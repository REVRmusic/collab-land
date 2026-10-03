import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { isEnvAdmin } from "@/lib/admin";

function serviceClient() {
  const url = process.env["SUPABASE_URL"] || process.env["VITE_SUPABASE_URL"];
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!url || !key) throw new Error("Configuration serveur incomplète (service role).");
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function userIdFromRequest(): Promise<string | null> {
  const { getRequest } = await import("@tanstack/react-start/server");
  const request = getRequest();
  const auth = request.headers.get("authorization") ?? "";
  const token = /^Bearer\s+(.+)$/i.exec(auth)?.[1];
  if (!token || token.split(".").length !== 3) return null;

  const url = process.env["SUPABASE_URL"] || process.env["VITE_SUPABASE_URL"];
  const publishable = process.env["SUPABASE_PUBLISHABLE_KEY"] || process.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !publishable) return null;

  const supabase = createClient<Database>(url, publishable, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.id;
}

export async function assertAdminUserId(): Promise<string> {
  const uid = await userIdFromRequest();
  if (!uid) throw new Error("Non authentifié");

  if (isEnvAdmin(uid)) return uid;

  const sb = serviceClient();
  const { data } = await sb.from("app_admins").select("user_id").eq("user_id", uid).maybeSingle();
  if (!data) throw new Error("Accès administrateur refusé");
  return uid;
}

export type AdminUserRow = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  email: string | null;
  created_at: string;
  project_count: number;
};

export async function listAdminUsers(search?: string): Promise<{ users: AdminUserRow[]; total: number }> {
  await assertAdminUserId();
  const sb = serviceClient();

  let q = sb
    .from("profiles")
    .select("id,username,display_name,avatar_url,bio,email,created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .limit(200);

  const term = search?.trim().replace(/[%,()]/g, "") ?? "";
  if (term.length >= 2) {
    q = q.or(`username.ilike.%${term}%,display_name.ilike.%${term}%,email.ilike.%${term}%`);
  }

  const { data, error, count } = await q;
  if (error) throw error;

  const ids = (data ?? []).map((p) => p.id);
  const counts = new Map<string, number>();
  if (ids.length) {
    const { data: projects } = await sb.from("projects").select("owner_id").in("owner_id", ids);
    for (const p of projects ?? []) {
      counts.set(p.owner_id, (counts.get(p.owner_id) ?? 0) + 1);
    }
  }

  const users: AdminUserRow[] = (data ?? []).map((p) => ({
    id: p.id,
    username: p.username,
    display_name: p.display_name,
    avatar_url: p.avatar_url,
    bio: p.bio,
    email: p.email,
    created_at: p.created_at,
    project_count: counts.get(p.id) ?? 0,
  }));

  return { users, total: count ?? users.length };
}
