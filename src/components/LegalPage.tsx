import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Logo } from "@/components/AppShell";

export function LegalFooter() {
  return (
    <footer className="border-t border-border px-5 py-6 text-center text-xs text-muted-foreground">
      © {new Date().getFullYear()} CollabLand ·{" "}
      <Link to="/terms" className="hover:text-foreground">Conditions d'utilisation</Link> ·{" "}
      <Link to="/legal" className="hover:text-foreground">Mentions légales</Link>
    </footer>
  );
}

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-3xl items-center px-5 py-5">
        <Link to="/"><Logo /></Link>
      </header>
      <main className="mx-auto max-w-3xl px-5 pb-16">
        <h1 className="font-display text-3xl font-bold sm:text-4xl">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Dernière mise à jour : {updated}</p>
        <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted-foreground [&_h2]:mb-2 [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-foreground">
          {children}
        </div>
      </main>
      <LegalFooter />
    </div>
  );
}
