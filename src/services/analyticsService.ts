import { supabase } from '@/integrations/supabase/client';
import type { Obligation } from './obligationService';
import { subMonths, format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

export interface ComplianceTrend {
    date: string;
    score: number;
    total: number;
    completed: number;
}

export interface ResponseTimeMetric {
    category: string;
    avgDays: number;
    count: number;
}

export interface Statistics {
    total: number;
    completed: number;
    overdue: number;
    upcoming: number;
    complianceRate: number;
    avgResponseTime: number;
}

export async function getAnalyticsData(obligations: Obligation[]) {
    const now = new Date();
    const last6Months = Array.from({ length: 6 }).map((_, i) => {
        const date = subMonths(now, 5 - i);
        return {
            month: format(date, 'MMM'),
            start: startOfMonth(date),
            end: endOfMonth(date),
        };
    });

    // 1. Fetch History to calculate real response times
    const { data: historyData } = await supabase
        .from('obligation_history')
        .select('*')
        .order('created_at', { ascending: true });

    const historyMap = new Map<string, any[]>();
    (historyData || []).forEach(record => {
        if (!historyMap.has(record.obligation_id)) {
            historyMap.set(record.obligation_id, []);
        }
        historyMap.get(record.obligation_id)?.push(record);
    });

    // 2. Compliance & Total Count Trends (last 6 months)
    let cumulativeTotal = 0;
    const complianceTrends: ComplianceTrend[] = last6Months.map(({ month, start, end }) => {
        const monthObligations = obligations.filter(o => {
            const dueDate = new Date(o.due_date);
            return isWithinInterval(dueDate, { start, end });
        });

        const completed = monthObligations.filter(o => {
            if (o.status === 'al_dia') return true;
            const history = historyMap.get(o.id) || [];
            return history.some(h => h.new_status === 'al_dia');
        }).length;

        const total = monthObligations.length;
        const score = total > 0 ? Math.round((completed / total) * 100) : 0; // Fix: 0 if no data

        return { date: month, score, total, completed };
    });

    // Calculate Evolution Data (Cumulative total)
    const evolutionData = last6Months.map(({ month, end }) => {
        const totalToDate = obligations.filter(o => new Date(o.created_at) <= end).length;
        return { date: month, count: totalToDate };
    });

    // 3. Real Response Time Metrics
    const categories = [...new Set(obligations.map(o => o.category))];
    const responseTimeMetrics: ResponseTimeMetric[] = categories.map(category => {
        const catObligations = obligations.filter(o => o.category === category);
        let totalDays = 0;
        let completedCount = 0;

        catObligations.forEach(o => {
            const history = historyMap.get(o.id) || [];
            const completionRecord = history.find(h => h.new_status === 'al_dia');

            if (completionRecord) {
                const start = new Date(o.created_at);
                const end = new Date(completionRecord.created_at);
                const diffTime = Math.abs(end.getTime() - start.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                totalDays += diffDays;
                completedCount++;
            }
        });

        return {
            category: category.charAt(0).toUpperCase() + category.slice(1),
            avgDays: completedCount > 0 ? Number((totalDays / completedCount).toFixed(1)) : 0,
            count: completedCount
        };
    });

    // 4. Status Distribution
    const overdue = obligations.filter(o => o.status === 'vencida').length;
    const upcoming = obligations.filter(o => o.status === 'por_vencer').length;
    const alDia = obligations.filter(o => o.status === 'al_dia').length;
    const total = obligations.length;

    const statusDistribution = [
        { name: 'Al día', value: alDia, color: '#10B981' },
        { name: 'Por vencer', value: upcoming, color: '#F59E0B' },
        { name: 'Vencidas', value: overdue, color: '#EF4444' },
    ];

    // 5. Criticality Analysis
    const criticalities = ['baja', 'media', 'alta'];
    const criticalityData = criticalities.map(level => {
        const count = obligations.filter(o => o.criticality === level).length;
        let color = '#3B82F6';
        if (level === 'alta') color = '#EF4444';
        if (level === 'media') color = '#F59E0B';

        return {
            name: level.charAt(0).toUpperCase() + level.slice(1),
            value: count,
            color
        };
    });

    const totalCompleted = responseTimeMetrics.reduce((acc, curr) => acc + curr.count, 0);
    const avgResponseTime = totalCompleted > 0
        ? responseTimeMetrics.reduce((acc, curr) => acc + curr.avgDays * curr.count, 0) / totalCompleted
        : 0;

    // Calculate Trends (Comparison with previous month)
    const currentScore = complianceTrends[5].score;
    const prevScore = complianceTrends[4].score;
    const complianceTrendVal = currentScore - prevScore;

    // Projection Projection logic
    const nextMonth = format(subMonths(now, -1), 'MMMM');
    const estimatedCompliance = Math.min(100, currentScore + (complianceTrendVal / 2));

    return {
        complianceTrends,
        evolutionData,
        responseTimeMetrics,
        statusDistribution,
        criticalityData,
        summary: {
            total,
            completed: alDia,
            overdue,
            upcoming,
            complianceRate: total > 0 ? Math.round((alDia / total) * 100) : 0,
            avgResponseTime: Number(avgResponseTime.toFixed(1)),
            complianceTrend: (complianceTrendVal >= 0 ? '+' : '') + complianceTrendVal + '%',
            responseTimeTrend: '-0.2d', // Placeholder for complex history trend
            projection: {
                nextMonth,
                score: Math.round(estimatedCompliance)
            }
        }
    };
}
