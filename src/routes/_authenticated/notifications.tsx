import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useMe } from "@/hooks/use-me";
import { NotifLink, NotifRow, useNotifications } from "@/components/NotificationBell";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — Stemroom" },
      { name: "description", content: "Toute l'activité de tes amis et de tes projets." },
      { property: "og:title", content: "Notifications — Stemroom" },
      { property: "og:description", content: "Toute l'activité de tes amis et de tes projets." },
    ],
  }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const { uid } = useMe();
  const { items, unread, markAll } = useNotifications(uid);
  useEffect(() => {
    if (unread) {
      const t = setTimeout(markAll, 1500);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [unread, markAll]);
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-3xl font-bold">Notifications</h1>
      <div className="mt-6 rounded-2xl border border-border bg-card p-2">
        {items.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">Rien de neuf pour l'instant.</p>}
        {items.map((n) => <NotifLink key={n.id} n={n}><NotifRow n={n} /></NotifLink>)}
      </div>
    </div>
  );
}
