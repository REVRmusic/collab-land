export type ProfileShareRow = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
};

export function siteOriginFromRequest(request?: Request | null): string {
  const fallback = "https://collab-land.lovable.app";
  if (!request?.url) return fallback;
  try {
    return new URL(request.url).origin;
  } catch {
    return fallback;
  }
}

export function buildProfileShareMeta(profile: ProfileShareRow | null, username: string, origin: string) {
  const handle = profile?.username || username;
  const name = profile?.display_name?.trim() || handle;
  const title = `${name} (@${handle}) — CollabLand`;
  const description =
    profile?.bio?.trim() ||
    `Découvre la vitrine de projets de @${handle} sur CollabLand — collabore avec des producteurs.`;
  const pageUrl = `${origin}/u/${encodeURIComponent(handle)}`;
  const imageUrl = `${origin}/og/u/${encodeURIComponent(handle)}`;
  return { found: !!profile, title, description, pageUrl, imageUrl, profile, handle, name };
}

export function profileOgSvg(letter: string, name: string) {
  const safe = letter.replace(/[^\p{L}\p{N}]/gu, "?").slice(0, 1).toUpperCase() || "?";
  const label = name.replace(/[<>&"]/g, "").slice(0, 40);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1a1524"/>
      <stop offset="55%" stop-color="#2a1f3d"/>
      <stop offset="100%" stop-color="#6d4aff"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#g)"/>
  <circle cx="600" cy="260" r="120" fill="#7c5cff"/>
  <text x="600" y="290" text-anchor="middle" font-family="system-ui,sans-serif" font-size="120" font-weight="700" fill="#ffffff">${safe}</text>
  <text x="600" y="440" text-anchor="middle" font-family="system-ui,sans-serif" font-size="48" font-weight="600" fill="#f5f3ff">${label}</text>
  <text x="600" y="500" text-anchor="middle" font-family="system-ui,sans-serif" font-size="28" fill="#c4b5fd">CollabLand</text>
</svg>`;
}
