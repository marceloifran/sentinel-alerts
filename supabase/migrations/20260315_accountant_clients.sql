-- Migration: Accountant Clients Panel
-- Description: Creates a table for accountants to manage multiple client companies
-- from a single panel view.
--
-- Model:
--   An accountant (a user with their own company) can manage N "client companies"
--   that they create and add obligations to on behalf of their clients.
--   The accountant_id references auth.users directly (not company to company).

-- 1. Create the accountant_clients table
CREATE TABLE IF NOT EXISTS public.accountant_clients (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  accountant_id  UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_company_id UUID     NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  nickname       TEXT,       -- optional friendly name the accountant gives
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(accountant_id, client_company_id)
);

-- 2. Enable RLS
ALTER TABLE public.accountant_clients ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies

-- Accountants can manage their own client list
CREATE POLICY "Accountants can view their own clients"
  ON public.accountant_clients FOR SELECT
  TO authenticated
  USING (accountant_id = auth.uid());

CREATE POLICY "Accountants can add client companies"
  ON public.accountant_clients FOR INSERT
  TO authenticated
  WITH CHECK (accountant_id = auth.uid());

CREATE POLICY "Accountants can remove their own clients"
  ON public.accountant_clients FOR DELETE
  TO authenticated
  USING (accountant_id = auth.uid());

-- 4. Grant SELECT on companies to authenticated users who have an entry in accountant_clients
--    (companies already has RLS but only allows seeing own company;
--     we add a policy to also allow accountants to see their managed companies)
CREATE POLICY "Accountants can view managed client companies"
  ON public.companies FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT client_company_id
      FROM public.accountant_clients
      WHERE accountant_id = auth.uid()
    )
  );

-- 5. Allow accountants to create companies (for adding new clients)
--    Companies table only had owner-tier policies before.
CREATE POLICY "Authenticated users can create companies"
  ON public.companies FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 6. Allow accountants to view/create obligations for their managed client companies
CREATE POLICY "Accountants can view managed client obligations"
  ON public.obligations FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT client_company_id
      FROM public.accountant_clients
      WHERE accountant_id = auth.uid()
    )
  );

CREATE POLICY "Accountants can create obligations for their client companies"
  ON public.obligations FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT client_company_id
      FROM public.accountant_clients
      WHERE accountant_id = auth.uid()
    )
  );

CREATE POLICY "Accountants can update obligations for their client companies"
  ON public.obligations FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT client_company_id
      FROM public.accountant_clients
      WHERE accountant_id = auth.uid()
    )
  );

CREATE POLICY "Accountants can delete obligations for their client companies"
  ON public.obligations FOR DELETE
  TO authenticated
  USING (
    company_id IN (
      SELECT client_company_id
      FROM public.accountant_clients
      WHERE accountant_id = auth.uid()
    )
  );
