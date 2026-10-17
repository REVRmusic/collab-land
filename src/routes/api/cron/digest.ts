import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";

async function authorizeDigestRequest(request: Request): Promise<Response | null> {
  const authHeader = request.headers.get("authorization") ?? "";
  const bearerToken = /^Bearer\s+(.+)$/i.exec(authHeader)?.[1];

  const url = new URL(request.url);
  const secretParam = url.searchParams.get("secret") || url.searchParams.get("token");
  const provided = bearerToken || secretParam;

  const allowed = [
    process.env["LOVABLE_CRON_SECRET"],
    process.env["LOVABLE_CRON_SECRET_PREVIOUS"],
    process.env["DIGEST_CRON_SECRET"],
    process.env["PUSH_DISPATCH_SECRET"],
  ].filter(Boolean) as string[];

  // 1. Si Bearer token présent et LOVABLE_CRON_SECRET configuré, vérification timing-safe standard
  if (bearerToken && process.env["LOVABLE_CRON_SECRET"]) {
    const unauthorized = await authenticateCronRequest(request);
    if (!unauthorized) return null;
  }

  // 2. Si un secret valide est fourni (via query param ou Bearer alternatif)
  if (provided && allowed.includes(provided)) {
    return null;
  }

  if (!allowed.length) {
    return new Response("Server configuration error: cron secrets non configurés", { status: 500 });
  }

  return new Response("Unauthorized", { status: 401 });
}

export const Route = createFileRoute("/api/cron/digest")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const unauthorized = await authorizeDigestRequest(request);
        if (unauthorized) return unauthorized;
        try {
          const { sendDailyDigestBatch } = await import("@/lib/email-digest.server");
          const result = await sendDailyDigestBatch();
          return Response.json({ ok: true, ...result });
        } catch (e) {
          const message = e instanceof Error ? e.message : "digest failed";
          console.error("[digest cron]", message);
          return Response.json({ ok: false, error: message }, { status: 500 });
        }
      },
      GET: async ({ request }) => {
        const unauthorized = await authorizeDigestRequest(request);
        if (unauthorized) return unauthorized;
        try {
          const { sendDailyDigestBatch } = await import("@/lib/email-digest.server");
          const result = await sendDailyDigestBatch();
          return Response.json({ ok: true, ...result });
        } catch (e) {
          const message = e instanceof Error ? e.message : "digest failed";
          console.error("[digest cron]", message);
          return Response.json({ ok: false, error: message }, { status: 500 });
        }
      },
    },
  },
});
