import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/og/u/$username")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { avatarOgResponse } = await import("@/lib/share-meta.server");
        return avatarOgResponse(params.username);
      },
    },
  },
});
