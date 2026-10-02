import { Pause, Play } from "lucide-react";
import { useAudio } from "@/hooks/use-audio";
import { formatTime, useMediaUrl } from "@/lib/media";
import { Waveform } from "./Waveform";

export function VoicePlayer({
  path,
  peaks,
  duration,
  mine,
}: {
  path: string;
  peaks?: number[] | null;
  duration?: number | null;
  mine?: boolean;
}) {
  const url = useMediaUrl("audio", path);
  const a = useAudio(url, duration);
  const barsWidth = Math.min(220, Math.max(90, (duration ?? 5) * 12));
  const rates = [1, 1.5, 2];
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={a.toggle}
        disabled={!a.ready}
        aria-label={a.playing ? "Pause" : "Lecture"}
        className="grid h-8 w-8 shrink-0 place-items-center disabled:opacity-50"
      >
        {a.playing ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current" />}
      </button>
      <div style={{ width: barsWidth }}>
        <Waveform
          peaks={(peaks as number[]) ?? []}
          progress={a.progress}
          onSeek={a.seek}
          variant="voice"
          height={32}
          playedVar={mine ? "--voice-foreground" : "--foreground"}
          restVar={mine ? "--voice-foreground" : "--muted-foreground"}
        />
      </div>
      <div className="flex w-10 flex-col items-end gap-1">
        <span className="text-xs tabular-nums opacity-90">
          {formatTime(a.playing || a.time ? a.time : a.duration || duration)}
        </span>
        {(a.playing || a.time > 0) && (
          <button
            type="button"
            onClick={() => a.setRate(rates[(rates.indexOf(a.rate) + 1) % rates.length] ?? 1)}
            className="rounded-full bg-background/25 px-2 py-0.5 text-[11px] font-semibold"
          >
            {a.rate}x
          </button>
        )}
      </div>
    </div>
  );
}
