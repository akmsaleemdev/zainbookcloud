// src/hooks/index.ts
// Barrel export for all hooks.
// Import from "@/hooks" instead of individual files to prevent
// "usePermissions is not defined" style errors across pages.
//
// Usage in any page:
//   import { usePermissions, useMasterAdmin, useSubscriptionAccess } from "@/hooks";

export { useAuth } from "./useAuth";
export { usePermissions } from "./usePermissions";
export { useMasterAdmin } from "./useMasterAdmin";
export { useSubscriptionAccess } from "./useSubscriptionAccess";
export { useOrganization } from "@/contexts/OrganizationContext";
