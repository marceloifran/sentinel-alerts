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

export interface TemplateSuggestion extends ObligationTemplate {
    template_id: string;
    match_reason: string;
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
 * Get suggested templates for the current user
 */
export async function getSuggestedTemplates(): Promise<TemplateSuggestion[]> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Usuario no autenticado');
    }

    const { data, error } = await supabase.rpc('get_suggested_templates_for_user', {
        _user_id: user.id
    });

    if (error) {
        console.error('Error getting suggested templates:', error);
        throw error;
    }

    return data || [];
}

/**
 * Get count of pending suggestions for current user
 */
export async function getSuggestionCount(): Promise<number> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return 0;
    }

    const { data, error } = await supabase.rpc('get_suggestion_count', {
        _user_id: user.id
    });

    if (error) {
        console.error('Error getting suggestion count:', error);
        return 0;
    }

    return data || 0;
}

/**
 * Accept a template suggestion and create an obligation
 */
export async function acceptTemplateSuggestion(
    templateId: string,
    dueDate: Date,
    responsibleId: string
): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Usuario no autenticado');
    }

    const { data, error } = await supabase.rpc('accept_template_suggestion', {
        _user_id: user.id,
        _template_id: templateId,
        _due_date: dueDate.toISOString().split('T')[0],
        _responsible_id: responsibleId
    });

    if (error) {
        console.error('Error accepting template:', error);
        throw error;
    }

    return data;
}

/**
 * Reject a template suggestion
 */
export async function rejectTemplateSuggestion(templateId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Usuario no autenticado');
    }

    const { error } = await supabase.rpc('reject_template_suggestion', {
        _user_id: user.id,
        _template_id: templateId
    });

    if (error) {
        console.error('Error rejecting template:', error);
        throw error;
    }
}

/**
 * Get all templates for a specific sector (for admin/preview)
 */
export async function getTemplatesBySector(sector: string): Promise<ObligationTemplate[]> {
    const { data, error } = await supabase
        .from('obligation_templates')
        .select('*')
        .or(`sector.eq.${sector},applies_to_all_sectors.eq.true`)
        .eq('is_active', true)
        .order('criticality', { ascending: false })
        .order('priority', { ascending: false });

    if (error) {
        console.error('Error getting templates by sector:', error);
        throw error;
    }

    return data || [];
}

/**
 * Get user's template interactions
 */
export async function getUserTemplateInteractions(): Promise<TemplateInteraction[]> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Usuario no autenticado');
    }

    const { data, error } = await supabase
        .from('user_template_interactions')
        .select('*')
        .eq('user_id', user.id)
        .order('interacted_at', { ascending: false });

    if (error) {
        console.error('Error getting user interactions:', error);
        throw error;
    }

    return data || [];
}

/**
 * Mark onboarding as completed
 */
export async function completeOnboarding(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Usuario no autenticado');
    }

    const { error } = await supabase
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

    const { error } = await supabase
        .from('profiles')
        .update({ onboarding_step: step })
        .eq('id', user.id);

    if (error) {
        console.error('Error updating onboarding step:', error);
        throw error;
    }
}
