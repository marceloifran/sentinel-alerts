import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import { useObligations } from "@/hooks/useObligations";
import {
    BarChart3,
    TrendingUp,
    Clock,
    CheckCircle,
    Download,
    Filter,
    Calendar,
    AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnalyticsMetricCard } from "@/components/reports/AnalyticsMetricCard";
import { ComplianceBarChart } from "@/components/reports/ComplianceBarChart";
import { ObligationsTrendChart } from "@/components/reports/ObligationsTrendChart";
import { StatusDonutChart } from "@/components/reports/StatusDonutChart";
import { AIInsightsPanel } from "@/components/reports/AIInsightsPanel";
import { getAnalyticsData } from "@/services/analyticsService";
import { generateAIInsights } from "@/services/aiAnalysisService";
import { DashboardSkeleton } from "@/components/skeletons/Skeletons";

const Reports = () => {
    const navigate = useNavigate();
    const { user, profile, isAdmin, isLoading: authLoading, signOut } = useAuth();
    const { data: obligations = [], isLoading, error } = useObligations();
    const [analyticsData, setAnalyticsData] = useState<any>(null);
    const [insights, setInsights] = useState<any[]>([]);

    useEffect(() => {
        if (obligations.length > 0) {
            const fetchData = async () => {
                const data = await getAnalyticsData(obligations);
                setAnalyticsData(data);
                const aiInsights = generateAIInsights(data.complianceTrends, data.responseTimeMetrics, data.summary);
                setInsights(aiInsights);
            };
            fetchData();
        }
    }, [obligations]);

    const handleLogout = async () => {
        await signOut();
        navigate('/');
    };

    if (authLoading || isLoading) {
        return <DashboardSkeleton />;
    }

    if (!user) {
        navigate('/auth');
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50/50">
            <Header
                userName={profile?.name || user.email || 'Usuario'}
                onLogout={handleLogout}
                isAdmin={isAdmin}
                userPlan={profile?.plan}
            />

            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Reportes y Análisis</h1>
                        <p className="text-gray-500">Visualiza el rendimiento y cumplimiento de tus obligaciones</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" className="gap-2 rounded-xl group hover:border-blue-400">
                            <Filter className="w-4 h-4 group-hover:text-blue-500" />
                            <span>Filtros</span>
                        </Button>
                        <Button className="gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 shadow-sm transition-all hover:scale-[1.02]">
                            <Download className="w-4 h-4" />
                            <span>Exportar PDF</span>
                        </Button>
                    </div>
                </div>

                {/* Metrics Overview */}
                {analyticsData && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <AnalyticsMetricCard
                            title="Tasa de Cumplimiento"
                            value={`${analyticsData.summary.complianceRate}%`}
                            trend={analyticsData.summary.complianceTrend}
                            trendType={analyticsData.summary.complianceTrend.startsWith('+') ? 'positive' : 'negative'}
                            icon={CheckCircle}
                            color="green"
                            description="Basado en obligaciones cerradas"
                        />
                        <AnalyticsMetricCard
                            title="Total Obligaciones"
                            value={analyticsData.summary.total}
                            icon={BarChart3}
                            color="blue"
                            description="Activas en el sistema"
                        />
                        <AnalyticsMetricCard
                            title="Tiempo Resf. Promedio"
                            value={`${analyticsData.summary.avgResponseTime.toFixed(1)}d`}
                            trend={analyticsData.summary.responseTimeTrend}
                            trendType="positive"
                            icon={Clock}
                            color="purple"
                            description="Días hasta completitud"
                        />
                        <AnalyticsMetricCard
                            title="Próximos Vencimientos"
                            value={analyticsData.summary.upcoming}
                            trend={`${analyticsData.summary.overdue} vencidas`}
                            trendType="negative"
                            icon={Calendar}
                            color="orange"
                            description="Para los próximos 7 días"
                        />
                    </div>
                )}

                {/* Main Charts Distribution */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <ComplianceBarChart data={analyticsData?.complianceTrends || []} />
                    <ObligationsTrendChart data={analyticsData?.evolutionData || []} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    <div className="lg:col-span-1">
                        <StatusDonutChart
                            title="Distribución de Estado"
                            subtitle="Estado actual de obligaciones"
                            data={analyticsData?.statusDistribution || []}
                        />
                    </div>
                    <div className="lg:col-span-2">
                        <AIInsightsPanel insights={insights} />
                    </div>
                </div>

                {/* Additional Analysis */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    <div className="lg:col-span-1">
                        <StatusDonutChart
                            title="Nivel de Criticidad"
                            subtitle="Riesgo de las obligaciones"
                            data={analyticsData?.criticalityData || []}
                        />
                    </div>
                    <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center">
                        <div className="text-center flex flex-col items-center gap-3">
                            <div className="p-3 bg-blue-50 rounded-full">
                                <TrendingUp className="w-8 h-8 text-blue-500" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-800">Proyección de Cumplimiento</h3>
                            <p className="text-gray-500 max-w-sm">Dada tu tendencia actual, se estima un cumplimiento del {analyticsData?.summary.projection.score}% para el próximo mes de {analyticsData?.summary.projection.nextMonth}.</p>
                            <Button variant="link" className="text-blue-600 font-semibold underline decoration-2 underline-offset-4">
                                Ver predicciones detalladas
                            </Button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Reports;
