# Master Admin: Login → Profile → Role → Route Guard → Module Access

## Trace (full flow)

1. **Login**
   - User signs in via Supabase Auth (`supabase.auth.signInWithPassword` or OTP).
   - `useAuth()` subscribes to `onAuthStateChange` and `getSession()` → exposes `user` (and `loading`).

2. **Profile**
   - There is no separate “profile” step for **role resolution**. Role is determined by:
     - **Email:** `isMasterAdminEmail(user?.email)` from `auth-constants` (sync).
     - **DB:** `user_roles` (and optionally `organization_members` for org users) via RPC `has_role` or direct read.

3. **Role**
   - **useMasterAdmin:**  
     - If `isMasterAdminEmail(user?.email)` → `isMasterAdmin = true` (no DB).  
     - Else queries `has_role(user.id, 'master_admin')` and `has_role(user.id, 'super_admin')` → `isMasterAdmin = true` if either returns true.
   - **usePermissions:**  
     - If email is Master Admin → `effectiveAdminRole = 'master_admin'`, `isSuperAdmin = true`, `canAccessModule(slug) = true`.  
     - Else loads `organization_members.role` for `currentOrg` and `role_permissions` for that role; `canAccessModule` = true for super_admin/master_admin.
   - **useSubscriptionAccess:**  
     - `isFullAccess = isMasterAdmin || isSuperAdmin`; if true, `hasModuleAccess(slug) = true` and `checkUsageLimit` returns allowed.

4. **Route guard**
   - **ProtectedRoute:**  
     - No user → redirect to `/auth`.  
     - If `isMasterAdminByEmail` or (after load) `isMasterAdmin` → render children (no onboarding).  
     - Else if no org membership → redirect to `/onboarding`.  
     - Else render children.
   - **ModuleGuard (per route):**  
     - If `isMasterAdmin` → render children (full bypass).  
     - Else no `currentOrg` → redirect to `/onboarding`.  
     - Else if `!hasModuleAccess(module)` → show UpgradePrompt (subscription).  
     - Else if `!canAccessModule(module)` → show UpgradePrompt (permission).  
     - Else render children.

5. **Module access**
   - **Sidebar:** For Master Admin, `displayGroups = [...masterAdminGroups, ...orgNavGroups]` (full nav).  
   - **ModuleGuard:** Master Admin skips subscription and permission checks.  
   - **Backend (RLS):** Tables must allow `is_platform_admin(auth.uid())` (or equivalent) for Master Admin to read/write; otherwise “permission denied” at runtime.

## Summary

- **Frontend:** Master Admin is identified by email or `user_roles`; route and module guards let them through without org or subscription checks.  
- **Backend:** Master Admin still needs RLS policies (and, if used, GRANTs) that include `is_platform_admin(auth.uid())` (or `has_role` for `master_admin`) on every table they use. Missing policies cause runtime “permission denied” errors.
