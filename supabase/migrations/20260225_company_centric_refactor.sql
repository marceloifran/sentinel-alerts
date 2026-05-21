-- Migration: Company-Centric Refactor
-- Description: Groups users and obligations under companies for multi-tenancy.

-- 1. Update app_role enum
-- We can't easily update enums in Supabase/Postgres if they are used, 
-- but we can add new values or create a new type.
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'owner';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'operativo';
-- We will migrate 'admin' -> 'admin' (or owner) and 'responsable' -> 'operativo' later.

-- 2. Create companies table
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  cuit TEXT,
  plan public.user_plan NOT NULL DEFAULT 'professional',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on companies
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- 3. Add company_id and criticality to profiles and obligations
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;
ALTER TABLE public.obligations ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.obligations ADD COLUMN IF NOT EXISTS criticality public.compliance_level DEFAULT 'media'::public.compliance_level; -- Assuming compliance_level exists or creating it
ALTER TABLE public.user_invitations ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

-- If compliance_level doesn't exist as a type, we should create it.
-- Based on complianceScoreService.ts it should be baja, media, alta.
DO $$ BEGIN
    CREATE TYPE public.compliance_level AS ENUM ('baja', 'media', 'alta');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 4. Fix RLS for companies
CREATE POLICY "Users within company can view company info"
  ON public.companies FOR SELECT
  TO authenticated
  USING (
    id IN (SELECT company_id FROM public.profiles WHERE profiles.id = auth.uid())
  );

CREATE POLICY "Owners can update company info"
  ON public.companies FOR UPDATE
  TO authenticated
  USING (
    id IN (
        SELECT company_id FROM public.profiles p
        JOIN public.user_roles ur ON ur.user_id = p.id
        WHERE p.id = auth.uid() AND ur.role = 'owner'
    )
  );

-- 5. Update handle_new_user trigger to handle companies
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

  IF v_invited_by IS NOT NULL THEN
    -- Join existing company
    SELECT company_id INTO v_invited_company_id FROM public.profiles WHERE id = v_invited_by;
    
    v_company_id := v_invited_company_id;
    -- Mark invitation as accepted
    UPDATE public.user_invitations SET status = 'accepted', invited_user_id = NEW.id, accepted_at = now() 
    WHERE invited_email = NEW.email AND invited_by = v_invited_by AND status = 'pending';
  ELSE
    -- Create new company
    v_company_name := COALESCE(NEW.raw_user_meta_data->>'company_name', split_part(NEW.email, '@', 1) || ' Co.');
    v_selected_plan := COALESCE(NEW.raw_user_meta_data->>'plan', 'professional')::public.user_plan;
    
    INSERT INTO public.companies (name, plan) 
    VALUES (v_company_name, v_selected_plan)
    RETURNING id INTO v_company_id;
  END IF;

  -- Insert profile
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
    CASE WHEN v_selected_plan = 'enterprise' THEN -1 ELSE 25 END,
    CASE WHEN v_selected_plan = 'enterprise' THEN -1 ELSE 10 END
  );
  
  -- Role assignment
  IF v_invited_by IS NOT NULL THEN
    -- If invited, role can be set in invitation metadata (not implemented yet, default to admin or operativo)
    -- For now, default to 'operativo' if invited
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'operativo');
  ELSE
    -- Original creator is owner
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'owner');
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 6. Re-write Obligations RLS for Company Isolation
DROP POLICY IF EXISTS "Admins can view all obligations" ON public.obligations;
DROP POLICY IF EXISTS "Responsables can view assigned obligations" ON public.obligations;
DROP POLICY IF EXISTS "Admins can create obligations" ON public.obligations;
DROP POLICY IF EXISTS "Admins can update all obligations" ON public.obligations;
DROP POLICY IF EXISTS "Responsables can update assigned obligations" ON public.obligations;
DROP POLICY IF EXISTS "Admins can delete obligations" ON public.obligations;

CREATE POLICY "Users can view company obligations"
  ON public.obligations FOR SELECT
  TO authenticated
  USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Owners and Admins can create obligations"
  ON public.obligations FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Owners and Admins can update any company obligation"
  ON public.obligations FOR UPDATE
  TO authenticated
  USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Operativos can update assigned obligations"
  ON public.obligations FOR UPDATE
  TO authenticated
  USING (
    responsible_id = auth.uid()
    AND company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Owners can delete company obligations"
  ON public.obligations FOR DELETE
  TO authenticated
  USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );
