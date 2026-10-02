export function linkHost(url: string) {
  try {
    const h = new URL(url).hostname;
    if (h.includes("wetransfer") || h.includes("we.tl")) return "WeTransfer";
    if (h.includes("swisstransfer")) return "SwissTransfer";
    if (h.includes("drive.google")) return "Google Drive";
    if (h.includes("dropbox")) return "Dropbox";
    if (h.includes("icloud")) return "iCloud Drive";
    return h;
  } catch {
    return "Lien";
  }
}

/** Returns a normalized HTTPS URL, null for empty input, or throws on invalid input. */
export function cleanLink(raw: string): string | null {
  const v = raw.trim();
  if (!v) return null;
  try {
    const u = new URL(v);
    if (u.protocol !== "https:") throw new Error();
    if (v.length > 2000) throw new Error();
    return u.toString();
  } catch {
    throw new Error("Lien de téléchargement invalide (doit commencer par https://)");
  }
}
