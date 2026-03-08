
-- Fix platform_modules: add all sidebar slugs
INSERT INTO platform_modules (slug, name, description, category)
VALUES
  ('dashboard', 'Dashboard', 'Main dashboard', 'core'),
  ('organizations', 'Organizations', 'Organization management', 'core'),
  ('properties', 'Properties', 'Property management', 'property'),
  ('buildings', 'Buildings', 'Building management', 'property'),
  ('floors', 'Floors', 'Floor management', 'property'),
  ('units', 'Units', 'Unit management', 'property'),
  ('rooms', 'Rooms', 'Room management', 'property'),
  ('bed-spaces', 'Bed Spaces', 'Bed space management', 'property'),
  ('tenants', 'Tenants', 'Tenant management', 'tenants'),
  ('leases', 'Leases', 'Lease management', 'tenants'),
  ('ejari', 'Ejari', 'Ejari contract management', 'tenants'),
  ('rent-management', 'Rent Management', 'Rent tracking', 'finance'),
  ('invoices', 'Invoices', 'Invoice management', 'finance'),
  ('payments', 'Payments', 'Payment tracking', 'finance'),
  ('cheque-tracking', 'Cheque Tracking', 'Cheque management', 'finance'),
  ('maintenance', 'Maintenance', 'Maintenance requests', 'operations'),
  ('amenities', 'Amenities', 'Amenity management', 'operations'),
  ('utilities', 'Utilities', 'Utility tracking', 'operations'),
  ('documents', 'Documents', 'Document management', 'operations'),
  ('uae-management', 'UAE Management', 'UAE-specific management', 'operations'),
  ('messaging', 'Messaging', 'Internal messaging', 'communication'),
  ('notifications', 'Notifications', 'Notification center', 'communication'),
  ('complaints', 'Complaints', 'Complaint management', 'communication'),
  ('notices', 'Notices', 'Notice board', 'communication'),
  ('reports', 'Reports', 'Report generation', 'intelligence'),
  ('analytics', 'Analytics', 'Analytics dashboard', 'intelligence'),
  ('ai-insights', 'AI Insights', 'AI-powered insights', 'intelligence'),
  ('automation', 'Automation', 'Workflow automation', 'intelligence'),
  ('owner-portal', 'Owner Portal', 'Property owner portal', 'portals'),
  ('tenant-portal', 'Tenant Portal', 'Tenant self-service portal', 'portals'),
  ('public-booking', 'Public Booking', 'Public booking portal', 'portals'),
  ('erp-integrations', 'ERP Integrations', 'ERP connections', 'integrations'),
  ('support', 'Support Center', 'Support system', 'integrations'),
  ('subscriptions', 'Subscription Plans', 'Plan management', 'system'),
  ('master-admin', 'Master Admin', 'Platform administration', 'system'),
  ('user-management', 'User Management', 'User and role management', 'system'),
  ('settings', 'Settings', 'System settings', 'system')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, category = EXCLUDED.category;

-- Add missing role permissions for property_owner
INSERT INTO role_permissions (role, module_slug, can_create, can_read, can_update, can_delete, can_approve, can_export, can_manage)
SELECT 'property_owner'::app_role, module_slug, can_create, can_read, can_update, can_delete, can_approve, can_export, false
FROM role_permissions
WHERE role = 'organization_admin' AND module_slug NOT IN ('master-admin')
ON CONFLICT (role, module_slug) DO NOTHING;

-- Add missing role permissions for staff
INSERT INTO role_permissions (role, module_slug, can_create, can_read, can_update, can_delete, can_approve, can_export, can_manage)
VALUES
  ('staff', 'dashboard', false, true, false, false, false, false, false),
  ('staff', 'properties', false, true, false, false, false, false, false),
  ('staff', 'buildings', false, true, false, false, false, false, false),
  ('staff', 'floors', false, true, false, false, false, false, false),
  ('staff', 'units', false, true, false, false, false, false, false),
  ('staff', 'rooms', false, true, false, false, false, false, false),
  ('staff', 'bed-spaces', false, true, false, false, false, false, false),
  ('staff', 'tenants', true, true, true, false, false, false, false),
  ('staff', 'leases', false, true, false, false, false, false, false),
  ('staff', 'invoices', false, true, false, false, false, false, false),
  ('staff', 'payments', false, true, false, false, false, false, false),
  ('staff', 'maintenance', true, true, true, false, false, false, false),
  ('staff', 'complaints', true, true, true, false, false, false, false),
  ('staff', 'documents', true, true, true, false, false, false, false),
  ('staff', 'messaging', true, true, true, false, false, false, false),
  ('staff', 'notifications', false, true, false, false, false, false, false),
  ('staff', 'notices', false, true, false, false, false, false, false),
  ('staff', 'settings', false, true, false, false, false, false, false)
ON CONFLICT (role, module_slug) DO NOTHING;

-- Link platform_modules to plan_modules for Professional & Enterprise (all modules)
INSERT INTO plan_modules (plan_id, module_id, is_included)
SELECT sp.id, pm.id, true
FROM subscription_plans sp
CROSS JOIN platform_modules pm
WHERE sp.id IN ('6dd8897d-6cef-46f9-9e5b-b2de8c56f66d', '42f8b824-3259-45b1-89f0-ab4975bee2e0')
ON CONFLICT DO NOTHING;

-- For Starter plan - core modules only
INSERT INTO plan_modules (plan_id, module_id, is_included)
SELECT sp.id, pm.id, true
FROM subscription_plans sp
CROSS JOIN platform_modules pm
WHERE sp.id = 'e7a8771c-1783-47cb-928e-2e528957a887'
  AND pm.category IN ('core', 'property', 'tenants', 'finance', 'operations', 'communication', 'system')
ON CONFLICT DO NOTHING;

-- For Free Trial - same as Professional
INSERT INTO plan_modules (plan_id, module_id, is_included)
SELECT sp.id, pm.id, true
FROM subscription_plans sp
CROSS JOIN platform_modules pm
WHERE sp.id = 'e71c2052-582f-41fb-a255-a28903e1a9e0'
ON CONFLICT DO NOTHING;
