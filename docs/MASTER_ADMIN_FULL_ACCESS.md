# Master Admin Full System Access – Audit & Fixes

## Root cause

The Master Admin account (the email set in `VITE_MASTER_ADMIN_EMAIL` / `<MASTER_ADMIN_EMAIL>`) had limited access for two reasons:

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

**`is_platform_admin(user_uuid UUID)` function:**  
Defined in `supabase/migrations/20260315000000_add_master_admin_role.sql`. Signature and behavior:

- **Signature:** `public.is_platform_admin(_user_id uuid) RETURNS boolean`
- **Return type:** `BOOLEAN`
- **Behavior:** Returns `true` when the user has `master_admin` or `super_admin` in `public.user_roles`; otherwise `false`. RLS policies use `is_platform_admin(auth.uid())` so that both roles get the same platform-level access.

```sql
CREATE OR REPLACE FUNCTION public.is_platform_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('super_admin', 'master_admin')
  )
$$;
```

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

**Security warning – tenant isolation bypass**

Granting Master Admin full CRUD on organization-scoped resources (e.g. `properties`, `tenants`, `leases`, `invoices`, `payments`, `maintenance_requests`, `buildings`, `units`, `rooms`, `bed_spaces`, `amenities`, `documents`, `messages`, `notifications`, `audit_logs`) **bypasses tenant isolation**. Scope: **all org data across all tenants**.

Operators must implement:

- **Access controls:** Mandatory MFA for Master Admin, IP allowlist where possible, strict session timeouts.
- **Audit:** Comprehensive audit logging of all Master Admin actions (e.g. `audit_logs` and application logs); retain and review regularly.
- **Governance:** Regular access reviews and documented incident response procedures for compromised Master Admin credentials (revoke role, rotate secrets, review `audit_logs` and `user_roles`).

### 5. Error handling and logging

- **ModuleGuard:** `console.warn` when access is denied (subscription or permission).
- **UpgradePrompt:** `console.warn` with `module`, `reason`, and optional `resourceName` when the prompt is shown.

---

## Deployment checklist

**Pre-deployment (REQUIRED)**

- Run all three migrations in a **staging** environment in this order:
  - `20260315000000_add_master_admin_role.sql` (adds `master_admin` and `is_platform_admin`)
  - `20260315100000_grant_organizations_permissions.sql` (organizations grants + policy)
  - `20260315200000_master_admin_platform_rls.sql` (platform and org-scoped RLS)
- In staging, verify Master Admin behavior: confirm `is_platform_admin(auth.uid())` and `user_roles` for the test Master Admin user, and that platform/org-scoped queries succeed without RLS errors.

**Backup**

- Snapshot the production database (or at least `public.user_roles` and RLS policy state) **before** running the `INSERT` into `public.user_roles` for the Master Admin user.

**Apply migrations (in order)**

1. `20260315000000_add_master_admin_role.sql`
2. `20260315100000_grant_organizations_permissions.sql`
3. `20260315200000_master_admin_platform_rls.sql`

**Ensure Master Admin has DB role**

Run once (replace `<MASTER_ADMIN_USER_UUID>` with the real `auth.users.id` for the account that matches `VITE_MASTER_ADMIN_EMAIL`):

```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('<MASTER_ADMIN_USER_UUID>', 'master_admin')
ON CONFLICT (user_id, role) DO NOTHING;
```

**Rollback procedure**

If issues occur after deployment:

- Restore from the pre-deployment backup if necessary.
- To reverse RLS/role changes without full restore: drop the new "Platform admins …" and updated policies (see migration filenames for policy names), revoke or revert any role grants applied in `20260315100000_grant_organizations_permissions.sql`, and remove the Master Admin row from `public.user_roles` if desired:  
  `DELETE FROM public.user_roles WHERE user_id = '<MASTER_ADMIN_USER_UUID>' AND role = 'master_admin';`

