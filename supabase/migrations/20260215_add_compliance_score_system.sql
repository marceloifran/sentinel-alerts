-- Migration: Add Compliance Score System
-- Description: Adds criticality levels to obligations and creates compliance score tracking

-- Create enum for obligation criticality
CREATE TYPE public.obligation_criticality AS ENUM ('baja', 'media', 'alta');

-- Add criticality column to obligations table
ALTER TABLE public.obligations 
ADD COLUMN criticality public.obligation_criticality NOT NULL DEFAULT 'media';

-- Create compliance_scores table to track score history
CREATE TABLE public.compliance_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  level TEXT NOT NULL CHECK (level IN ('alto', 'medio', 'bajo')),
  breakdown JSONB NOT NULL,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_latest_score UNIQUE (user_id, calculated_at)
);

-- Create index for faster queries
CREATE INDEX idx_compliance_scores_user_id ON public.compliance_scores(user_id);
CREATE INDEX idx_compliance_scores_calculated_at ON public.compliance_scores(calculated_at DESC);

-- Enable RLS on compliance_scores
ALTER TABLE public.compliance_scores ENABLE ROW LEVEL SECURITY;

-- RLS Policies for compliance_scores
CREATE POLICY "Users can view own compliance scores"
  ON public.compliance_scores FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own compliance scores"
  ON public.compliance_scores FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Function to calculate compliance score for a user
