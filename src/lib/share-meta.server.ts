import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import {
  buildProfileShareMeta,
  profileOgSvg,
  siteOriginFromRequest,
  type ProfileShareRow,
} from "@/lib/share-meta";

function isNewSupabaseApiKey(value: string): boolean {
  return value.startsWith("sb_publishable_") || value.startsWith("sb_secret_");
}

function createSupabaseFetch(supabaseKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );
    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }
    if (isNewSupabaseApiKey(supabaseKey) && headers.get("Authorization") === `Bearer ${supabaseKey}`) {
      headers.delete("Authorization");
    }
    headers.set("apikey", supabaseKey);
    return fetch(input, { ...init, headers });
  };
}

function createPublicSupabase(): SupabaseClient<Database> {
  const url = process.env["SUPABASE_URL"] || process.env["VITE_SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"] || process.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) throw new Error("Supabase URL/key manquants pour les aperçus de lien");
  return createClient<Database>(url, key, {
    global: { fetch: createSupabaseFetch(key) },
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
  });
}

export async function fetchProfileByUsername(username: string): Promise<ProfileShareRow | null> {
  const supabase = createPublicSupabase();
  const { data, error } = await supabase
    .from("profiles")
    .select("id,username,display_name,avatar_url,bio")
    .eq("username", username)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function loadProfileSharePayload(username: string, request?: Request | null) {
  const origin = siteOriginFromRequest(request);
  try {
    const profile = await fetchProfileByUsername(username);
    return buildProfileShareMeta(profile, username, origin);
  } catch {
    return buildProfileShareMeta(null, username, origin);
  }
}

export async function avatarOgResponse(username: string): Promise<Response> {
  let profile: ProfileShareRow | null = null;
  try {
    profile = await fetchProfileByUsername(username);
  } catch {
    profile = null;
  }

  const name = profile?.display_name?.trim() || profile?.username || username;
  const letter = name.charAt(0);

  if (profile?.avatar_url) {
    try {
      const supabase = createPublicSupabase();
      const { data, error } = await supabase.storage.from("avatars").createSignedUrl(profile.avatar_url, 3600);
      if (!error && data?.signedUrl) {
        const img = await fetch(data.signedUrl);
        if (img.ok && img.body) {
          const type = img.headers.get("Content-Type") || "image/jpeg";
          return new Response(img.body, {
            headers: {
              "Content-Type": type,
              "Cache-Control": "public, max-age=1800",
            },
          });
        }
      }
    } catch {
      // fall through to SVG
    }
  }

  return new Response(profileOgSvg(letter, name), {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=600",
    },
  });
}
