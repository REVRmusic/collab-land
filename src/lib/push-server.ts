import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { notifPlainText, VAPID_PUBLIC_KEY } from "@/lib/push-shared";

function admin() {
  const url = process.env["SUPABASE_URL"] || process.env["VITE_SUPABASE_URL"];
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!url || !key) throw new Error("SUPABASE_SERVICE_ROLE_KEY manquant pour l’envoi des push");
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function configureVapid() {
  const priv = process.env["VAPID_PRIVATE_KEY"];
  const pub = process.env["VAPID_PUBLIC_KEY"] || VAPID_PUBLIC_KEY;
  const subject = process.env["VAPID_SUBJECT"] || "mailto:noreply@collabland-notify.lm-music.com";
  if (!priv) throw new Error("VAPID_PRIVATE_KEY manquant (à ajouter dans les secrets Lovable)");
  webpush.setVapidDetails(subject, pub, priv);
}

export type PushNotifRow = {
  id: string;
  user_id: string;
  type: string;
  project_id: string | null;
  data: Record<string, unknown>;
  actor_id: string | null;
};

export async function sendWebPushForNotification(n: PushNotifRow) {
  configureVapid();
  const sb = admin();

  let actorName: string | null = null;
  if (n.actor_id) {
    const { data: actor } = await sb
      .from("profiles")
      .select("display_name,username")
      .eq("id", n.actor_id)
      .maybeSingle();
    actorName = actor?.display_name || actor?.username || null;
  }

  const { title, body } = notifPlainText(n.type, n.data, actorName);
  const url = n.project_id ? `/projects/${n.project_id}` : n.type.startsWith("friend") ? "/friends" : "/notifications";
  const payload = JSON.stringify({
    title,
    body,
    url,
    tag: n.id,
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
  });

  const { data: subs } = await sb
    .from("push_subscriptions")
    .select("id,endpoint,p256dh,auth")
    .eq("user_id", n.user_id);

  if (!subs?.length) {
    await sb.from("notifications").update({ push_sent_at: new Date().toISOString() }).eq("id", n.id);
    return { sent: 0, removed: 0 };
  }

  let sent = 0;
  let removed = 0;
  for (const s of subs) {
    try {
      await webpush.sendNotification(
        {
          endpoint: s.endpoint,
          keys: { p256dh: s.p256dh, auth: s.auth },
        },
        payload,
        { TTL: 60 * 60 * 12, urgency: "normal" },
      );
      sent++;
    } catch (err: unknown) {
      const status = typeof err === "object" && err && "statusCode" in err ? Number((err as { statusCode: number }).statusCode) : 0;
      if (status === 404 || status === 410) {
        await sb.from("push_subscriptions").delete().eq("id", s.id);
        removed++;
      }
    }
  }

  await sb.from("notifications").update({ push_sent_at: new Date().toISOString() }).eq("id", n.id);
  return { sent, removed };
}

export async function flushPendingPushNotifications(limit = 40) {
  configureVapid();
  const sb = admin();
  const { data, error } = await sb
    .from("notifications")
    .select("id,user_id,type,project_id,data,actor_id")
    .is("push_sent_at", null)
    .order("created_at", { ascending: true })
    .limit(limit);
  if (error) throw error;

  let totalSent = 0;
  for (const row of data ?? []) {
    const result = await sendWebPushForNotification({
      id: row.id,
      user_id: row.user_id,
      type: row.type,
      project_id: row.project_id,
      data: (row.data ?? {}) as Record<string, unknown>,
      actor_id: row.actor_id,
    });
    totalSent += result.sent;
  }
  return { processed: data?.length ?? 0, sent: totalSent };
}
