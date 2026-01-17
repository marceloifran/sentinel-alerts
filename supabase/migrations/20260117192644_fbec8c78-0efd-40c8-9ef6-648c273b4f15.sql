-- Add phone column to profiles table for WhatsApp notifications
ALTER TABLE public.profiles 
ADD COLUMN phone TEXT DEFAULT NULL;

-- Add whatsapp_enabled column to control if user wants WhatsApp notifications
ALTER TABLE public.profiles 
ADD COLUMN whatsapp_enabled BOOLEAN DEFAULT false;