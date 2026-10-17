import { createServerFn } from "@tanstack/react-start";

export const getProjectShareMeta = createServerFn({ method: "GET" })
  .validator((input: { id: string }) => ({
    id: String(input?.id || "").trim(),
  }))
  .handler(async ({ data }) => {
    const { getRequest } = await import("@tanstack/react-start/server");
    const { loadProjectSharePayload } = await import("@/lib/share-meta.server");
    let request: Request | null = null;
    try {
      request = getRequest();
    } catch {
      request = null;
    }
    return loadProjectSharePayload(data.id, request);
  });
