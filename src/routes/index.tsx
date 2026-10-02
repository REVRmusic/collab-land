import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { GitBranch, Lock, Mic, Palette, Bell, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/AppShell";
import { Waveform } from "@/components/Waveform";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Stemroom — Le studio partagé des producteurs" },
      { name: "description", content: "Vitrine de projets, historique des versions, stems, covers et vocaux : collabore avec tes amis producteurs." },
      { property: "og:title", content: "Stemroom — Le studio partagé des producteurs" },
      { property: "og:description", content: "Vitrine de projets, historique des versions, stems, covers et vocaux entre producteurs." },
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
    { icon: GitBranch, t: "Historique des versions", d: "Chaque V2, V3… avec sa pré-écoute et ses notes." },
    { icon: Lock, t: "Partage ciblé", d: "Tous tes amis, ou seulement ceux que tu choisis." },
    { icon: Mic, t: "Vocaux dans le fil", d: "Envoie et réponds en vocal, comme sur Instagram." },
    { icon: Download, t: "Stems & liens", d: "Demande les stems ou récupère le projet en un clic." },
    { icon: Palette, t: "Covers", d: "Propose des artworks et choisis la cover finale." },
    { icon: Bell, t: "Notifications", d: "Cloche en temps réel et résumé quotidien." },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ backgroundImage: "var(--gradient-glow)" }}>
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Logo />
        <Link to="/auth" className="rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-accent">Connexion</Link>
      </header>
      <section className="mx-auto max-w-6xl px-5 pb-16 pt-12 sm:pt-20">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Pour producteurs & DJs</p>
        <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-[1.05] sm:text-6xl">
          Ton studio partagé.<br />Chaque idée, chaque version.
        </h1>
        <p className="mt-5 max-w-xl text-lg text-muted-foreground">
          Montre tes démos dans ta vitrine, fais évoluer les projets à plusieurs, échange des vocaux et récupère les stems.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/auth" className="rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-[0_10px_40px_-10px_var(--primary)] hover:brightness-110">
            Créer mon studio
          </Link>
        </div>
        <div className="mt-14 rounded-2xl border border-border bg-card/70 p-5 backdrop-blur">
          <div className="mb-3 flex items-center justify-between text-sm">
            <span className="font-display font-semibold">Night Drive — V4</span>
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
    </div>
  );
}
