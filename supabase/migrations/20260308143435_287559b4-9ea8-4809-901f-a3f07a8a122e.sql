
-- Complaints table
CREATE TABLE public.complaints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL,
  category TEXT NOT NULL DEFAULT 'general',
  subject TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  priority TEXT NOT NULL DEFAULT 'medium',
  assigned_to UUID,
  resolution TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  resolved_at TIMESTAMPTZ,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view complaints" ON public.complaints FOR SELECT
  USING ((EXISTS (SELECT 1 FROM organization_members WHERE organization_members.organization_id = complaints.organization_id AND organization_members.user_id = auth.uid())) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Org members can insert complaints" ON public.complaints FOR INSERT
  WITH CHECK ((EXISTS (SELECT 1 FROM organization_members WHERE organization_members.organization_id = complaints.organization_id AND organization_members.user_id = auth.uid())) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Managers can update complaints" ON public.complaints FOR UPDATE
  USING ((EXISTS (SELECT 1 FROM organization_members WHERE organization_members.organization_id = complaints.organization_id AND organization_members.user_id = auth.uid() AND organization_members.role = ANY(ARRAY['organization_admin'::app_role, 'property_owner'::app_role, 'property_manager'::app_role, 'staff'::app_role]))) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Admins can delete complaints" ON public.complaints FOR DELETE
  USING ((EXISTS (SELECT 1 FROM organization_members WHERE organization_members.organization_id = complaints.organization_id AND organization_members.user_id = auth.uid() AND organization_members.role = ANY(ARRAY['organization_admin'::app_role, 'property_owner'::app_role]))) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Notices table
CREATE TABLE public.notices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  notice_type TEXT NOT NULL DEFAULT 'general',
  recipient_type TEXT NOT NULL DEFAULT 'all',
  recipient_ids UUID[] DEFAULT '{}',
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view notices" ON public.notices FOR SELECT
  USING ((EXISTS (SELECT 1 FROM organization_members WHERE organization_members.organization_id = notices.organization_id AND organization_members.user_id = auth.uid())) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Managers can insert notices" ON public.notices FOR INSERT
  WITH CHECK ((EXISTS (SELECT 1 FROM organization_members WHERE organization_members.organization_id = notices.organization_id AND organization_members.user_id = auth.uid() AND organization_members.role = ANY(ARRAY['organization_admin'::app_role, 'property_owner'::app_role, 'property_manager'::app_role, 'staff'::app_role]))) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Managers can update notices" ON public.notices FOR UPDATE
  USING ((EXISTS (SELECT 1 FROM organization_members WHERE organization_members.organization_id = notices.organization_id AND organization_members.user_id = auth.uid() AND organization_members.role = ANY(ARRAY['organization_admin'::app_role, 'property_owner'::app_role, 'property_manager'::app_role, 'staff'::app_role]))) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Admins can delete notices" ON public.notices FOR DELETE
  USING ((EXISTS (SELECT 1 FROM organization_members WHERE organization_members.organization_id = notices.organization_id AND organization_members.user_id = auth.uid() AND organization_members.role = ANY(ARRAY['organization_admin'::app_role, 'property_owner'::app_role]))) OR has_role(auth.uid(), 'super_admin'::app_role));
