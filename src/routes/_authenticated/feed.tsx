import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { GitBranch, MessageSquare, Mic } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CoverImage, UserAvatar } from "@/components/UserAvatar";
import { TrackPlayer } from "@/components/TrackPlayer";
import { VoicePlayer } from "@/components/VoiceBubble";
import { Skeleton } from "@/components/ui/skeleton";
import { formatTime, timeAgo } from "@/lib/media";

export const Route = createFileRoute("/_authenticated/feed")({
  head: () => ({
    meta: [
      { title: "Fil — CollabLand" },
      { name: "description", content: "Les derniers projets et versions de tes amis producteurs." },
      { property: "og:title", content: "Fil — CollabLand" },
      { property: "og:description", content: "Les derniers projets et versions de tes amis." },
    ],
  }),
  component: Feed,
});

type Prof = { id: string; username: string; display_name: string | null; avatar_url: string | null };
type ProjectLite = { id: string; title: string; cover_url: string | null };

type Activity =
  | {
      kind: "version";
      id: string;
      created_at: string;
      version_number: number;
      title: string | null;
      notes: string | null;
      audio_url: string;
      peaks: number[] | null;
      duration: number | null;
      author: Prof;
      project: ProjectLite;
    }
  | {
      kind: "voice";
      id: string;
      created_at: string;
      audio_url: string;
      peaks: number[] | null;
      duration: number | null;
      author: Prof;
      project: ProjectLite;
    }
  | {
      kind: "marker";
      id: string;
      created_at: string;
      time_sec: number;
      body: string;
      author: Prof;
      project: ProjectLite;
      version: { id: string; version_number: number };
    };

function Feed() {
  const q = useQuery({
    queryKey: ["feed-activity"],
    queryFn: async (): Promise<Activity[]> => {
      const [versions, voices, markers] = await Promise.all([
        supabase
          .from("project_versions")
          .select("id,version_number,title,notes,created_at,audio_url,peaks,duration,author:profiles!project_versions_author_id_fkey(id,username,display_name,avatar_url),project:projects!project_versions_project_id_fkey(id,title,cover_url)")
          .order("created_at", { ascending: false })
          .limit(30),
        supabase
          .from("messages")
          .select("id,created_at,audio_url,peaks,duration,author:profiles!messages_author_id_fkey(id,username,display_name,avatar_url),project:projects!messages_project_id_fkey(id,title,cover_url)")
          .eq("kind", "voice")
          .order("created_at", { ascending: false })
          .limit(30),
        supabase
          .from("version_markers")
          .select("id,created_at,time_sec,body,author:profiles!version_markers_author_id_fkey(id,username,display_name,avatar_url),project:projects!version_markers_project_id_fkey(id,title,cover_url),version:project_versions!version_markers_version_id_fkey(id,version_number)")
          .order("created_at", { ascending: false })
          .limit(30),
      ]);
      if (versions.error) throw versions.error;
      if (voices.error) throw voices.error;
      // Markers table may not exist yet before migration — ignore that error.
      if (markers.error && !/version_markers|schema cache|does not exist/i.test(markers.error.message)) throw markers.error;

      const items: Activity[] = [];
      for (const v of versions.data ?? []) {
        const row = v as unknown as Omit<Extract<Activity, { kind: "version" }>, "kind">;
        if (!row.project || !row.author) continue;
        items.push({ kind: "version", ...row, peaks: (row.peaks as number[] | null) ?? null });
      }
      for (const m of voices.data ?? []) {
        const row = m as unknown as Omit<Extract<Activity, { kind: "voice" }>, "kind"> & { audio_url: string | null };
        if (!row.project || !row.author || !row.audio_url) continue;
        items.push({ kind: "voice", ...row, audio_url: row.audio_url, peaks: (row.peaks as number[] | null) ?? null });
      }
      for (const m of markers.data ?? []) {
        const row = m as unknown as Omit<Extract<Activity, { kind: "marker" }>, "kind">;
        if (!row.project || !row.author || !row.version) continue;
        items.push({ kind: "marker", ...row });
      }
      return items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 40);
    },
  });

  return (
    <div>
      <h1 className="text-3xl font-bold">Fil d'actualité</h1>
      <p className="mt-1 text-muted-foreground">Versions, vocaux et annotations de ton cercle.</p>
      <div className="mt-6 space-y-4">
        {q.isLoading && [0, 1, 2].map((i) => <Skeleton key={i} className="h-36 rounded-2xl" />)}
        {q.isError && (
          <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-6 text-sm">
            Impossible de charger le fil. Réessaie plus tard.
          </div>
        )}
        {q.data?.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center">
            <h2 className="text-lg font-semibold">C'est calme ici</h2>
            <p className="mt-1 text-sm text-muted-foreground">Ajoute des amis ou publie ton premier projet.</p>
            <div className="mt-4 flex justify-center gap-2">
              <Link to="/friends" className="rounded-full border border-border px-4 py-2 text-sm">Trouver des producteurs</Link>
              <Link to="/projects/new" className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Nouveau projet</Link>
            </div>
          </div>
        )}
        {q.data?.map((item) => <ActivityCard key={`${item.kind}-${item.id}`} item={item} />)}
      </div>
    </div>
  );
}

