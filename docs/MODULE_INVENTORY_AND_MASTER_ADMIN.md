# Full Module Inventory & Master Admin / Subscription Status

**Purpose:** Single source of truth for all app modules, sub-modules, working status, and prioritized Master Admin / Subscription issues. **No code edits** — inventory only.

---

## 1. Module and sub-module list (from routes + Sidebar)

### 1.1 Public / marketing (no app layout)

| Route(s) | Module | Sub-module / note |
|----------|--------|--------------------|
| `/`, `/website` | Website | Home |
| `/website/features` | Website | Features |
| `/website/pricing` | Website | Pricing |
| `/website/solutions` | Website | Solutions |
| `/website/about` | Website | About |
| `/website/contact` | Website | Contact |
| `/website/payment-gateways` | Website | Payment gateways (marketing) |
| `/auth` | Auth | Login |
| `/register` | Auth | Register |
| `/reset-password` | Auth | Reset password |
| `/checkout` | Billing | Checkout (plan purchase) |
| `/docs` | Docs | Documentation |
| `/faq` | Docs | FAQ |
| `/onboarding` | Onboarding | Org/plan selection (Shopify-style) |

### 1.2 App – Platform (Master Admin–facing)

| Route | Module | Sub-module / note |
|-------|--------|--------------------|
| `/master-admin` | Master Admin Panel | Single page with tabs: Organizations, **Plans**, **Subscriptions**, Tickets, **Modules**, **Gateways**, Logs, **Email Domains** |
| `/organizations` | Organizations | CRUD orgs (with ModuleGuard `organizations`) |
| `/user-management` | User Management (All Users) | Members list, Add by ID, **Invite by Email** |
| `/subscriptions` | Subscriptions | Org-level plan view (with ModuleGuard `subscriptions`) |
| `/support` | Support Center | Tickets (with ModuleGuard `support`) |
| `/settings` | Settings | Org/user settings (with ModuleGuard `settings`) |

### 1.3 App – Property & structure

| Route | Module (slug) | Sub-module / note |
|-------|----------------|--------------------|
| `/dashboard` | Dashboard | Main dashboard |
| `/properties` | Properties | Properties + property images |
| `/buildings` | Buildings | Buildings |
| `/floors` | Floors | Floors |
| `/units` | Units | Units |
| `/rooms` | Rooms | Rooms |
| `/bed-spaces` | Bed Spaces | Bed spaces |

### 1.4 App – Tenant & lease

| Route | Module (slug) | Sub-module / note |
|-------|----------------|--------------------|
| `/tenants` | Tenants | Tenants list + **Add Tenant** |
| `/leases` | Leases | Leases |
| `/ejari` | Ejari | Ejari |
| `/rent-management` | Rent Management | Rent control |

### 1.5 App – Finance

| Route | Module (slug) | Sub-module / note |
|-------|----------------|--------------------|
| `/invoices` | Invoices | Invoices |
| `/payments` | Payments | Payments |
| `/cheque-tracking` | Cheque Tracking | Cheques |
| `/accounting` | Accounting | Accounting & VAT |

### 1.6 App – HR & payroll

| Route | Module (slug) | Sub-module / note |
|-------|----------------|--------------------|
| `/hr` | HR Dashboard | hr-payroll |
| `/employees` | Employees | hr-payroll |
| `/attendance` | Attendance | hr-payroll |
| `/leave` | Leave Management | hr-payroll |
| `/payroll` | Payroll | hr-payroll |

### 1.7 App – Operations

| Route | Module (slug) | Sub-module / note |
|-------|----------------|--------------------|
| `/maintenance` | Maintenance | Maintenance requests |
| `/amenities` | Amenities | Amenities |
| `/utilities` | Utilities | Utilities |
| `/documents` | Documents | Documents |
| `/uae-management` | UAE Management | Parking, visitors, access cards, inspections |

### 1.8 App – Communication

| Route | Module (slug) | Sub-module / note |
|-------|----------------|--------------------|
| `/messaging` | Messaging | Messaging |
| `/notifications` | Notifications | Notifications |
| `/complaints` | Complaints | Complaints |
| `/notices` | Notices | Notices |

### 1.9 App – Intelligence

| Route | Module (slug) | Sub-module / note |
|-------|----------------|--------------------|
| `/reports` | Reports | Reports |
| `/analytics` | Analytics | Analytics |
| `/ai-insights` | AI Insights | AI Insights |
| `/automation` | Automation | Workflow builder |

### 1.10 App – Portals & integrations

| Route | Module (slug) | Sub-module / note |
|-------|----------------|--------------------|
| `/owner-portal` | Owner Portal | owner-portal |
| `/tenant-portal` | Tenant Portal | tenant-portal |
| `/public-booking` | Public Booking | public-booking (leads) |
| `/erp-integrations` | ERP Integrations | ERP |

### 1.11 Other app routes

| Route | Module | Note |
|-------|--------|------|
| `/customer-dashboard` | Customer Dashboard | No ModuleGuard (separate flow) |
| `*` | NotFound | 404 |

