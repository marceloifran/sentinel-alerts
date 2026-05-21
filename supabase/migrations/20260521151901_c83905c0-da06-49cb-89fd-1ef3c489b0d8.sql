
-- 1) profiles: restrict SELECT to own profile + same-company members
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Users can view profiles in same company"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  company_id IS NOT NULL
  AND company_id IN (
    SELECT p.company_id FROM public.profiles p WHERE p.id = auth.uid()
  )
);

-- 2) subscriptions: restrict UPDATE to service_role
DROP POLICY IF EXISTS "Service role can update subscriptions" ON public.subscriptions;

CREATE POLICY "Service role can update subscriptions"
ON public.subscriptions
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

-- 3) email_notifications: restrict INSERT to service_role
DROP POLICY IF EXISTS "Service role can insert notifications" ON public.email_notifications;

CREATE POLICY "Service role can insert notifications"
ON public.email_notifications
FOR INSERT
TO service_role
WITH CHECK (true);
