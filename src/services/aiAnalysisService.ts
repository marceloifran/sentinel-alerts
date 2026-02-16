import type { ComplianceTrend, ResponseTimeMetric, Statistics } from './analyticsService';

export interface AIInsight {
    type: 'success' | 'warning' | 'info' | 'critical';
    title: string;
    description: string;
    recommendation: string;
}

export function generateAIInsights(
    trends: ComplianceTrend[],
    metrics: ResponseTimeMetric[],
    summary: Statistics
): AIInsight[] {
    const insights: AIInsight[] = [];

    // 1. Compliance Rate Analysis
    if (summary.complianceRate >= 90) {
        insights.push({
            type: 'success',
            title: 'Cumplimiento Excelente',
            description: `Tu tasa de cumplimiento actual es del ${summary.complianceRate}%, lo cual supera el promedio de la industria.`,
            recommendation: 'Mantén este ritmo y asegúrate de documentar estas buenas prácticas.'
        });
    } else if (summary.complianceRate >= 70) {
        insights.push({
            type: 'info',
            title: 'Cumplimiento Estable',
            description: `Tu cumplimiento está en ${summary.complianceRate}%. Hay margen de mejora en procesos específicos.`,
            recommendation: 'Revisa las obligaciones por vencer con mayor anticipación.'
        });
    } else {
        insights.push({
            type: 'critical',
            title: 'Alerta de Cumplimiento Bajo',
            description: `La tasa de cumplimiento ha caído al ${summary.complianceRate}%, aumentando el riesgo de sanciones.`,
            recommendation: 'Prioriza inmediatamente las tareas vencidas y revisa la carga de trabajo de los responsables.'
        });
    }

    // 2. Response Time Analysis
    const slowCategories = metrics.filter(m => m.avgDays > 5);
    if (slowCategories.length > 0) {
        insights.push({
            type: 'warning',
            title: 'Cuellos de Botella Detectados',
            description: `Las categorías ${slowCategories.map(c => c.category).join(', ')} presentan tiempos de respuesta elevados.`,
            recommendation: 'Considera simplificar los procesos de aprobación o asignar más responsables a estas áreas.'
        });
    }

    // 3. Trend Analysis
    if (trends.length >= 2) {
        const last = trends[trends.length - 1].score;
        const prev = trends[trends.length - 2].score;

        if (last > prev) {
            insights.push({
                type: 'success',
                title: 'Tendencia Positiva',
                description: 'Se observa una mejora en el cumplimiento respecto al mes anterior.',
                recommendation: 'Sigue incentivando al equipo con estos resultados.'
            });
        } else if (last < prev) {
            insights.push({
                type: 'warning',
                title: 'Tendencia en Descenso',
                description: 'El cumplimiento este mes es menor al anterior.',
                recommendation: 'Investiga si hubo cambios normativos o problemas de personal que afectaran la ejecución.'
            });
        }
    }

    // 4. Risk Prediction (Based on upcoming)
    if (summary.upcoming > 5) {
        insights.push({
            type: 'info',
            title: 'Pico de Trabajo Próximo',
            description: `Tienes ${summary.upcoming} obligaciones por vencer en los próximos días.`,
            recommendation: 'Adelanta las tareas más simples hoy para evitar saturación al final de la semana.'
        });
    }

    return insights;
}
