-- Add Mercado Pago subscription tracking columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS mp_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS mp_preapproval_plan_id TEXT,
  ADD COLUMN IF NOT EXISTS plan_activated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ;

-- Index for fast lookup by MP subscription ID
CREATE INDEX IF NOT EXISTS idx_profiles_mp_subscription_id
  ON public.profiles(mp_subscription_id);

-- Index for fast lookup by email (used by webhook)
CREATE INDEX IF NOT EXISTS idx_profiles_email
  ON public.profiles(email);

COMMENT ON COLUMN public.profiles.mp_subscription_id IS 'Mercado Pago preapproval/subscription ID';
COMMENT ON COLUMN public.profiles.mp_preapproval_plan_id IS 'MP plan template ID (starter/pro/estudio)';
COMMENT ON COLUMN public.profiles.plan_activated_at IS 'When the paid plan was activated';
COMMENT ON COLUMN public.profiles.plan_expires_at IS 'When the plan expires (null = active indefinitely)';
