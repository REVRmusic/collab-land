import { MessageSquarePlus, Pause, Play, Trash2 } from "lucide-react";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAudio } from "@/hooks/use-audio";
import { useMe } from "@/hooks/use-me";
import { formatTime, timeAgo, useMediaUrl } from "@/lib/media";
import { supabase } from "@/integrations/supabase/client";
import { Waveform } from "./Waveform";
import { UserAvatar } from "./UserAvatar";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

type Props = {
  path: string;
  peaks?: number[] | null;
  duration?: number | null;
  height?: number;
  size?: "sm" | "lg";
  /** When set, shows and creates time annotations on this version */
  versionId?: string;
  projectId?: string;
};

type Marker = {
  id: string;
  time_sec: number;
  body: string;
  created_at: string;
  author_id: string;
  author: { username: string; display_name: string | null; avatar_url: string | null } | null;
};

export function TrackPlayer({ path, peaks, duration, height = 72, size = "lg", versionId, projectId }: Props) {
  const url = useMediaUrl("audio", path);
  const a = useAudio(url, duration);
  const { uid } = useMe();
  const qc = useQueryClient();
  const annotate = !!(versionId && projectId);
  const key = ["markers", versionId];
  const [draft, setDraft] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);
  const [pinTime, setPinTime] = useState(0);
  const [busy, setBusy] = useState(false);

  const markers = useQuery({
    queryKey: key,
    enabled: annotate,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("version_markers")
        .select("id,time_sec,body,created_at,author_id,author:profiles!version_markers_author_id_fkey(username,display_name,avatar_url)")
        .eq("version_id", versionId!)
        .order("time_sec", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as Marker[];
    },
  });

  const dur = a.duration || duration || 0;
  const btn = size === "lg" ? "h-14 w-14" : "h-10 w-10";
  const list = markers.data ?? [];

  const startAnnotate = () => {
    setPinTime(a.time || 0);
    setComposing(true);
    setDraft("");
  };

  const save = async () => {
    const body = draft.trim();
    if (!body || !uid || !versionId || !projectId) return;
    setBusy(true);
    const { error } = await supabase.from("version_markers").insert({
      project_id: projectId,
      version_id: versionId,
      author_id: uid,
      time_sec: Math.max(0, pinTime),
      body,
    });
    setBusy(false);
    if (error) { toast.error("Annotation impossible"); return; }
    setDraft("");
    setComposing(false);
    qc.invalidateQueries({ queryKey: key });
    toast.success("Annotation ajoutée");
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("version_markers").delete().eq("id", id);
    if (error) { toast.error("Suppression impossible"); return; }
    if (activeId === id) setActiveId(null);
    qc.invalidateQueries({ queryKey: key });
  };

  const jumpTo = (m: Marker) => {
    setActiveId(m.id);
    a.seekTo(m.time_sec);
  };

  return (
    <div className="w-full space-y-3">
      <div className="flex w-full items-center gap-4">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            a.toggle();
          }}
          disabled={!a.ready}
          aria-label={a.playing ? "Pause" : "Lecture"}
          className={`${btn} grid shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-[0_8px_30px_-8px_var(--primary)] transition hover:scale-105 disabled:opacity-50`}
        >
          {a.playing ? <Pause className="h-5 w-5 fill-current" /> : <Play className="ml-0.5 h-5 w-5 fill-current" />}
        </button>
        <div className="relative min-w-0 flex-1">
          <Waveform
            peaks={(peaks as number[]) ?? []}
            progress={a.progress}
            onSeek={a.seek}
            height={height}
            markers={list.map((m) => ({
              id: m.id,
              ratio: dur > 0 ? Math.min(1, m.time_sec / dur) : 0,
              active: m.id === activeId,
            }))}
            onMarkerClick={(id) => {
              const m = list.find((x) => x.id === id);
              if (m) jumpTo(m);
            }}
          />
          <span className="pointer-events-none absolute left-0 top-[58%] rounded bg-background/85 px-1 text-[11px] font-medium tabular-nums text-primary">
            {formatTime(a.time)}
          </span>
          <span className="pointer-events-none absolute right-0 top-[58%] rounded bg-background/85 px-1 text-[11px] tabular-nums text-muted-foreground">
            {formatTime(dur)}
          </span>
        </div>
      </div>

      {annotate && (
        <div className="space-y-2">
          {!composing ? (
            <Button type="button" variant="secondary" size="sm" onClick={startAnnotate} disabled={!a.ready}>
              <MessageSquarePlus className="h-4 w-4" />Annoter à {formatTime(a.time)}
            </Button>
          ) : (
            <div className="flex flex-col gap-2 rounded-xl border border-border bg-surface-2 p-3 sm:flex-row sm:items-center">
              <span className="shrink-0 rounded-full bg-primary/15 px-2.5 py-1 text-xs font-semibold text-primary">{formatTime(pinTime)}</span>
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Ex. drop trop soft, snare trop fort…"
                maxLength={280}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); save(); }
                  if (e.key === "Escape") setComposing(false);
                }}
              />
              <div className="flex gap-2">
                <Button type="button" size="sm" variant="ghost" onClick={() => setComposing(false)}>Annuler</Button>
                <Button type="button" size="sm" disabled={busy || !draft.trim()} onClick={save}>{busy ? "…" : "Publier"}</Button>
              </div>
            </div>
          )}

          {list.length > 0 && (
            <ul className="space-y-1.5">
              {list.map((m) => (
                <li key={m.id} className={`flex items-start gap-2 rounded-lg px-2 py-1.5 ${activeId === m.id ? "bg-primary/10" : ""}`}>
                  <button type="button" onClick={() => jumpTo(m)} className="flex min-w-0 flex-1 items-start gap-2 text-left hover:opacity-90">
                    <span className="mt-0.5 shrink-0 rounded bg-secondary px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-primary">{formatTime(m.time_sec)}</span>
                    <UserAvatar profile={m.author} className="mt-0.5 h-5 w-5" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm">{m.body}</span>
                      <span className="text-[11px] text-muted-foreground">{m.author?.display_name || m.author?.username} · {timeAgo(m.created_at)}</span>
                    </span>
                  </button>
                  {uid && uid === m.author_id && (
                    <button
                      type="button"
                      className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-background hover:text-destructive"
                      aria-label="Supprimer l'annotation"
                      onClick={() => remove(m.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
