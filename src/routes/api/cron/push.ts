import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";

export const Route = createFileRoute("/api/cron/push")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const unauthorized = await authenticateCronRequest(request);
        if (unauthorized) return unauthorized;
        try {
          const { flushPendingPushNotifications } = await import("@/lib/push-server");
          const result = await flushPendingPushNotifications(50);
          return Response.json({ ok: true, ...result });
        } catch (e) {
          const message = e instanceof Error ? e.message : "push failed";
          console.error("[push cron]", message);
          return Response.json({ ok: false, error: message }, { status: 500 });
        }
      },
    },
  },
});
