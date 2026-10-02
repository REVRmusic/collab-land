import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCheck, CornerUpLeft, GitBranch, Mic, Plus, Send, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { computePeaks, extOf, removeFiles, timeAgo, uploadFile } from "@/lib/media";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { UserAvatar } from "@/components/UserAvatar";
import { VoicePlayer } from "@/components/VoiceBubble";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import { TrackPlayer } from "@/components/TrackPlayer";
import { NewVersionDialog } from "./NewVersionDialog";

type Author = { id: string; username: string; display_name: string | null; avatar_url: string | null };
type Msg = {
  id: string;
  kind: "text" | "voice" | "version";
  body: string | null;
  audio_url: string | null;
  peaks: number[] | null;
  duration: number | null;
  reply_to_id: string | null;
  created_at: string;
  author: Author;
  version: { version_number: number; title: string | null; audio_url: string; peaks: number[] | null; duration: number | null } | null;
};

function preview(m?: Msg) {
  if (!m) return "Message supprimé";
  if (m.kind === "voice") return "🎙 Message vocal";
  if (m.kind === "version") return `Version V${m.version?.version_number ?? ""}`;
  return m.body ?? "";
}

export function Discussion({ projectId, uid }: { projectId: string; uid: string }) {
  const qc = useQueryClient();
  const key = ["messages", projectId];
  const [text, setText] = useState("");
  const [recording, setRecording] = useState(false);
  const [replyTo, setReplyTo] = useState<Msg | null>(null);
  const [sending, setSending] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);

  const q = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("id,kind,body,audio_url,peaks,duration,reply_to_id,created_at,author:profiles!messages_author_id_fkey(id,username,display_name,avatar_url),version:project_versions(version_number,title,audio_url,peaks,duration)")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true })
        .limit(300);
      if (error) throw error;
      return data as unknown as Msg[];
    },
  });

  useEffect(() => {
    const ch = supabase
      .channel(`msgs-${projectId}-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages", filter: `project_id=eq.${projectId}` }, () => {
        qc.invalidateQueries({ queryKey: ["messages", projectId] });
        qc.invalidateQueries({ queryKey: ["versions", projectId] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [projectId, qc]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [q.data?.length]);

  // ---- Read receipts ----
  const myIds = (q.data ?? []).filter((m) => m.author.id === uid).map((m) => m.id);
  const readsKey = ["reads", projectId, myIds.length];
  const reads = useQuery({
    queryKey: readsKey,
    enabled: myIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("message_reads")
        .select("message_id,read_at,reader:profiles!message_reads_user_id_fkey(id,username,display_name,avatar_url)")
        .in("message_id", myIds);
      if (error) throw error;
      const map = new Map<string, Reader[]>();
      for (const r of data as unknown as { message_id: string; read_at: string; reader: Author }[]) {
        const arr = map.get(r.message_id) ?? [];
        arr.push({ ...r.reader, read_at: r.read_at });
        map.set(r.message_id, arr);
      }
      return map;
    },
  });

  useEffect(() => {
    const ch = supabase
      .channel(`reads-${projectId}-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "message_reads" }, () => {
        qc.invalidateQueries({ queryKey: ["reads", projectId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [projectId, qc]);

  const seen = useRef(new Set<string>());
  const pending = useRef(new Set<string>());
  const flushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const observer = useRef<IntersectionObserver | null>(null);
  useEffect(() => {
    const flush = async () => {
      const ids = [...pending.current];
      pending.current.clear();
      if (!ids.length) return;
      await supabase.from("message_reads").upsert(ids.map((message_id) => ({ message_id, user_id: uid })), { onConflict: "message_id,user_id", ignoreDuplicates: true });
    };
    observer.current = new IntersectionObserver((entries) => {
      if (document.visibilityState !== "visible") return;
      for (const e of entries) {
        const id = (e.target as HTMLElement).dataset['mid'];
        if (e.isIntersecting && id && !seen.current.has(id)) {
          seen.current.add(id);
          pending.current.add(id);
        }
      }
      if (flushTimer.current) clearTimeout(flushTimer.current);
      flushTimer.current = setTimeout(flush, 600);
    }, { threshold: 0.6 });
    document.querySelectorAll<HTMLElement>("[data-mid]").forEach((el) => observer.current?.observe(el));
    return () => { observer.current?.disconnect(); if (flushTimer.current) clearTimeout(flushTimer.current); void flush(); };
  }, [uid]);
  const observe = useCallback((el: HTMLElement | null) => { if (el) observer.current?.observe(el); }, []);

  const deleteMsg = async (m: Msg) => {
    const { error } = await supabase.from("messages").delete().eq("id", m.id);
    if (error) { toast.error("Suppression impossible"); return; }
    if (m.kind === "voice") await removeFiles("audio", [m.audio_url]);
    toast.success("Message supprimé");
    qc.invalidateQueries({ queryKey: key });
  };

  const byId = new Map((q.data ?? []).map((m) => [m.id, m]));

  const send = async (payload: Record<string, unknown>) => {
    const { error } = await supabase.from("messages").insert({ project_id: projectId, author_id: uid, reply_to_id: replyTo?.id ?? null, ...payload });
    if (error) { toast.error("Envoi impossible"); return; }
    setReplyTo(null);
    qc.invalidateQueries({ queryKey: key });
  };

  const sendText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    const body = text.trim();
    setText("");
    await send({ kind: "text", body });
  };

  const onVoice = useCallback(
    async (blob: Blob) => {
      setRecording(false);
      setSending(true);
      try {
        const w = await computePeaks(blob, 48);
        const path = await uploadFile("audio", blob, extOf(blob, "webm"));
        await send({ kind: "voice", audio_url: path, peaks: w.peaks, duration: w.duration });
      } catch {
        toast.error("Envoi du vocal impossible");
      } finally {
        setSending(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [replyTo],
  );

  return (
    <div className="flex h-[70vh] min-h-[480px] flex-col overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex-1 space-y-1 overflow-y-auto p-3 sm:p-5">
        {q.data?.length === 0 && (
          <p className="py-16 text-center text-sm text-muted-foreground">Lance la discussion : un message, un vocal ou une nouvelle version.</p>
        )}
        {q.data?.map((m, i) => {
          const mine = m.author.id === uid;
          const prev = q.data[i - 1];
          const grouped = prev && prev.author.id === m.author.id && new Date(m.created_at).getTime() - new Date(prev.created_at).getTime() < 5 * 60e3;
          const reply = m.reply_to_id ? byId.get(m.reply_to_id) : undefined;
          return (
            <div key={m.id} className={`group flex items-end gap-2 ${mine ? "flex-row-reverse" : ""} ${grouped ? "" : "pt-3"}`}>
              <div className="w-8 shrink-0">{!mine && !grouped && <UserAvatar profile={m.author} className="h-8 w-8" />}</div>
              <div className={`flex max-w-[85%] flex-col sm:max-w-[70%] ${mine ? "items-end" : "items-start"}`}>
                {!grouped && (
                  <span className="mb-1 px-1 text-xs text-muted-foreground">
                    {mine ? "Toi" : m.author.display_name || m.author.username} · {timeAgo(m.created_at)}
                  </span>
                )}
                {m.reply_to_id && (
                  <div className={`mb-1 flex flex-col ${mine ? "items-end" : "items-start"}`}>
                    <span className="px-1 text-[11px] text-muted-foreground">
                      {mine ? "Tu as répondu" : "A répondu"} à {reply?.author.id === uid ? "toi" : reply?.author.display_name || reply?.author.username || "un message"}
                    </span>
                    <span className="mt-0.5 max-w-full truncate rounded-2xl border-l-2 border-muted-foreground/40 bg-surface-2/70 px-3 py-1.5 text-xs text-muted-foreground">
                      {preview(reply)}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-1" data-mid={mine ? undefined : m.id} ref={mine ? undefined : observe}>
                  {mine && m.kind !== "version" && (
                    <ConfirmDelete title={m.kind === "voice" ? "Supprimer ce vocal ?" : "Supprimer ce message ?"} onConfirm={() => deleteMsg(m)}>
                      <button className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted-foreground opacity-60 hover:bg-accent hover:text-destructive sm:opacity-0 sm:group-hover:opacity-100" aria-label="Supprimer le message">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </ConfirmDelete>
                  )}
                  {mine && <ReplyBtn onClick={() => setReplyTo(m)} />}
                  <Bubble m={m} mine={mine} />
                  {!mine && <ReplyBtn onClick={() => setReplyTo(m)} />}
                </div>
                {mine && <SeenBy readers={reads.data?.get(m.id)} />}
              </div>
            </div>
          );
        })}
        <div ref={bottom} />
      </div>

      <div className="border-t border-border p-3">
        {replyTo && (
          <div className="mb-2 flex items-center justify-between gap-2 rounded-xl bg-surface-2 px-3 py-2 text-sm">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Réponse à {replyTo.author.id === uid ? "toi-même" : replyTo.author.display_name || replyTo.author.username}</p>
              <p className="truncate">{preview(replyTo)}</p>
            </div>
            <button onClick={() => setReplyTo(null)} aria-label="Annuler la réponse"><X className="h-4 w-4" /></button>
          </div>
        )}
        <div className="flex items-center gap-2 rounded-full bg-surface-2 p-1.5 pl-2">
          {recording ? (
            <VoiceRecorder onDone={onVoice} onCancel={() => setRecording(false)} />
          ) : (
            <>
              <NewVersionDialog
                projectId={projectId}
                uid={uid}
                trigger={
                  <button type="button" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground" aria-label="Publier une version" title="Publier une nouvelle version">
                    <Plus className="h-4 w-4" />
                  </button>
                }
              />
              <form onSubmit={sendText} className="flex min-w-0 flex-1 items-center">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={sending ? "Envoi du vocal…" : "Ton message…"}
                  className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm outline-none placeholder:text-muted-foreground"
                />
                {text.trim() ? (
                  <button type="submit" className="grid h-9 w-9 place-items-center rounded-full text-primary" aria-label="Envoyer"><Send className="h-4 w-4" /></button>
                ) : (
                  <button type="button" onClick={() => setRecording(true)} disabled={sending} className="grid h-9 w-9 place-items-center rounded-full hover:bg-accent" aria-label="Enregistrer un vocal">
                    <Mic className="h-5 w-5" />
                  </button>
                )}
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

type Reader = Author & { read_at: string };

function SeenBy({ readers }: { readers?: Reader[] | undefined }) {
  if (!readers?.length) return null;
  const sorted = [...readers].sort((a, b) => a.read_at.localeCompare(b.read_at));
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="mt-1 flex items-center gap-1.5 px-1 text-[11px] text-muted-foreground hover:text-foreground" aria-label="Voir qui a lu">
          <CheckCheck className="h-3.5 w-3.5 text-primary" />
          <span>Vu par</span>
          <span className="flex -space-x-1.5">
            {sorted.slice(0, 3).map((r) => <UserAvatar key={r.id} profile={r} className="h-4 w-4 ring-1 ring-card" />)}
          </span>
          {sorted.length > 3 && <span>+{sorted.length - 3}</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-60 p-2">
        <p className="px-2 pb-1 text-xs font-semibold text-muted-foreground">Vu par</p>
        {sorted.map((r) => (
          <div key={r.id} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm">
            <UserAvatar profile={r} className="h-6 w-6" />
            <span className="min-w-0 flex-1 truncate">{r.display_name || r.username}</span>
            <span className="text-xs text-muted-foreground">{timeAgo(r.read_at)}</span>
          </div>
        ))}
      </PopoverContent>
    </Popover>
  );
}

function ReplyBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted-foreground opacity-60 hover:bg-accent sm:opacity-0 sm:group-hover:opacity-100" aria-label="Répondre">
      <CornerUpLeft className="h-3.5 w-3.5" />
    </button>
  );
}

function Bubble({ m, mine }: { m: Msg; mine: boolean }) {
  if (m.kind === "version" && m.version) {
    return (
      <div className="w-[min(520px,72vw)] rounded-2xl border border-primary/30 bg-primary/5 p-3">
        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-primary">
          <GitBranch className="h-3.5 w-3.5" />Nouvelle version V{m.version.version_number}{m.version.title ? ` · ${m.version.title}` : ""}
        </p>
        <TrackPlayer path={m.version.audio_url} peaks={m.version.peaks} duration={m.version.duration} size="sm" height={44} />
        {m.body && <p className="mt-2 text-sm text-foreground/80">{m.body}</p>}
      </div>
    );
  }
  const cls = mine ? "bg-voice text-voice-foreground" : "bg-surface-2 text-foreground";
  if (m.kind === "voice" && m.audio_url)
    return (
      <div className={`rounded-3xl px-4 py-2.5 ${cls}`}>
        <VoicePlayer path={m.audio_url} peaks={m.peaks} duration={m.duration} mine={mine} />
      </div>
    );
  return <div className={`whitespace-pre-wrap break-words rounded-3xl px-4 py-2.5 text-sm ${cls}`}>{m.body}</div>;
}
