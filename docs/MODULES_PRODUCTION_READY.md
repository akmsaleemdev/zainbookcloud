# Modules Production-Ready Summary

This document summarizes changes made to make every visible module fully functional: Supabase-connected, full CRUD where applicable, RLS for Master Admin, no mock data, and fixed forms/tables.

---

## SQL / RLS (Migrations)

### 20260317000000_platform_admin_remaining_tables.sql (new)
Adds `is_platform_admin(auth.uid())` policies for Master Admin on:

- **Property/tenant related:** `property_images`, `tenant_family_members`, `cheque_tracking`, `leads`, `rent_schedules`
- **Utilities:** `utility_meters`, `utility_readings`
- **Billing:** `billing_history`
- **HR:** `employees`, `employee_documents`, `attendance_logs`, `leave_requests`, `leave_balances`, `payroll_runs`, `payroll_items`
- **UAE / operations:** `parking_spaces`, `visitor_logs`, `access_cards`, `building_inspections`, `service_charges`
- **Accounting:** `chart_of_accounts`, `expenses`, `bank_transactions`, `vat_records`

Run after `20260316000000_master_admin_full_access_fix.sql`.

---

## Frontend (Pages) – Changes

### Floors
- **Fix:** Buildings and units now loaded via two-step query (properties by org → buildings by property_id → units by building_id). Removes reliance on cross-relation filters that may not work in all PostgREST versions.

### Accounting
- **Before:** Static UI with hardcoded AED values and no layout.
- **After:** Wrapped in `AppLayout`; connected to Supabase: `payments`, `invoices`, `expenses`, `chart_of_accounts`. Stats (Total Revenue, Total Expenses, Net Profit, VAT) are computed from real data. Chart of Accounts tab shows DB accounts or empty state. Journals and VAT tabs keep placeholders for future wiring.

### AI Insights
- **Before:** Tenant risk score used random values (“fake risk score”).
- **After:** Risk score is derived from real data: overdue/pending invoices per tenant, lease end date (expiring soon or expired). No random factor; sort order remains by score.

### WorkflowBuilder (Automation)
- **Change:** Removed “Simplified for UI mockup” comment. Workflows remain in local state until a `workflows` (or similar) table exists and is wired.

### HR Dashboard
- **Before:** Static cards (e.g. 142 employees, 8 pending leaves, AED 452K) and mock “Recent Hires” list; no AppLayout.
- **After:** Wrapped in `AppLayout`; connected to Supabase: `employees` (count + recent list), `leave_requests` (pending count), `payroll_runs` (last payroll total). “Expiring Documents” left as placeholder until employee docs/visa fields are used. “Recent Hires” shows real employees with name, job title, and “X ago”.

---

## Module Status Overview

| Module / Page        | Supabase | CRUD / Data        | RLS (Platform Admin) | Notes |
|----------------------|----------|--------------------|----------------------|--------|
| Dashboard            | ✅       | Read               | ✅ (via org tables)  | Redirects Master Admin to master-admin. |
| Organizations        | ✅       | Full               | ✅                   | |
| Properties           | ✅       | Full + images      | ✅                   | |
| Buildings            | ✅       | Full               | ✅                   | |
| Floors               | ✅       | Read (view)        | ✅                   | Query fixed. |
| Units                | ✅       | Full               | ✅                   | |
| Rooms                | ✅       | Full               | ✅                   | |
| Bed Spaces           | ✅       | Full               | ✅                   | |
| Tenants              | ✅       | Full               | ✅                   | |
| Leases               | ✅       | Full               | ✅                   | |
| Ejari                | ✅       | Full               | ✅                   | |
| Rent Management      | ✅       | rent_schedules     | ✅                   | |
| Invoices             | ✅       | Full               | ✅                   | |
| Payments             | ✅       | Full               | ✅                   | |
| Cheque Tracking      | ✅       | Full               | ✅                   | |
| Accounting           | ✅       | Read COA + stats   | ✅                   | Real revenue/expenses/VAT; COA list. |
| HR Dashboard         | ✅       | Read               | ✅                   | Real counts + recent employees. |
| Employees            | ✅       | Full               | ✅                   | |
| Attendance           | ✅       | Read               | ✅                   | |
| Leave                | ✅       | Full               | ✅                   | |
| Payroll              | ✅       | Full               | ✅                   | |
| Maintenance          | ✅       | Full               | ✅                   | |
| Amenities            | ✅       | Full               | ✅                   | |
| Utilities            | ✅       | Full               | ✅                   | |
| Documents            | ✅       | Full               | ✅                   | |
| UAE Management       | ✅       | Full               | ✅                   | |
| Messaging            | ✅       | Full               | ✅                   | |
| Notifications        | ✅       | Read/update        | ✅                   | |
| Complaints           | ✅       | Full               | ✅                   | |
| Notices              | ✅       | Full               | ✅                   | |
| Reports              | ✅       | Read + PDF         | ✅                   | |
| Analytics            | ✅       | Read               | ✅                   | |
| AI Insights          | ✅       | Read + risk logic  | ✅                   | Risk from real data. |
| Automation            | ✅       | Local state        | —                    | No DB table yet. |
| Owner Portal          | ✅       | Read               | ✅                   | |
| Tenant Portal        | ✅       | Read/insert        | ✅                   | |
| Public Booking       | ✅       | leads              | ✅                   | |
| ERP Integrations     | ✅       | Full               | ✅                   | |
| Support Center       | ✅       | tickets + chat     | ✅                   | |
| Subscriptions        | ✅       | Full               | ✅                   | |
| Master Admin         | ✅       | Full               | ✅                   | |
| User Management      | ✅       | Full               | ✅                   | |
| Settings             | ✅       | profiles/orgs      | ✅                   | |

---

## Deploy Checklist

1. Run migrations in order:  
   `20260315000000` → `20260315100000` → `20260315200000` → `20260316000000` → **`20260317000000`**.
2. Ensure Master Admin has `user_roles.master_admin` and, if needed, `VITE_MASTER_ADMIN_EMAIL` in production.
3. Deploy frontend (Floors, Accounting, AI Insights, HR Dashboard, WorkflowBuilder text change).

---

## Optional Next Steps (not required for “fully functional”)

- **Accounting:** Journal entry form and persistence to `journal_entries` (or equivalent) if the table exists; VAT tab wired to `vat_records`.
- **Automation:** Backend table for workflows and API so workflows persist and can be run by a worker.
- **HR Dashboard:** “Expiring Documents” count from employee documents / visa/Emirates ID expiry when schema supports it.
