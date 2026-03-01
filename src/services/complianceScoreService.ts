import { supabase } from '@/integrations/supabase/client';
import type { Obligation } from './obligationService';

export type CriticalityLevel = 'baja' | 'media' | 'alta';
export type ComplianceLevel = 'alto' | 'medio' | 'bajo';

export interface ComplianceScore {
    score: number; // 0-100
    level: ComplianceLevel;
    breakdown: ScoreBreakdown;
    calculatedAt: string;
}

export interface ScoreBreakdown {
    totalObligations: number;
    penalties: ScorePenalty[];
    summary: string;
}

export interface ScorePenalty {
    type: string;
    count: number;
    pointsDeducted: number;
    description: string;
}

export const criticalityLabels: Record<CriticalityLevel, string> = {
    baja: 'Baja',
    media: 'Media',
    alta: 'Alta',
};

export const complianceLevelLabels: Record<ComplianceLevel, string> = {
    alto: 'Cumplimiento Alto',
    medio: 'Cumplimiento Medio',
    bajo: 'Cumplimiento Bajo',
};

/**
 * Calculate compliance score based on obligations
 * This is a client-side implementation that mirrors the database function
 */
export function calculateComplianceScore(obligations: Obligation[]): ComplianceScore {
    let score = 100;
    const penalties: ScorePenalty[] = [];
    const totalObligations = obligations.length;

    // Count different types of issues
    const overdueAlta = obligations.filter(o => o.status === 'vencida' && o.criticality === 'alta').length;
    const overdueMedia = obligations.filter(o => o.status === 'vencida' && o.criticality === 'media').length;
    const overdueBaja = obligations.filter(o => o.status === 'vencida' && o.criticality === 'baja').length;

    // Check for upcoming obligations (<7 days)
    const today = new Date();
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(today.getDate() + 7);

    const upcomingAlta = obligations.filter(o => {
        if (o.status !== 'por_vencer') return false;
        const dueDate = new Date(o.due_date);
        return dueDate <= sevenDaysFromNow && o.criticality === 'alta';
    }).length;

    const upcomingMedia = obligations.filter(o => {
        if (o.status !== 'por_vencer') return false;
        const dueDate = new Date(o.due_date);
        return dueDate <= sevenDaysFromNow && o.criticality === 'media';
    }).length;

    const upcomingBaja = obligations.filter(o => {
        if (o.status !== 'por_vencer') return false;
        const dueDate = new Date(o.due_date);
        return dueDate <= sevenDaysFromNow && o.criticality === 'baja';
    }).length;

    // Note: In the current schema, responsible_id is NOT NULL, so this won't apply
    // Keeping for future flexibility
    const noResponsible = obligations.filter(o => !o.responsible_id).length;

    // Apply penalties
    if (overdueAlta > 0) {
        const points = overdueAlta * 20;
        score -= points;
        penalties.push({
            type: 'overdue_alta',
            count: overdueAlta,
            pointsDeducted: points,
            description: 'Obligaciones vencidas (criticidad alta)',
        });
    }

    if (overdueMedia > 0) {
        const points = overdueMedia * 15;
        score -= points;
        penalties.push({
            type: 'overdue_media',
            count: overdueMedia,
            pointsDeducted: points,
            description: 'Obligaciones vencidas (criticidad media)',
        });
    }

    if (overdueBaja > 0) {
        const points = overdueBaja * 10;
        score -= points;
        penalties.push({
            type: 'overdue_baja',
            count: overdueBaja,
            pointsDeducted: points,
            description: 'Obligaciones vencidas (criticidad baja)',
        });
    }

    if (upcomingAlta > 0) {
        const points = upcomingAlta * 10;
        score -= points;
        penalties.push({
            type: 'upcoming_alta',
            count: upcomingAlta,
            pointsDeducted: points,
            description: 'Obligaciones por vencer en 7 días (criticidad alta)',
        });
    }

    if (upcomingMedia > 0) {
        const points = upcomingMedia * 7;
        score -= points;
        penalties.push({
            type: 'upcoming_media',
            count: upcomingMedia,
            pointsDeducted: points,
            description: 'Obligaciones por vencer en 7 días (criticidad media)',
        });
    }

    if (upcomingBaja > 0) {
        const points = upcomingBaja * 5;
        score -= points;
        penalties.push({
            type: 'upcoming_baja',
            count: upcomingBaja,
            pointsDeducted: points,
            description: 'Obligaciones por vencer en 7 días (criticidad baja)',
        });
    }

    if (noResponsible > 0) {
        const points = noResponsible * 3;
        score -= points;
        penalties.push({
            type: 'no_responsible',
            count: noResponsible,
            pointsDeducted: points,
            description: 'Obligaciones sin responsable asignado',
        });
    }

    // Ensure score doesn't go below 0
    score = Math.max(0, score);

    // Determine compliance level
    const level = getComplianceLevel(score);

    // Generate summary
    const summary = generateSummary(score, overdueAlta + overdueMedia + overdueBaja, upcomingAlta + upcomingMedia + upcomingBaja);

    return {
        score,
        level,
        breakdown: {
            totalObligations,
            penalties,
            summary,
        },
        calculatedAt: new Date().toISOString(),
    };
}

