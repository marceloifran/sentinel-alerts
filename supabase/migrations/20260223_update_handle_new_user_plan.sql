-- Update handle_new_user to take plan from metadata and assign limits
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
 AS $function$
DECLARE
  selected_plan public.user_plan;
BEGIN
  -- Get plan from metadata or default to starter
  selected_plan := COALESCE(NEW.raw_user_meta_data->>'plan', 'starter')::public.user_plan;

  INSERT INTO public.profiles (
    id, 
    email, 
    name, 
    phone, 
    plan,
    max_obligations,
    max_users,
    plan_expires_at
  )
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'phone',
    selected_plan,
    CASE 
      WHEN selected_plan = 'starter' THEN 3
      WHEN selected_plan = 'professional' THEN 10
      WHEN selected_plan = 'enterprise' THEN -1
      ELSE 3
    END,
    CASE 
      WHEN selected_plan = 'starter' THEN 1
      WHEN selected_plan = 'professional' THEN 5
      WHEN selected_plan = 'enterprise' THEN -1
      ELSE 1
    END,
    CASE
      WHEN selected_plan = 'starter' THEN NOW() + INTERVAL '30 days'
      ELSE NULL
    END
  );
  
  -- All new users get admin role by default
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  
  RETURN NEW;
END;
$function$;
