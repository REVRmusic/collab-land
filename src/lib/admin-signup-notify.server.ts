import * as React from "react";
import { render } from "@react-email/render";
import { createClient } from "@supabase/supabase-js";
import { sendLovableEmail } from "@lovable.dev/email-js";
import type { Database } from "@/integrations/supabase/types";
import { FROM_ADDRESS, SENDER_DOMAIN } from "@/lib/email-config";
import { AdminNewSignupEmail } from "@/lib/email-templates/admin-new-signup";

function serviceClient() {
  const url = process.env["SUPABASE_URL"] || process.env["VITE_SUPABASE_URL"];
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!url || !key) return null;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Destinataires : ADMIN_NOTIFY_EMAIL (+ emails des comptes dans app_admins). */
export async function resolveAdminNotifyEmails(): Promise<string[]> {
  const emails = new Set<string>();

  const raw = process.env["ADMIN_NOTIFY_EMAIL"] || "";
  for (const part of raw.split(",")) {
    const e = part.trim().toLowerCase();
    if (e.includes("@")) emails.add(e);
  }

  const sb = serviceClient();
  if (sb) {
    try {
      const { data: admins } = await sb.from("app_admins").select("user_id");
      const ids = (admins ?? []).map((a) => a.user_id);
      if (ids.length) {
        const { data: profiles } = await sb.from("profiles").select("email").in("id", ids);
        for (const p of profiles ?? []) {
          if (p.email?.includes("@")) emails.add(p.email.trim().toLowerCase());
        }
      }
    } catch (e) {
      console.error("[admin-signup-notify] lookup admins failed:", e);
    }
  }

  return [...emails];
}

async function lookupSignupProfile(email: string) {
  const sb = serviceClient();
  if (!sb) return null;
  try {
    const { data } = await sb
      .from("profiles")
      .select("username,display_name")
      .eq("email", email)
      .maybeSingle();
    return data;
  } catch {
    return null;
  }
}

/** Envoie un email aux admins quand un nouvel utilisateur s’inscrit. Ne jette pas. */
export async function notifyAdminsOfNewSignup(signupEmail: string): Promise<void> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) {
    console.warn("[admin-signup-notify] LOVABLE_API_KEY manquant — email admin ignoré");
    return;
  }

  const recipients = await resolveAdminNotifyEmails();
  if (!recipients.length) {
    console.warn(
      "[admin-signup-notify] Aucun destinataire (définis ADMIN_NOTIFY_EMAIL ou la table app_admins)",
    );
    return;
  }

  // Ne pas te renvoyer le mail si tu t’inscris toi-même (edge case).
  const normalized = signupEmail.trim().toLowerCase();
  const targets = recipients.filter((r) => r !== normalized);
  if (!targets.length) return;

  const profile = await lookupSignupProfile(signupEmail);
  const element = React.createElement(AdminNewSignupEmail, {
    email: signupEmail,
    username: profile?.username,
    displayName: profile?.display_name,
  });
  const html = await render(element);
  const text = await render(element, { plainText: true });
  const subject = profile?.username
    ? `Nouvelle inscription : @${profile.username}`
    : `Nouvelle inscription : ${signupEmail}`;

  await Promise.all(
    targets.map((to) =>
      sendLovableEmail(
        {
          to,
          from: FROM_ADDRESS,
          sender_domain: SENDER_DOMAIN,
          subject,
          html,
          text,
          purpose: "transactional",
          idempotency_key: `admin-new-signup:${normalized}:${to}`,
          label: "admin_new_signup",
        },
        { apiKey, sendUrl: process.env["LOVABLE_SEND_URL"] },
      ).catch((e) => {
        console.error(`[admin-signup-notify] envoi échoué vers ${to}:`, e);
      }),
    ),
  );
}
