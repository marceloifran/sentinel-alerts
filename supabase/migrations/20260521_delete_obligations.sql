-- 1. Drop triggers conditionally (only if tables exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'obligations') THEN
    DROP TRIGGER IF EXISTS trigger_recalculate_compliance_score ON public.obligations;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'obligation_history') THEN
    DROP TRIGGER IF EXISTS trigger_recalculate_compliance_score_history ON public.obligation_history;
  END IF;
END $$;

-- 2. Drop functions associated with obligations and compliance score calculations
DROP FUNCTION IF EXISTS public.trigger_recalculate_compliance_score() CASCADE;
DROP FUNCTION IF EXISTS public.calculate_compliance_score(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.get_suggested_templates_for_user(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.accept_template_suggestion(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.reject_template_suggestion(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.get_suggestion_count(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.check_user_data(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.clean_my_data() CASCADE;
DROP FUNCTION IF EXISTS public.check_notification_limit() CASCADE;

-- 3. Drop tables related to obligations
DROP TABLE IF EXISTS public.obligation_files CASCADE;
DROP TABLE IF EXISTS public.obligation_history CASCADE;
DROP TABLE IF EXISTS public.obligation_notifications CASCADE;
DROP TABLE IF EXISTS public.obligations CASCADE;
DROP TABLE IF EXISTS public.obligation_templates CASCADE;
DROP TABLE IF EXISTS public.user_template_interactions CASCADE;
DROP TABLE IF EXISTS public.compliance_scores CASCADE;

-- 4. Update handle_new_user() trigger function to remove references to max_obligations
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
 
   -- Insert profile bound to company (excluding max_obligations)
   INSERT INTO public.profiles (
     id, 
     email, 
     name, 
     phone, 
     sector, 
     plan,
     company_id,
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

-- 5. Drop column max_obligations from public.profiles
ALTER TABLE public.profiles DROP COLUMN IF EXISTS max_obligations;
