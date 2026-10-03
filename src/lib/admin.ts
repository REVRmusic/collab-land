/** Env allow-list (comma-separated UUIDs). Complements the app_admins DB table. */
export function adminIdsFromEnv(): string[] {
  const raw = process.env["ADMIN_USER_IDS"] || process.env["VITE_ADMIN_USER_IDS"] || "";
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s) => /^[0-9a-f-]{36}$/.test(s));
}

export function isEnvAdmin(userId: string): boolean {
  return adminIdsFromEnv().includes(userId.toLowerCase());
}
