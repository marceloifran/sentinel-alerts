-- Set admin as default role for all new users
-- This migration updates the handle_new_user function to assign admin role to all new users

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, name, phone, sector)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'sector'
  );
  
  -- All new users get admin role by default
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  
  RETURN NEW;
END;
$function$;
