/**
 * Single source of truth for platform-level admin identity.
 * Master Admin bypasses onboarding and has full platform access.
 * Set VITE_MASTER_ADMIN_EMAIL in .env (required in production).
 */
const DEFAULT_MASTER_ADMIN_EMAIL = "zainbooksys@gmail.com";

const envEmail =
  typeof import.meta !== "undefined" ? import.meta.env?.VITE_MASTER_ADMIN_EMAIL : undefined;
const resolved =
  typeof envEmail === "string" && envEmail.trim()
    ? envEmail.trim()
    : DEFAULT_MASTER_ADMIN_EMAIL;

const isProd = typeof import.meta !== "undefined" && import.meta.env?.PROD;
if (isProd && (!envEmail || typeof envEmail !== "string" || !envEmail.trim())) {
  throw new Error(
    "VITE_MASTER_ADMIN_EMAIL is required in production. Add it to .env (see .env.example)."
  );
}

export const MASTER_ADMIN_EMAIL = resolved;

export function isMasterAdminEmail(email: string | null | undefined): boolean {
  return !!email && email.toLowerCase().trim() === MASTER_ADMIN_EMAIL;
}
