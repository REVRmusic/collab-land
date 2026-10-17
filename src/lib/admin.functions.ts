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

export const getAdminGrowthFn = createServerFn({ method: "GET" }).handler(async () => {
  const { getAdminGrowthSeries } = await import("@/lib/admin.server");
  return getAdminGrowthSeries();
});

export const getAdminDigestStatsFn = createServerFn({ method: "GET" }).handler(async () => {
  const { assertAdminUserId } = await import("@/lib/admin.server");
  await assertAdminUserId();
  const { getDigestStats } = await import("@/lib/email-digest.server");
  return getDigestStats();
});

export const triggerAdminDigestFn = createServerFn({ method: "POST" })
  .validator((input: { testOnly?: boolean } | undefined) => ({
    testOnly: Boolean(input?.testOnly),
  }))
  .handler(async ({ data }) => {
    const { assertAdminUserId } = await import("@/lib/admin.server");
    const adminId = await assertAdminUserId();
    const { sendDailyDigestToUser, sendDailyDigestBatch } = await import("@/lib/email-digest.server");
    if (data.testOnly) {
      return sendDailyDigestToUser(adminId, { force: true });
    }
    return sendDailyDigestBatch();
  });