# Master Admin Full System Access – Audit & Fixes

## Root cause

The Master Admin account (zainbooksys@gmail.com) had limited access for two reasons:

1. **Frontend navigation**  
   The sidebar showed only a short “platform” nav (Admin Dashboard, Organizations, All Users, Subscriptions, Support, Settings). Links to other modules (Properties, Invoices, Analytics, AI, ERP, HR, etc.) were hidden, so Master Admin could not reach them from the UI.

2. **Database RLS (Row Level Security)**  
   Many policies used `has_role(auth.uid(), 'super_admin')` only. The Master Admin role is `master_admin` in `user_roles`, so those policies did not allow access. Platform tables (subscription_plans, customer_subscriptions, support_tickets, etc.) and org-scoped tables (properties, tenants, invoices, etc.) were therefore blocked for Master Admin.

---

## Fixes applied

### 1. Frontend – Sidebar (full module list for Master Admin)

- **File:** `src/components/layout/Sidebar.tsx`
- **Change:** For Master Admin, `displayGroups` is now `[...masterAdminGroups, ...orgNavGroups]` so they see both platform sections and every org module (Dashboard, Properties, Tenants, Leases, Invoices, Payments, HR, Analytics, AI, ERP, etc.).
- **Change:** Org switcher is shown for Master Admin when they have organizations, so they can choose which org’s data to view on org-scoped pages.

### 2. Frontend – ModuleGuard & usePermissions

- **Already correct:** `ModuleGuard` bypasses all checks when `isMasterAdmin` is true (no org, no subscription, no role check).
- **Already correct:** `usePermissions` treats `master_admin` and `super_admin` as `isSuperAdmin` and returns full permissions (`canAccessModule` true, `hasPermission` true, `getModulePermissions` all true).

### 3. Frontend – Subscription access

- **Already correct:** `useSubscriptionAccess` sets `isFullAccess = isMasterAdmin || isSuperAdmin` and `hasModuleAccess` returns true when `isFullAccess` is true.

### 4. Database – RLS migration for Master Admin

- **File:** `supabase/migrations/20260315200000_master_admin_platform_rls.sql`
- **Purpose:** Give `master_admin` the same platform and org-scoped access as `super_admin` by using `is_platform_admin(auth.uid())` (which is true for both roles).

**Platform / subscription / support:**

- `subscription_plans`, `platform_modules`, `plan_modules`: manage with `is_platform_admin`.
- `customer_subscriptions`, `subscription_modules`: view (org member or platform admin), manage (platform admin).
- `support_tickets`, `ticket_messages`: view/update/delete where `is_platform_admin`.
- `payment_gateway_configs`: manage with `is_platform_admin`.
- `ai_chat_sessions`, `ai_chat_messages`: view with `is_platform_admin` where needed.
- `erp_connections`, `erp_sync_logs`: view/manage with `is_platform_admin`.

**Organization and org-scoped data:**

- `organization_members`: SELECT for platform admin (so Master Admin can list all org members).
- New “Platform admins …” policies for full CRUD where `is_platform_admin(auth.uid())`:
  - `properties`, `tenants`, `leases`, `invoices`, `payments`, `maintenance_requests`
  - `buildings`, `units`, `rooms`, `bed_spaces`, `amenities`, `documents`, `messages`, `notifications`
  - `audit_logs`: SELECT for platform admin.

(Existing org-member policies stay; these add platform-admin access so Master Admin can operate across all tenants.)

### 5. Error handling and logging

- **ModuleGuard:** `console.warn` when access is denied (subscription or permission).
- **UpgradePrompt:** `console.warn` with `module`, `reason`, and optional `resourceName` when the prompt is shown.

---

## Deployment checklist

1. **Apply migrations (in order)**  
   - `20260315000000_add_master_admin_role.sql` (adds `master_admin` and `is_platform_admin`)  
   - `20260315100000_grant_organizations_permissions.sql` (organizations table grants + policy)  
   - `20260315200000_master_admin_platform_rls.sql` (platform and org-scoped RLS for Master Admin)

2. **Ensure Master Admin has DB role**  
   Run once (replace with real `auth.users.id` for the Master Admin email):

   ```sql
   INSERT INTO public.user_roles (user_id, role)
   VALUES ('<MASTER_ADMIN_USER_UUID>', 'master_admin')
   ON CONFLICT (user_id, role) DO NOTHING;
   ```

3. **Frontend**  
   Deploy updated app (Sidebar, ModuleGuard, UpgradePrompt). No env changes required if `VITE_MASTER_ADMIN_EMAIL` is already set.

---

## Verification (Master Admin)

After deployment, as Master Admin (zainbooksys@gmail.com):

- See full sidebar: Platform (Admin Dashboard), Tenants (Organizations, All Users), Billing (Subscriptions), Monitoring (Support), System (Settings), plus all org modules (Dashboard, Property, Tenant & Lease, Finance, HR, Operations, Communication, Intelligence, Portals, Integrations, System).
- Use org switcher when multiple orgs exist.
- Open every module (no “Access Restricted” or “Upgrade Required” due to role).
- Create/edit/delete organizations; manage subscription plans and pricing; access analytics, AI, ERP, settings; manage any tenant’s data within the app.
- If something is still blocked, check browser console for `[ModuleGuard]` / `[UpgradePrompt]` warnings and Supabase logs for RLS; add more “Platform admins …” policies for the missing table(s) if needed.

---

## Summary

| Area              | Issue                                      | Fix                                                                 |
|-------------------|--------------------------------------------|---------------------------------------------------------------------|
| Sidebar           | Master Admin saw only 6 links              | Show platform nav + full org nav for Master Admin                  |
| Org switcher      | Hidden for Master Admin                    | Shown when organizations exist                                      |
| RLS               | Only `super_admin` in policies             | New migration uses `is_platform_admin()` for platform/org tables    |
| Permission logs   | No visibility on denials                   | Console warnings in ModuleGuard and UpgradePrompt                  |

Master Admin now has full platform authority and access to all modules and data, with tenant restrictions bypassed via `is_platform_admin()` in RLS and full navigation and guards on the frontend.
