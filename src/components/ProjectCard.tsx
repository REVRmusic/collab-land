import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, GitBranch, LifeBuoy, Lock } from "lucide-react";
import { toast } from "sonner";
import { CoverImage, UserAvatar } from "./UserAvatar";
import { TrackPlayer } from "./TrackPlayer";
import { timeAgo } from "@/lib/media";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export type ProjectRow = {
  id: string;
  title: string;
  genre: string | null;
  bpm: number | null;
  musical_key: string | null;
  cover_url: string | null;
  visibility: string;
  help_needed: string | null;
  updated_at: string;
  showcase?: boolean | null;
  owner: { username: string; display_name: string | null; avatar_url: string | null } | null;
  project_versions: { id: string; version_number: number; audio_url: string; peaks: unknown; duration: number | null }[];
};

export const PROJECT_SELECT =
  "id,title,genre,bpm,musical_key,cover_url,visibility,help_needed,showcase,updated_at,owner:profiles!projects_owner_id_fkey(username,display_name,avatar_url),project_versions(id,version_number,audio_url,peaks,duration)";

export function latestVersion(p: ProjectRow) {
  return [...(p.project_versions ?? [])].sort((a, b) => b.version_number - a.version_number)[0];
}

function ShowcaseToggle({ projectId, value }: { projectId: string; value: boolean }) {
  const qc = useQueryClient();
  const [on, setOn] = useState(value);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setOn(value);
  }, [value]);

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    const next = !on;
    setOn(next);
    setBusy(true);
    const { error } = await supabase
      .from("projects")
      .update({ showcase: next, updated_at: new Date().toISOString() })
      .eq("id", projectId);
    setBusy(false);
    if (error) {
      setOn(!next);
      toast.error("Impossible de modifier la visibilité");
      return;
    }
    toast.success(next ? "Visible sur ton profil public" : "Masqué du profil public");
    qc.invalidateQueries({ queryKey: ["user-projects"] });
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={on ? "Masquer du profil public" : "Rendre visible sur le profil public"}
      disabled={busy}
      onClick={toggle}
      className={cn(
        "relative inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full p-1 text-[11px] font-semibold tracking-wide transition-all",
        "ring-1 ring-inset focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        on
          ? "bg-primary text-primary-foreground ring-primary/40 shadow-[0_0_20px_-8px] shadow-primary"
          : "bg-secondary/80 text-muted-foreground ring-border hover:bg-secondary hover:text-foreground",
        busy && "opacity-70",
      )}
    >
      <span
        className={cn(
          "grid h-6 w-6 place-items-center rounded-full transition-all duration-200",
          on ? "bg-white/20" : "bg-background/60",
        )}
      >
        {on ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
      </span>
      <span className="pr-2.5">{on ? "Public" : "Masqué"}</span>
    </button>
  );
}

export function ProjectCard({
  p,
  /** On “Ma vitrine”, show a toggle to publish/unpublish on the shared profile. */
  showPublicVisibility = false,
}: {
  p: ProjectRow;
  showPublicVisibility?: boolean;
}) {
  const v = latestVersion(p);
  return (
    <article className="group rounded-2xl border border-border bg-card p-3 transition hover:border-primary/30 sm:p-4">
      <div className="flex gap-4">
        <Link to="/projects/$id" params={{ id: p.id }} className="shrink-0">
          <CoverImage path={p.cover_url} seed={`${p.id}:${p.title}`} className="h-24 w-24 rounded-xl sm:h-36 sm:w-36" />
        </Link>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              {p.owner && (
                <Link to="/u/$username" params={{ username: p.owner.username }} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                  <UserAvatar profile={p.owner} className="h-5 w-5" />
                  <span className="truncate">{p.owner.display_name || p.owner.username}</span>
                </Link>
              )}
              <Link to="/projects/$id" params={{ id: p.id }}>
                <h3 className="mt-1 truncate text-lg font-bold leading-tight group-hover:text-primary sm:text-xl">{p.title}</h3>
              </Link>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {showPublicVisibility ? (
                <ShowcaseToggle projectId={p.id} value={!!p.showcase} />
              ) : (
                p.genre && <span className="hidden rounded-full bg-secondary px-3 py-1 text-xs font-medium sm:inline"># {p.genre}</span>
              )}
            </div>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {v && <span className="flex items-center gap-1"><GitBranch className="h-3 w-3" />V{v.version_number}</span>}
            {p.bpm && <span>{p.bpm} BPM</span>}
            {p.musical_key && <span>{p.musical_key}</span>}
            {p.visibility === "selected" && <span className="flex items-center gap-1"><Lock className="h-3 w-3" />Privé</span>}
            {!showPublicVisibility && p.showcase && (
              <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-semibold text-primary">Vitrine</span>
            )}
            {showPublicVisibility && p.genre && (
              <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium"># {p.genre}</span>
            )}
            <span>{timeAgo(p.updated_at)}</span>
          </div>
          {p.help_needed && (
            <p className="mt-1.5 flex items-center gap-1 truncate text-xs font-medium text-primary"><LifeBuoy className="h-3 w-3 shrink-0" /><span className="truncate">{p.help_needed}</span></p>
          )}
          <div className="mt-auto hidden pt-3 sm:block">
            {v && <TrackPlayer path={v.audio_url} peaks={v.peaks as number[]} duration={v.duration} size="sm" height={56} />}
          </div>
        </div>
      </div>
      <div className="mt-3 sm:hidden">
        {v && <TrackPlayer path={v.audio_url} peaks={v.peaks as number[]} duration={v.duration} size="sm" height={48} />}
      </div>
    </article>
  );
}
