import { createServerFn } from "@tanstack/react-start";

export const getProfileShareMeta = createServerFn({ method: "GET" })
  .validator((input: { username: string }) => ({
    username: String(input?.username || "").trim(),
  }))
  .handler(async ({ data }) => {
    const { getRequest } = await import("@tanstack/react-start/server");
    const { loadProfileSharePayload } = await import("@/lib/share-meta.server");
    let request: Request | null = null;
    try {
      request = getRequest();
    } catch {
      request = null;
    }
    return loadProfileSharePayload(data.username, request);
  });
