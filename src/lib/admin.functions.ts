import { createServerFn } from "@tanstack/react-start";

export const checkIsAdmin = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const { assertAdminUserId } = await import("@/lib/admin.server");
    await assertAdminUserId();
    return { admin: true as const };
  } catch {
    return { admin: false as const };
  }
});

export const listAdminUsersFn = createServerFn({ method: "GET" })
  .validator((input: { search?: string } | undefined) => ({
    search: input?.search?.trim() ?? "",
  }))
  .handler(async ({ data }) => {
    const { listAdminUsers } = await import("@/lib/admin.server");
    return listAdminUsers(data.search);
  });
