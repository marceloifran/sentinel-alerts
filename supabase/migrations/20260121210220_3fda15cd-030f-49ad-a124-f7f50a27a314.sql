-- Create enum for user plans
CREATE TYPE public.user_plan AS ENUM ('starter', 'professional', 'enterprise');

-- Add plan column to profiles table
ALTER TABLE public.profiles ADD COLUMN plan public.user_plan NOT NULL DEFAULT 'starter';

-- Add plan limits columns
ALTER TABLE public.profiles ADD COLUMN max_obligations INTEGER NOT NULL DEFAULT 10;
ALTER TABLE public.profiles ADD COLUMN max_users INTEGER NOT NULL DEFAULT 1;