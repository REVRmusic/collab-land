import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/hooks/use-me";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/UserAvatar";
import { FriendButton } from "@/components/FriendButton";
import { useFriends, type FriendProfile } from "@/hooks/use-friends";

export const Route = createFileRoute("/_authenticated/friends")({
  head: () => ({
    meta: [
      { title: "Amis — Stemroom" },
      { name: "description", content: "Trouve des producteurs et gère tes amis." },
      { property: "og:title", content: "Amis — Stemroom" },
      { property: "og:description", content: "Trouve des producteurs et gère tes amis." },
    ],
  }),
  component: FriendsPage,
});

type P = FriendProfile;

function Row({ p, me }: { p: P; me: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl p-3 hover:bg-accent/50">
      <Link to="/u/$username" params={{ username: p.username }} className="flex min-w-0 flex-1 items-center gap-3">
        <UserAvatar profile={p} className="h-11 w-11" />
        <div className="min-w-0">
          <p className="truncate font-semibold">{p.display_name || p.username}</p>
          <p className="truncate text-sm text-muted-foreground">@{p.username}</p>
        </div>
      </Link>
      <FriendButton me={me} other={p.id} />
    </div>
  );
}

function FriendsPage() {
  const { uid } = useMe();
  const [term, setTerm] = useState("");
  const f = useFriends(uid);
  const search = useQuery({
    queryKey: ["search", term],
    enabled: term.trim().length >= 2,
    queryFn: async () => {
      const t = term.trim().replace(/[%,()]/g, "");
      const { data } = await supabase
        .from("profiles")
        .select("id,username,display_name,avatar_url")
        .or(`username.ilike.%${t}%,display_name.ilike.%${t}%`)
        .neq("id", uid!)
        .limit(20);
      return (data ?? []) as P[];
    },
  });
  if (!uid) return null;
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-3xl font-bold">Amis</h1>
      <div className="relative mt-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Rechercher un producteur ou DJ…" className="h-11 pl-9" />
      </div>
      {term.trim().length >= 2 && (
        <div className="mt-3 rounded-2xl border border-border bg-card p-2">
          {search.data?.length === 0 && <p className="p-4 text-sm text-muted-foreground">Aucun résultat.</p>}
          {search.data?.map((p) => <Row key={p.id} p={p} me={uid} />)}
        </div>
      )}
      {!!f.data?.incoming.length && (
        <section className="mt-8">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-primary">Demandes reçues</h2>
          <div className="rounded-2xl border border-border bg-card p-2">{f.data.incoming.map((p) => <Row key={p.id} p={p} me={uid} />)}</div>
        </section>
      )}
      <section className="mt-8">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Mes amis ({f.data?.friends.length ?? 0})</h2>
        <div className="rounded-2xl border border-border bg-card p-2">
          {f.data?.friends.length === 0 && <p className="p-4 text-sm text-muted-foreground">Pas encore d'amis. Utilise la recherche ci-dessus.</p>}
          {f.data?.friends.map((p) => <Row key={p.id} p={p} me={uid} />)}
        </div>
      </section>
      {!!f.data?.outgoing.length && (
        <section className="mt-8">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Demandes envoyées</h2>
          <div className="rounded-2xl border border-border bg-card p-2">{f.data.outgoing.map((p) => <Row key={p.id} p={p} me={uid} />)}</div>
        </section>
      )}
    </div>
  );
}
