-- Add sector column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS sector text;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.sector IS 'Business sector or industry of the user/company';