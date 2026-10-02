import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Logo } from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { normalizeUsername, USERNAME_HINT, usernameError } from "@/lib/username";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { next?: string } => {
    const n = s["next"];
    if (typeof n === "string" && n.startsWith("/") && !n.startsWith("//")) return { next: n };
    return {};
  },
  head: () => ({
    meta: [
      { title: "Connexion — CollabLand" },
      { name: "description", content: "Connecte-toi ou crée ton compte producteur sur CollabLand." },
      { property: "og:title", content: "Connexion — CollabLand" },
      { property: "og:description", content: "Connecte-toi ou crée ton compte producteur." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

type Mode = "login" | "signup" | "forgot" | "reset";

function AuthPage() {
  const navigate = useNavigate();
  const { next } = Route.useSearch();
  const [mode, setMode] = useState<Mode>("login");
  const recovering = useRef(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [confirm, setConfirm] = useState("");
  const [accepted, setAccepted] = useState(false);
  const mismatch = (mode === "signup" || mode === "reset") && confirm.length > 0 && confirm !== password;
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const afterAuthPath = next || "/feed";

  const goAfterAuth = () => {
    if (next?.startsWith("/invite/")) {
      navigate({ to: "/invite/$token", params: { token: next.slice("/invite/".length) }, replace: true });
      return;
    }
    if (next?.startsWith("/u/")) {
      navigate({ to: "/u/$username", params: { username: next.slice("/u/".length) }, replace: true });
      return;
    }
    navigate({ to: "/feed", replace: true });
  };

  useEffect(() => {
    const goReady = (session: unknown) => {
      if (session && !recovering.current) goAfterAuth();
    };
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        recovering.current = true;
        setMode("reset");
        setSent(false);
        setResetSent(false);
        setPassword("");
        setConfirm("");
        return;
      }
      goReady(session);
    });
    supabase.auth.getSession().then(({ data: s }) => goReady(s.session));
    return () => data.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, next]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + "/auth",
        });
        if (error) throw error;
        setResetSent(true);
      } else if (mode === "reset") {
        if (password.length < 8) throw new Error("Le mot de passe doit faire au moins 8 caractères");
        if (password !== confirm) throw new Error("Les mots de passe ne correspondent pas");
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        recovering.current = false;
        toast.success("Mot de passe mis à jour");
        goAfterAuth();
      } else {
        if (password.length < 8) throw new Error("Le mot de passe doit faire au moins 8 caractères");
        if (password !== confirm) throw new Error("Les mots de passe ne correspondent pas");
        if (!accepted) throw new Error("Accepte les conditions d'utilisation pour continuer");
        const u = normalizeUsername(username);
        const err = usernameError(u);
        if (err) throw new Error(err);
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + afterAuthPath, data: { username: u } },
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
    const redirect =
      next
        ? `${window.location.origin}/auth?next=${encodeURIComponent(next)}`
        : `${window.location.origin}/auth`;
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: redirect });
    if (r.error) toast.error("Connexion Google impossible");
  };

  const title =
    mode === "login" ? "Bon retour"
    : mode === "signup" ? "Créer ton compte"
    : mode === "forgot" ? "Mot de passe oublié"
    : "Nouveau mot de passe";

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
          ) : resetSent ? (
            <div className="text-center">
              <h1 className="text-xl font-bold">Vérifie tes emails</h1>
              <p className="mt-2 text-sm text-muted-foreground">Si un compte existe pour {email}, tu recevras un lien pour choisir un nouveau mot de passe.</p>
              <button type="button" className="mt-4 text-sm font-medium text-primary" onClick={() => { setResetSent(false); setMode("login"); }}>
                Retour à la connexion
              </button>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold">{title}</h1>
              {mode === "forgot" && (
                <p className="mt-2 text-sm text-muted-foreground">Indique ton email : tu recevras un lien pour choisir un nouveau mot de passe.</p>
              )}
              {mode === "reset" && (
                <p className="mt-2 text-sm text-muted-foreground">Choisis un nouveau mot de passe pour ton compte.</p>
              )}
              {(mode === "login" || mode === "signup") && (
                <>
                  <Button variant="outline" className="mt-5 w-full" onClick={google} type="button">
                    Continuer avec Google
                  </Button>
                  <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />ou<span className="h-px flex-1 bg-border" /></div>
                </>
              )}
              <form onSubmit={submit} className={`space-y-4 ${mode === "forgot" || mode === "reset" ? "mt-5" : ""}`}>
                {mode === "signup" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="u">Nom d'utilisateur</Label>
                    <Input id="u" value={username} onChange={(e) => setUsername(e.target.value)} required minLength={3} maxLength={24} placeholder="djnova" />
                    <p className="text-xs text-muted-foreground">{USERNAME_HINT}</p>
                  </div>
                )}
                {(mode === "login" || mode === "signup" || mode === "forgot") && (
                  <div className="space-y-1.5">
                    <Label htmlFor="e">Email</Label>
                    <Input id="e" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                )}
                {(mode === "login" || mode === "signup" || mode === "reset") && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <Label htmlFor="p">{mode === "reset" ? "Nouveau mot de passe" : "Mot de passe"}</Label>
                      {mode === "login" && (
                        <button type="button" className="text-xs font-medium text-primary" onClick={() => { setMode("forgot"); setPassword(""); setConfirm(""); }}>
                          Mot de passe oublié ?
                        </button>
                      )}
                    </div>
                    <Input id="p" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={mode === "login" ? 6 : 8} />
                  </div>
                )}
                {(mode === "signup" || mode === "reset") && (
                  <div className="space-y-1.5">
                    <Label htmlFor="pc">Confirmer le mot de passe</Label>
                    <Input id="pc" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required aria-invalid={mismatch} />
                    {mismatch && <p className="text-xs text-destructive">Les mots de passe ne correspondent pas</p>}
                  </div>
                )}
                {mode === "signup" && (
                  <label className="flex items-start gap-2 text-xs text-muted-foreground">
                    <input type="checkbox" className="mt-0.5 accent-[var(--primary)]" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} required />
                    <span>J'accepte les <Link to="/terms" target="_blank" className="text-primary underline">conditions d'utilisation</Link> et j'ai lu les <Link to="/legal" target="_blank" className="text-primary underline">mentions légales</Link>.</span>
                  </label>
                )}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={busy || ((mode === "signup" || mode === "reset") && (confirm !== password || (mode === "signup" && !accepted)))}
                >
                  {mode === "login" ? "Se connecter"
                    : mode === "signup" ? "Créer mon compte"
                    : mode === "forgot" ? "Envoyer le lien"
                    : "Enregistrer le mot de passe"}
                </Button>
              </form>
              {mode !== "reset" && (
                <p className="mt-5 text-center text-sm text-muted-foreground">
                  {mode === "login" && (
                    <>Pas encore de compte ?{" "}
                      <button type="button" className="font-medium text-primary" onClick={() => setMode("signup")}>Inscription</button>
                    </>
                  )}
                  {mode === "signup" && (
                    <>Déjà inscrit ?{" "}
                      <button type="button" className="font-medium text-primary" onClick={() => setMode("login")}>Connexion</button>
                    </>
                  )}
                  {mode === "forgot" && (
                    <button type="button" className="font-medium text-primary" onClick={() => setMode("login")}>Retour à la connexion</button>
                  )}
                </p>
              )}
            </>
          )}
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          <Link to="/terms" className="hover:text-foreground">Conditions d'utilisation</Link> · <Link to="/legal" className="hover:text-foreground">Mentions légales</Link>
        </p>
      </div>
    </div>
  );
}
