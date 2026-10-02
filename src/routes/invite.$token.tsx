import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/hooks/use-me";
import { Logo } from "@/components/AppShell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/invite/$token")({
  head: () => ({
    meta: [
      { title: "Invitation à un projet — CollabLand" },
      { name: "description", content: "Tu as été invité à rejoindre un projet CollabLand. Ouvre le lien pour collaborer." },
      { property: "og:type", content: "website" },
      { property: "og:title", content: "Invitation à un projet — CollabLand" },
      { property: "og:description", content: "Tu as été invité à rejoindre un projet CollabLand. Ouvre le lien pour collaborer." },
      { property: "og:image", content: "https://collab-land.lovable.app/og/default" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Invitation à un projet — CollabLand" },
      { name: "twitter:description", content: "Tu as été invité à rejoindre un projet CollabLand. Ouvre le lien pour collaborer." },
      { name: "twitter:image", content: "https://collab-land.lovable.app/og/default" },
    ],
  }),
  component: InvitePage,
});

function InvitePage() {
  const { token } = Route.useParams();
  const { uid, loading } = useMe();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"idle" | "working" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!uid) return;
    let cancelled = false;
    (async () => {
      setStatus("working");
      const { data, error: err } = await supabase.rpc("accept_project_invite", { _token: token });
      if (cancelled) return;
      if (err) {
        setStatus("error");
        setError(err.message || "Invitation impossible");
        toast.error(err.message || "Invitation impossible");
        return;
      }
      toast.success("Tu as rejoint le projet");
      navigate({ to: "/projects/$id", params: { id: data as string }, replace: true });
    })();
    return () => { cancelled = true; };
  }, [loading, uid, token, navigate]);

  if (loading || (uid && status === "working")) {
    return (
      <Shell>
        <h1 className="text-xl font-bold">Invitation en cours…</h1>
        <p className="mt-2 text-sm text-muted-foreground">On t’ajoute au projet.</p>
      </Shell>
    );
  }

  if (!uid) {
    return (
      <Shell>
        <h1 className="text-xl font-bold">Tu es invité sur un projet</h1>
        <p className="mt-2 text-sm text-muted-foreground">Connecte-toi ou crée un compte pour rejoindre la collab — pas besoin d’être déjà ami.</p>
        <div className="mt-6 flex flex-col gap-2">
          <Button asChild>
            <Link to="/auth" search={{ next: `/invite/${token}` }}>Continuer</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link to="/">Retour à l'accueil</Link>
          </Button>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <h1 className="text-xl font-bold">Invitation</h1>
      <p className="mt-2 text-sm text-muted-foreground">{error ?? "Une erreur est survenue."}</p>
      <Button className="mt-6" variant="secondary" asChild>
        <Link to="/feed">Retour au fil</Link>
      </Button>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen place-items-center px-4" style={{ backgroundImage: "var(--gradient-glow)" }}>
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center"><Logo to="/" /></div>
        <div className="rounded-2xl border border-border bg-card p-6">{children}</div>
      </div>
    </div>
  );
}
