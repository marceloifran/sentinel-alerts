-- Migration: Verify and Fix User Data Isolation
-- Description: Ensures RLS is working correctly and provides cleanup utilities

-- ============================================================================
-- 1. VERIFY RLS IS ENABLED
-- ============================================================================

-- Ensure RLS is enabled on all tables
ALTER TABLE public.obligations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obligation_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obligation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. VERIFY CURRENT POLICIES
-- ============================================================================

-- Check if isolation policy exists, if not create it
DO $$
BEGIN
  -- Drop old policies if they exist
  DROP POLICY IF EXISTS "Users can only view their own created obligations" ON public.obligations;
  DROP POLICY IF EXISTS "Users can update their own obligations" ON public.obligations;
  DROP POLICY IF EXISTS "Users can delete their own obligations" ON public.obligations;
  DROP POLICY IF EXISTS "Users can create obligations" ON public.obligations;
  
  -- Recreate policies with proper isolation
  CREATE POLICY "Users can only view their own created obligations"
    ON public.obligations FOR SELECT
    TO authenticated
    USING (created_by = auth.uid());
  
  CREATE POLICY "Users can update their own obligations"
    ON public.obligations FOR UPDATE
    TO authenticated
    USING (created_by = auth.uid());
  
  CREATE POLICY "Users can delete their own obligations"
    ON public.obligations FOR DELETE
    TO authenticated
    USING (created_by = auth.uid());
  
  CREATE POLICY "Users can create obligations"
    ON public.obligations FOR INSERT
    TO authenticated
    WITH CHECK (created_by = auth.uid());
END $$;

-- ============================================================================
-- 3. UTILITY FUNCTION: Check User Data
-- ============================================================================

-- Function to check if user has any data
CREATE OR REPLACE FUNCTION public.check_user_data(_user_id UUID DEFAULT auth.uid())
RETURNS TABLE (
  has_profile BOOLEAN,
  has_obligations BOOLEAN,
  obligation_count INTEGER,
  profile_sector TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_has_profile BOOLEAN;
  v_has_obligations BOOLEAN;
  v_obligation_count INTEGER;
  v_profile_sector TEXT;
BEGIN
  -- Check profile
  SELECT EXISTS(SELECT 1 FROM profiles WHERE id = _user_id) INTO v_has_profile;
  
  -- Get sector
  SELECT sector INTO v_profile_sector FROM profiles WHERE id = _user_id;
  
  -- Check obligations
  SELECT COUNT(*) INTO v_obligation_count FROM obligations WHERE created_by = _user_id;
  v_has_obligations := v_obligation_count > 0;
  
  RETURN QUERY SELECT v_has_profile, v_has_obligations, v_obligation_count, v_profile_sector;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_user_data(UUID) TO authenticated;

-- ============================================================================
-- 4. UTILITY FUNCTION: Clean User Data (for testing)
-- ============================================================================

-- Function to clean all user data (use with caution!)
CREATE OR REPLACE FUNCTION public.clean_my_data()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete user's obligations (cascade will handle related data)
  DELETE FROM obligations WHERE created_by = auth.uid();
  
  -- Delete user's template interactions
  DELETE FROM user_template_interactions WHERE user_id = auth.uid();
  
  -- Delete user's compliance scores
  DELETE FROM compliance_scores WHERE user_id = auth.uid();
  
  -- Reset onboarding
  UPDATE profiles 
  SET onboarding_completed = false,
      onboarding_step = 0,
      suggested_templates_shown = false
  WHERE id = auth.uid();
END;
$$;

GRANT EXECUTE ON FUNCTION public.clean_my_data() TO authenticated;

-- ============================================================================
-- 5. COMMENTS
-- ============================================================================

COMMENT ON FUNCTION public.check_user_data(UUID) IS 'Check if user has profile and obligations data';
COMMENT ON FUNCTION public.clean_my_data() IS 'Clean all data for current user (for testing purposes)';
