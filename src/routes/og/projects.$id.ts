import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/og/projects/$id")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { projectOgResponse } = await import("@/lib/share-meta.server");
        return projectOgResponse(params.id);
      },
    },
  },
});
