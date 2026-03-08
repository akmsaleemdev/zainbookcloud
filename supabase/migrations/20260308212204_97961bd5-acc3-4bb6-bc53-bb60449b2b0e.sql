
CREATE OR REPLACE FUNCTION public.onboard_organization(
  _user_id uuid,
  _org_name text,
  _org_name_ar text DEFAULT NULL,
  _emirate text DEFAULT 'Dubai',
  _org_email text DEFAULT NULL,
  _org_phone text DEFAULT NULL,
  _plan_id uuid DEFAULT NULL,
  _billing_cycle text DEFAULT 'monthly'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id uuid;
  v_sub_id uuid;
  v_plan record;
  v_total_amount numeric;
  v_is_trial boolean;
BEGIN
  -- Verify user exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = _user_id) THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Check user doesn't already have an org
  IF EXISTS (SELECT 1 FROM organization_members WHERE user_id = _user_id) THEN
    RAISE EXCEPTION 'User already belongs to an organization';
  END IF;

  -- Get plan details
  IF _plan_id IS NOT NULL THEN
    SELECT * INTO v_plan FROM subscription_plans WHERE id = _plan_id AND is_active = true;
    IF v_plan IS NULL THEN
      RAISE EXCEPTION 'Plan not found or inactive';
    END IF;
  END IF;

  -- 1. Create organization
  INSERT INTO organizations (name, name_ar, emirate, email, phone, created_by, country, currency, timezone)
  VALUES (_org_name, _org_name_ar, _emirate, _org_email, _org_phone, _user_id, 'UAE', 'AED', 'Asia/Dubai')
  RETURNING id INTO v_org_id;

  -- 2. Add user as organization_admin
  INSERT INTO organization_members (user_id, organization_id, role, is_active)
  VALUES (_user_id, v_org_id, 'organization_admin', true);

  -- 3. Create subscription if plan selected
  IF v_plan IS NOT NULL THEN
    v_is_trial := v_plan.plan_type = 'trial';
    v_total_amount := CASE WHEN _billing_cycle = 'yearly' THEN v_plan.price * 10 ELSE v_plan.price END;

    INSERT INTO customer_subscriptions (
      organization_id, plan_id, billing_cycle, total_amount, status,
      trial_ends_at, next_billing_date
    ) VALUES (
      v_org_id, _plan_id, _billing_cycle, v_total_amount,
      CASE WHEN v_is_trial THEN 'trialing' ELSE 'active' END,
      CASE WHEN v_is_trial THEN now() + ((COALESCE(v_plan.trial_days, 14))::text || ' days')::interval ELSE NULL END,
      (now() + CASE WHEN _billing_cycle = 'yearly' THEN interval '365 days' ELSE interval '30 days' END)::date
    )
    RETURNING id INTO v_sub_id;

    -- 4. Enable plan modules
    INSERT INTO subscription_modules (subscription_id, module_id, is_enabled, enabled_at)
    SELECT v_sub_id, pm.module_id, true, now()
    FROM plan_modules pm
    WHERE pm.plan_id = _plan_id AND pm.is_included = true
    ON CONFLICT (subscription_id, module_id) DO NOTHING;

    -- 5. Log billing history
    INSERT INTO billing_history (
      organization_id, action, plan_name, amount, billing_cycle,
      description, invoice_number, status, subscription_id
    ) VALUES (
      v_org_id, 'new_subscription', v_plan.name, v_total_amount, _billing_cycle,
      'Subscribed to ' || v_plan.name || ' plan',
      'INV-' || upper(to_hex(extract(epoch from now())::int)),
      CASE WHEN v_plan.price = 0 THEN 'trial' ELSE 'completed' END,
      v_sub_id
    );
  END IF;

  RETURN jsonb_build_object(
    'organization_id', v_org_id,
    'subscription_id', v_sub_id,
    'success', true
  );
END;
$$;
