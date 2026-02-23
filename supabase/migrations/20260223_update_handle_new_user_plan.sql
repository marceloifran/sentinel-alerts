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
  -- Get plan from metadata or default to professional
  selected_plan := COALESCE(NEW.raw_user_meta_data->>'plan', 'professional')::public.user_plan;

  INSERT INTO public.profiles (
    id, 
    email, 
    name, 
    phone, 
    sector, 
    plan,
    max_obligations,
    max_users
  )
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'sector',
    selected_plan,
    CASE 
      WHEN selected_plan = 'professional' THEN 25
      WHEN selected_plan = 'enterprise' THEN -1
      ELSE 25
    END,
    CASE 
      WHEN selected_plan = 'professional' THEN 10
      WHEN selected_plan = 'enterprise' THEN -1
      ELSE 10
    END
  );
  
  -- All new users get admin role by default
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  
  RETURN NEW;
END;
$function$;
