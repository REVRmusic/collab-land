import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { GitBranch, LifeBuoy, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/hooks/use-me";
import { timeAgo } from "@/lib/media";
import { CoverImage, UserAvatar } from "@/components/UserAvatar";
import { TrackPlayer } from "@/components/TrackPlayer";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/projects/")({
  head: () => ({
    meta: [
      { title: "Projets — CollabLand" },
      { name: "description", content: "Suis tous les projets partagés avec toi, triés par dernière version." },
      { property: "og:title", content: "Projets — CollabLand" },
      { property: "og:description", content: "Suis tous les projets partagés avec toi, triés par dernière version." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProjectsPage,
});

type Prof = { id: string; username: string; display_name: string | null; avatar_url: string | null };
type Row = {
  id: string; title: string; owner_id: string; cover_url: string | null; visibility: string; genre: string | null; help_needed: string | null;
  owner: Prof;
  project_versions: { id: string; version_number: number; audio_url: string; peaks: number[] | null; duration: number | null; created_at: string; author: Prof }[];
};

const FILTERS = [["all", "Tous"], ["mine", "Les miens"], ["shared", "Partagés avec moi"]] as const;

function ProjectsPage() {
  const { uid } = useMe();
  const [filter, setFilter] = useState<(typeof FILTERS)[number][0]>("all");
  const q = useQuery({
    queryKey: ["all-projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id,title,owner_id,cover_url,visibility,genre,help_needed,owner:profiles!projects_owner_id_fkey(id,username,display_name,avatar_url),project_versions(id,version_number,audio_url,peaks,duration,created_at,author:profiles!project_versions_author_id_fkey(id,username,display_name,avatar_url))")
        .limit(200);
      if (error) throw error;
      return (data as unknown as Row[]).map((p) => {
        const latest = [...p.project_versions].sort((a, b) => b.version_number - a.version_number)[0];
        return { ...p, latest };
      }).sort((a, b) => (b.latest?.created_at ?? "").localeCompare(a.latest?.created_at ?? ""));
    },
  });
  const rows = (q.data ?? []).filter((p) => filter === "all" || (filter === "mine" ? p.owner_id === uid : p.owner_id !== uid));

  return (
    <div>
      <h1 className="text-3xl font-bold">Projets</h1>
      <p className="mt-1 text-sm text-muted-foreground">Tous les projets auxquels tu as accès, dernière version en premier.</p>
      <div className="mt-4 flex gap-2 overflow-x-auto">
        {FILTERS.map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition ${filter === k ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>{l}</button>
        ))}
      </div>
      <div className="mt-5 space-y-3">
        {q.isLoading && [0, 1, 2].map((i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        {!q.isLoading && rows.length === 0 && <p className="py-16 text-center text-sm text-muted-foreground">Aucun projet ici pour l'instant.</p>}
        {rows.map((p) => (
          <article key={p.id} className="group rounded-2xl border border-border bg-card p-3 transition hover:border-primary/30 sm:p-4">
            <div className="flex gap-4">
              <Link to="/projects/$id" params={{ id: p.id }} className="shrink-0"><CoverImage path={p.cover_url} className="h-20 w-20 rounded-xl sm:h-24 sm:w-24" /></Link>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <UserAvatar profile={p.owner} className="h-4 w-4" />
                  <span className="truncate">{p.owner_id === uid ? "Toi" : p.owner.display_name || p.owner.username}</span>
                  {p.visibility === "selected" && <Lock className="h-3 w-3" />}
                </div>
                <Link to="/projects/$id" params={{ id: p.id }}><h3 className="mt-0.5 truncate text-lg font-bold group-hover:text-primary">{p.title}</h3></Link>
                {p.latest && (
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                    <GitBranch className="h-3 w-3 text-primary" />
                    <span className="font-semibold text-foreground">V{p.latest.version_number}</span>
                    par {p.latest.author.id === uid ? "toi" : p.latest.author.display_name || p.latest.author.username} · {timeAgo(p.latest.created_at)}
                  </p>
                )}
                {p.help_needed && <p className="mt-1 flex items-center gap-1 truncate text-xs font-medium text-primary"><LifeBuoy className="h-3 w-3 shrink-0" /><span className="truncate">{p.help_needed}</span></p>}
                <div className="mt-2 hidden sm:block">{p.latest && <TrackPlayer path={p.latest.audio_url} peaks={p.latest.peaks} duration={p.latest.duration} size="sm" height={44} />}</div>
              </div>
            </div>
            <div className="mt-3 sm:hidden">{p.latest && <TrackPlayer path={p.latest.audio_url} peaks={p.latest.peaks} duration={p.latest.duration} size="sm" height={40} />}</div>
          </article>
        ))}
      </div>
    </div>
  );
}
