import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

async function authorizePushRequest(request: Request): Promise<Response | null> {
  const auth = request.headers.get("authorization") ?? "";
  const token = /^Bearer\s+(.+)$/i.exec(auth)?.[1];
  if (!token) return new Response("Unauthorized", { status: 401 });

  const allowed = [
    process.env["LOVABLE_CRON_SECRET"],
    process.env["LOVABLE_CRON_SECRET_PREVIOUS"],
    process.env["PUSH_DISPATCH_SECRET"],
  ].filter(Boolean) as string[];

  if (!allowed.length) return new Response("Server configuration error", { status: 500 });
  if (!allowed.includes(token)) return new Response("Unauthorized", { status: 401 });
  return null;
}

/** Immediate push dispatch (Database Webhook / cron / manual). */
export const Route = createFileRoute("/api/push/dispatch")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const unauthorized = await authorizePushRequest(request);
        if (unauthorized) return unauthorized;

        try {
          const body = (await request.json().catch(() => ({}))) as { notification_id?: string };
          const { sendWebPushForNotification, flushPendingPushNotifications } = await import("@/lib/push-server");
          const url = process.env["SUPABASE_URL"] || process.env["VITE_SUPABASE_URL"];
          const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
          if (!url || !key) return Response.json({ error: "missing service role" }, { status: 500 });
          const sb = createClient<Database>(url, key, { auth: { persistSession: false } });

          if (body.notification_id) {
            const { data, error } = await sb
              .from("notifications")
              .select("id,user_id,type,project_id,data,actor_id")
              .eq("id", body.notification_id)
              .maybeSingle();
            if (error || !data) return Response.json({ error: "notification not found" }, { status: 404 });
            const result = await sendWebPushForNotification({
              id: data.id,
              user_id: data.user_id,
              type: data.type,
              project_id: data.project_id,
              data: (data.data ?? {}) as Record<string, unknown>,
              actor_id: data.actor_id,
            });
            return Response.json({ ok: true, ...result });
          }

          const result = await flushPendingPushNotifications(30);
          return Response.json({ ok: true, ...result });
        } catch (e) {
          const message = e instanceof Error ? e.message : "dispatch failed";
          console.error("[push dispatch]", message);
          return Response.json({ ok: false, error: message }, { status: 500 });
        }
      },
    },
  },
});
