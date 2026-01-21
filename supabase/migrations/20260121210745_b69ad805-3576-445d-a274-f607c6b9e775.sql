-- Create table to track user invitations
CREATE TABLE public.user_invitations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    invited_by UUID NOT NULL,
    invited_email TEXT NOT NULL,
    invited_user_id UUID,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    accepted_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.user_invitations ENABLE ROW LEVEL SECURITY;

-- Admins can view invitations they created
CREATE POLICY "Admins can view their invitations"
ON public.user_invitations
FOR SELECT
USING (invited_by = auth.uid() OR is_admin(auth.uid()));

-- Admins can create invitations
CREATE POLICY "Admins can create invitations"
ON public.user_invitations
FOR INSERT
WITH CHECK (invited_by = auth.uid() AND is_admin(auth.uid()));

-- Admins can update their invitations
CREATE POLICY "Admins can update their invitations"
ON public.user_invitations
FOR UPDATE
USING (invited_by = auth.uid() OR is_admin(auth.uid()));

-- Admins can delete their invitations
CREATE POLICY "Admins can delete their invitations"
ON public.user_invitations
FOR DELETE
USING (invited_by = auth.uid() OR is_admin(auth.uid()));

-- Create index for faster lookups
CREATE INDEX idx_invitations_invited_by ON public.user_invitations(invited_by);
CREATE INDEX idx_invitations_invited_email ON public.user_invitations(invited_email);

-- Create function to link invitation when user signs up
CREATE OR REPLACE FUNCTION public.link_invitation_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.user_invitations 
    SET invited_user_id = NEW.id,
        status = 'accepted',
        accepted_at = now()
    WHERE invited_email = NEW.email
      AND status = 'pending';
    RETURN NEW;
END;
$$;

-- Create trigger to run after profile is created
CREATE TRIGGER on_profile_created_link_invitation
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.link_invitation_on_signup();