import * as React from "react";
import { render } from "@react-email/render";
import { createClient } from "@supabase/supabase-js";
import { sendLovableEmail } from "@lovable.dev/email-js";
import type { Database } from "@/integrations/supabase/types";
import { FROM_ADDRESS, SENDER_DOMAIN, SITE_URL } from "@/lib/email-config";
import { DailyDigestEmail, type DigestItem } from "@/lib/email-templates/daily-digest";

function serviceClient() {
  const url = process.env["SUPABASE_URL"] || process.env["VITE_SUPABASE_URL"];
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!url || !key) return null;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env["LOVABLE_API_KEY"] || process.env["RESEND_API_KEY"]);
}

interface SendEmailPayload {
  to: string;
  subject: string;
  html: string;
  text: string;
  idempotencyKey?: string;
}

async function sendEmail({ to, subject, html, text, idempotencyKey }: SendEmailPayload): Promise<{ ok: boolean; id?: string }> {
  const lovableApiKey = process.env["LOVABLE_API_KEY"];
  const resendApiKey = process.env["RESEND_API_KEY"];

  if (lovableApiKey) {
    const res = await sendLovableEmail(
      {
        to,
        from: FROM_ADDRESS,
        sender_domain: SENDER_DOMAIN,
        subject,
        html,
        text,
        purpose: "transactional",
        label: "daily_digest",
        idempotency_key: idempotencyKey,
      },
      { apiKey: lovableApiKey, sendUrl: process.env["LOVABLE_SEND_URL"] },
    );
    return { ok: true, id: res.message_id || res.workflow_id };
  }

  if (resendApiKey) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to,
        subject,
        html,
        text,
        headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Resend send failed (${res.status}): ${err}`);
    }
    const data = (await res.json()) as { id?: string };
    return { ok: true, id: data.id };
  }

  // Si aucune clé n'est encore définie (ex: environnement local dev avant config secrets)
  console.warn(
    `[email-digest] Aucun provider d'email configuré (LOVABLE_API_KEY ou RESEND_API_KEY manquant). Simulation d'envoi vers ${to}.`,
  );
  return { ok: true, id: `mock-${Date.now()}` };
}

type RawNotification = {
  id: string;
  user_id: string;
  type: string;
  created_at: string;
  project_id: string | null;
  data: Record<string, unknown> | null;
  actor_id: string | null;
  actor?: { username: string; display_name: string | null } | null;
  project?: { title: string } | null;
};

export function formatDigestItem(n: RawNotification, siteUrl: string): DigestItem {
  const actorName = n.actor?.display_name || (n.actor?.username ? `@${n.actor.username}` : "Quelqu'un");
  const title = (n.data?.["title"] as string) || n.project?.title || "un projet";
  const projectUrl = n.project_id ? `${siteUrl}/projects/${n.project_id}` : null;
  const friendsUrl = `${siteUrl}/friends`;

  switch (n.type) {
    case "new_version": {
      const v = n.data?.["version"] ? `V${n.data["version"]}` : "une nouvelle version";
      return {
        id: n.id,
        type: n.type,
        icon: "🎧",
        actorName,
        actionText: `a publié la ${v} de`,
        projectTitle: title,
        projectUrl,
      };
    }
    case "new_message": {
      const isVoice = n.data?.["kind"] === "voice";
      return {
        id: n.id,
        type: n.type,
        icon: isVoice ? "🎙️" : "💬",
        actorName,
        actionText: isVoice ? "a envoyé un message vocal dans" : "a écrit dans la discussion de",
        projectTitle: title,
        projectUrl,
      };
    }
    case "new_project": {
      return {
        id: n.id,
        type: n.type,
        icon: "🚀",
        actorName,
        actionText: "a partagé un nouveau projet :",
        projectTitle: title,
        projectUrl,
      };
    }
    case "new_cover": {
      return {
        id: n.id,
        type: n.type,
        icon: "🎨",
        actorName,
        actionText: "a proposé une pochette pour",
        projectTitle: title,
        projectUrl,
      };
    }
    case "friend_request": {
      return {
        id: n.id,
        type: n.type,
        icon: "👥",
        actorName,
        actionText: "souhaite t'ajouter en ami sur CollabLand",
        projectUrl: friendsUrl,
      };
    }
    case "friend_accepted": {
      return {
        id: n.id,
        type: n.type,
        icon: "🤝",
        actorName,
        actionText: "a accepté ta demande d'ami",
        projectUrl: friendsUrl,
      };
    }
    case "stem_request": {
      return {
        id: n.id,
        type: n.type,
        icon: "🎛️",
        actorName,
        actionText: "a demandé les STEMS de",
        projectTitle: title,
        projectUrl,
      };
    }
    case "stem_accepted": {
      return {
        id: n.id,
        type: n.type,
        icon: "📦",
        actorName,
        actionText: "a partagé les STEMS de",
        projectTitle: title,
        projectUrl,
      };
    }
    case "stem_declined": {
      return {
        id: n.id,
        type: n.type,
        icon: "❌",
        actorName,
        actionText: "a décliné ta demande de STEMS pour",
        projectTitle: title,
        projectUrl,
      };
    }
    default: {
      return {
        id: n.id,
        type: n.type,
        icon: "⚡",
        actorName,
        actionText: "Nouvelle activité",
        projectTitle: title,
        projectUrl,
      };
    }
  }
}

export type SendUserDigestResult = {
  sent: boolean;
  reason?: string;
  recipient?: string;
  notificationsCount?: number;
  messageId?: string;
};

/**
 * Envoie le résumé quotidien à un utilisateur unique (pour tests ou envoi ciblé).
 */
export async function sendDailyDigestToUser(
  userId: string,
  options: { force?: boolean; dryRun?: boolean } = {},
): Promise<SendUserDigestResult> {
  const sb = serviceClient();
  if (!sb) {
    return {
      sent: false,
      reason: "missing_service_role_key (ajoute SUPABASE_SERVICE_ROLE_KEY dans tes variables d'environnement)",
    };
  }

  const { data: profile, error: profErr } = await sb
    .from("profiles")
    .select("id, username, display_name, email, email_digest")
    .eq("id", userId)
    .maybeSingle();

  if (profErr || !profile) {
    return { sent: false, reason: "profile_not_found" };
  }

  const recipientEmail = profile.email?.trim().toLowerCase();
  if (!recipientEmail || !recipientEmail.includes("@")) {
    return { sent: false, reason: "missing_email" };
  }

  if (!profile.email_digest && !options.force) {
    return { sent: false, reason: "digest_disabled" };
  }

  // Recherche des notifications non envoyées par email (max 7 jours pour rester pertinent)
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  let query = sb
    .from("notifications")
    .select(`
      id,
      user_id,
      type,
      created_at,
      project_id,
      data,
      actor_id,
      actor:profiles!notifications_actor_id_fkey(username, display_name),
      project:projects(title)
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (!options.force) {
    query = query.eq("emailed", false).gte("created_at", sevenDaysAgo);
  }

  const { data: notifs, error: notifErr } = await query.limit(25);
  if (notifErr) throw notifErr;

  const rawNotifications = (notifs ?? []) as unknown as RawNotification[];

  // Si aucune notification et mode force (test admin), on génère un exemple de prévisualisation
  let itemsToRender: DigestItem[] = [];
  if (rawNotifications.length === 0) {
    if (!options.force) {
      return { sent: false, reason: "no_pending_notifications" };
    }
    itemsToRender = [
      {
        id: "demo-1",
        type: "new_version",
        icon: "🎧",
        actorName: "CollabLand Studio",
        actionText: "a publié la V2 de",
        projectTitle: "Exemple de projet (Email Test)",
        projectUrl: `${SITE_URL}/projects`,
      },
      {
        id: "demo-2",
        type: "new_message",
        icon: "🎙️",
        actorName: "Collaborateur",
        actionText: "a envoyé un message vocal dans",
        projectTitle: "Exemple de projet (Email Test)",
        projectUrl: `${SITE_URL}/projects`,
      },
    ];
  } else {
    itemsToRender = rawNotifications.slice(0, 10).map((n) => formatDigestItem(n, SITE_URL));
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  const subject =
    itemsToRender.length === 1
      ? `Ton récapitulatif CollabLand : 1 nouveauté sur tes projets`
      : `Ton récapitulatif CollabLand : ${itemsToRender.length} nouveautés sur tes projets`;

  const emailElement = React.createElement(DailyDigestEmail, {
    displayName: profile.display_name,
    username: profile.username,
    items: itemsToRender,
    siteUrl: SITE_URL,
    totalPendingCount: rawNotifications.length || itemsToRender.length,
  });

  const html = await render(emailElement);
  const text = await render(emailElement, { plainText: true });

  const idempotencyKey = `daily-digest:${userId}:${todayStr}${options.force ? `:${Date.now()}` : ""}`;
  const sendRes = await sendEmail({
    to: recipientEmail,
    subject,
    html,
    text,
    idempotencyKey,
  });

  // Marquer comme envoyées
  if (!options.dryRun && rawNotifications.length > 0) {
    const ids = rawNotifications.map((n) => n.id);
    await sb.from("notifications").update({ emailed: true }).in("id", ids);
  }

  return {
    sent: true,
    recipient: recipientEmail,
    notificationsCount: rawNotifications.length || itemsToRender.length,
    messageId: sendRes.id,
  };
}

export type BatchDigestResult = {
  processedProfiles: number;
  digestsSent: number;
  totalNotificationsEmailed: number;
  skipped: number;
  errors: string[];
};

/**
 * Exécute le lot du résumé quotidien pour tous les utilisateurs éligibles (appelé par le cron).
 */
export async function sendDailyDigestBatch(limitProfiles = 100): Promise<BatchDigestResult> {
  const sb = serviceClient();
  if (!sb) {
    return {
      processedProfiles: 0,
      digestsSent: 0,
      totalNotificationsEmailed: 0,
      skipped: 0,
      errors: [
        "SUPABASE_SERVICE_ROLE_KEY manquant. Définis ce secret dans Lovable Cloud ou dans ton fichier .env local.",
      ],
    };
  }

  // Récupère les profils ayant activé le digest avec un email
  const { data: profiles, error: profErr } = await sb
    .from("profiles")
    .select("id, username, display_name, email, email_digest")
    .eq("email_digest", true)
    .not("email", "is", null)
    .limit(limitProfiles);

  if (profErr) throw profErr;

  let digestsSent = 0;
  let totalNotificationsEmailed = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const prof of profiles ?? []) {
    try {
      const res = await sendDailyDigestToUser(prof.id, { force: false });
      if (res.sent) {
        digestsSent++;
        totalNotificationsEmailed += res.notificationsCount ?? 0;
      } else {
        skipped++;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[email-digest] Erreur pour l'utilisateur ${prof.username} (${prof.id}):`, msg);
      errors.push(`${prof.username}: ${msg}`);
    }
  }

  // Archivage silencieux des très anciennes notifications non envoyées (> 14 jours)
  try {
    const fourteenDaysAgo = new Date(Date.now() - 14 * 86400000).toISOString();
    await sb
      .from("notifications")
      .update({ emailed: true })
      .eq("emailed", false)
      .lt("created_at", fourteenDaysAgo);
  } catch (cleanErr) {
    console.warn("[email-digest] Nettoyage des anciennes notifications ignoré:", cleanErr);
  }

  return {
    processedProfiles: (profiles ?? []).length,
    digestsSent,
    totalNotificationsEmailed,
    skipped,
    errors,
  };
}

export type DigestStats = {
  digestEnabledUsers: number;
  totalUsers: number;
  pendingNotifications: number;
  hasEmailConfigured: boolean;
  senderDomain: string;
  fromAddress: string;
};

/**
 * Statistiques pour le tableau de bord Admin.
 */
export async function getDigestStats(): Promise<DigestStats> {
  const sb = serviceClient();
  if (!sb) {
    return {
      digestEnabledUsers: 0,
      totalUsers: 0,
      pendingNotifications: 0,
      hasEmailConfigured: isEmailConfigured(),
      senderDomain: SENDER_DOMAIN,
      fromAddress: FROM_ADDRESS,
    };
  }

  try {
    const [totalRes, enabledRes, pendingRes] = await Promise.all([
      sb.from("profiles").select("id", { count: "exact", head: true }),
      sb.from("profiles").select("id", { count: "exact", head: true }).eq("email_digest", true),
      sb.from("notifications").select("id", { count: "exact", head: true }).eq("emailed", false),
    ]);

    return {
      digestEnabledUsers: enabledRes.count ?? 0,
      totalUsers: totalRes.count ?? 0,
      pendingNotifications: pendingRes.count ?? 0,
      hasEmailConfigured: isEmailConfigured(),
      senderDomain: SENDER_DOMAIN,
      fromAddress: FROM_ADDRESS,
    };
  } catch (err) {
    console.error("[email-digest] getDigestStats failed:", err);
    return {
      digestEnabledUsers: 0,
      totalUsers: 0,
      pendingNotifications: 0,
      hasEmailConfigured: isEmailConfigured(),
      senderDomain: SENDER_DOMAIN,
      fromAddress: FROM_ADDRESS,
    };
  }
}
