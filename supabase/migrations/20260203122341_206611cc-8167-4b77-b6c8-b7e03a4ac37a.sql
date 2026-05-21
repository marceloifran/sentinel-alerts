-- Create subscriptions table to track Mercado Pago subscriptions
CREATE TABLE public.subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mercadopago_subscription_id TEXT,
  mercadopago_preapproval_id TEXT,
  plan public.user_plan NOT NULL DEFAULT 'starter',
  status TEXT NOT NULL DEFAULT 'pending', -- pending, authorized, paused, cancelled, active
  price_monthly INTEGER NOT NULL, -- in ARS cents
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscription
CREATE POLICY "Users can view their own subscription"
ON public.subscriptions
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own subscription
CREATE POLICY "Users can insert their own subscription"
ON public.subscriptions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Service role can update subscriptions (for webhooks)
CREATE POLICY "Service role can update subscriptions"
ON public.subscriptions
FOR UPDATE
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Create function to update user plan when subscription changes
CREATE OR REPLACE FUNCTION public.sync_plan_from_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When subscription becomes active, update user's plan and limits
  IF NEW.status = 'authorized' OR NEW.status = 'active' THEN
    UPDATE public.profiles
    SET 
      plan = NEW.plan,
      max_obligations = CASE 
        WHEN NEW.plan = 'starter' THEN 5
        WHEN NEW.plan = 'professional' THEN 25
        WHEN NEW.plan = 'enterprise' THEN -1    -- unlimited
        ELSE 5
      END,
      max_users = CASE 
        WHEN NEW.plan = 'starter' THEN 1
        WHEN NEW.plan = 'professional' THEN 10
        WHEN NEW.plan = 'enterprise' THEN -1   -- unlimited
        ELSE 1
      END
    WHERE id = NEW.user_id;
  END IF;
  
  -- When subscription is cancelled, revert to starter
  IF NEW.status = 'cancelled' THEN
    UPDATE public.profiles
    SET 
      plan = 'starter',
      max_obligations = 5,
      max_users = 1
    WHERE id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to sync plan
CREATE TRIGGER sync_plan_on_subscription_change
AFTER INSERT OR UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.sync_plan_from_subscription();