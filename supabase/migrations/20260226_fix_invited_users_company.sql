-- Ensure invited users always join the inviter's company
-- and backfill existing users / obligations to the correct company.

-- 1) Final version of handle_new_user with company-centric behaviour
--    (combines plan limits + invitation / company_id logic).
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_company_id UUID;
  v_company_name TEXT;
  v_selected_plan public.user_plan;
  v_invited_by UUID;
  v_invited_company_id UUID;
BEGIN
  -- Check if there is a pending invitation for this email
  SELECT invited_by INTO v_invited_by FROM public.user_invitations 
  WHERE invited_email = NEW.email AND status = 'pending' 
  ORDER BY created_at DESC LIMIT 1;

  -- Get plan from metadata or default to professional
  v_selected_plan := COALESCE(NEW.raw_user_meta_data->>'plan', 'professional')::public.user_plan;

  IF v_invited_by IS NOT NULL THEN
    -- Join existing company from inviter profile
    SELECT company_id INTO v_invited_company_id FROM public.profiles WHERE id = v_invited_by;
    v_company_id := v_invited_company_id;

    -- Mark invitation as accepted
    UPDATE public.user_invitations 
    SET invited_user_id = NEW.id,
        status = 'accepted',
        accepted_at = now()
    WHERE invited_email = NEW.email 
      AND invited_by = v_invited_by 
      AND status = 'pending';
  ELSE
    -- Create new company for first user (no invitation)
    v_company_name := COALESCE(NEW.raw_user_meta_data->>'company_name', split_part(NEW.email, '@', 1) || ' Co.');

    INSERT INTO public.companies (name, plan) 
    VALUES (v_company_name, v_selected_plan)
    RETURNING id INTO v_company_id;
  END IF;

  -- Insert profile bound to company
  INSERT INTO public.profiles (
    id, 
    email, 
    name, 
    phone, 
    sector, 
    plan,
    company_id,
    max_obligations,
    max_users
  )
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'sector',
    COALESCE(v_selected_plan, 'professional'),
    v_company_id,
    CASE 
      WHEN v_selected_plan = 'professional' THEN 25
      WHEN v_selected_plan = 'enterprise' THEN -1
      ELSE 25
    END,
    CASE 
      WHEN v_selected_plan = 'professional' THEN 10
      WHEN v_selected_plan = 'enterprise' THEN -1
      ELSE 10
    END
  );
  
  -- Role assignment
  IF v_invited_by IS NOT NULL THEN
    -- Invited users become operativos by default
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'operativo');
  ELSE
    -- Original creator is owner
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'owner');
  END IF;
  
  RETURN NEW;
END;
$function$;


-- 2) Backfill company_id for existing invited users whose profiles are missing it.
UPDATE public.profiles p
SET company_id = inviter.company_id
FROM public.user_invitations ui
JOIN public.profiles inviter ON inviter.id = ui.invited_by
WHERE p.email = ui.invited_email
  AND p.company_id IS NULL
  AND inviter.company_id IS NOT NULL
  AND ui.status IN ('pending', 'accepted');


-- 3) Backfill company_id on obligations created by users that already have a company.
UPDATE public.obligations o
SET company_id = pr.company_id
FROM public.profiles pr
WHERE o.company_id IS NULL
  AND o.created_by = pr.id
  AND pr.company_id IS NOT NULL;

