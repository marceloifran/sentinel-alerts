import { supabase } from '@/integrations/supabase/client';


export interface ObligationTemplate {
    id: string;
    title: string;
    description: string | null;
    category: string;
    sector: string;
    criticality: 'baja' | 'media' | 'alta';
    frequency: 'mensual' | 'bimestral' | 'trimestral' | 'semestral' | 'anual' | 'unica';
    required_documents: string[];
    is_active: boolean;
    priority: number;
    applies_to_all_sectors: boolean;
    legal_reference: string | null;
    penalty_description: string | null;
    estimated_cost: string | null;
    created_at: string;
    updated_at: string;
}



export interface TemplateInteraction {
    id: string;
    user_id: string;
    template_id: string;
    action: 'accepted' | 'rejected' | 'dismissed';
    created_obligation_id: string | null;
    interacted_at: string;
}



/**
 * Get all active templates
 */
export async function getTemplates(): Promise<ObligationTemplate[]> {
    const { data, error } = await (supabase as any)
        .from('obligation_templates')
        .select('*')
        .eq('is_active', true)
        .order('criticality', { ascending: false })
        .order('priority', { ascending: false });

    if (error) {
        console.error('Error getting templates:', error);
        throw error;
    }

    return (data || []) as ObligationTemplate[];
}

/**
 * Get user's template interactions
 */
export async function getUserTemplateInteractions(): Promise<TemplateInteraction[]> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Usuario no autenticado');
    }

    const { data, error } = await (supabase as any)
        .from('user_template_interactions')
        .select('*')
        .eq('user_id', user.id)
        .order('interacted_at', { ascending: false });

    if (error) {
        console.error('Error getting user interactions:', error);
        throw error;
    }

    return (data || []) as TemplateInteraction[];
}

/**
 * Mark onboarding as completed
 */
export async function completeOnboarding(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Usuario no autenticado');
    }

    const { error } = await (supabase as any)
        .from('profiles')
        .update({
            onboarding_completed: true,
            onboarding_step: 5,
            suggested_templates_shown: true
        })
        .eq('id', user.id);

    if (error) {
        console.error('Error completing onboarding:', error);
        throw error;
    }
}

/**
 * Update onboarding step
 */
export async function updateOnboardingStep(step: number): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Usuario no autenticado');
    }

    const { error } = await (supabase as any)
        .from('profiles')
        .update({ onboarding_step: step })
        .eq('id', user.id);

    if (error) {
        console.error('Error updating onboarding step:', error);
        throw error;
    }
}
