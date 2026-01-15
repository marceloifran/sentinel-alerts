-- Create email_notifications table to track sent reminders
CREATE TABLE public.email_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  obligation_id UUID NOT NULL REFERENCES public.obligations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('30_days', '7_days', 'due_date')),
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  email_to TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique constraint to prevent duplicate notifications
CREATE UNIQUE INDEX idx_unique_notification 
  ON public.email_notifications(obligation_id, user_id, notification_type);

-- Enable RLS
ALTER TABLE public.email_notifications ENABLE ROW LEVEL SECURITY;

-- Admins can view all notifications
CREATE POLICY "Admins can view all notifications"
  ON public.email_notifications
  FOR SELECT
  USING (public.is_admin(auth.uid()));

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
  ON public.email_notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow edge function to insert notifications (service role bypasses RLS)
CREATE POLICY "Service role can insert notifications"
  ON public.email_notifications
  FOR INSERT
  WITH CHECK (true);