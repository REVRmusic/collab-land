import { LegalFooter } from "@/components/LegalPage";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { GitBranch, Lock, Mic, Palette, Bell, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/AppShell";
import { Waveform } from "@/components/Waveform";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CollabLand — Fais tes morceaux à plusieurs" },
      { name: "description", content: "Partage tes projets en cours, échange des versions et des vocaux avec tes amis producteurs, et faites avancer le morceau ensemble." },
      { property: "og:title", content: "CollabLand — Fais tes morceaux à plusieurs" },
      { property: "og:description", content: "Partage tes projets en cours, échange des versions et des vocaux avec tes amis producteurs, et faites avancer le morceau ensemble." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const navigate = useNavigate();
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/feed", replace: true });
    });
  }, [navigate]);

  const peaks = useMemo(
    () => Array.from({ length: 160 }, (_, i) => 0.25 + 0.6 * Math.abs(Math.sin(i / 7) * Math.cos(i / 17)) + ((i * 37) % 11) / 60),
    [],
  );

  const features = [
    { icon: GitBranch, t: "Faites avancer le morceau", d: "Chaque V2, V3… avec sa pré-écoute : tout le monde suit où en est le projet." },
    { icon: Lock, t: "À plusieurs, à ta manière", d: "Ouvre le projet à tous tes amis ou seulement à ceux que tu choisis." },
    { icon: Mic, t: "Discutez, en vocal", d: "Réagis à une version d'un simple vocal, comme sur Instagram." },
    { icon: Download, t: "Échangez les stems", d: "Demande les stems ou récupère la dernière version en un clic." },
    { icon: Palette, t: "Construisez l'identité", d: "Chacun propose des covers, le morceau trouve sa pochette." },
    { icon: Bell, t: "Personne ne rate un passage", d: "Cloche en temps réel : une nouvelle version, un vocal, et chacun le sait." },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ backgroundImage: "var(--gradient-glow)" }}>
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Logo to="/" />
        <Link to="/auth" search={{}} className="rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-accent">Connexion</Link>
      </header>
      <section className="mx-auto max-w-6xl px-5 pb-16 pt-12 sm:pt-20">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Faites de la musique ensemble</p>
        <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-[1.05] sm:text-6xl">
          Un morceau ne se fait jamais seul.<br />Fais-le évoluer à plusieurs.
        </h1>
        <p className="mt-5 max-w-xl text-lg text-muted-foreground">
          Dépose ton projet en cours, invite tes amis producteurs, et faites avancer le morceau ensemble — chaque version s'écoute, se commente et s'améliore, du premier brouillon au master.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/auth" search={{}} className="rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-[0_10px_40px_-10px_var(--primary)] hover:brightness-110">
            Commencer à collaborer
          </Link>
        </div>
        <div className="mt-14 rounded-2xl border border-border bg-card/70 p-5 backdrop-blur">
          <div className="mb-3 flex items-center justify-between text-sm">
            <span className="font-display font-semibold">Night Drive — V4 par Max</span>
            <span className="text-muted-foreground">124 BPM · A min</span>
          </div>
          <Waveform peaks={peaks} progress={0.38} height={90} />
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-4 px-5 pb-24 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <div key={f.t} className="rounded-2xl border border-border bg-card p-5">
            <f.icon className="h-5 w-5 text-primary" />
            <h3 className="mt-3 font-semibold">{f.t}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{f.d}</p>
          </div>
        ))}
      </section>
      <LegalFooter />
    </div>
  );
}
