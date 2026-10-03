import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ExternalLink, Mail, Search, Shield } from "lucide-react";
import { checkIsAdmin, listAdminUsersFn } from "@/lib/admin.functions";
import { UserAvatar } from "@/components/UserAvatar";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { timeAgo } from "@/lib/media";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({
    meta: [
      { title: "Admin — CollabLand" },
      { name: "robots", content: "noindex, nofollow" },
      { name: "description", content: "Espace administrateur CollabLand." },
    ],
  }),
  beforeLoad: async () => {
    const { admin } = await checkIsAdmin();
    if (!admin) throw redirect({ to: "/feed" });
  },
  component: AdminUsersPage,
});

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function AdminUsersPage() {
  const [term, setTerm] = useState("");
  const [debounced, setDebounced] = useState("");

  // light debounce without extra deps
  useMemo(() => {
    const t = window.setTimeout(() => setDebounced(term.trim()), 250);
    return () => window.clearTimeout(t);
  }, [term]);

  const q = useQuery({
    queryKey: ["admin-users", debounced],
    queryFn: () => listAdminUsersFn({ data: { search: debounced } }),
  });

  const users = q.data?.users ?? [];
  const total = q.data?.total ?? 0;

  const weekAgo = Date.now() - 7 * 86400000;
  const monthAgo = Date.now() - 30 * 86400000;
  const thisWeek = users.filter((u) => new Date(u.created_at).getTime() >= weekAgo).length;
  const thisMonth = users.filter((u) => new Date(u.created_at).getTime() >= monthAgo).length;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
            <Shield className="h-3.5 w-3.5" />Administration
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Comptes créés</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Visible uniquement par toi. Les emails ne sont jamais exposés aux autres utilisateurs.
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3">
        {[
          { label: debounced ? "Résultats" : "Total", value: total },
          { label: "7 derniers jours", value: debounced ? "—" : thisWeek },
          { label: "30 derniers jours", value: debounced ? "—" : thisMonth },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-border/80 bg-card/60 px-4 py-3">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{s.label}</p>
            <p className="mt-1 font-display text-2xl font-semibold tabular-nums">{q.isLoading ? "—" : s.value}</p>
          </div>
        ))}
      </div>

      <div className="relative mt-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Rechercher un pseudo, un nom ou un email…"
          className="h-11 pl-9"
          autoComplete="off"
        />
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card">
        {q.isLoading && (
          <div className="space-y-3 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        )}
        {q.isError && (
          <p className="p-8 text-center text-sm text-destructive">
            Impossible de charger les comptes. Vérifie que la migration admin et le service role sont en place.
          </p>
        )}
        {!q.isLoading && !q.isError && users.length === 0 && (
          <p className="p-8 text-center text-sm text-muted-foreground">Aucun compte trouvé.</p>
        )}
        <ul className="divide-y divide-border/70">
          {users.map((u) => (
            <li key={u.id} className="flex flex-col gap-3 p-4 transition hover:bg-accent/30 sm:flex-row sm:items-center sm:gap-4">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <UserAvatar profile={u} className="h-12 w-12" />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <p className="truncate font-semibold">{u.display_name || u.username}</p>
                    <span className="truncate text-sm text-muted-foreground">@{u.username}</span>
                  </div>
                  {u.email ? (
                    <p className="mt-0.5 flex items-center gap-1.5 truncate text-sm text-muted-foreground">
                      <Mail className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{u.email}</span>
                    </p>
                  ) : (
                    <p className="mt-0.5 text-sm text-muted-foreground/70">Email non renseigné</p>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-3 text-xs text-muted-foreground sm:flex-col sm:items-end sm:gap-1">
                <p>
                  Inscrit {timeAgo(u.created_at)}
                  <span className="text-muted-foreground/60"> · {formatDate(u.created_at)}</span>
                </p>
                <p className="tabular-nums">
                  {u.project_count} projet{u.project_count === 1 ? "" : "s"}
                </p>
                <Link
                  to="/u/$username"
                  params={{ username: u.username }}
                  className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                >
                  Voir la vitrine <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
