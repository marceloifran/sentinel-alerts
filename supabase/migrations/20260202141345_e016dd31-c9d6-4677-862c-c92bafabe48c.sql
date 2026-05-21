-- Table to store Google Calendar integration settings per user
CREATE TABLE public.google_calendar_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    token_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    selected_calendar_id TEXT DEFAULT 'primary',
    sync_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.google_calendar_integrations ENABLE ROW LEVEL SECURITY;

-- RLS policies - users can only manage their own integration
CREATE POLICY "Users can view own integration"
ON public.google_calendar_integrations
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own integration"
ON public.google_calendar_integrations
FOR INSERT
WITH CHECK (user_id = auth.uid() AND is_admin(auth.uid()));

CREATE POLICY "Users can update own integration"
ON public.google_calendar_integrations
FOR UPDATE
USING (user_id = auth.uid() AND is_admin(auth.uid()));

CREATE POLICY "Users can delete own integration"
ON public.google_calendar_integrations
FOR DELETE
USING (user_id = auth.uid() AND is_admin(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_google_calendar_integrations_updated_at
BEFORE UPDATE ON public.google_calendar_integrations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Add google_event_id to obligations table
ALTER TABLE public.obligations 
ADD COLUMN google_event_id TEXT;