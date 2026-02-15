-- REVERT: Restore original RLS policies for obligations
-- This migration reverts the strict isolation and restores the original admin/responsible model

-- Drop the strict isolation policies
DROP POLICY IF EXISTS "Users can only view their own created obligations" ON public.obligations;
DROP POLICY IF EXISTS "Users can update their own obligations" ON public.obligations;
DROP POLICY IF EXISTS "Users can delete their own obligations" ON public.obligations;
DROP POLICY IF EXISTS "Users can create obligations" ON public.obligations;

-- Restore original policies: Admins can view all, responsibles can view assigned

-- Admins can view all obligations
CREATE POLICY "Admins can view all obligations"
  ON public.obligations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Responsables can view obligations assigned to them
CREATE POLICY "Responsables can view assigned obligations"
  ON public.obligations FOR SELECT
  TO authenticated
  USING (responsible_id = auth.uid());

-- Admins can create obligations
CREATE POLICY "Admins can create obligations"
  ON public.obligations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Admins can update all obligations
CREATE POLICY "Admins can update all obligations"
  ON public.obligations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Responsables can update their assigned obligations
CREATE POLICY "Responsables can update assigned obligations"
  ON public.obligations FOR UPDATE
  TO authenticated
  USING (responsible_id = auth.uid());

-- Admins can delete obligations
CREATE POLICY "Admins can delete obligations"
  ON public.obligations FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );
