/**
 * Single source of truth for platform-level admin identity.
 * Master Admin bypasses onboarding and has full platform access.
 * Set VITE_MASTER_ADMIN_EMAIL in production to override the default.
 */
const DEFAULT_MASTER_ADMIN_EMAIL = "zainbooksys@gmail.com";

const envEmail =
  typeof import.meta !== "undefined" ? import.meta.env?.VITE_MASTER_ADMIN_EMAIL : undefined;
export const MASTER_ADMIN_EMAIL =
  typeof envEmail === "string" && envEmail.trim()
    ? envEmail.trim()
    : DEFAULT_MASTER_ADMIN_EMAIL;

export function isMasterAdminEmail(email: string | null | undefined): boolean {
  return !!email && email.toLowerCase().trim() === MASTER_ADMIN_EMAIL;
}
