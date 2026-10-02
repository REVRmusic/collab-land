import { useEffect, useRef, useState } from "react";
import { ChevronLeft, Lock, Send, Trash2 } from "lucide-react";
import { formatTime } from "@/lib/media";

export function VoiceRecorder({
  onDone,
  onCancel,
  finishAction,
  locked,
}: {
  onDone: (blob: Blob) => void;
  onCancel: () => void;
  finishAction: "send" | "cancel" | null;
  locked: boolean;
}) {
  const [elapsed, setElapsed] = useState(0);
  const [levels, setLevels] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [recorderReady, setRecorderReady] = useState(false);
  const rec = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const cancelled = useRef(false);

  const finish = (action: "send" | "cancel") => {
    const recorder = rec.current;
    if (!recorder || recorder.state !== "recording") return;
    cancelled.current = action === "cancel";
    recorder.stop();
    if (action === "cancel") onCancel();
  };

  useEffect(() => {
    let stream: MediaStream | null = null;
    let raf = 0;
    let ctx: AudioContext | null = null;
    const start = Date.now();
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mime = ["audio/webm;codecs=opus", "audio/mp4", "audio/webm"].find((m) => MediaRecorder.isTypeSupported(m));
        const r = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
        r.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
        r.onstop = () => {
          if (!cancelled.current) onDone(new Blob(chunks.current, { type: r.mimeType }));
        };
        r.start();
        rec.current = r;
        setRecorderReady(true);
        ctx = new AudioContext();
        const an = ctx.createAnalyser();
        an.fftSize = 256;
        ctx.createMediaStreamSource(stream).connect(an);
        const data = new Uint8Array(an.frequencyBinCount);
        let last = 0;
        const tick = (t: number) => {
          setElapsed((Date.now() - start) / 1000);
          if (t - last > 90) {
            an.getByteTimeDomainData(data);
            let max = 0;
            for (const v of data) max = Math.max(max, Math.abs(v - 128));
            setLevels((l) => [...l.slice(-39), Math.min(1, max / 64 + 0.08)]);
            last = t;
          }
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      } catch {
        setError("Micro inaccessible. Autorise l'accès au micro dans ton navigateur.");
      }
    })();
    return () => {
      cancelAnimationFrame(raf);
      if (rec.current?.state === "recording") {
        cancelled.current = true;
        rec.current.stop();
      }
      stream?.getTracks().forEach((t) => t.stop());
      ctx?.close();
    };
  }, [onDone]);

  useEffect(() => {
    if (finishAction && recorderReady && rec.current?.state === "recording") finish(finishAction);
    // finish intentionally reads the current recorder instance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finishAction, recorderReady]);

  if (error)
    return (
      <div className="flex flex-1 items-center justify-between gap-2 text-sm text-destructive">
        {error}
        <button onClick={onCancel} className="text-muted-foreground underline">Fermer</button>
      </div>
    );

  return (
    <div className="flex min-w-0 flex-1 items-center gap-2" aria-live="polite">
      {locked ? (
        <button
          type="button"
          onClick={() => finish("cancel")}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-destructive hover:bg-destructive/10"
          aria-label="Annuler le vocal"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      ) : (
        <span className="flex shrink-0 items-center text-xs text-muted-foreground">
          <ChevronLeft className="h-4 w-4" />Annuler
        </span>
      )}
      <span className="h-2 w-2 animate-pulse rounded-full bg-destructive" />
      <span className="w-9 shrink-0 text-xs tabular-nums sm:w-10 sm:text-sm">{formatTime(elapsed)}</span>
      <div className="flex h-8 min-w-0 flex-1 items-center justify-end gap-[2px] overflow-hidden">
        {levels.slice(-24).map((l, i) => (
          <span key={i} className="w-[3px] rounded-full bg-voice" style={{ height: `${l * 100}%` }} />
        ))}
      </div>
      {locked ? (
        <button
          type="button"
          onClick={() => finish("send")}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-voice text-voice-foreground"
          aria-label="Envoyer le vocal"
        >
          <Send className="h-4 w-4" />
        </button>
      ) : (
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-primary/40 text-primary" aria-label="Glisser vers le haut pour verrouiller">
          <Lock className="h-4 w-4" />
        </span>
      )}
    </div>
  );
}
