-- Migration: Add Intelligent Normative Assistant System
-- Description: Creates obligation templates, user interactions tracking, and recommendation functions

-- ============================================================================
-- 1. CREATE TABLES
-- ============================================================================

-- Table: obligation_templates
-- Stores predefined obligation templates by sector
CREATE TABLE public.obligation_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic information
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('fiscal', 'laboral', 'legal', 'ambiental', 'sanitario', 'otro')),
  
  -- Sector/Industry
  sector TEXT NOT NULL CHECK (sector IN (
    'construccion', 'comercio', 'servicios', 'industria', 'agro', 
    'tecnologia', 'salud', 'educacion', 'transporte', 'inmobiliaria', 
    'gastronomia', 'profesional', 'otro'
  )),
  
  -- Criticality and frequency
  criticality public.obligation_criticality NOT NULL DEFAULT 'media',
  frequency TEXT NOT NULL CHECK (frequency IN ('mensual', 'bimestral', 'trimestral', 'semestral', 'anual', 'unica')),
  
  -- Required documentation
  required_documents JSONB DEFAULT '[]',
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  applies_to_all_sectors BOOLEAN DEFAULT false,
  
  -- Additional information
  legal_reference TEXT,
  penalty_description TEXT,
  estimated_cost TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for obligation_templates
CREATE INDEX idx_obligation_templates_sector ON public.obligation_templates(sector);
CREATE INDEX idx_obligation_templates_category ON public.obligation_templates(category);
CREATE INDEX idx_obligation_templates_active ON public.obligation_templates(is_active) WHERE is_active = true;
CREATE INDEX idx_obligation_templates_criticality ON public.obligation_templates(criticality);

-- Table: user_template_interactions
-- Tracks user interactions with template suggestions
CREATE TABLE public.user_template_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES public.obligation_templates(id) ON DELETE CASCADE,
  
  -- User action
  action TEXT NOT NULL CHECK (action IN ('accepted', 'rejected', 'dismissed')),
  
  -- If accepted, reference to created obligation
  created_obligation_id UUID REFERENCES public.obligations(id) ON DELETE SET NULL,
  
  -- Timestamp
  interacted_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(user_id, template_id)
);

-- Indexes for user_template_interactions
CREATE INDEX idx_user_template_interactions_user ON public.user_template_interactions(user_id);
CREATE INDEX idx_user_template_interactions_template ON public.user_template_interactions(template_id);
CREATE INDEX idx_user_template_interactions_action ON public.user_template_interactions(action);

-- Update profiles table with onboarding fields
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS suggested_templates_shown BOOLEAN DEFAULT false;

-- ============================================================================
-- 2. ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE public.obligation_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_template_interactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for obligation_templates (read-only for authenticated users)
CREATE POLICY "Anyone can view active templates"
  ON public.obligation_templates FOR SELECT
  TO authenticated
  USING (is_active = true);

-- RLS Policies for user_template_interactions
CREATE POLICY "Users can view own interactions"
  ON public.user_template_interactions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own interactions"
  ON public.user_template_interactions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own interactions"
  ON public.user_template_interactions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================================
-- 3. FUNCTIONS
-- ============================================================================

