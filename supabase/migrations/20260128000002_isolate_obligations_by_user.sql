-- Isolate obligations by user - users can only see their own created obligations
-- This migration updates RLS policies to ensure proper data isolation

-- Drop existing policies that allow viewing other users' obligations
DROP POLICY IF EXISTS "Admins can view all obligations" ON public.obligations;
DROP POLICY IF EXISTS "Responsables can view assigned obligations" ON public.obligations;

-- Create new policy: users can only view obligations they created
CREATE POLICY "Users can only view their own created obligations"
  ON public.obligations FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

-- Update other policies to maintain consistency
-- Users can still update their own obligations
DROP POLICY IF EXISTS "Admins can update all obligations" ON public.obligations;
DROP POLICY IF EXISTS "Responsables can update assigned obligations" ON public.obligations;

CREATE POLICY "Users can update their own obligations"
  ON public.obligations FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid());

-- Users can delete their own obligations
DROP POLICY IF EXISTS "Admins can delete obligations" ON public.obligations;

CREATE POLICY "Users can delete their own obligations"
  ON public.obligations FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- Users can create obligations (no change needed, but keeping for clarity)
DROP POLICY IF EXISTS "Admins can create obligations" ON public.obligations;

CREATE POLICY "Users can create obligations"
  ON public.obligations FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());
