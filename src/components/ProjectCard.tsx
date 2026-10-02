import { Link } from "@tanstack/react-router";
import { GitBranch, Lock } from "lucide-react";
import { CoverImage, UserAvatar } from "./UserAvatar";
import { TrackPlayer } from "./TrackPlayer";
import { timeAgo } from "@/lib/media";

export type ProjectRow = {
  id: string;
  title: string;
  genre: string | null;
  bpm: number | null;
  musical_key: string | null;
  cover_url: string | null;
  visibility: string;
  updated_at: string;
  owner: { username: string; display_name: string | null; avatar_url: string | null } | null;
  project_versions: { id: string; version_number: number; audio_url: string; peaks: unknown; duration: number | null }[];
};

export const PROJECT_SELECT =
  "id,title,genre,bpm,musical_key,cover_url,visibility,updated_at,owner:profiles!projects_owner_id_fkey(username,display_name,avatar_url),project_versions(id,version_number,audio_url,peaks,duration)";

export function latestVersion(p: ProjectRow) {
  return [...(p.project_versions ?? [])].sort((a, b) => b.version_number - a.version_number)[0];
}

export function ProjectCard({ p }: { p: ProjectRow }) {
  const v = latestVersion(p);
  return (
    <article className="group rounded-2xl border border-border bg-card p-3 transition hover:border-primary/30 sm:p-4">
      <div className="flex gap-4">
        <Link to="/projects/$id" params={{ id: p.id }} className="shrink-0">
          <CoverImage path={p.cover_url} className="h-24 w-24 rounded-xl sm:h-36 sm:w-36" />
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
            {p.genre && <span className="hidden shrink-0 rounded-full bg-secondary px-3 py-1 text-xs font-medium sm:inline"># {p.genre}</span>}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {v && <span className="flex items-center gap-1"><GitBranch className="h-3 w-3" />V{v.version_number}</span>}
            {p.bpm && <span>{p.bpm} BPM</span>}
            {p.musical_key && <span>{p.musical_key}</span>}
            {p.visibility === "selected" && <span className="flex items-center gap-1"><Lock className="h-3 w-3" />Privé</span>}
            <span>{timeAgo(p.updated_at)}</span>
          </div>
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
