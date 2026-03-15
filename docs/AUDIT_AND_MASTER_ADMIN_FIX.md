# Production-Grade Audit & Master Admin Fix

## 1. EXECUTIVE SUMMARY

### What was broken
- **Master Admin** was sometimes sent to the **onboarding flow** instead of the platform Admin Dashboard.
- Root cause: **race between auth, role resolution, and membership check** — when ProtectedRoute ran, the membership query could run before the master-admin check settled; Master Admin has no `organization_members` row, so the app redirected to onboarding.
- **Database**: `app_role` enum did not include `master_admin`, so RPC `has_role(_role => 'master_admin')` would fail; frontend relied only on email for Master Admin.

### Root causes
1. **ProtectedRoute**: Membership query was enabled when `!isMasterAdmin`; in the first render after login, `isMasterAdmin` could still be false (async), so membership ran, returned false, and redirected to onboarding.
2. **No synchronous “never onboarding” check**: Master Admin was not treated as “never onboarding” by a sync check before any async path.
3. **AuthPage post-login redirect**: Used form `email` instead of `authData.user.email` for the redirect decision; minor but could mismatch.
4. **Register**: After signup with session, always sent to `/onboarding`; Master Admin email was not redirected to `/master-admin`.
5. **DB**: `master_admin` missing from `app_role`; RLS and `has_role` only supported `super_admin` for platform-level access.

### Architecture gaps
- Platform owner (Master Admin) identity was split: email in frontend, no DB role.
- No single constant for Master Admin email (duplicated in 4 files).
- `/admin/dashboard` was not defined (only `/master-admin`).

### Highest-priority fixes (done)
1. **Sync Master Admin check in ProtectedRoute** so that email-based Master Admin never hits the membership check and never goes to onboarding.
2. **Centralized auth constant** (`@/lib/auth-constants.ts`) and use it everywhere.
3. **AuthPage**: Post-login redirect uses `authData.user?.email` and `isMasterAdminEmail()`; only `super_admin` in DB for role-based redirect (no invalid `master_admin` RPC).
4. **Onboarding**: Sync + async Master Admin check; redirect to `/admin/dashboard` immediately when Master Admin.
5. **Register**: If new user email is Master Admin, redirect to `/admin/dashboard` instead of `/onboarding`.
6. **Route**: Added `/admin/dashboard` → redirect to `/master-admin` (canonical platform dashboard URL).
7. **AuthPage (already logged in)**: Sync `isMasterAdminByEmail` so Master Admin redirects to `/admin/dashboard` without waiting for async role; all admin redirects use `/admin/dashboard`.
8. **Dashboard**: Master Admin redirects to `/admin/dashboard` (not `/master-admin`) for consistency.
7. **DB migration**: Add `master_admin` to `app_role`, add `is_platform_admin()`, and update key RLS policies to use it.

---

## 2. MASTER ADMIN ROOT CAUSE ANALYSIS

### Exact files involved
- `src/components/auth/ProtectedRoute.tsx` — redirect to `/onboarding` when `!hasMembership` without a prior sync Master Admin check.
- `src/hooks/useMasterAdmin.ts` — async role resolution; first render can have `loading: true`, `isMasterAdmin: false`.
- `src/contexts/OrganizationContext.tsx` — uses same email check; not the direct cause of redirect.
- `src/pages/AuthPage.tsx` — post-login redirect logic.
- `src/pages/Onboarding.tsx` — allowed Master Admin to land on onboarding (then redirect); now sync check avoids that.
- DB: `app_role` enum and `has_role()` — no `master_admin` value.

### Exact logic that caused onboarding redirect
In **ProtectedRoute**:
1. User loads a protected route (e.g. `/dashboard` or `/master-admin`) after login.
2. `useAuth()` has `user` set; `useMasterAdmin()` may still have `adminLoading === true` and `isMasterAdmin === false` for one render.
3. Membership query is `enabled: !!user && !authLoading && !adminLoading && !isMasterAdmin`. If that becomes true before `isMasterAdmin` is true, the query runs.
4. For Master Admin there is no row in `organization_members`, so `hasMembership === false`.
5. Code hits `if (!hasMembership) return <Navigate to="/onboarding" replace />` and redirects.

### DB/RLS/profile
- **RLS**: Not the main cause; the issue was frontend redirect logic.
- **Profile**: Not required for Master Admin; email is enough.
- **user_roles**: `master_admin` was not in `app_role`, so inserting or checking `master_admin` in DB would fail. Frontend used email only.