-- Function: get_suggested_templates_for_user
-- Returns suggested obligation templates for a user based on their sector
CREATE OR REPLACE FUNCTION public.get_suggested_templates_for_user(_user_id UUID)
RETURNS TABLE (
  template_id UUID,
  title TEXT,
  description TEXT,
  category TEXT,
  criticality public.obligation_criticality,
  frequency TEXT,
  required_documents JSONB,
  legal_reference TEXT,
  penalty_description TEXT,
  estimated_cost TEXT,
  priority INTEGER,
  match_reason TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_sector TEXT;
  v_existing_titles TEXT[];
BEGIN
  -- Get user's sector
  SELECT sector INTO v_user_sector
  FROM profiles
  WHERE id = _user_id;
  
  -- Get titles of existing obligations (normalized for comparison)
  SELECT ARRAY_AGG(LOWER(TRIM(title))) INTO v_existing_titles
  FROM obligations
  WHERE created_by = _user_id;
  
  -- Initialize empty array if no obligations
  v_existing_titles := COALESCE(v_existing_titles, ARRAY[]::TEXT[]);
  
  -- Return suggested templates
  RETURN QUERY
  SELECT 
    t.id,
    t.title,
    t.description,
    t.category,
    t.criticality,
    t.frequency,
    t.required_documents,
    t.legal_reference,
    t.penalty_description,
    t.estimated_cost,
    t.priority,
    CASE 
      WHEN t.applies_to_all_sectors THEN 'Obligación universal para todas las empresas'
      ELSE 'Obligación típica del sector ' || v_user_sector
    END as match_reason
  FROM obligation_templates t
  LEFT JOIN user_template_interactions uti 
    ON uti.template_id = t.id AND uti.user_id = _user_id
  WHERE 
    t.is_active = true
    AND (t.sector = v_user_sector OR t.applies_to_all_sectors = true)
    AND uti.id IS NULL -- User hasn't interacted with this template
    AND NOT (LOWER(TRIM(t.title)) = ANY(v_existing_titles)) -- No similar obligation exists
  ORDER BY 
    t.criticality DESC, -- Critical first
    t.priority DESC,    -- Then by priority
    t.title ASC;
END;
$$;

-- Function: accept_template_suggestion
-- Creates an obligation from a template and records the interaction
CREATE OR REPLACE FUNCTION public.accept_template_suggestion(
  _user_id UUID,
  _template_id UUID,
  _due_date DATE,
  _responsible_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_template RECORD;
  v_new_obligation_id UUID;
BEGIN
  -- Verify user owns this action
  IF _user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  -- Get template data
  SELECT * INTO v_template
  FROM obligation_templates
  WHERE id = _template_id AND is_active = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Plantilla no encontrada o inactiva';
  END IF;
  
  -- Create new obligation based on template
  INSERT INTO obligations (
    title,
    description,
    category,
    due_date,
    status,
    created_by,
    responsible_id,
    criticality
  ) VALUES (
    v_template.title,
    v_template.description,
    v_template.category,
    _due_date,
    CASE 
      WHEN _due_date < CURRENT_DATE THEN 'vencida'
      WHEN _due_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'por_vencer'
      ELSE 'al_dia'
    END,
    _user_id,
    _responsible_id,
    v_template.criticality
  )
  RETURNING id INTO v_new_obligation_id;
  
  -- Record interaction
  INSERT INTO user_template_interactions (
    user_id,
    template_id,
    action,
    created_obligation_id
  ) VALUES (
    _user_id,
    _template_id,
    'accepted',
    v_new_obligation_id
  )
  ON CONFLICT (user_id, template_id) 
  DO UPDATE SET 
    action = 'accepted',
    created_obligation_id = v_new_obligation_id,
    interacted_at = now();
  
  RETURN v_new_obligation_id;
END;
$$;

-- Function: reject_template_suggestion
-- Records that user rejected a template suggestion
CREATE OR REPLACE FUNCTION public.reject_template_suggestion(
  _user_id UUID,
  _template_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify user owns this action
  IF _user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  INSERT INTO user_template_interactions (
    user_id,
    template_id,
    action
  ) VALUES (
    _user_id,
    _template_id,
    'rejected'
  )
  ON CONFLICT (user_id, template_id) 
  DO UPDATE SET 
    action = 'rejected',
    interacted_at = now();
END;
$$;

-- Function: get_suggestion_count
-- Returns count of pending suggestions for a user
CREATE OR REPLACE FUNCTION public.get_suggestion_count(_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM public.get_suggested_templates_for_user(_user_id);
  
  RETURN v_count;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_suggested_templates_for_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_template_suggestion(UUID, UUID, DATE, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_template_suggestion(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_suggestion_count(UUID) TO authenticated;

-- ============================================================================
-- 4. SEED DATA - OBLIGATION TEMPLATES
-- ============================================================================

-- CONSTRUCCIÓN
INSERT INTO obligation_templates (title, description, category, sector, criticality, frequency, required_documents, legal_reference, penalty_description, estimated_cost, priority) VALUES
('Habilitación Municipal de Obra', 'Permiso municipal para iniciar construcción en el predio', 'legal', 'construccion', 'alta', 'unica', '["Planos aprobados por profesional matriculado", "Certificado de factibilidad", "Pago de tasas municipales", "Seguro de responsabilidad civil"]', 'Código de Edificación Municipal', 'Multas de hasta $500,000 y paralización inmediata de obra', '$50,000 - $200,000', 100),

('Certificado de Higiene y Seguridad en Obra', 'Certificación de condiciones de trabajo seguras en obra', 'laboral', 'construccion', 'alta', 'anual', '["Informe de riesgos laborales", "Plan de seguridad e higiene", "Matafuegos y señalización", "Botiquín de primeros auxilios"]', 'Ley 19.587 - Higiene y Seguridad en el Trabajo', 'Multas de $100,000 a $1,000,000 y clausura de obra', '$30,000 - $80,000', 95),

('ART - Alta de Empleados de Construcción', 'Afiliación obligatoria de trabajadores a ART', 'laboral', 'construccion', 'alta', 'mensual', '["Nómina actualizada de empleados", "Formulario de alta F.931", "Comprobante de pago"]', 'Ley 24.557 - Riesgos del Trabajo', 'Multas de $50,000 por cada trabajador no asegurado', '$5,000 - $15,000/empleado', 90),

('Declaración Jurada de IVA', 'Presentación mensual de IVA ante AFIP', 'fiscal', 'construccion', 'alta', 'mensual', '["Facturas de compra", "Facturas de venta", "Libro IVA digital"]', 'Ley 23.349 - Impuesto al Valor Agregado', 'Multas e intereses por mora, bloqueo de CUIT', '$0 (trámite digital)', 85),

('Renovación de Matrícula Profesional', 'Renovación anual de matrícula de arquitecto/ingeniero responsable', 'legal', 'construccion', 'media', 'anual', '["Comprobante de pago de matrícula", "Certificado de matrícula vigente", "Seguro de mala praxis"]', 'Ley de Ejercicio Profesional Provincial', 'Inhabilitación profesional temporal', '$20,000 - $40,000', 70),

('Certificado de Final de Obra', 'Certificación de finalización conforme a planos aprobados', 'legal', 'construccion', 'alta', 'unica', '["Planos conforme a obra", "Certificado de profesional", "Inspección municipal aprobada"]', 'Código de Edificación Municipal', 'Imposibilidad de habitar o vender la propiedad', '$80,000 - $150,000', 85);

-- COMERCIO
INSERT INTO obligation_templates (title, description, category, sector, criticality, frequency, required_documents, legal_reference, penalty_description, estimated_cost, priority) VALUES
('Habilitación Comercial Municipal', 'Permiso municipal para operar actividad comercial', 'legal', 'comercio', 'alta', 'anual', '["Plano del local comercial", "Certificado de bomberos", "Pago de tasas municipales", "Habilitación de bromatología (si aplica)"]', 'Código de Habilitaciones Municipal', 'Clausura inmediata y multas de $100,000 a $500,000', '$30,000 - $100,000', 100),

('Libro de Quejas Oficial', 'Libro rubricado para reclamos de consumidores', 'legal', 'comercio', 'media', 'unica', '["Solicitud en Defensa al Consumidor", "Formulario de inscripción"]', 'Ley 24.240 - Defensa del Consumidor', 'Multas de $50,000 a $200,000 por incumplimiento', '$5,000 - $10,000', 60),

('Declaración Jurada de Ingresos Brutos', 'Impuesto provincial sobre ingresos brutos', 'fiscal', 'comercio', 'alta', 'mensual', '["Facturación del período", "Comprobantes de pago", "Libro de IVA"]', 'Código Fiscal Provincial', 'Multas, intereses y embargo preventivo', '$0 (trámite digital)', 85),

('Renovación de Licencia de Marca', 'Renovación de registro de marca comercial en INPI', 'legal', 'comercio', 'baja', 'anual', '["Comprobante de pago INPI", "Certificado de marca vigente"]', 'Ley 22.362 - Marcas y Designaciones', 'Pérdida de protección legal de la marca', '$15,000 - $30,000', 40),

('Inspección de Bromatología', 'Inspección sanitaria de local de venta de alimentos', 'sanitario', 'comercio', 'alta', 'semestral', '["Certificado de manipulación de alimentos", "Carnet sanitario del personal", "Análisis de agua potable"]', 'Código Alimentario Argentino', 'Clausura y decomiso de mercadería', '$20,000 - $50,000', 80),

('Registro de Proveedores', 'Inscripción en registro de proveedores del Estado', 'legal', 'comercio', 'baja', 'anual', '["Constancia de AFIP", "Certificado de cumplimiento fiscal", "Balance contable"]', 'Ley de Compras del Estado', 'Imposibilidad de vender al Estado', '$10,000 - $25,000', 30);

-- SERVICIOS
INSERT INTO obligation_templates (title, description, category, sector, criticality, frequency, required_documents, legal_reference, penalty_description, estimated_cost, priority) VALUES
('Habilitación de Servicios Profesionales', 'Permiso para ejercer actividad profesional', 'legal', 'servicios', 'alta', 'anual', '["Matrícula profesional vigente", "Seguro de responsabilidad civil", "Certificado de domicilio"]', 'Ley de Ejercicio Profesional', 'Inhabilitación y multas', '$25,000 - $60,000', 90),

('Declaración Jurada de Ganancias', 'Impuesto a las ganancias de servicios profesionales', 'fiscal', 'servicios', 'alta', 'anual', '["Libro de ingresos y egresos", "Facturas emitidas", "Comprobantes de gastos deducibles"]', 'Ley 20.628 - Impuesto a las Ganancias', 'Multas, intereses y ajustes fiscales', '$0 (trámite digital)', 85),

('Renovación de Matrícula Profesional', 'Renovación anual de matrícula en colegio profesional', 'legal', 'servicios', 'alta', 'anual', '["Comprobante de pago", "Certificado de capacitación continua", "Seguro de mala praxis"]', 'Ley de Colegios Profesionales', 'Suspensión de matrícula', '$30,000 - $70,000', 88),

('Certificado de Capacitación Continua', 'Acreditación de horas de capacitación profesional', 'legal', 'servicios', 'media', 'anual', '["Certificados de cursos", "Asistencia a congresos", "Publicaciones"]', 'Reglamento del Colegio Profesional', 'Imposibilidad de renovar matrícula', '$20,000 - $50,000', 60);

-- INDUSTRIA
INSERT INTO obligation_templates (title, description, category, sector, criticality, frequency, required_documents, legal_reference, penalty_description, estimated_cost, priority) VALUES
('Habilitación Industrial', 'Permiso municipal para actividad industrial', 'legal', 'industria', 'alta', 'anual', '["Estudio de impacto ambiental", "Planos de planta", "Certificado de bomberos", "Pago de tasas"]', 'Código de Habilitaciones Industrial', 'Clausura y multas de $200,000 a $1,000,000', '$100,000 - $300,000', 100),

('Certificado de Aptitud Ambiental', 'Evaluación de impacto ambiental de la actividad', 'ambiental', 'industria', 'alta', 'anual', '["Estudio de impacto ambiental", "Plan de gestión de residuos", "Análisis de efluentes"]', 'Ley General del Ambiente 25.675', 'Clausura, multas y responsabilidad penal', '$150,000 - $500,000', 95),

('Gestión de Residuos Peligrosos', 'Declaración y gestión de residuos industriales', 'ambiental', 'industria', 'alta', 'trimestral', '["Manifiesto de residuos", "Contrato con transportista habilitado", "Certificado de disposición final"]', 'Ley 24.051 - Residuos Peligrosos', 'Multas de $500,000 a $5,000,000 y responsabilidad penal', '$80,000 - $200,000', 90),

('Certificado de Seguridad e Higiene Industrial', 'Condiciones de seguridad en planta industrial', 'laboral', 'industria', 'alta', 'anual', '["Plan de seguridad", "Capacitación de personal", "Elementos de protección personal", "Señalización"]', 'Ley 19.587', 'Multas y clausura de planta', '$60,000 - $150,000', 88),

('Renovación de Certificado de Calidad ISO', 'Mantenimiento de certificación ISO 9001', 'otro', 'industria', 'media', 'anual', '["Auditoría interna", "Acciones correctivas", "Revisión de procesos"]', 'Norma ISO 9001', 'Pérdida de certificación', '$200,000 - $400,000', 50);

-- PLANTILLAS UNIVERSALES (aplican a todos los sectores)
INSERT INTO obligation_templates (title, description, category, sector, criticality, frequency, required_documents, legal_reference, penalty_description, estimated_cost, priority, applies_to_all_sectors) VALUES
('Pago de Cargas Sociales', 'Pago mensual de aportes y contribuciones patronales', 'laboral', 'servicios', 'alta', 'mensual', '["Nómina de empleados", "Recibos de sueldo", "Formulario F.931"]', 'Ley 24.241 - Sistema de Jubilaciones', 'Multas de $50,000 por cada empleado, embargo', '$0 (% de sueldos)', 100, true),

('Declaración Jurada de Ganancias Anual', 'Declaración anual de impuesto a las ganancias', 'fiscal', 'servicios', 'alta', 'anual', '["Balance contable", "Libro diario", "Comprobantes de ingresos y gastos"]', 'Ley 20.628 - Impuesto a las Ganancias', 'Multas, intereses y ajustes fiscales', '$0 (trámite digital)', 95, true),

('Renovación de CUIT', 'Actualización de datos en AFIP', 'fiscal', 'servicios', 'media', 'anual', '["Constancia de CUIT", "Formulario 460", "Comprobante de domicilio"]', 'RG AFIP', 'Bloqueo de CUIT e imposibilidad de operar', '$0 (trámite digital)', 60, true),

('Seguro de Responsabilidad Civil', 'Póliza de seguro de responsabilidad civil', 'legal', 'servicios', 'media', 'anual', '["Póliza vigente", "Comprobante de pago"]', 'Código Civil y Comercial', 'Responsabilidad personal ilimitada ante daños', '$30,000 - $100,000', 50, true);

-- ============================================================================
-- 5. COMMENTS
-- ============================================================================

COMMENT ON TABLE public.obligation_templates IS 'Predefined obligation templates by industry sector for intelligent suggestions';
COMMENT ON TABLE public.user_template_interactions IS 'Tracks user interactions (accept/reject) with template suggestions';
COMMENT ON COLUMN public.profiles.onboarding_completed IS 'Whether user has completed the onboarding wizard';
COMMENT ON COLUMN public.profiles.onboarding_step IS 'Current step in onboarding process (0-5)';
COMMENT ON FUNCTION public.get_suggested_templates_for_user(UUID) IS 'Returns suggested obligation templates for a user based on their sector';
COMMENT ON FUNCTION public.accept_template_suggestion(UUID, UUID, DATE, UUID) IS 'Creates an obligation from a template and records the interaction';
COMMENT ON FUNCTION public.reject_template_suggestion(UUID, UUID) IS 'Records that user rejected a template suggestion';
