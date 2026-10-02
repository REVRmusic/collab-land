import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Logo } from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Connexion — Stemroom" },
      { name: "description", content: "Connecte-toi ou crée ton compte producteur sur Stemroom." },
      { property: "og:title", content: "Connexion — Stemroom" },
      { property: "og:description", content: "Connecte-toi ou crée ton compte producteur." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => data.session && navigate({ to: "/feed", replace: true }));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => s && navigate({ to: "/feed", replace: true }));
    return () => data.subscription.unsubscribe();
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/feed", data: { username } },
        });
        if (error) throw error;
        setSent(true);
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (r.error) toast.error("Connexion Google impossible");
  };

  return (
    <div className="grid min-h-screen place-items-center px-4" style={{ backgroundImage: "var(--gradient-glow)" }}>
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center"><Logo /></div>
        <div className="rounded-2xl border border-border bg-card p-6">
          {sent ? (
            <div className="text-center">
              <h1 className="text-xl font-bold">Vérifie tes emails</h1>
              <p className="mt-2 text-sm text-muted-foreground">Un lien de confirmation a été envoyé à {email}.</p>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold">{mode === "login" ? "Bon retour" : "Créer ton compte"}</h1>
              <Button variant="outline" className="mt-5 w-full" onClick={google} type="button">
                Continuer avec Google
              </Button>
              <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />ou<span className="h-px flex-1 bg-border" /></div>
              <form onSubmit={submit} className="space-y-4">
                {mode === "signup" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="u">Nom d'utilisateur</Label>
                    <Input id="u" value={username} onChange={(e) => setUsername(e.target.value)} required minLength={3} placeholder="djnova" />
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="e">Email</Label>
                  <Input id="e" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="p">Mot de passe</Label>
                  <Input id="p" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
                </div>
                <Button type="submit" className="w-full" disabled={busy}>
                  {mode === "login" ? "Se connecter" : "Créer mon compte"}
                </Button>
              </form>
              <p className="mt-5 text-center text-sm text-muted-foreground">
                {mode === "login" ? "Pas encore de compte ?" : "Déjà inscrit ?"}{" "}
                <button className="font-medium text-primary" onClick={() => setMode(mode === "login" ? "signup" : "login")}>
                  {mode === "login" ? "Inscription" : "Connexion"}
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