CREATE OR REPLACE FUNCTION public.calculate_compliance_score(_user_id UUID)
RETURNS TABLE (
  score INTEGER,
  level TEXT,
  breakdown JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_score INTEGER := 100;
  v_level TEXT;
  v_penalties JSONB := '[]'::JSONB;
  v_total_obligations INTEGER;
  v_summary TEXT;
  
  -- Penalty counters
  v_overdue_alta INTEGER := 0;
  v_overdue_media INTEGER := 0;
  v_overdue_baja INTEGER := 0;
  v_upcoming_alta INTEGER := 0;
  v_upcoming_media INTEGER := 0;
  v_upcoming_baja INTEGER := 0;
  v_no_responsible INTEGER := 0;
  v_no_docs_critical INTEGER := 0;
BEGIN
  -- Get total obligations for user
  SELECT COUNT(*) INTO v_total_obligations
  FROM obligations
  WHERE created_by = _user_id;
  
  -- Count overdue obligations by criticality
  SELECT 
    COUNT(*) FILTER (WHERE criticality = 'alta'),
    COUNT(*) FILTER (WHERE criticality = 'media'),
    COUNT(*) FILTER (WHERE criticality = 'baja')
  INTO v_overdue_alta, v_overdue_media, v_overdue_baja
  FROM obligations
  WHERE created_by = _user_id AND status = 'vencida';
  
  -- Count upcoming obligations (<7 days) by criticality
  SELECT 
    COUNT(*) FILTER (WHERE criticality = 'alta'),
    COUNT(*) FILTER (WHERE criticality = 'media'),
    COUNT(*) FILTER (WHERE criticality = 'baja')
  INTO v_upcoming_alta, v_upcoming_media, v_upcoming_baja
  FROM obligations
  WHERE created_by = _user_id 
    AND status = 'por_vencer'
    AND due_date <= CURRENT_DATE + INTERVAL '7 days';
  
  -- Count obligations without responsible (using a placeholder check)
  -- Note: In your schema, responsible_id is NOT NULL, so this might not apply
  -- Keeping it for future flexibility
  SELECT COUNT(*) INTO v_no_responsible
  FROM obligations
  WHERE created_by = _user_id AND responsible_id IS NULL;
  
  -- Count critical obligations without documentation
  SELECT COUNT(*) INTO v_no_docs_critical
  FROM obligations o
  WHERE o.created_by = _user_id 
    AND o.criticality = 'alta'
    AND NOT EXISTS (
      SELECT 1 FROM obligation_files f WHERE f.obligation_id = o.id
    );
  
  -- Apply penalties and build breakdown
  
  -- Overdue alta criticality: -20 points each
  IF v_overdue_alta > 0 THEN
    v_score := v_score - (v_overdue_alta * 20);
    v_penalties := v_penalties || jsonb_build_object(
      'type', 'overdue_alta',
      'count', v_overdue_alta,
      'pointsDeducted', v_overdue_alta * 20,
      'description', 'Obligaciones vencidas (criticidad alta)'
    );
  END IF;
  
  -- Overdue media criticality: -15 points each
  IF v_overdue_media > 0 THEN
    v_score := v_score - (v_overdue_media * 15);
    v_penalties := v_penalties || jsonb_build_object(
      'type', 'overdue_media',
      'count', v_overdue_media,
      'pointsDeducted', v_overdue_media * 15,
      'description', 'Obligaciones vencidas (criticidad media)'
    );
  END IF;
  
  -- Overdue baja criticality: -10 points each
  IF v_overdue_baja > 0 THEN
    v_score := v_score - (v_overdue_baja * 10);
    v_penalties := v_penalties || jsonb_build_object(
      'type', 'overdue_baja',
      'count', v_overdue_baja,
      'pointsDeducted', v_overdue_baja * 10,
      'description', 'Obligaciones vencidas (criticidad baja)'
    );
  END IF;
  
  -- Upcoming alta criticality: -10 points each
  IF v_upcoming_alta > 0 THEN
    v_score := v_score - (v_upcoming_alta * 10);
    v_penalties := v_penalties || jsonb_build_object(
      'type', 'upcoming_alta',
      'count', v_upcoming_alta,
      'pointsDeducted', v_upcoming_alta * 10,
      'description', 'Obligaciones por vencer en 7 días (criticidad alta)'
    );
  END IF;
  
  -- Upcoming media criticality: -7 points each
  IF v_upcoming_media > 0 THEN
    v_score := v_score - (v_upcoming_media * 7);
    v_penalties := v_penalties || jsonb_build_object(
      'type', 'upcoming_media',
      'count', v_upcoming_media,
      'pointsDeducted', v_upcoming_media * 7,
      'description', 'Obligaciones por vencer en 7 días (criticidad media)'
    );
  END IF;
  
  -- Upcoming baja criticality: -5 points each
  IF v_upcoming_baja > 0 THEN
    v_score := v_score - (v_upcoming_baja * 5);
    v_penalties := v_penalties || jsonb_build_object(
      'type', 'upcoming_baja',
      'count', v_upcoming_baja,
      'pointsDeducted', v_upcoming_baja * 5,
      'description', 'Obligaciones por vencer en 7 días (criticidad baja)'
    );
  END IF;
  
  -- No responsible: -3 points each
  IF v_no_responsible > 0 THEN
    v_score := v_score - (v_no_responsible * 3);
    v_penalties := v_penalties || jsonb_build_object(
      'type', 'no_responsible',
      'count', v_no_responsible,
      'pointsDeducted', v_no_responsible * 3,
      'description', 'Obligaciones sin responsable asignado'
    );
  END IF;
  
  -- No documentation on critical obligations: -5 points each
  IF v_no_docs_critical > 0 THEN
    v_score := v_score - (v_no_docs_critical * 5);
    v_penalties := v_penalties || jsonb_build_object(
      'type', 'no_docs_critical',
      'count', v_no_docs_critical,
      'pointsDeducted', v_no_docs_critical * 5,
      'description', 'Obligaciones críticas sin documentación'
    );
  END IF;
  
  -- Ensure score doesn't go below 0
  IF v_score < 0 THEN
    v_score := 0;
  END IF;
  
  -- Determine compliance level
  IF v_score >= 80 THEN
    v_level := 'alto';
  ELSIF v_score >= 50 THEN
    v_level := 'medio';
  ELSE
    v_level := 'bajo';
  END IF;
  
  -- Generate summary
  IF v_score = 100 THEN
    v_summary := '¡Excelente! Todas las obligaciones están al día.';
  ELSIF v_score >= 80 THEN
    v_summary := 'Buen cumplimiento general. Mantén el control de las obligaciones próximas.';
  ELSIF v_score >= 50 THEN
    v_summary := format('Tu score bajó por %s obligaciones vencidas y %s por vencer.', 
                        v_overdue_alta + v_overdue_media + v_overdue_baja,
                        v_upcoming_alta + v_upcoming_media + v_upcoming_baja);
  ELSE
    v_summary := format('Atención urgente requerida: %s obligaciones vencidas.', 
                        v_overdue_alta + v_overdue_media + v_overdue_baja);
  END IF;
  
  -- Return results
  RETURN QUERY SELECT 
    v_score,
    v_level,
    jsonb_build_object(
      'totalObligations', v_total_obligations,
      'penalties', v_penalties,
      'summary', v_summary
    );
END;
$$;

-- Trigger function to auto-recalculate score when obligations change
CREATE OR REPLACE FUNCTION public.trigger_recalculate_compliance_score()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_score_data RECORD;
BEGIN
  -- Calculate new score for the user
  SELECT * INTO v_score_data
  FROM public.calculate_compliance_score(
    COALESCE(NEW.created_by, OLD.created_by)
  );
  
  -- Insert new score record
  INSERT INTO public.compliance_scores (user_id, score, level, breakdown)
  VALUES (
    COALESCE(NEW.created_by, OLD.created_by),
    v_score_data.score,
    v_score_data.level,
    v_score_data.breakdown
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create triggers on obligations table
CREATE TRIGGER on_obligation_change_recalculate_score
  AFTER INSERT OR UPDATE OR DELETE ON public.obligations
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_recalculate_compliance_score();

-- Create trigger on obligation_files table (affects score)
CREATE TRIGGER on_obligation_file_change_recalculate_score
  AFTER INSERT OR DELETE ON public.obligation_files
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_recalculate_compliance_score();

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.calculate_compliance_score(UUID) TO authenticated;

-- Comment on table and columns
COMMENT ON TABLE public.compliance_scores IS 'Stores historical compliance scores for users';
COMMENT ON COLUMN public.obligations.criticality IS 'Criticality level of the obligation (baja, media, alta)';
COMMENT ON FUNCTION public.calculate_compliance_score(UUID) IS 'Calculates compliance score for a given user based on their obligations';
