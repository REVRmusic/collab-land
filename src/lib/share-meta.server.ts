import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import {
  buildProfileShareMeta,
  buildProjectShareMeta,
  defaultOgSvg,
  profileOgSvg,
  projectOgSvg,
  siteOriginFromRequest,
  type ProfileShareRow,
  type ProjectShareData,
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

function serviceClient(): SupabaseClient<Database> {
  const url = process.env["SUPABASE_URL"] || process.env["VITE_SUPABASE_URL"];
  const serviceKey = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  const pubKey = process.env["SUPABASE_PUBLISHABLE_KEY"] || process.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
  const key = serviceKey || pubKey;
  if (!url || !key) throw new Error("Supabase URL/key manquants pour les aperçus de partage");

  return createClient<Database>(url, key, {
    global: { fetch: createSupabaseFetch(key) },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Télécharge une image de Supabase Storage et la convertit en Data URI base64
 * pour l'intégrer directement dans le SVG. Échoue silencieusement si indisponible.
 */
async function fetchImageDataUri(
  bucket: "covers" | "avatars",
  path: string | null | undefined,
): Promise<string | null> {
  if (!path) return null;
  const sb = serviceClient();

  try {
    let downloadUrl: string | null = null;
    if (/^https?:\/\//i.test(path)) {
      downloadUrl = path;
    } else {
      const { data, error } = await sb.storage.from(bucket).createSignedUrl(path, 3600);
      if (!error && data?.signedUrl) {
        downloadUrl = data.signedUrl;
      }
    }

    if (!downloadUrl) return null;

    // Timeout de 2.5s pour éviter de ralentir la génération d'OG image
    const resp = await fetch(downloadUrl, {
      signal: AbortSignal.timeout ? AbortSignal.timeout(2500) : undefined,
    });
    if (!resp.ok) return null;

    const contentType = resp.headers.get("content-type") || "image/jpeg";
    const arrayBuffer = await resp.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    return `data:${contentType};base64,${base64}`;
  } catch (err) {
    console.warn(`[share-meta] Impossible de charger l'image ${bucket}/${path}:`, err);
    return null;
  }
}

export async function fetchProfileByUsername(username: string): Promise<ProfileShareRow | null> {
  const sb = serviceClient();
  const { data, error } = await sb
    .from("profiles")
    .select("id,username,display_name,avatar_url,bio")
    .eq("username", username)
    .maybeSingle();

  if (error) {
    console.error("[share-meta] Erreur fetchProfileByUsername:", error);
    return null;
  }
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

export async function fetchProjectShareData(projectId: string): Promise<ProjectShareData | null> {
  const sb = serviceClient();
  const { data: p, error } = await sb
    .from("projects")
    .select(`
      id,
      title,
      description,
      help_needed,
      genre,
      bpm,
      musical_key,
      cover_url,
      created_at,
      owner:profiles!projects_owner_id_fkey(username, display_name, avatar_url),
      project_versions(id, version_number)
    `)
    .eq("id", projectId)
    .maybeSingle();

  if (error || !p) {
    if (error) console.error("[share-meta] Erreur fetchProjectShareData:", error);
    return null;
  }

  const versions = p.project_versions || [];
  const versionCount = versions.length > 0 ? versions.length : 1;
  const latestVersionNumber = versions.reduce(
    (max, v) => (v.version_number && v.version_number > max ? v.version_number : max),
    1,
  );

  const owner = Array.isArray(p.owner) ? p.owner[0] : p.owner;

  return {
    id: p.id,
    title: p.title,
    description: p.description,
    help_needed: p.help_needed,
    genre: p.genre,
    bpm: p.bpm,
    musical_key: p.musical_key,
    cover_url: p.cover_url,
    created_at: p.created_at,
    version_count: versionCount,
    latest_version_number: latestVersionNumber,
    owner_name: owner?.display_name?.trim() || owner?.username || "Producteur",
    owner_username: owner?.username || "producer",
    owner_avatar_url: owner?.avatar_url || null,
  };
}

export async function loadProjectSharePayload(projectId: string, request?: Request | null) {
  const origin = siteOriginFromRequest(request);
  try {
    const project = await fetchProjectShareData(projectId);
    return buildProjectShareMeta(project, projectId, origin);
  } catch {
    return buildProjectShareMeta(null, projectId, origin);
  }
}

/**
 * Génère l'image SVG Open Graph pour un projet musical.
 */
export async function projectOgResponse(projectId: string): Promise<Response> {
  const project = await fetchProjectShareData(projectId);

  if (!project) {
    return defaultOgResponse();
  }

  // Téléchargement optionnel de la cover en base64
  let coverDataUri: string | null = null;
  if (project.cover_url) {
    coverDataUri = await fetchImageDataUri("covers", project.cover_url);
  }

  const svg = projectOgSvg({
    title: project.title,
    ownerName: project.owner_name,
    ownerUsername: project.owner_username,
    versionCount: project.version_count,
    latestVersionNumber: project.latest_version_number,
    genre: project.genre,
    bpm: project.bpm,
    musicalKey: project.musical_key,
    helpNeeded: project.help_needed,
    description: project.description,
    coverDataUri,
    seed: `${project.id}:${project.title}`,
  });

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=1800, s-maxage=3600",
    },
  });
}

/**
 * Génère l'image SVG Open Graph pour une vitrine artiste.
 */
export async function avatarOgResponse(username: string): Promise<Response> {
  const profile = await fetchProfileByUsername(username);

  let avatarDataUri: string | null = null;
  let projectCount = 0;

  if (profile) {
    const sb = serviceClient();
    const [avatarRes, countRes] = await Promise.all([
      profile.avatar_url ? fetchImageDataUri("avatars", profile.avatar_url) : Promise.resolve(null),
      sb
        .from("projects")
        .select("id", { count: "exact", head: true })
        .eq("owner_id", profile.id)
        .catch(() => ({ count: 0 })),
    ]);

    avatarDataUri = avatarRes;
    projectCount = countRes.count || 0;
  }

  const name = profile?.display_name?.trim() || profile?.username || username;
  const svg = profileOgSvg({
    name,
    username,
    bio: profile?.bio,
    projectCount,
    avatarDataUri,
  });

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=1800, s-maxage=3600",
    },
  });
}

/**
 * Génère l'image SVG Open Graph par défaut du site.
 */
export function defaultOgResponse(): Response {
  return new Response(defaultOgSvg(), {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=604800",
    },
  });
}
