import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Copy, Plus, Share2 } from "lucide-react";
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
import { getProfileShareMeta } from "@/lib/profile-share.functions";
import { buildProfileShareMeta } from "@/lib/share-meta";

export const Route = createFileRoute("/u/$username")({
  loader: ({ params }) => getProfileShareMeta({ data: { username: params.username } }),
  head: ({ loaderData, params }) => {
    const share = loaderData ?? buildProfileShareMeta(null, params.username, "https://collab-land.lovable.app");
    return {
      meta: [
        { title: share.title },
        { name: "description", content: share.description },
        { property: "og:type", content: "profile" },
        { property: "og:title", content: share.title },
        { property: "og:description", content: share.description },
        { property: "og:url", content: share.pageUrl },
        { property: "og:image", content: share.imageUrl },
        { property: "og:image:alt", content: `Photo de profil de ${share.name}` },
        { property: "og:site_name", content: "CollabLand" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: share.title },
        { name: "twitter:description", content: share.description },
        { name: "twitter:image", content: share.imageUrl },
        { name: "twitter:image:alt", content: `Photo de profil de ${share.name}` },
      ],
      links: [{ rel: "canonical", href: share.pageUrl }],
    };
  },
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
  const share = Route.useLoaderData();
  const { uid } = useMe();
  const prof = useQuery({
    queryKey: ["profile", username],
    initialData: share.profile ?? undefined,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id,username,display_name,avatar_url,bio")
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

  const shareLink = async () => {
    const url = share.pageUrl || `${window.location.origin}/u/${p.username}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: share.title, text: share.description, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.success("Lien de la vitrine copié");
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      try {
        await navigator.clipboard.writeText(url);
        toast.success("Lien de la vitrine copié");
      } catch {
        toast.error("Impossible de copier le lien");
      }
    }
  };

  const shown = (() => {
    const list = projects.data ?? [];
    if (!isMe) return list;
    // Public showcase projects first so the owner sees what visitors get
    return [...list].sort((a, b) => Number(!!b.showcase) - Number(!!a.showcase));
  })();
  const publicCount = shown.filter((pr) => pr.showcase).length;
  const emptyPublic = !isMe && shown.length === 0;

  return (
    <div>
      <section className="relative overflow-hidden rounded-3xl border border-border bg-card p-5 sm:p-8" style={{ backgroundImage: "var(--gradient-glow)" }}>
        <div className="flex items-start gap-4">
          <UserAvatar profile={p} className="h-20 w-20 shrink-0 sm:h-28 sm:w-28" />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h1 className="truncate text-2xl font-bold sm:text-3xl">{p.display_name || p.username}</h1>
                <p className="text-sm text-muted-foreground sm:text-base">@{p.username}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={shareLink}
                  aria-label="Partager"
                  title="Partager"
                  className="h-9 w-9 px-0 sm:w-auto sm:px-3"
                >
                  <Share2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Partager</span>
                </Button>
                {isMe ? (
                  <Button asChild size="sm" className="h-9 w-9 px-0 sm:w-auto sm:px-3">
                    <Link to="/projects/new" aria-label="Nouveau projet" title="Nouveau projet">
                      <Plus className="h-4 w-4" />
                      <span className="hidden sm:inline">Projet</span>
                    </Link>
                  </Button>
                ) : (
                  uid && <FriendButton me={uid} other={p.id} />
                )}
                {!uid && (
                  <Button asChild size="sm" className="h-9">
                    <Link to="/auth" search={{ next: `/u/${p.username}` }}>Rejoindre</Link>
                  </Button>
                )}
              </div>
            </div>
            {p.bio && <p className="mt-2 max-w-xl text-sm text-foreground/80">{p.bio}</p>}
          </div>
        </div>
      </section>
      <div className="mt-8 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Vitrine</h2>
          <p className="text-sm text-muted-foreground">
            {isMe
              ? publicCount > 0
                ? `${publicCount} projet${publicCount > 1 ? "s" : ""} visible${publicCount > 1 ? "s" : ""} sur ton profil public. Bascule Public / Masqué sur chaque carte.`
                : "Aucun projet n’est encore visible publiquement — passe un projet en Public sur sa carte."
              : "Extraits des projets mis en avant."}
          </p>
        </div>
        {isMe && (
          <button type="button" onClick={shareLink} className="hidden items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground sm:inline-flex">
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
        {shown.map((pr) => <ProjectCard key={pr.id} p={pr} showPublicVisibility={isMe} />)}
      </div>
    </div>
  );
}
