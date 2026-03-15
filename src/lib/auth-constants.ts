/**
 * Single source of truth for platform-level admin identity.
 * Master Admin bypasses onboarding and has full platform access.
 */
export const MASTER_ADMIN_EMAIL = "zainbooksys@gmail.com";

export function isMasterAdminEmail(email: string | null | undefined): boolean {
  return !!email && email.toLowerCase().trim() === MASTER_ADMIN_EMAIL;
}
