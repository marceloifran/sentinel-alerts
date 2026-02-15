import { Obligation } from './obligationService';
import { ComplianceScore } from './complianceScoreService';

export interface CompanyInfo {
    name: string;
    address?: string;
    taxId?: string;
    logo?: string;
}

export interface ObligationStats {
    total: number;
    alDia: number;
    porVencer: number;
    vencidas: number;
    criticas: number;
    sinDocumentacion: number;
}

export interface CategorizedObligations {
    alDia: Obligation[];
    porVencer: Obligation[];
    vencidas: Obligation[];
}

export interface RiskLevel {
    level: 'bajo' | 'medio' | 'alto' | 'crítico';
    score: number;
    factors: string[];
}

export interface ReportData {
    companyInfo: CompanyInfo;
    generatedAt: Date;
    reportPeriod: string;
    complianceScore: ComplianceScore;
    obligations: Obligation[];
    categorizedObligations: CategorizedObligations;
    riskLevel: RiskLevel;
    statistics: ObligationStats;
    criticalObligations: Obligation[];
    obligationsWithoutDocs: Obligation[];
    recommendations: string[];
}

/**
 * Get company information from user profile
 */
export function getCompanyInfo(userName: string, userEmail: string): CompanyInfo {
    // For now, use user data. In future, this could come from a company_info table
    return {
        name: userName || userEmail || 'Empresa',
        address: undefined,
        taxId: undefined,
        logo: undefined
    };
}

/**
 * Categorize obligations by status
 */
export function getObligationsByStatus(obligations: Obligation[]): CategorizedObligations {
    return {
        alDia: obligations.filter(o => o.status === 'al_dia'),
        porVencer: obligations.filter(o => o.status === 'por_vencer'),
        vencidas: obligations.filter(o => o.status === 'vencida')
    };
}

/**
 * Get critical obligations (high criticality)
 */
export function getCriticalObligations(obligations: Obligation[]): Obligation[] {
    return obligations.filter(o => o.criticality === 'alta');
}

/**
 * Get obligations without documentation
 * Note: This checks if obligation_files exist for the obligation
 */
export function getObligationsWithoutDocuments(obligations: Obligation[]): Obligation[] {
    // For now, we'll mark as "needs implementation" - requires checking obligation_files table
    // This would need to be done via a join query or separate fetch
    return [];
}

/**
 * Calculate obligation statistics
 */
export function calculateStatistics(obligations: Obligation[]): ObligationStats {
    const alDia = obligations.filter(o => o.status === 'al_dia').length;
    const porVencer = obligations.filter(o => o.status === 'por_vencer').length;
    const vencidas = obligations.filter(o => o.status === 'vencida').length;
    const criticas = obligations.filter(o => o.criticality === 'alta').length;

    return {
        total: obligations.length,
        alDia,
        porVencer,
        vencidas,
        criticas,
        sinDocumentacion: 0 // TODO: implement when we have file checking
    };
}

/**
 * Calculate risk level based on obligations and compliance score
 */
export function calculateRiskLevel(
    obligations: Obligation[],
    score: ComplianceScore
): RiskLevel {
    const vencidas = obligations.filter(o => o.status === 'vencida');
    const criticas = obligations.filter(o => o.criticality === 'alta');
    const vencidasCriticas = vencidas.filter(o => o.criticality === 'alta');

    let riskScore = 0;
    const factors: string[] = [];

    // Risk factors
    if (vencidasCriticas.length > 0) {
        riskScore += 40;
        factors.push(`${vencidasCriticas.length} obligación(es) crítica(s) vencida(s)`);
    }

    if (vencidas.length > 5) {
        riskScore += 30;
        factors.push(`${vencidas.length} obligaciones vencidas`);
    } else if (vencidas.length > 0) {
        riskScore += 15;
        factors.push(`${vencidas.length} obligación(es) vencida(s)`);
    }

    if (score.score < 50) {
        riskScore += 20;
        factors.push('Score de cumplimiento bajo');
    } else if (score.score < 70) {
        riskScore += 10;
        factors.push('Score de cumplimiento medio-bajo');
    }

    if (criticas.length > 10) {
        riskScore += 10;
        factors.push('Alto número de obligaciones críticas');
    }

    // Classification
    if (riskScore >= 70) {
        return { level: 'crítico', score: riskScore, factors };
    }
    if (riskScore >= 50) {
        return { level: 'alto', score: riskScore, factors };
    }
    if (riskScore >= 30) {
        return { level: 'medio', score: riskScore, factors };
    }

    return { level: 'bajo', score: riskScore, factors: factors.length > 0 ? factors : ['Sin factores de riesgo significativos'] };
}

/**
 * Generate automated recommendations based on obligations and score
 */
export function generateRecommendations(
    obligations: Obligation[],
    score: ComplianceScore,
    categorized: CategorizedObligations
): string[] {
    const recommendations: string[] = [];

    const { vencidas, porVencer } = categorized;
    const vencidasCriticas = vencidas.filter(o => o.criticality === 'alta');
    const porVencerCriticas = porVencer.filter(o => o.criticality === 'alta');

    // Critical overdue obligations
    if (vencidasCriticas.length > 0) {
        recommendations.push(
            `🔴 URGENTE: Resolver ${vencidasCriticas.length} obligación(es) crítica(s) vencida(s) de inmediato`
        );
    }

    // Overdue obligations
    if (vencidas.length > 0) {
        recommendations.push(
            `Priorizar resolución de ${vencidas.length} obligación(es) vencida(s)`
        );
    }

    // Critical upcoming obligations
    if (porVencerCriticas.length > 0) {
        recommendations.push(
            `Atender ${porVencerCriticas.length} obligación(es) crítica(s) que vencen próximamente`
        );
    }

    // Upcoming obligations
    if (porVencer.length > 0) {
        recommendations.push(
            `Revisar y planificar ${porVencer.length} obligación(es) que vencen en los próximos 30 días`
        );
    }

    // Low score
    if (score.score < 70) {
        recommendations.push(
            'Implementar sistema de alertas tempranas para prevenir vencimientos'
        );
    }

    if (score.score < 50) {
        recommendations.push(
            'Considerar auditoría interna para identificar puntos críticos de mejora'
        );
    }

    // No issues
    if (recommendations.length === 0) {
        recommendations.push(
            '✅ Mantener el excelente nivel de cumplimiento actual',
            'Continuar monitoreando obligaciones próximas a vencer',
            'Revisar periódicamente el score de cumplimiento'
        );
    }

    return recommendations;
}

/**
 * Aggregate all data needed for the report
 */
export function aggregateReportData(
    obligations: Obligation[],
    complianceScore: ComplianceScore,
    userName: string,
    userEmail: string
): ReportData {
    const companyInfo = getCompanyInfo(userName, userEmail);
    const categorizedObligations = getObligationsByStatus(obligations);
    const criticalObligations = getCriticalObligations(obligations);
    const obligationsWithoutDocs = getObligationsWithoutDocuments(obligations);
    const statistics = calculateStatistics(obligations);
    const riskLevel = calculateRiskLevel(obligations, complianceScore);
    const recommendations = generateRecommendations(obligations, complianceScore, categorizedObligations);

    const now = new Date();
    const reportPeriod = now.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

    return {
        companyInfo,
        generatedAt: now,
        reportPeriod,
        complianceScore,
        obligations,
        categorizedObligations,
        riskLevel,
        statistics,
        criticalObligations,
        obligationsWithoutDocs,
        recommendations
    };
}
