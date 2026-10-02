import { useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { UserAvatar } from "./UserAvatar";
import { timeAgo } from "@/lib/media";

export type Notif = {
  id: string;
  type: string;
  read: boolean;
  created_at: string;
  project_id: string | null;
  data: Record<string, unknown>;
  actor: { username: string; display_name: string | null; avatar_url: string | null } | null;
};

export function notifText(n: Notif) {
  const who = n.actor?.display_name || n.actor?.username || "Quelqu'un";
  const t = (n.data?.['title'] as string) ?? "un projet";
  switch (n.type) {
    case "new_project": return <><b>{who}</b> a partagé un nouveau projet : <b>{t}</b></>;
    case "new_version": return <><b>{who}</b> a publié la V{String(n.data?.['version'] ?? "")} de <b>{t}</b></>;
    case "new_message": return <><b>{who}</b> a {n.data?.['kind'] === "voice" ? "envoyé un vocal" : "écrit"} dans <b>{t}</b></>;
    case "new_cover": return <><b>{who}</b> a proposé une cover pour <b>{t}</b></>;
    case "friend_request": return <><b>{who}</b> veut t'ajouter en ami</>;
    case "friend_accepted": return <><b>{who}</b> a accepté ta demande d'ami</>;
    case "stem_request": return <><b>{who}</b> demande les STEMS de <b>{t}</b></>;
    case "stem_accepted": return <><b>{who}</b> a accepté ta demande de STEMS pour <b>{t}</b></>;
    case "stem_declined": return <><b>{who}</b> a refusé ta demande de STEMS pour <b>{t}</b></>;
    default: return <>Nouvelle activité</>;
  }
}

export function useNotifications(uid?: string) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["notifications", uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("id,type,read,created_at,project_id,data,actor:profiles!notifications_actor_id_fkey(username,display_name,avatar_url)")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as unknown as Notif[];
    },
  });
  useEffect(() => {
    if (!uid) return;
    const ch = supabase
      .channel(`notif-${uid}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${uid}` }, () =>
        qc.invalidateQueries({ queryKey: ["notifications", uid] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [uid, qc]);
  const markAll = async () => {
    await supabase.from("notifications").update({ read: true }).eq("read", false);
    qc.invalidateQueries({ queryKey: ["notifications", uid] });
  };
  return { items: q.data ?? [], unread: (q.data ?? []).filter((n) => !n.read).length, markAll };
}

export function NotifLink({ n, children, onClick }: { n: Notif; children: React.ReactNode; onClick?: () => void }) {
  const cls = `flex gap-3 rounded-lg p-3 text-sm transition hover:bg-accent ${n.read ? "opacity-70" : ""}`;
  if (n.project_id)
    return <Link to="/projects/$id" params={{ id: n.project_id }} className={cls} onClick={onClick}>{children}</Link>;
  return <Link to="/friends" className={cls} onClick={onClick}>{children}</Link>;
}

export function NotifRow({ n }: { n: Notif }) {
  return (
    <>
      <UserAvatar profile={n.actor} className="h-9 w-9" />
      <div className="min-w-0 flex-1">
        <p className="leading-snug text-foreground/90">{notifText(n)}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{timeAgo(n.created_at)}</p>
      </div>
      {!n.read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />}
    </>
  );
}

export function NotificationBell({ uid }: { uid?: string | undefined }) {
  const { items, unread, markAll } = useNotifications(uid);
  return (
    <Popover onOpenChange={(o) => !o && unread && markAll()}>
      <PopoverTrigger asChild>
        <button className="relative grid h-10 w-10 place-items-center rounded-full hover:bg-accent" aria-label="Notifications">
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[360px] max-w-[92vw] p-2">
        <div className="flex items-center justify-between px-2 py-1">
          <h3 className="font-display font-semibold">Notifications</h3>
          {unread > 0 && <button onClick={markAll} className="text-xs text-primary">Tout marquer lu</button>}
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {items.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">Rien de neuf pour l'instant.</p>}
          {items.map((n) => (
            <NotifLink key={n.id} n={n}><NotifRow n={n} /></NotifLink>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
