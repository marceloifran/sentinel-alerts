-- Company-wide read access for obligations, history and files
-- so any user inside a company (owner, admin, operativo) can
-- ver todas las obligaciones y sus detalles.

-- 1) Obligations RLS: company-centric visibility
ALTER TABLE public.obligations ENABLE ROW LEVEL SECURITY;

-- Clean up previous isolation policies if they exist
DROP POLICY IF EXISTS "Users can only view their own created obligations" ON public.obligations;
DROP POLICY IF EXISTS "Users can view company obligations" ON public.obligations;
DROP POLICY IF EXISTS "Admins can view all obligations" ON public.obligations;
DROP POLICY IF EXISTS "Responsables can view assigned obligations" ON public.obligations;
DROP POLICY IF EXISTS "Admins can create obligations" ON public.obligations;
DROP POLICY IF EXISTS "Admins can update all obligations" ON public.obligations;
DROP POLICY IF EXISTS "Responsables can update assigned obligations" ON public.obligations;
DROP POLICY IF EXISTS "Admins can delete obligations" ON public.obligations;
DROP POLICY IF EXISTS "Owners and Admins can create obligations" ON public.obligations;
DROP POLICY IF EXISTS "Owners and Admins can update any company obligation" ON public.obligations;
DROP POLICY IF EXISTS "Operativos can update assigned obligations" ON public.obligations;
DROP POLICY IF EXISTS "Owners can delete company obligations" ON public.obligations;

-- Any authenticated user inside the company can see all company obligations
CREATE POLICY "Users can view company obligations"
  ON public.obligations FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Owners and admins can create obligations for their company
CREATE POLICY "Owners and Admins can create obligations"
  ON public.obligations FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Owners and admins can update any obligation in their company
CREATE POLICY "Owners and Admins can update any company obligation"
  ON public.obligations FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Operativos pueden actualizar solo obligaciones donde son responsables
CREATE POLICY "Operativos can update assigned obligations"
  ON public.obligations FOR UPDATE
  TO authenticated
  USING (
    responsible_id = auth.uid()
    AND company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Solo el owner puede borrar obligaciones de la empresa
CREATE POLICY "Owners can delete company obligations"
  ON public.obligations FOR DELETE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );


-- 2) Obligation history: company-wide read access
ALTER TABLE public.obligation_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view history of accessible obligations" ON public.obligation_history;

CREATE POLICY "Users can view company obligation history"
  ON public.obligation_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.obligations o
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE o.id = obligation_id
        AND o.company_id = p.company_id
    )
  );

-- Keep insert policy as-is: each user records their own changes
DROP POLICY IF EXISTS "Authenticated users can insert history" ON public.obligation_history;
CREATE POLICY "Authenticated users can insert history"
  ON public.obligation_history FOR INSERT
  TO authenticated
  WITH CHECK (changed_by = auth.uid());


-- 3) Obligation files: company-wide read access
ALTER TABLE public.obligation_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view files of accessible obligations" ON public.obligation_files;

CREATE POLICY "Users can view company obligation files"
  ON public.obligation_files FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.obligations o
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE o.id = obligation_id
        AND o.company_id = p.company_id
    )
  );

-- Upload policy: keep behaviour (user must be uploader and inside company)
DROP POLICY IF EXISTS "Users can upload files to accessible obligations" ON public.obligation_files;
CREATE POLICY "Users can upload files to accessible obligations"
  ON public.obligation_files FOR INSERT
  TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.obligations o
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE o.id = obligation_id
        AND o.company_id = p.company_id
    )
  );

-- Delete policy: keep behaviour (owner of file or admin/owner via separate checks)
DROP POLICY IF EXISTS "Users can delete own files" ON public.obligation_files;
CREATE POLICY "Users can delete own files"
  ON public.obligation_files FOR DELETE
  TO authenticated
  USING (uploaded_by = auth.uid());