function ActivityCard({ item }: { item: Activity }) {
  const who = item.author.display_name || item.author.username;
  return (
    <article className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <Link to="/u/$username" params={{ username: item.author.username }} className="shrink-0">
          <UserAvatar profile={item.author} className="h-10 w-10" />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="text-sm">
            <Link to="/u/$username" params={{ username: item.author.username }} className="font-semibold hover:text-primary">{who}</Link>
            {" "}
            {item.kind === "version" && (
              <>
                {item.version_number === 1 ? "a publié" : "a droppé la"}{" "}
                <Link to="/projects/$id" params={{ id: item.project.id }} className="font-semibold text-primary hover:underline">
                  {item.version_number === 1 ? item.project.title : `V${item.version_number}`}
                </Link>
                {item.version_number > 1 && (
                  <> sur <Link to="/projects/$id" params={{ id: item.project.id }} className="font-medium hover:text-primary">{item.project.title}</Link></>
                )}
              </>
            )}
            {item.kind === "voice" && (
              <>
                a envoyé un vocal sur{" "}
                <Link to="/projects/$id" params={{ id: item.project.id }} className="font-semibold hover:text-primary">{item.project.title}</Link>
              </>
            )}
            {item.kind === "marker" && (
              <>
                a annoté la V{item.version.version_number} de{" "}
                <Link to="/projects/$id" params={{ id: item.project.id }} className="font-semibold hover:text-primary">{item.project.title}</Link>
                {" "}à {formatTime(item.time_sec)}
              </>
            )}
            <span className="text-muted-foreground"> · {timeAgo(item.created_at)}</span>
          </p>

          {item.kind === "version" && (
            <div className="mt-3 flex gap-3">
              <Link to="/projects/$id" params={{ id: item.project.id }} className="shrink-0">
                <CoverImage path={item.project.cover_url} className="h-16 w-16 rounded-lg" />
              </Link>
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <GitBranch className="h-3.5 w-3.5" />
                  <span className="font-medium text-foreground">V{item.version_number}{item.title ? ` · ${item.title}` : ""}</span>
                </div>
                <TrackPlayer path={item.audio_url} peaks={item.peaks} duration={item.duration} size="sm" height={48} />
                {item.notes && <p className="mt-2 text-sm text-muted-foreground">{item.notes}</p>}
              </div>
            </div>
          )}

          {item.kind === "voice" && (
            <div className="mt-3 inline-flex max-w-full items-center gap-2 rounded-2xl bg-secondary px-3 py-2">
              <Mic className="h-4 w-4 shrink-0 text-primary" />
              <VoicePlayer path={item.audio_url} peaks={item.peaks} duration={item.duration} />
            </div>
          )}

          {item.kind === "marker" && (
            <Link
              to="/projects/$id"
              params={{ id: item.project.id }}
              className="mt-3 flex items-start gap-2 rounded-xl border border-border bg-surface-2 px-3 py-2 hover:border-primary/40"
            >
              <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span className="min-w-0">
                <span className="mr-2 rounded bg-primary/15 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-primary">{formatTime(item.time_sec)}</span>
                <span className="text-sm">{item.body}</span>
              </span>
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
