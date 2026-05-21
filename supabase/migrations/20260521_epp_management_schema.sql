-- Migration: EPP & Labor Documentation Schema
-- Description: Creates tables for employees, EPP items, EPP deliveries, and labor documents.

-- 1. Create table for Employees
CREATE TABLE IF NOT EXISTS public.employees (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  dni_cuil    TEXT        NOT NULL,
  file_number TEXT,       -- Legajo
  job_title   TEXT,       -- Cargo / Puesto (importante para Formulario 299)
  phone       TEXT,
  status      TEXT        NOT NULL DEFAULT 'activo', -- 'activo' | 'inactivo'
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Create table for EPP Items (Inventory)
CREATE TABLE IF NOT EXISTS public.epp_items (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  description TEXT,
  category    TEXT,       -- 'cabeza', 'manos', 'pies', 'cuerpo', 'ocular', etc.
  stock       INTEGER     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Create table for EPP Deliveries
CREATE TABLE IF NOT EXISTS public.epp_deliveries (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id     UUID        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id    UUID        NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  epp_item_id    UUID        NOT NULL REFERENCES public.epp_items(id) ON DELETE CASCADE,
  quantity       INTEGER     NOT NULL DEFAULT 1,
  delivery_date  DATE        NOT NULL DEFAULT current_date,
  supervisor_id  UUID        NOT NULL REFERENCES auth.users(id),
  signature_path TEXT,       -- Ruta del archivo de firma en Storage
  status         TEXT        NOT NULL DEFAULT 'pendiente', -- 'pendiente' | 'firmado'
  signed_at      TIMESTAMPTZ,
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Create table for Labor Documents (like Formulario 299 PDF)
CREATE TABLE IF NOT EXISTS public.labor_documents (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id UUID        REFERENCES public.employees(id) ON DELETE SET NULL,
  name        TEXT        NOT NULL, -- ej: "Constancia EPP - F299 - 21/05/2026"
  type        TEXT        NOT NULL, -- 'f299_epp' | 'safety_induction' | 'other'
  file_path   TEXT        NOT NULL, -- Ruta en Storage
  status      TEXT        NOT NULL DEFAULT 'pendiente', -- 'pendiente' | 'firmado' | 'rechazado'
  signed_at   TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Create storage bucket for signatures and labor documents if they don't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('signatures', 'signatures', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('labor-documents', 'labor-documents', false)
ON CONFLICT (id) DO NOTHING;

-- 6. Enable RLS on all new tables
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.epp_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.epp_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.labor_documents ENABLE ROW LEVEL SECURITY;

-- 7. Define RLS Policies for Employees
CREATE POLICY "Users can view company employees"
  ON public.employees FOR SELECT
  TO authenticated
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert company employees"
  ON public.employees FOR INSERT
  TO authenticated
  WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update company employees"
  ON public.employees FOR UPDATE
  TO authenticated
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete company employees"
  ON public.employees FOR DELETE
  TO authenticated
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- 8. Define RLS Policies for EPP Items
CREATE POLICY "Users can view company EPP items"
  ON public.epp_items FOR SELECT
  TO authenticated
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert company EPP items"
  ON public.epp_items FOR INSERT
  TO authenticated
  WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update company EPP items"
  ON public.epp_items FOR UPDATE
  TO authenticated
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete company EPP items"
  ON public.epp_items FOR DELETE
  TO authenticated
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- 9. Define RLS Policies for EPP Deliveries
CREATE POLICY "Users can view company EPP deliveries"
  ON public.epp_deliveries FOR SELECT
  TO authenticated
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert company EPP deliveries"
  ON public.epp_deliveries FOR INSERT
  TO authenticated
  WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update company EPP deliveries"
  ON public.epp_deliveries FOR UPDATE
  TO authenticated
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete company EPP deliveries"
  ON public.epp_deliveries FOR DELETE
  TO authenticated
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- 10. Define RLS Policies for Labor Documents
CREATE POLICY "Users can view company labor documents"
  ON public.labor_documents FOR SELECT
  TO authenticated
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert company labor documents"
  ON public.labor_documents FOR INSERT
  TO authenticated
  WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update company labor documents"
  ON public.labor_documents FOR UPDATE
  TO authenticated
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete company labor documents"
  ON public.labor_documents FOR DELETE
  TO authenticated
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- 11. Storage Policies for Signatures Bucket
CREATE POLICY "Authenticated users can upload signatures"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'signatures');

CREATE POLICY "Authenticated users can view signatures"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'signatures');

-- 12. Storage Policies for Labor Documents Bucket
CREATE POLICY "Authenticated users can upload labor documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'labor-documents');

CREATE POLICY "Authenticated users can view labor documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'labor-documents');

-- 13. Create triggers to update updated_at timestamps
CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_epp_items_updated_at
  BEFORE UPDATE ON public.epp_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_epp_deliveries_updated_at
  BEFORE UPDATE ON public.epp_deliveries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_labor_documents_updated_at
  BEFORE UPDATE ON public.labor_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
