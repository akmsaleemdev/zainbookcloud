
-- Payment gateway configurations table for Master Admin
CREATE TABLE public.payment_gateway_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  display_name text NOT NULL,
  api_key text,
  secret_key text,
  merchant_id text,
  access_token text,
  extra_config jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT false,
  is_test_mode boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_gateway_configs ENABLE ROW LEVEL SECURITY;

-- Only super_admin can manage payment gateways
CREATE POLICY "Super admins manage payment gateways"
  ON public.payment_gateway_configs FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Add missing subscription control columns to subscription_plans
ALTER TABLE public.subscription_plans 
  ADD COLUMN IF NOT EXISTS max_properties integer DEFAULT 10,
  ADD COLUMN IF NOT EXISTS max_tenants integer DEFAULT 50,
  ADD COLUMN IF NOT EXISTS report_access boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS ai_features_access boolean DEFAULT true;