### Corrected logic
1. **ProtectedRoute**: Before any async membership check, if `user?.email` matches the Master Admin email (via `isMasterAdminEmail(user?.email)`), render children and do not run the membership query or redirect to onboarding.
2. **Membership query**: `enabled` also requires `!isMasterAdminByEmail` so it never runs for the Master Admin email.
3. **Onboarding**: Sync check `isMasterAdminEmail(user?.email)`; if true, show loading and redirect to `/admin/dashboard` (no onboarding UI).
4. **AuthPage**: Use `authData.user?.email` (fallback to form email) and `isMasterAdminEmail()`; redirect Master/Super Admin to `/admin/dashboard`. For already-logged-in visit to /auth, sync `isMasterAdminByEmail` redirects immediately to `/admin/dashboard` without waiting for async role.
5. **Single constant**: `MASTER_ADMIN_EMAIL` and `isMasterAdminEmail()` in `@/lib/auth-constants.ts` used everywhere.

---

## 3. COMPLETE ISSUE LIST (by category)

### Frontend
- Master Admin sent to onboarding (fixed).
- Duplicate Master Admin email string in 4 files (fixed — centralized).
- No `/admin/dashboard` route (fixed — redirects to `/master-admin`).
- Register always sent to onboarding after signup (fixed for Master Admin email).

### Backend / API
- No backend change required for this fix; auth is Supabase + frontend.

### Database
- `app_role` missing `master_admin` (fixed in migration).
- RLS policies only checked `super_admin` (fixed for user_roles and organizations via `is_platform_admin()`).

### Auth
- Race between admin check and membership check (fixed with sync email check).
- Post-login redirect used form email (fixed to use session user email).

### Routing
- Onboarding reachable by Master Admin (fixed with sync redirect).
- `/admin/dashboard` missing (fixed).

### Roles/Permissions
- `useMasterAdmin` and `usePermissions` already treat Master Admin email as full access; no change needed beyond constant.

### Modules
- Master Admin and Super Admin both go to `/master-admin`; Dashboard redirects Master Admin to `/master-admin` (already correct).

### Integrations
- N/A for this fix.

### Deployment
- Run new migration `20260315000000_add_master_admin_role.sql` after existing migrations.
- Ensure `npm install` then `npm run build` for production build.

---

## 4. FILE-BY-FILE FIX PLAN

| File | Issue | Fix |
|------|--------|-----|
| `src/lib/auth-constants.ts` | (new) | Added: `MASTER_ADMIN_EMAIL`, `isMasterAdminEmail()`. |
| `src/components/auth/ProtectedRoute.tsx` | Redirect to onboarding before admin check settled | Sync `isMasterAdminByEmail`; if true, render children and skip membership; membership `enabled` excludes `isMasterAdminByEmail`. |
| `src/hooks/useMasterAdmin.ts` | Duplicate email string | Use `isMasterAdminEmail(user?.email)` from auth-constants. |
| `src/contexts/OrganizationContext.tsx` | Duplicate email string | Use `isMasterAdminEmail(user?.email)`; rename local to `isMasterAdminByEmail`. |
| `src/hooks/usePermissions.ts` | Duplicate email string | Use `isMasterAdminEmail(user?.email)`. |
| `src/pages/AuthPage.tsx` | Redirect used form email; role check incomplete | Use `authData.user?.email` and `isMasterAdminEmail()`; check both `super_admin` and `master_admin` in `user_roles`. |
| `src/pages/Onboarding.tsx` | Master Admin could see onboarding briefly | Sync `isMasterAdminByEmail`; redirect in effect and in enabled flags; show loading while redirecting. |
| `src/pages/Register.tsx` | Always onboarding after signup | If `isMasterAdminEmail(authData.user?.email)`, redirect to `/admin/dashboard`. |
| `src/App.tsx` | No `/admin/dashboard` | Added route `/admin/dashboard` → `<Navigate to="/master-admin" replace />`. |
| `supabase/migrations/20260315000000_add_master_admin_role.sql` | (new) | Add `master_admin` to `app_role`; add `is_platform_admin()`; update user_roles and organizations RLS. |

---

## 5. DATABASE FIXES

### Migration: `20260315000000_add_master_admin_role.sql`

- Adds `master_admin` to `app_role` (safe if already present via DO block).
- Creates `is_platform_admin(uuid)` returning true for `super_admin` or `master_admin` in `user_roles`.
- Drops and recreates:
  - `user_roles`: "Admins can manage roles" using `is_platform_admin(auth.uid())`.
  - `organizations`: "Admins can manage orgs" using `is_platform_admin(auth.uid())`.

### Optional: Seed Master Admin role (run after migration)

If you want the platform owner in `user_roles` (in addition to email check), run once (replace the UUID with the real `auth.users.id` for `zainbooksys@gmail.com`):

```sql
-- Get user id: SELECT id FROM auth.users WHERE email = 'zainbooksys@gmail.com';
INSERT INTO public.user_roles (user_id, role)
VALUES ('<auth-users-uuid-here>', 'master_admin')
ON CONFLICT (user_id, role) DO NOTHING;
```

