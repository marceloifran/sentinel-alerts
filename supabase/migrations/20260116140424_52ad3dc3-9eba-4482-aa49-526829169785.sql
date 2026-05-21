-- Add recurrence field to obligations table
ALTER TABLE public.obligations 
ADD COLUMN recurrence TEXT CHECK (recurrence IN ('none', 'monthly', 'annual')) DEFAULT 'none';

-- Add comment for clarity
COMMENT ON COLUMN public.obligations.recurrence IS 'Recurrence type: none, monthly, or annual';