/**
 * Get compliance level based on score
 */
export function getComplianceLevel(score: number): ComplianceLevel {
    if (score >= 80) return 'alto';
    if (score >= 50) return 'medio';
    return 'bajo';
}

/**
 * Generate human-readable summary
 */
function generateSummary(score: number, overdueCount: number, upcomingCount: number): string {
    if (score === 100) {
        return '¡Excelente! Todas las obligaciones están al día.';
    }
    if (score >= 80) {
        return 'Buen cumplimiento general. Mantén el control de las obligaciones próximas.';
    }
    if (score >= 50) {
        return `Tu score bajó por ${overdueCount} obligaciones vencidas y ${upcomingCount} por vencer.`;
    }
    return `Atención urgente requerida: ${overdueCount} obligaciones vencidas.`;
}

/**
 * Get the latest compliance score from database for a user
 */
export async function getLatestComplianceScore(userId: string): Promise<ComplianceScore | null> {
    const { data, error } = await (supabase as any)
        .from('compliance_scores')
        .select('*')
        .eq('user_id', userId)
        .order('calculated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return {
        score: (data as any).score,
        level: (data as any).level as ComplianceLevel,
        breakdown: (data as any).breakdown as ScoreBreakdown,
        calculatedAt: (data as any).calculated_at,
    };
}

/**
 * Get compliance score history for a user
 */
export async function getComplianceScoreHistory(
    userId: string,
    limit: number = 30
): Promise<ComplianceScore[]> {
    const { data, error } = await (supabase as any)
        .from('compliance_scores')
        .select('*')
        .eq('user_id', userId)
        .order('calculated_at', { ascending: false })
        .limit(limit);

    if (error) throw error;

    return (data || []).map((record: any) => ({
        score: record.score,
        level: record.level as ComplianceLevel,
        breakdown: record.breakdown as ScoreBreakdown,
        calculatedAt: record.calculated_at,
    }));
}

/**
 * Manually trigger score recalculation by calling the database function
 */
export async function recalculateComplianceScore(userId: string): Promise<ComplianceScore> {
    // Call the database function
    const { data, error } = await (supabase as any).rpc('calculate_compliance_score', {
        _user_id: userId,
    });

    if (error) throw error;
    if (!data || (Array.isArray(data) && data.length === 0)) {
        throw new Error('Failed to calculate compliance score');
    }

    const result = Array.isArray(data) ? data[0] : data;

    // Save the score
    const { error: insertError } = await (supabase as any)
        .from('compliance_scores')
        .insert({
            user_id: userId,
            score: result.score,
            level: result.level,
            breakdown: result.breakdown,
        });

    if (insertError) throw insertError;

    return {
        score: result.score,
        level: result.level as ComplianceLevel,
        breakdown: result.breakdown as ScoreBreakdown,
        calculatedAt: new Date().toISOString(),
    };
}

/**
 * Get color class based on compliance level
 */
export function getComplianceLevelColor(level: ComplianceLevel): string {
    switch (level) {
        case 'alto':
            return 'text-green-600 bg-green-50 border-green-200';
        case 'medio':
            return 'text-yellow-600 bg-yellow-50 border-yellow-200';
        case 'bajo':
            return 'text-red-600 bg-red-50 border-red-200';
    }
}

/**
 * Get icon color based on compliance level
 */
export function getComplianceLevelIconColor(level: ComplianceLevel): string {
    switch (level) {
        case 'alto':
            return 'text-green-600';
        case 'medio':
            return 'text-yellow-600';
        case 'bajo':
            return 'text-red-600';
    }
}

/**
 * Get score color for circular progress
 */
export function getScoreColor(score: number): string {
    if (score >= 80) return '#16a34a'; // green-600
    if (score >= 50) return '#ca8a04'; // yellow-600
    return '#dc2626'; // red-600
}
