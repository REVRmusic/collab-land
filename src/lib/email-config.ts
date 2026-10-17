/** Shared sender settings for Lovable / Resend transactional emails. */
export const SITE_NAME = process.env["SITE_NAME"] || "CollabLand";
export const SENDER_DOMAIN = process.env["SENDER_DOMAIN"] || "collabland-notify.lm-music.com";
export const FROM_ADDRESS = process.env["FROM_ADDRESS"] || `${SITE_NAME} <noreply@${SENDER_DOMAIN}>`;
export const SITE_URL = process.env["SITE_URL"] || process.env["APP_URL"] || "https://collab-land.lovable.app";

