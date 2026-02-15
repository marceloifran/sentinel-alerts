import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getSuggestedTemplates,
    getSuggestionCount,
    acceptTemplateSuggestion,
    rejectTemplateSuggestion,
    completeOnboarding,
    updateOnboardingStep,
    type TemplateSuggestion
} from '@/services/templateService';
import { toast } from 'sonner';

/**
 * Hook to get suggested templates for current user
 */
export function useTemplateSuggestions() {
    return useQuery({
        queryKey: ['template-suggestions'],
        queryFn: getSuggestedTemplates,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

/**
 * Hook to get count of pending suggestions
 */
export function useSuggestionCount() {
    return useQuery({
        queryKey: ['suggestion-count'],
        queryFn: getSuggestionCount,
        staleTime: 5 * 60 * 1000,
    });
}

/**
 * Hook to accept a template suggestion
 */
export function useAcceptTemplate() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            templateId,
            dueDate,
            responsibleId
        }: {
            templateId: string;
            dueDate: Date;
            responsibleId: string;
        }) => acceptTemplateSuggestion(templateId, dueDate, responsibleId),

        onSuccess: () => {
            // Invalidate queries to refresh data
            queryClient.invalidateQueries({ queryKey: ['template-suggestions'] });
            queryClient.invalidateQueries({ queryKey: ['suggestion-count'] });
            queryClient.invalidateQueries({ queryKey: ['obligations'] });
            queryClient.invalidateQueries({ queryKey: ['compliance-score'] });

            toast.success('Obligación creada exitosamente');
        },

        onError: (error) => {
            console.error('Error accepting template:', error);
            toast.error('Error al crear la obligación');
        },
    });
}

/**
 * Hook to reject a template suggestion
 */
export function useRejectTemplate() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (templateId: string) => rejectTemplateSuggestion(templateId),

        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['template-suggestions'] });
            queryClient.invalidateQueries({ queryKey: ['suggestion-count'] });

            toast.success('Sugerencia rechazada');
        },

        onError: (error) => {
            console.error('Error rejecting template:', error);
            toast.error('Error al rechazar la sugerencia');
        },
    });
}

/**
 * Hook to complete onboarding
 */
export function useCompleteOnboarding() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: completeOnboarding,

        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            toast.success('¡Bienvenido a IfsinRem!');
        },

        onError: (error) => {
            console.error('Error completing onboarding:', error);
            toast.error('Error al completar el onboarding');
        },
    });
}

/**
 * Hook to update onboarding step
 */
export function useUpdateOnboardingStep() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (step: number) => updateOnboardingStep(step),

        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile'] });
        },

        onError: (error) => {
            console.error('Error updating onboarding step:', error);
        },
    });
}

/**
 * Hook to accept multiple templates at once
 */
export function useAcceptMultipleTemplates() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (templates: Array<{
            templateId: string;
            dueDate: Date;
            responsibleId: string;
        }>) => {
            const results = await Promise.allSettled(
                templates.map(t => acceptTemplateSuggestion(t.templateId, t.dueDate, t.responsibleId))
            );

            const succeeded = results.filter(r => r.status === 'fulfilled').length;
            const failed = results.filter(r => r.status === 'rejected').length;

            return { succeeded, failed, total: templates.length };
        },

        onSuccess: ({ succeeded, failed, total }) => {
            queryClient.invalidateQueries({ queryKey: ['template-suggestions'] });
            queryClient.invalidateQueries({ queryKey: ['suggestion-count'] });
            queryClient.invalidateQueries({ queryKey: ['obligations'] });
            queryClient.invalidateQueries({ queryKey: ['compliance-score'] });

            if (failed === 0) {
                toast.success(`${succeeded} obligaciones creadas exitosamente`);
            } else {
                toast.warning(`${succeeded} creadas, ${failed} fallaron`);
            }
        },

        onError: (error) => {
            console.error('Error accepting multiple templates:', error);
            toast.error('Error al crear las obligaciones');
        },
    });
}
