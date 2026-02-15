import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getLatestComplianceScore,
    getComplianceScoreHistory,
    recalculateComplianceScore,
    calculateComplianceScore,
    ComplianceScore,
} from '@/services/complianceScoreService';
import { useObligations } from './useObligations';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useMemo } from 'react';

/**
 * Hook to get the latest compliance score from database
 */
export function useComplianceScore() {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['compliance-score', user?.id],
        queryFn: () => getLatestComplianceScore(user!.id),
        enabled: !!user,
        staleTime: 2 * 60 * 1000, // 2 minutes
    });
}

/**
 * Hook to calculate compliance score in real-time from current obligations
 * This provides instant feedback without waiting for database triggers
 */
export function useRealtimeComplianceScore(): ComplianceScore | null {
    const { data: obligations = [] } = useObligations();

    return useMemo(() => {
        if (obligations.length === 0) {
            return {
                score: 100,
                level: 'alto' as const,
                breakdown: {
                    totalObligations: 0,
                    penalties: [],
                    summary: '¡Excelente! Todas las obligaciones están al día.',
                },
                calculatedAt: new Date().toISOString(),
            };
        }

        return calculateComplianceScore(obligations);
    }, [obligations]);
}

/**
 * Hook to get compliance score history
 */
export function useComplianceScoreHistory(limit: number = 30) {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['compliance-score-history', user?.id, limit],
        queryFn: () => getComplianceScoreHistory(user!.id, limit),
        enabled: !!user,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

/**
 * Hook to manually trigger score recalculation
 */
export function useRecalculateComplianceScore() {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    return useMutation({
        mutationFn: () => recalculateComplianceScore(user!.id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['compliance-score', user?.id] });
            queryClient.invalidateQueries({ queryKey: ['compliance-score-history', user?.id] });
            toast.success('Score de cumplimiento actualizado');
        },
        onError: (error) => {
            console.error('Error recalculating compliance score:', error);
            toast.error('Error al recalcular el score');
        },
    });
}