---

## 2. Working / partially working / UI-only / broken (summary)

- **Working:** UI loads, main read/write flows work for intended roles (including Master Admin where intended).
- **Partially working:** UI works but some actions fail (e.g. RLS/permission on specific tables, or rate limit).
- **UI-only:** Page renders but backend/DB not wired or no real data.
- **Broken:** Critical path fails for target user (e.g. Master Admin) or error blocks use.

Evidence from screenshots + codebase:

| Area | Status | Evidence |
|------|--------|----------|
| **Master Admin Panel – Plans tab** | **Broken (Master Admin)** | "permission denied for table subscription_plans" when creating/editing plan. Migration `20260315200000` defines `is_platform_admin` policy; if migration not applied or GRANT missing, Master Admin will get this error. |
| **Master Admin Panel – Gateways tab** | **Broken (Master Admin)** | "permission denied for table payment_gateway_configs" when adding gateway. Same migration has policy for `is_platform_admin`; deployment/GRANT issue or migration order. |
| **Master Admin Panel – Email Domains tab** | **Broken (Master Admin)** | "permission denied for table email_domains". **RLS only allows `has_role('super_admin')`**; no policy for `master_admin` / `is_platform_admin`. Code: `20260308223003` + `zainbook_full_schema.sql`. |
| **Master Admin Panel – Modules tab** | **Partially working / UI-only** | UI shows "0 of 0 modules active". If `platform_modules` has no rows in DB, tab is effectively empty; if migration not applied, SELECT/UPDATE may fail. Seed in `20260308214312` inserts rows; if that migration wasn’t run, table can be empty. |
| **User Management – Invite by Email** | **Partially working** | "For security purposes, you can only request this after 45 seconds" — **rate limit (Supabase auth)**. Invite flow: signUp + insert into `organization_members`; insert can also fail for Master Admin (see below). |
| **User Management – Add by ID / list / edit** | **Broken (Master Admin) when writing** | Master Admin is not in `organization_members` for an org. INSERT/UPDATE/DELETE policies on `organization_members` only allow org admins (EXISTS in org_members) or self-insert; **no `is_platform_admin`**. So Master Admin cannot add/update/remove members. |
| **Tenants – Add Tenant** | **Broken (Master Admin)** | "infinite recursion detected in policy for relation 'organization_members'". INSERT into `organization_members` (or a trigger/flow that touches it) triggers RLS that again reads `organization_members`, causing recursion. Likely tied to "Org admins can insert members" policy and/or trigger `trg_members_usage`. |
| **Organizations** | **Working (after prior fix)** | Create/edit orgs fixed for Master Admin via `20260315100000_grant_organizations_permissions.sql`. |
| **Subscription/Pricing (org-level Subscriptions page)** | **Depends** | Page uses ModuleGuard `subscriptions`; Master Admin bypasses guard. Actual data from `customer_subscriptions` etc.; migration gives platform admin access. If migration applied, **working**; if not, **broken**. |
| **Other org-scoped modules (Properties, Tenants, Leases, etc.)** | **Working (Master Admin)** | Migration `20260315200000` adds "Platform admins …" policies for properties, tenants, leases, invoices, payments, maintenance_requests, buildings, units, rooms, bed_spaces, amenities, documents, messages, notifications, audit_logs. So **if migration applied**, Master Admin can access these. |
| **Dashboard, Settings, Support, Reports, Analytics, etc.** | **Working (UI + access)** | ModuleGuard lets Master Admin through; pages load. Backend depends on RLS per table; many still use `has_role('super_admin')` only — those need `is_platform_admin` in migrations to be fully consistent for Master Admin. |

---

## 3. Detailed status by category

### 3.1 Master Admin Panel (tabs)

| Tab | Table(s) | RLS / policy | Status |
|-----|----------|--------------|--------|
| Organizations | `organizations` | Grant + policy (20260315100000) | Working |
| Plans | `subscription_plans` | is_platform_admin (20260315200000) | Broken if migration not applied or GRANT missing |
| Subscriptions | `customer_subscriptions`, etc. | is_platform_admin | Same as Plans |
| Tickets | `support_tickets`, `ticket_messages` | is_platform_admin | Working once migration applied |
| Modules | `platform_modules` | is_platform_admin | Partially working / 0 of 0 if table empty or migration not applied |
| Gateways | `payment_gateway_configs` | is_platform_admin | Broken if migration not applied or GRANT missing |
| Logs | `audit_logs` | Platform admins SELECT | Working once migration applied |
| Email Domains | `email_domains` | **Only has_role('super_admin')** | **Broken for Master Admin** (no is_platform_admin) |

### 3.2 User Management & organization_members

