import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/hooks/use-me";
import { UserAvatar } from "@/components/UserAvatar";
import { FriendButton } from "@/components/FriendButton";
import { PROJECT_SELECT, ProjectCard, type ProjectRow } from "@/components/ProjectCard";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/u/$username")({
  head: ({ params }) => ({
    meta: [
      { title: `@${params.username} — Stemroom` },
      { name: "description", content: `La vitrine de projets de @${params.username} sur Stemroom.` },
      { property: "og:title", content: `@${params.username} — Stemroom` },
      { property: "og:description", content: `La vitrine de projets de @${params.username}.` },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { username } = Route.useParams();
  const { uid } = useMe();
  const prof = useQuery({
    queryKey: ["profile", username],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("username", username).maybeSingle();
      return data;
    },
  });
  const p = prof.data;
  const projects = useQuery({
    queryKey: ["user-projects", p?.id],
    enabled: !!p,
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select(PROJECT_SELECT).eq("owner_id", p!.id).order("updated_at", { ascending: false });
      if (error) throw error;
      return data as unknown as ProjectRow[];
    },
  });

  if (prof.isLoading) return <Skeleton className="h-40 rounded-2xl" />;
  if (!p) return <p className="text-muted-foreground">Producteur introuvable.</p>;
  const isMe = uid === p.id;

  return (
    <div>
      <section className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 sm:p-8" style={{ backgroundImage: "var(--gradient-glow)" }}>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <UserAvatar profile={p} className="h-24 w-24 sm:h-28 sm:w-28" />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-3xl font-bold">{p.display_name || p.username}</h1>
            <p className="text-muted-foreground">@{p.username}</p>
            {p.bio && <p className="mt-2 max-w-xl text-sm text-foreground/80">{p.bio}</p>}
          </div>
          <div className="flex gap-2">
            {isMe ? (
              <>
                <Link to="/settings" className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm"><Settings className="h-4 w-4" />Modifier</Link>
                <Link to="/projects/new" className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"><Plus className="h-4 w-4" />Projet</Link>
              </>
            ) : (
              uid && <FriendButton me={uid} other={p.id} />
            )}
          </div>
        </div>
      </section>
      <h2 className="mt-8 text-xl font-bold">Vitrine</h2>
      <div className="mt-4 space-y-4">
        {projects.data?.length === 0 && (
          <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            {isMe ? "Publie ton premier projet pour remplir ta vitrine." : "Aucun projet visible pour toi. Ajoute ce producteur en ami pour découvrir ses projets."}
          </p>
        )}
        {projects.data?.map((pr) => <ProjectCard key={pr.id} p={pr} />)}
      </div>
    </div>
  );
}
