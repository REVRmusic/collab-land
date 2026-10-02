/** Single rule for signup and settings (normalized to lowercase). */
export const USERNAME_HINT = "3 à 24 caractères : lettres, chiffres, _ et .";

const USERNAME_RE = /^[a-z0-9_.]{3,24}$/;

export function normalizeUsername(raw: string) {
  return raw.trim().toLowerCase();
}

/** Returns an error message, or null if the username is valid. */
export function usernameError(raw: string): string | null {
  const u = normalizeUsername(raw);
  if (!USERNAME_RE.test(u)) return `Nom d'utilisateur : ${USERNAME_HINT}`;
  return null;
}