| Action | Policy / trigger | Status |
|--------|------------------|--------|
| View members | SELECT: user_id = auth.uid() OR is_platform_admin (20260315200000) | Working for Master Admin |
| Add by ID (insert member) | "Org admins can insert members" — EXISTS(org_members where role=org_admin); no is_platform_admin | **Broken for Master Admin** |
| Invite by Email | signUp + insert organization_members; 45s rate limit | Partially working (rate limit) + insert can fail for Master Admin |
| Update/delete member | Org admins only; no is_platform_admin | **Broken for Master Admin** |
| Add Tenant (Tenants page) | May touch organization_members or trigger; recursion in RLS | **Broken** (infinite recursion) |

### 3.3 Subscription / pricing (prioritized)

| Component | Status | Notes |
|-----------|--------|-------|
| Master Admin – Plans (create/edit/delete) | Broken (permission denied) | subscription_plans RLS/GRANT |
| Master Admin – Subscriptions tab | Depends on migration | customer_subscriptions has is_platform_admin |
| Master Admin – Modules tab | 0 of 0 modules | platform_modules empty or not seeded |
| Org Subscriptions page (`/subscriptions`) | Depends on migration | UI + guard OK; data access via RLS |
| Checkout / onboarding | Working | Separate flow |

---

## 4. Security and performance notes

- **Rate limiting (Invite):** Supabase auth rate limit ("request this after 45 seconds") — expected; improves security.
- **RLS recursion (organization_members):** Infinite recursion on INSERT/trigger is a **security/performance bug**; must be fixed so policies/triggers do not re-enter the same relation in a way that causes recursion.
- **Master Admin scope:** Granting platform admin full CRUD on org-scoped tables bypasses tenant isolation; MFA, audit, and access reviews recommended (see `MASTER_ADMIN_FULL_ACCESS.md`).
- **Tables still using only `has_role('super_admin')`:** Several older migrations use `has_role(auth.uid(), 'super_admin')` and do not include `is_platform_admin(auth.uid())`. Master Admin will be denied on those unless new policies or migration updates add `is_platform_admin`. Tables explicitly given "Platform admins …" in `20260315200000` are covered.

---

## 5. Prioritized list (Master Admin + Subscription/Pricing)

**Critical (Master Admin cannot complete platform admin tasks)**

1. **subscription_plans** — Master Admin cannot create/edit/delete plans (permission denied).  
   - Verify migration `20260315200000` applied; add GRANT if needed; ensure no other policy blocks.

2. **email_domains** — Master Admin cannot add/update/delete email domains (permission denied).  
   - Add RLS policy (or alter existing) to allow `is_platform_admin(auth.uid())` for ALL.

3. **payment_gateway_configs** — Master Admin cannot add gateways (permission denied).  
   - Same as (1): verify migration and GRANTs.

4. **organization_members INSERT/UPDATE/DELETE** — Master Admin cannot add/update/remove org members.  
   - Add INSERT/UPDATE/DELETE policies that allow `public.is_platform_admin(auth.uid())` **without** requiring EXISTS in organization_members (to avoid recursion).

5. **organization_members infinite recursion** — Add Tenant (or any flow that inserts into org_members) triggers "infinite recursion detected in policy for relation 'organization_members'".  
   - Fix policy and/or trigger so that checking permission does not re-query organization_members in a recursive way; prefer is_platform_admin for platform admins.

**High (Subscription/Pricing module)**

6. **platform_modules** — "0 of 0 modules active" in Master Admin Modules tab.  
   - Ensure seed migration `20260308214312` (or equivalent) has been run so `platform_modules` has rows; ensure RLS allows is_platform_admin for SELECT/UPDATE.

7. **customer_subscriptions / plan_modules / subscription_modules** — Confirm Master Admin can manage subscriptions and plan-module links after migration.

**Medium (UX / security hardening)**

8. Invite by Email rate limit — Document 45s limit for users; consider optional backend throttle to avoid hitting Supabase limit.  
9. Audit remaining tables that still use only `has_role('super_admin')` and add `is_platform_admin` where Master Admin should have access.

---

## 6. Summary

- **Full module list:** All modules and sub-modules are listed in §1 (routes + Sidebar).
- **Working:** Most app modules are working for org users and, where "Platform admins" RLS exists and migrations are applied, for Master Admin (organizations, properties, tenants, leases, invoices, payments, etc.).
- **Broken for Master Admin:** subscription_plans (create plan), payment_gateway_configs (add gateway), email_domains (add domain), organization_members (add/update/delete members); Add Tenant triggers infinite recursion on organization_members.
- **Partially working:** Invite by Email (rate limit); Modules tab (0 of 0 if platform_modules empty or not seeded).
- **Prioritized:** Master Admin issues (1–5) and Subscription/Pricing (6–7) are ordered in §5 for remediation.

**Fix applied (2026-03-16):** Migration `20260316000000_master_admin_full_access_fix.sql` addresses items 1–6: organization_members (platform admin CRUD + `is_org_admin` helper to avoid recursion), role_permissions, subscription_plans, usage_limits, email_domains, payment_gateway_configs, and profiles (platform admins can view all). See also `docs/AUTH_FLOW_MASTER_ADMIN.md` for login → role → guard → module access trace.