**Verification SQL (run as the Master Admin user or with that user's JWT in Supabase)**

- Confirm role: `SELECT * FROM public.user_roles WHERE user_id = auth.uid();` — Expect at least one row with `role = 'master_admin'` (or `super_admin`).
- Confirm helper: `SELECT public.is_platform_admin(auth.uid());` — Expect `true`.
- Platform-scoped tables (should return rows without RLS errors): `SELECT count(*) FROM public.subscription_plans;`, `SELECT count(*) FROM public.customer_subscriptions;`
- Org-scoped tables (counts should include all organizations): `SELECT count(*) FROM public.properties;`, `SELECT count(*) FROM public.tenants;`
- Audit: `SELECT * FROM public.audit_logs WHERE user_id = auth.uid() ORDER BY created_at DESC LIMIT 10;` — Expect recent entries for Master Admin actions if the app writes to `audit_logs`.

**Post-deployment verification and monitoring**

- **audit_logs:** Confirm Master Admin actions are logged; monitor for unexpected or bulk changes.
- **Error rates:** Watch Supabase and app logs for RLS/permission errors or spikes.
- **Frontend:** Confirm Sidebar shows full nav for Master Admin, ModuleGuard and UpgradePrompt do not block Master Admin, and `VITE_MASTER_ADMIN_EMAIL` is set correctly in the deployed environment.

**Frontend deploy**

- Deploy the updated app (Sidebar, ModuleGuard, UpgradePrompt). No env changes needed if `VITE_MASTER_ADMIN_EMAIL` is already set.

---

## Verification (Master Admin)

After deployment, as Master Admin (account matching `VITE_MASTER_ADMIN_EMAIL`):

**UI checks**

- See full sidebar: Platform (Admin Dashboard), Tenants (Organizations, All Users), Billing (Subscriptions), Monitoring (Support), System (Settings), plus all org modules (Dashboard, Property, Tenant & Lease, Finance, HR, Operations, Communication, Intelligence, Portals, Integrations, System).
- Use org switcher when multiple orgs exist.
- Open every module (no “Access Restricted” or “Upgrade Required” due to role).
- Create/edit/delete organizations; manage subscription plans and pricing; access analytics, AI, ERP, settings; manage any tenant’s data within the app.
- If something is still blocked, check browser console for `[ModuleGuard]` / `[UpgradePrompt]` warnings and Supabase logs for RLS; add more “Platform admins …” policies for the missing table(s) if needed.

**Database-level verification**

Run the following as the Master Admin user (e.g. via Supabase SQL Editor or client using that user's session). Reference: **`is_platform_admin()`**, **`auth.uid()`**, **`user_roles`**, **`subscription_plans`**, **`customer_subscriptions`**, **`properties`**, **`tenants`**, **`audit_logs`**.

1. **Role and function**
   - `SELECT * FROM public.user_roles WHERE user_id = auth.uid();` — Expect: row(s) with `role` in (`master_admin`, `super_admin`).
   - `SELECT public.is_platform_admin(auth.uid());` — Expect: `true`.

2. **Platform-scoped tables (no RLS failures)**
   - `SELECT count(*) FROM public.subscription_plans;`
   - `SELECT count(*) FROM public.customer_subscriptions;`  
   Queries should succeed; counts reflect all plans/subscriptions the app expects.

3. **Org-scoped tables (counts include all orgs)**
   - `SELECT count(*) FROM public.properties;`
   - `SELECT count(*) FROM public.tenants;`  
   Counts should include data for all organizations, not only one tenant.

4. **Audit logging**
   - `SELECT * FROM public.audit_logs WHERE user_id = auth.uid() ORDER BY created_at DESC LIMIT 10;`  
   Expect: recent rows for Master Admin actions if the app records them in `audit_logs`.

**Expected outcomes:** All queries succeed without RLS errors; platform and org-scoped counts show full scope; `audit_logs` contains Master Admin activity where the app writes it.

---

## Summary

| Area              | Issue                                      | Fix                                                                 |
|-------------------|--------------------------------------------|---------------------------------------------------------------------|
| Sidebar           | Master Admin saw only 6 links              | Show platform nav + full org nav for Master Admin                  |
| Org switcher      | Hidden for Master Admin                    | Shown when organizations exist                                      |
| RLS               | Only `super_admin` in policies             | New migration uses `is_platform_admin()` for platform/org tables    |
| Permission logs   | No visibility on denials                   | Console warnings in ModuleGuard and UpgradePrompt                  |

Master Admin now has full platform authority and access to all modules and data, with tenant restrictions bypassed via `is_platform_admin()` in RLS and full navigation and guards on the frontend.
