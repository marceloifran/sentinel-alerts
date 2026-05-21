-- Migration: Add detailed fields for Formulario 299 PDF
-- Description: Extends companies, employees, and epp_items tables to support Salta local addresses, job descriptions, and EPP certifications.

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS zip_code TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT;

ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS job_description TEXT,
  ADD COLUMN IF NOT EXISTS required_epps TEXT;

ALTER TABLE public.epp_items
  ADD COLUMN IF NOT EXISTS type_model TEXT,
  ADD COLUMN IF NOT EXISTS brand TEXT,
  ADD COLUMN IF NOT EXISTS certified TEXT DEFAULT 'Si';