---

## 6. AUTH + ROLE FIXES (SUMMARY)

- **Login** → AuthPage uses `authData.user?.email` and `isMasterAdminEmail()`; if true → `/admin/dashboard`; else if `user_roles` has `super_admin` or `master_admin` → `/admin/dashboard`; else if org membership → `/dashboard`; else → `/onboarding`. Already logged in on /auth: sync `isMasterAdminByEmail` → `/admin/dashboard`; else when `adminLoading` false, `isMasterAdmin` → `/admin/dashboard`.
- **ProtectedRoute**: Sync Master Admin email → render; else wait for admin loading; if Master/Super Admin → render; else wait for membership; if no membership → `/onboarding`.
- **Onboarding**: Sync Master Admin email (or async isMasterAdmin) → redirect to `/admin/dashboard`, no onboarding UI.
- **Register**: After signup with session, Master Admin email → `/admin/dashboard`, others → `/onboarding`.
- **Dashboard**: If `isMasterAdmin` → `<Navigate to="/admin/dashboard" />`.
- **Single source of truth**: `@/lib/auth-constants.ts` for Master Admin email and helper.

---

## 7. MODULE-BY-MODULE (Master Admin only)

- **Dashboard**: Redirects `isMasterAdmin` to `/admin/dashboard` (which then loads `/master-admin`).
- **Master Admin page**: Wrapped in ProtectedRoute + ModuleGuard; Master Admin bypasses ModuleGuard (unchanged).
- **Onboarding**: Now redirects Master Admin immediately (sync + async).
- **Sidebar**: Already shows Master Admin nav for `isMasterAdmin` (unchanged).

---

## 8. E2E TEST PLAN (Master Admin)

1. **Master Admin login**
   - Sign in with Master Admin email → must land on `/admin/dashboard` (then `/master-admin`), never on onboarding.
2. **Direct visit to /onboarding**
   - While logged in as Master Admin, open `/onboarding` → must redirect to `/admin/dashboard`.
3. **Direct visit to /dashboard**
   - While logged in as Master Admin → must redirect to `/admin/dashboard` (Dashboard logic).
4. **Register as Master Admin**
   - If signup creates session and email is Master Admin → redirect to `/admin/dashboard`, not `/onboarding`.

### Post-deploy verification

- [ ] Master Admin can sign in and lands on `/admin/dashboard` / platform dashboard (not onboarding).
- [ ] Visiting `/onboarding` while logged in as Master Admin redirects to `/admin/dashboard`.
- [ ] New tenant signup can complete onboarding and reach dashboard.
- [ ] Protected routes require login; unauthenticated users redirect to `/auth`.
- [ ] Build and env: `npm run build` succeeds with production env vars set.

---

## 9. PRODUCTION HARDENING (brief)

- **Master Admin email:** `auth-constants.ts` reads `VITE_MASTER_ADMIN_EMAIL` (optional). If unset, falls back to the default. Set in production to override.
- **Migration order:** Run `supabase/migrations/20260315000000_add_master_admin_role.sql` after all existing migrations (e.g. `supabase db push` or run the SQL in the Supabase SQL editor).
- **Build:** Run `npm install` and `npm run build` before deploy.

---

## 10. DEPLOYMENT PACKAGE

- **Code**: All changes in `src/` and new migration as above.
- **Env**: Copy `.env.example` to `.env` and set `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`; optional `VITE_MASTER_ADMIN_EMAIL` for configurable Master Admin email.
- **Build**: `npm install && npm run build`.
- **DB**: Apply migration; optionally seed `user_roles` with `master_admin` for the platform owner user.

### Quick deploy checklist

1. Clone repo and run `npm install`.
2. Copy `.env.example` to `.env` and set Supabase URL and anon key (and optionally `VITE_MASTER_ADMIN_EMAIL`).
3. Run `npm run build`; fix any errors.
4. Apply DB migration `20260315000000_add_master_admin_role.sql` (e.g. `supabase db push` or Supabase SQL editor).
5. (Optional) Seed Master Admin in `user_roles`: `INSERT INTO public.user_roles (user_id, role) VALUES ('<auth.users.id>', 'master_admin') ON CONFLICT (user_id, role) DO NOTHING;`
6. Deploy the `dist/` output (or connect your host to the repo and set env vars in the dashboard).

---

## 11. FINAL DELIVERABLES

- **Code**: Centralized auth constant, ProtectedRoute sync check, AuthPage/Onboarding/Register redirect fixes, `/admin/dashboard` route.
- **SQL**: Migration adding `master_admin` and `is_platform_admin()`, RLS updates for user_roles and organizations.
- **Config**: No new required config; optional env for Master Admin email.
- No placeholders: all logic is implemented and wired.
