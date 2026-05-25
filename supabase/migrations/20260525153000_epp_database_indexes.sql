-- Migration: EPP Database Indexes
-- Description: Creates indexes on foreign keys and company filters to speed up select, join and order queries.

-- Indexes for employees table
CREATE INDEX IF NOT EXISTS idx_employees_company_id ON public.employees (company_id);

-- Indexes for epp_items table
CREATE INDEX IF NOT EXISTS idx_epp_items_company_id ON public.epp_items (company_id);

-- Indexes for epp_deliveries table
CREATE INDEX IF NOT EXISTS idx_epp_deliveries_company_id ON public.epp_deliveries (company_id);
CREATE INDEX IF NOT EXISTS idx_epp_deliveries_employee_id ON public.epp_deliveries (employee_id);
CREATE INDEX IF NOT EXISTS idx_epp_deliveries_epp_item_id ON public.epp_deliveries (epp_item_id);

-- Composite index for recent deliveries sorting (company_id, created_at DESC)
CREATE INDEX IF NOT EXISTS idx_epp_deliveries_company_created_at_desc ON public.epp_deliveries (company_id, created_at DESC);

-- Indexes for labor_documents table
CREATE INDEX IF NOT EXISTS idx_labor_documents_company_id ON public.labor_documents (company_id);
CREATE INDEX IF NOT EXISTS idx_labor_documents_employee_id ON public.labor_documents (employee_id);
