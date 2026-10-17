import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/og/default")({
  server: {
    handlers: {
      GET: async () => {
        const { defaultOgResponse } = await import("@/lib/share-meta.server");
        return defaultOgResponse();
      },
    },
  },
});
