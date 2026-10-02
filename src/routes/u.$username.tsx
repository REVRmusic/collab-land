import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Copy, Plus, Settings, Share2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/hooks/use-me";
import { AppShell, Logo } from "@/components/AppShell";
import { UserAvatar } from "@/components/UserAvatar";
import { FriendButton } from "@/components/FriendButton";
import { PROJECT_SELECT, ProjectCard, type ProjectRow } from "@/components/ProjectCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { LegalFooter } from "@/components/LegalPage";

export const Route = createFileRoute("/u/$username")({
  head: ({ params }) => ({
    meta: [
      { title: `@${params.username} — CollabLand` },
      { name: "description", content: `La vitrine de projets de @${params.username} sur CollabLand.` },
      { property: "og:title", content: `@${params.username} — CollabLand` },
      { property: "og:description", content: `La vitrine de projets de @${params.username}.` },
    ],
  }),
  component: ProfileRoute,
});

function ProfileRoute() {
  const { uid, loading } = useMe();
  const { username } = Route.useParams();
  const body = <ProfilePage />;
  if (loading) return <div className="grid min-h-screen place-items-center"><Skeleton className="h-40 w-full max-w-2xl rounded-2xl" /></div>;
  if (uid) return <AppShell>{body}</AppShell>;
  return (
    <div className="min-h-screen" style={{ backgroundImage: "var(--gradient-glow)" }}>
      <header className="mx-auto flex max-w-3xl items-center justify-between px-5 py-5">
        <Logo to="/" />
        <Link to="/auth" search={{ next: `/u/${username}` }} className="rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-accent">
          Connexion
        </Link>
      </header>
      <main className="mx-auto max-w-3xl px-5 pb-16">{body}</main>
      <LegalFooter />
    </div>
  );
}

function ProfilePage() {
  const { username } = Route.useParams();
  const { uid } = useMe();
  const prof = useQuery({
    queryKey: ["profile", username],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id,username,display_name,avatar_url,bio,created_at")
        .eq("username", username)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const p = prof.data;
  const isMe = !!uid && uid === p?.id;
  const projects = useQuery({
    queryKey: ["user-projects", p?.id, isMe ? "mine" : "public"],
    enabled: !!p,
    queryFn: async () => {
      let q = supabase.from("projects").select(PROJECT_SELECT).eq("owner_id", p!.id).order("updated_at", { ascending: false });
      if (!isMe && !uid) q = q.eq("showcase", true);
      const { data, error } = await q;
      if (error) throw error;
      return data as unknown as ProjectRow[];
    },
  });

  if (prof.isLoading) return <Skeleton className="h-40 rounded-2xl" />;
  if (!p) return <p className="text-muted-foreground">Producteur introuvable.</p>;

  const share = async () => {
    const url = `${window.location.origin}/u/${p.username}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Lien de la vitrine copié");
    } catch {
      toast.error("Impossible de copier le lien");
    }
  };

  const shown = projects.data ?? [];
  const emptyPublic = !isMe && shown.length === 0;

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
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={share}>
              <Share2 className="h-4 w-4" />Partager
            </Button>
            {isMe ? (
              <>
                <Link to="/settings" className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm"><Settings className="h-4 w-4" />Modifier</Link>
                <Link to="/projects/new" className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"><Plus className="h-4 w-4" />Projet</Link>
              </>
            ) : (
              uid && <FriendButton me={uid} other={p.id} />
            )}
            {!uid && (
              <Link to="/auth" search={{ next: `/u/${p.username}` }} className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">
                Rejoindre CollabLand
              </Link>
            )}
          </div>
        </div>
      </section>
      <div className="mt-8 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Vitrine</h2>
          <p className="text-sm text-muted-foreground">
            {isMe
              ? "Coche « Sur ma vitrine publique » dans Modifier pour exposer un projet ici."
              : "Extraits des projets mis en avant."}
          </p>
        </div>
        {isMe && (
          <button type="button" onClick={share} className="hidden items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground sm:inline-flex">
            <Copy className="h-3.5 w-3.5" />/u/{p.username}
          </button>
        )}
      </div>
      <div className="mt-4 space-y-4">
        {projects.isLoading && <Skeleton className="h-36 rounded-2xl" />}
        {emptyPublic && (
          <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Aucun projet en vitrine pour le moment.
          </p>
        )}
        {isMe && shown.length === 0 && (
          <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Publie ton premier projet pour remplir ta vitrine.
          </p>
        )}
        {shown.map((pr) => <ProjectCard key={pr.id} p={pr} />)}
      </div>
    </div>
  );
}
