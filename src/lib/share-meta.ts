export type ProfileShareRow = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  project_count?: number;
};

export type ProjectShareData = {
  id: string;
  title: string;
  description: string | null;
  help_needed: string | null;
  genre: string | null;
  bpm: number | null;
  musical_key: string | null;
  cover_url: string | null;
  created_at: string;
  version_count: number;
  latest_version_number: number;
  owner_name: string;
  owner_username: string;
  owner_avatar_url: string | null;
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

export function escapeXml(unsafe: string | null | undefined): string {
  if (!unsafe) return "";
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function truncate(str: string | null | undefined, max: number): string {
  if (!str) return "";
  const trimmed = str.trim();
  if (trimmed.length <= max) return trimmed;
  return trimmed.slice(0, max - 1) + "…";
}

export function wrapText(text: string, maxCharsPerLine: number, maxLines: number): string[] {
  const words = (text || "").trim().split(/\s+/);
  if (!words.length || !words[0]) return [];
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const test = currentLine ? `${currentLine} ${word}` : word;
    if (test.length <= maxCharsPerLine) {
      currentLine = test;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
      if (lines.length >= maxLines - 1) break;
    }
  }
  if (currentLine && lines.length < maxLines) {
    lines.push(currentLine);
  }
  return lines;
}

function hashSeed(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getGradientHues(seed: string): { hue1: number; hue2: number } {
  const bands = [200, 230, 255, 275, 295, 320];
  const h = hashSeed(seed || "collabland");
  const hue1 = bands[h % bands.length]!;
  const hue2 = bands[(h + 2) % bands.length]!;
  return { hue1, hue2 };
}

export function buildProfileShareMeta(profile: ProfileShareRow | null, username: string, origin: string) {
  const handle = profile?.username || username;
  const name = profile?.display_name?.trim() || handle;
  const title = `${name} (@${handle}) — CollabLand`;
  const description =
    profile?.bio?.trim() ||
    `Découvre la vitrine de projets de @${handle} sur CollabLand — collabore avec des producteurs, écoute les versions et propose tes retours.`;
  const pageUrl = `${origin}/u/${encodeURIComponent(handle)}`;
  const imageUrl = `${origin}/og/u/${encodeURIComponent(handle)}`;
  return { found: !!profile, title, description, pageUrl, imageUrl, profile, handle, name };
}

export function buildProjectShareMeta(project: ProjectShareData | null, id: string, origin: string) {
  const title = project?.title || "Projet musical";
  const owner = project?.owner_name || "Producteur";
  const versions = project?.version_count ?? 1;
  const pageTitle = `${title} — ${owner} · CollabLand`;

  const details: string[] = [];
  if (project?.genre) details.push(project.genre);
  if (project?.bpm) details.push(`${project.bpm} BPM`);
  if (project?.musical_key) details.push(`Tonalité ${project.musical_key}`);
  details.push(`${versions} version${versions > 1 ? "s" : ""}`);

  const help = project?.help_needed?.trim();
  const desc = project?.description?.trim();
  const extraInfo = help ? `Recherche : ${help}` : desc ? desc : "Écoute la démo et collabore sur les versions.";

  const description = `${owner} a partagé « ${title} » (${details.join(" · ")}). ${extraInfo}`;
  const pageUrl = `${origin}/projects/${encodeURIComponent(id)}`;
  const imageUrl = `${origin}/og/projects/${encodeURIComponent(id)}`;

  return {
    found: !!project,
    title: pageTitle,
    description,
    pageUrl,
    imageUrl,
    project,
  };
}

export interface ProjectOgSvgOptions {
  title: string;
  ownerName: string;
  ownerUsername: string;
  versionCount: number;
  latestVersionNumber?: number | null;
  genre?: string | null;
  bpm?: number | null;
  musicalKey?: string | null;
  helpNeeded?: string | null;
  description?: string | null;
  coverDataUri?: string | null;
  seed?: string | null;
}

export function projectOgSvg(opts: ProjectOgSvgOptions): string {
  const titleLines = wrapText(opts.title, 24, 2);
  const { hue1, hue2 } = getGradientHues(opts.seed || opts.title);
  const helpText = opts.helpNeeded?.trim() || opts.description?.trim();
  const helpLines = helpText
    ? wrapText(helpText, 52, 3)
    : [
        "Morceau ouvert aux collaborations : écoute la démo audio,",
        "télécharge les STEMS et propose tes versions ou vocaux.",
      ];

  const versionText = `V${opts.latestVersionNumber || opts.versionCount} · ${opts.versionCount} version${opts.versionCount > 1 ? "s" : ""}`;
  const safeTitle = escapeXml(opts.title);
  const safeOwner = escapeXml(opts.ownerName);
  const safeUsername = escapeXml(opts.ownerUsername);

  // Construction des pills de métadonnées
  const pills: { label: string; icon: string; highlight?: boolean }[] = [];
  pills.push({ label: versionText, icon: "⚡", highlight: true });
  if (opts.bpm) pills.push({ label: `${opts.bpm} BPM`, icon: "⏱" });
  if (opts.musicalKey) pills.push({ label: opts.musicalKey, icon: "🎹" });
  if (opts.genre) pills.push({ label: opts.genre, icon: "🎵" });

  let pillX = 510;
  const pillSvg = pills
    .slice(0, 4)
    .map((p) => {
      const width = Math.max(90, p.label.length * 9.5 + 46);
      const currentX = pillX;
      pillX += width + 12;
      if (p.highlight) {
        return `
        <g transform="translate(${currentX}, 248)">
          <rect width="${width}" height="36" rx="12" fill="#7c3aed" />
          <text x="14" y="23" font-family="'Space Grotesk', system-ui, sans-serif" font-size="14" font-weight="700" fill="#ffffff">${escapeXml(p.icon)} ${escapeXml(p.label)}</text>
        </g>`;
      }
      return `
      <g transform="translate(${currentX}, 248)">
        <rect width="${width}" height="36" rx="12" fill="#1b1429" stroke="#3b2b57" stroke-width="1.2" />
        <text x="14" y="23" font-family="system-ui, sans-serif" font-size="13" font-weight="600" fill="#d8cbff">${escapeXml(p.icon)} ${escapeXml(p.label)}</text>
      </g>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <!-- Arrière-plan sombre studio -->
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0b0913"/>
      <stop offset="45%" stop-color="#140f22"/>
      <stop offset="100%" stop-color="#1b122c"/>
    </linearGradient>

    <!-- Halos lumineux ambiants -->
    <radialGradient id="glowLeft" cx="20%" cy="40%" r="55%">
      <stop offset="0%" stop-color="#7c3aed" stop-opacity="0.32"/>
      <stop offset="100%" stop-color="#7c3aed" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glowRight" cx="85%" cy="30%" r="50%">
      <stop offset="0%" stop-color="#9333ea" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="#9333ea" stop-opacity="0"/>
    </radialGradient>

    <!-- Dégradé de la pochette procédurale -->
    <linearGradient id="coverProc" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="hsl(${hue1}, 75%, 26%)"/>
      <stop offset="50%" stop-color="hsl(${hue2}, 65%, 16%)"/>
      <stop offset="100%" stop-color="#0b0814"/>
    </linearGradient>
    <radialGradient id="coverShine" cx="30%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.6"/>
    </radialGradient>

    <!-- Ombre portée pour la cover -->
    <filter id="cardShadow" x="-15%" y="-15%" width="130%" height="130%">
      <feDropShadow dx="0" dy="18" stdDeviation="22" flood-color="#000000" flood-opacity="0.75"/>
    </filter>

    <clipPath id="coverClip">
      <rect x="70" y="115" width="400" height="400" rx="24" ry="24" />
    </clipPath>
  </defs>

  <!-- Fond -->
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#glowLeft)"/>
  <rect width="1200" height="630" fill="url(#glowRight)"/>

  <!-- Ligne de lueur subtile en haut -->
  <line x1="70" y1="0" x2="1130" y2="0" stroke="#7c3aed" stroke-opacity="0.4" stroke-width="3"/>

  <!-- Top Bar: Logo & Badge -->
  <g transform="translate(70, 42)">
    <rect width="36" height="36" rx="10" fill="#7c3aed"/>
    <path d="M12 25 L12 11 M18 25 L18 8 M24 25 L24 14" stroke="#ffffff" stroke-width="2.6" stroke-linecap="round"/>
    <text x="48" y="25" font-family="'Space Grotesk', system-ui, sans-serif" font-size="22" font-weight="700" fill="#ffffff" letter-spacing="-0.5">CollabLand</text>
  </g>

  <!-- Badge Catégorie -->
  <g transform="translate(930, 42)">
    <rect width="200" height="36" rx="18" fill="#1e162f" stroke="#7c3aed" stroke-width="1.4"/>
    <circle cx="22" cy="18" r="4.5" fill="#a855f7"/>
    <text x="36" y="23" font-family="'Space Grotesk', system-ui, sans-serif" font-size="12" font-weight="700" letter-spacing="1.2" fill="#e9d5ff">PROJET EN COURS</text>
  </g>

  <!-- Colonne Gauche: Disque Vinyle + Pochette -->
  <!-- Effet Disque vinyle qui dépasse à droite -->
  <g opacity="0.85">
    <circle cx="430" cy="315" r="160" fill="#0c0a13" stroke="#251d38" stroke-width="3"/>
    <circle cx="430" cy="315" r="130" fill="none" stroke="#1c162b" stroke-width="1"/>
    <circle cx="430" cy="315" r="105" fill="none" stroke="#1c162b" stroke-width="1"/>
    <circle cx="430" cy="315" r="80" fill="none" stroke="#1c162b" stroke-width="1"/>
    <circle cx="430" cy="315" r="48" fill="#7c3aed" fill-opacity="0.2" stroke="#a855f7" stroke-width="2"/>
    <circle cx="430" cy="315" r="14" fill="#0c0a13"/>
  </g>

  <!-- Pochette (Image ou Procédurale) -->
  <rect x="70" y="115" width="400" height="400" rx="24" ry="24" fill="#140f20" filter="url(#cardShadow)"/>
  ${
    opts.coverDataUri
      ? `<image href="${opts.coverDataUri}" x="70" y="115" width="400" height="400" preserveAspectRatio="xMidYMid slice" clip-path="url(#coverClip)" />`
      : `
    <g clip-path="url(#coverClip)">
      <rect x="70" y="115" width="400" height="400" fill="url(#coverProc)"/>
      <rect x="70" y="115" width="400" height="400" fill="url(#coverShine)"/>
      <circle cx="270" cy="315" r="95" fill="none" stroke="#ffffff" stroke-opacity="0.12" stroke-width="2"/>
      <circle cx="270" cy="315" r="65" fill="none" stroke="#ffffff" stroke-opacity="0.16" stroke-width="2"/>
      <!-- Ondes stylisées au centre -->
      <path d="M220 315 Q245 270 270 315 T320 315" fill="none" stroke="#ffffff" stroke-width="5" stroke-linecap="round" opacity="0.8"/>
      <text x="270" y="325" font-family="'Space Grotesk', system-ui, sans-serif" font-size="34" font-weight="700" text-anchor="middle" fill="#ffffff" opacity="0.95">${escapeXml(opts.title.slice(0, 3).toUpperCase())}</text>
    </g>`
  }
  <!-- Contour net de la cover -->
  <rect x="70" y="115" width="400" height="400" rx="24" ry="24" fill="none" stroke="#ffffff" stroke-opacity="0.16" stroke-width="1.5"/>

  <!-- Badge sur la cover en bas à gauche -->
  <g transform="translate(86, 460)">
    <rect width="185" height="38" rx="12" fill="#0d0b14" fill-opacity="0.9" stroke="#ffffff" stroke-opacity="0.2"/>
    <text x="14" y="24" font-family="'Space Grotesk', system-ui, sans-serif" font-size="13" font-weight="700" fill="#ffffff">🎧 ${escapeXml(versionText)}</text>
  </g>

  <!-- Colonne Droite: Titre du son -->
  <g transform="translate(510, 115)">
    ${
      titleLines.length === 1
        ? `<text x="0" y="44" font-family="'Space Grotesk', system-ui, sans-serif" font-size="44" font-weight="700" fill="#ffffff" letter-spacing="-0.8">${escapeXml(titleLines[0])}</text>`
        : `
      <text x="0" y="38" font-family="'Space Grotesk', system-ui, sans-serif" font-size="38" font-weight="700" fill="#ffffff" letter-spacing="-0.8">${escapeXml(titleLines[0])}</text>
      <text x="0" y="80" font-family="'Space Grotesk', system-ui, sans-serif" font-size="38" font-weight="700" fill="#ffffff" letter-spacing="-0.8">${escapeXml(titleLines[1])}</text>`
    }
    
    <!-- Artiste / DJ -->
    <g transform="translate(0, ${titleLines.length === 1 ? 78 : 112})">
      <circle cx="12" cy="0" r="12" fill="#7c3aed"/>
      <text x="12" y="5" font-family="system-ui, sans-serif" font-size="12" font-weight="700" text-anchor="middle" fill="#ffffff">${escapeXml(safeOwner.charAt(0))}</text>
      <text x="34" y="5" font-family="system-ui, sans-serif" font-size="20" fill="#c4b5fd">Par <tspan font-weight="700" fill="#ffffff">${safeOwner}</tspan> <tspan fill="#9d8ac7" font-size="16">(@${safeUsername})</tspan></text>
    </g>
  </g>

  <!-- Rangée des Badges (BPM, Tonalité, Genre, Versions) -->
  ${pillSvg}

  <!-- Cadre Description / Modifications souhaitées par le DJ -->
  <g transform="translate(510, 305)">
    <rect width="620" height="195" rx="18" fill="#151024" fill-opacity="0.9" stroke="#5b369c" stroke-width="1.4"/>
    
    <!-- En-tête du cadre -->
    <g transform="translate(20, 24)">
      <circle cx="8" cy="8" r="8" fill="#7c3aed" fill-opacity="0.3"/>
      <text x="8" y="12" font-family="system-ui, sans-serif" font-size="11" text-anchor="middle" fill="#c084fc">✦</text>
      <text x="26" y="12" font-family="'Space Grotesk', system-ui, sans-serif" font-size="12" font-weight="700" letter-spacing="1.2" fill="#c084fc">
        ${opts.helpNeeded?.trim() ? "MODIFICATIONS SOUHAITÉES PAR LE DJ" : "COLLABORATION & RETOURS"}
      </text>
    </g>

    <!-- Texte de description -->
    <g transform="translate(20, 64)">
      ${helpLines
        .map(
          (line, i) =>
            `<text x="0" y="${i * 26}" font-family="system-ui, sans-serif" font-size="16" line-height="24" fill="#ede8f8">${escapeXml(line)}</text>`,
        )
        .join("")}
    </g>
    
    <!-- Footer dans le cadre -->
    <line x1="20" y1="150" x2="600" y2="150" stroke="#ffffff" stroke-opacity="0.08" stroke-width="1"/>
    <g transform="translate(20, 172)">
      <text x="0" y="0" font-family="system-ui, sans-serif" font-size="12" font-weight="600" fill="#a78bfa">
        🎛️ Démo en écoute · Fichiers du projet &amp; STEMS téléchargeables
      </text>
    </g>
  </g>

  <!-- Footer Général & Spectre audio décoratif -->
  <g transform="translate(70, 565)">
    <!-- Barres d'égaliseur décoratives -->
    <g transform="translate(0, -6)" opacity="0.8">
      <rect x="0" y="10" width="3" height="14" rx="1.5" fill="#a855f7"/>
      <rect x="6" y="4" width="3" height="20" rx="1.5" fill="#a855f7"/>
      <rect x="12" y="8" width="3" height="16" rx="1.5" fill="#7c3aed"/>
      <rect x="18" y="0" width="3" height="24" rx="1.5" fill="#c084fc"/>
      <rect x="24" y="6" width="3" height="18" rx="1.5" fill="#a855f7"/>
      <rect x="30" y="12" width="3" height="12" rx="1.5" fill="#7c3aed"/>
      <rect x="36" y="4" width="3" height="20" rx="1.5" fill="#c084fc"/>
      <rect x="42" y="9" width="3" height="15" rx="1.5" fill="#a855f7"/>
    </g>
    <text x="60" y="8" font-family="'Space Grotesk', system-ui, sans-serif" font-size="15" font-weight="600" fill="#d8cbff">
      Écouter la démo waveform &amp; collaborer sur <tspan fill="#ffffff" font-weight="700">collab-land.lovable.app</tspan>
    </text>
  </g>
</svg>`;
}

export interface ProfileOgSvgOptions {
  name: string;
  username: string;
  bio?: string | null;
  projectCount?: number;
  avatarDataUri?: string | null;
}

export function profileOgSvg(opts: ProfileOgSvgOptions): string {
  const safeName = escapeXml(opts.name || opts.username);
  const safeUsername = escapeXml(opts.username);
  const letter = (opts.name || opts.username || "P").charAt(0).toUpperCase();
  const bioLines = wrapText(opts.bio || "Producteur de musique sur CollabLand. Écoute mes projets en cours, versions et stems.", 48, 3);
  const count = opts.projectCount ?? 0;
  const projectLabel = `${count} projet${count > 1 ? "s" : ""} en écoute`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0a0812"/>
      <stop offset="50%" stop-color="#140d24"/>
      <stop offset="100%" stop-color="#1c1130"/>
    </linearGradient>

    <radialGradient id="avatarGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#7c3aed" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="#7c3aed" stop-opacity="0"/>
    </radialGradient>

    <clipPath id="avatarClip">
      <circle cx="210" cy="300" r="110"/>
    </clipPath>
  </defs>

  <!-- Fond -->
  <rect width="1200" height="630" fill="url(#bg)"/>
  <circle cx="210" cy="300" r="170" fill="url(#avatarGlow)"/>

  <!-- Top Bar -->
  <g transform="translate(80, 50)">
    <rect width="36" height="36" rx="10" fill="#7c3aed"/>
    <path d="M12 25 L12 11 M18 25 L18 8 M24 25 L24 14" stroke="#ffffff" stroke-width="2.6" stroke-linecap="round"/>
    <text x="48" y="25" font-family="'Space Grotesk', system-ui, sans-serif" font-size="22" font-weight="700" fill="#ffffff">CollabLand</text>
  </g>

  <g transform="translate(880, 50)">
    <rect width="240" height="36" rx="18" fill="#201535" stroke="#7c3aed" stroke-width="1.4"/>
    <circle cx="22" cy="18" r="4.5" fill="#a855f7"/>
    <text x="36" y="23" font-family="'Space Grotesk', system-ui, sans-serif" font-size="12" font-weight="700" letter-spacing="1.2" fill="#e9d5ff">VITRINE ARTISTE / DJ</text>
  </g>

  <!-- Colonne Gauche : Avatar de l'artiste -->
  <circle cx="210" cy="300" r="116" fill="none" stroke="#7c3aed" stroke-width="3"/>
  <circle cx="210" cy="300" r="110" fill="#221738"/>
  ${
    opts.avatarDataUri
      ? `<image href="${opts.avatarDataUri}" x="100" y="190" width="220" height="220" preserveAspectRatio="xMidYMid slice" clip-path="url(#avatarClip)"/>`
      : `
    <text x="210" y="335" font-family="'Space Grotesk', system-ui, sans-serif" font-size="96" font-weight="700" text-anchor="middle" fill="#ffffff">${escapeXml(letter)}</text>`
  }

  <!-- Badge sous l'avatar -->
  <g transform="translate(125, 435)">
    <rect width="170" height="34" rx="17" fill="#171126" stroke="#4a356e" stroke-width="1.2"/>
    <text x="85" y="22" font-family="system-ui, sans-serif" font-size="13" font-weight="600" text-anchor="middle" fill="#d4c4ff">🎧 En studio</text>
  </g>

  <!-- Colonne Droite : Nom, Pseudo, Bio et Stats -->
  <g transform="translate(400, 175)">
    <text x="0" y="44" font-family="'Space Grotesk', system-ui, sans-serif" font-size="48" font-weight="700" fill="#ffffff" letter-spacing="-0.8">${safeName}</text>
    <text x="0" y="82" font-family="system-ui, sans-serif" font-size="24" font-weight="500" fill="#c4b5fd">@${safeUsername}</text>

    <!-- Pills de stats -->
    <g transform="translate(0, 115)">
      <g>
        <rect width="180" height="36" rx="12" fill="#7c3aed"/>
        <text x="14" y="23" font-family="'Space Grotesk', system-ui, sans-serif" font-size="14" font-weight="700" fill="#ffffff">🎵 ${escapeXml(projectLabel)}</text>
      </g>
      <g transform="translate(192, 0)">
        <rect width="210" height="36" rx="12" fill="#1b1429" stroke="#3b2b57" stroke-width="1.2"/>
        <text x="14" y="23" font-family="system-ui, sans-serif" font-size="13" font-weight="600" fill="#d8cbff">🤝 Collaborations ouvertes</text>
      </g>
    </g>

    <!-- Cadre Bio -->
    <g transform="translate(0, 175)">
      <rect width="720" height="135" rx="18" fill="#150f24" stroke="#4a2e80" stroke-width="1.3"/>
      <g transform="translate(24, 38)">
        ${bioLines
          .map(
            (line, i) =>
              `<text x="0" y="${i * 26}" font-family="system-ui, sans-serif" font-size="17" fill="#ede8f8">${escapeXml(line)}</text>`,
          )
          .join("")}
      </g>
    </g>
  </g>

  <!-- Footer -->
  <g transform="translate(80, 565)">
    <text x="0" y="8" font-family="'Space Grotesk', system-ui, sans-serif" font-size="16" font-weight="600" fill="#d8cbff">
      Découvrir la vitrine d'artiste sur <tspan fill="#ffffff" font-weight="700">collab-land.lovable.app/u/${safeUsername}</tspan>
    </text>
  </g>
</svg>`;
}

export function defaultOgSvg(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0a0812"/>
      <stop offset="45%" stop-color="#140d24"/>
      <stop offset="100%" stop-color="#1e1133"/>
    </linearGradient>

    <radialGradient id="centerGlow" cx="50%" cy="40%" r="50%">
      <stop offset="0%" stop-color="#7c3aed" stop-opacity="0.38"/>
      <stop offset="100%" stop-color="#7c3aed" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#centerGlow)"/>

  <!-- Logo Icon Central -->
  <g transform="translate(560, 110)">
    <rect width="80" height="80" rx="22" fill="#7c3aed"/>
    <path d="M26 56 L26 24 M40 56 L40 18 M54 56 L54 30" stroke="#ffffff" stroke-width="5" stroke-linecap="round"/>
  </g>

  <!-- Titre Principal -->
  <text x="600" y="240" font-family="'Space Grotesk', system-ui, sans-serif" font-size="62" font-weight="700" text-anchor="middle" fill="#ffffff" letter-spacing="-1">CollabLand</text>
  <text x="600" y="295" font-family="'Space Grotesk', system-ui, sans-serif" font-size="30" font-weight="600" text-anchor="middle" fill="#d4c4ff">Faites de la musique ensemble</text>

  <!-- Description -->
  <text x="600" y="350" font-family="system-ui, sans-serif" font-size="19" text-anchor="middle" fill="#ede8f8">
    Le studio collaboratif pour les producteurs de musique : versions, waveform en direct,
  </text>
  <text x="600" y="380" font-family="system-ui, sans-serif" font-size="19" text-anchor="middle" fill="#ede8f8">
    retours vocaux et échange de STEMS en toute simplicité.
  </text>

  <!-- 4 Piliers Fonctionnalités -->
  <g transform="translate(160, 430)">
    <g transform="translate(0, 0)">
      <rect width="205" height="42" rx="14" fill="#1b132a" stroke="#433061" stroke-width="1.2"/>
      <text x="102" y="26" font-family="'Space Grotesk', system-ui, sans-serif" font-size="14" font-weight="600" text-anchor="middle" fill="#ffffff">🎧 Lecteur Waveform</text>
    </g>
    <g transform="translate(225, 0)">
      <rect width="205" height="42" rx="14" fill="#1b132a" stroke="#433061" stroke-width="1.2"/>
      <text x="102" y="26" font-family="'Space Grotesk', system-ui, sans-serif" font-size="14" font-weight="600" text-anchor="middle" fill="#ffffff">🔁 Gestion des Versions</text>
    </g>
    <g transform="translate(450, 0)">
      <rect width="205" height="42" rx="14" fill="#1b132a" stroke="#433061" stroke-width="1.2"/>
      <text x="102" y="26" font-family="'Space Grotesk', system-ui, sans-serif" font-size="14" font-weight="600" text-anchor="middle" fill="#ffffff">🎙️ Retours Vocaux</text>
    </g>
    <g transform="translate(675, 0)">
      <rect width="205" height="42" rx="14" fill="#1b132a" stroke="#433061" stroke-width="1.2"/>
      <text x="102" y="26" font-family="'Space Grotesk', system-ui, sans-serif" font-size="14" font-weight="600" text-anchor="middle" fill="#ffffff">🎛️ Sessions &amp; STEMS</text>
    </g>
  </g>

  <!-- Spectre audio décoratif au bas -->
  <g transform="translate(480, 530)" opacity="0.6">
    <rect x="0" y="10" width="4" height="20" rx="2" fill="#7c3aed"/>
    <rect x="10" y="4" width="4" height="26" rx="2" fill="#a855f7"/>
    <rect x="20" y="12" width="4" height="18" rx="2" fill="#7c3aed"/>
    <rect x="30" y="0" width="4" height="30" rx="2" fill="#c084fc"/>
    <rect x="40" y="8" width="4" height="22" rx="2" fill="#a855f7"/>
    <rect x="50" y="14" width="4" height="16" rx="2" fill="#7c3aed"/>
    <rect x="60" y="2" width="4" height="28" rx="2" fill="#c084fc"/>
    <rect x="70" y="10" width="4" height="20" rx="2" fill="#a855f7"/>
    <rect x="80" y="6" width="4" height="24" rx="2" fill="#7c3aed"/>
    <rect x="90" y="14" width="4" height="16" rx="2" fill="#c084fc"/>
    <rect x="100" y="8" width="4" height="22" rx="2" fill="#a855f7"/>
    <rect x="110" y="16" width="4" height="14" rx="2" fill="#7c3aed"/>
  </g>
  <text x="600" y="585" font-family="'Space Grotesk', system-ui, sans-serif" font-size="14" font-weight="600" text-anchor="middle" fill="#9d88cc">
    collab-land.lovable.app
  </text>
</svg>`;
}
