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
    AlertCircle,
    Loader2
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
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    generateComplianceReport,
    downloadReport,
    generateReportFileName
} from "@/services/reportGenerationService";
import { aggregateReportData } from "@/services/reportDataService";
import { calculateComplianceScore } from "@/services/complianceScoreService";
import { toast } from "sonner";

const Reports = () => {
    const navigate = useNavigate();
    const { user, profile, isAdmin, isLoading: authLoading, signOut } = useAuth();
    const { data: obligations = [], isLoading, error } = useObligations();
    const [analyticsData, setAnalyticsData] = useState<any>(null);
    const [insights, setInsights] = useState<any[]>([]);
    const [isExporting, setIsExporting] = useState(false);

    // Filter states
    const [categoryFilter, setCategoryFilter] = useState<string>("all");
    const [criticalityFilter, setCriticalityFilter] = useState<string>("all");

    const filteredObligations = useMemo(() => {
        return obligations.filter(o => {
            const matchesCategory = categoryFilter === "all" || o.category === categoryFilter;
            const matchesCriticality = criticalityFilter === "all" || o.criticality === criticalityFilter;
            return matchesCategory && matchesCriticality;
        });
    }, [obligations, categoryFilter, criticalityFilter]);

    useEffect(() => {
        if (filteredObligations.length > 0 || obligations.length > 0) {
            const fetchData = async () => {
                const data = await getAnalyticsData(filteredObligations);
                setAnalyticsData(data);
                const aiInsights = generateAIInsights(data.complianceTrends, data.responseTimeMetrics, data.summary);
                setInsights(aiInsights);
            };
            fetchData();
        }
    }, [filteredObligations, obligations.length]);

    const handleExportPDF = async () => {
        if (!user || !analyticsData) return;

        try {
            setIsExporting(true);
            const score = calculateComplianceScore(filteredObligations);
            const reportData = aggregateReportData(
                filteredObligations,
                score,
                profile?.name || user.email || "Usuario",
                user.email || ""
            );

            const blob = await generateComplianceReport(reportData);
            const fileName = generateReportFileName(profile?.name || "Empresa", new Date());
            downloadReport(blob, fileName);
            toast.success("Reporte generado exitosamente");
        } catch (error) {
            console.error("Error generating report:", error);
            toast.error("Error al generar el reporte");
        } finally {
            setIsExporting(false);
        }
    };

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
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="gap-2 rounded-xl group hover:border-blue-400">
                                    <Filter className="w-4 h-4 group-hover:text-blue-500" />
                                    <span>Filtros</span>
                                    {(categoryFilter !== "all" || criticalityFilter !== "all") && (
                                        <span className="ml-1 w-2 h-2 rounded-full bg-blue-500" />
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-72 p-4 rounded-2xl shadow-xl" align="end">
                                <div className="space-y-4">
                                    <h4 className="font-semibold text-gray-900">Filtrar Análisis</h4>
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</label>
                                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                            <SelectTrigger className="rounded-xl">
                                                <SelectValue placeholder="Todas las categorías" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl">
                                                <SelectItem value="all">Todas</SelectItem>
                                                <SelectItem value="fiscal">Fiscal</SelectItem>
                                                <SelectItem value="legal">Legal</SelectItem>
                                                <SelectItem value="seguridad">Seguridad</SelectItem>
                                                <SelectItem value="operativa">Operativa</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Criticidad</label>
                                        <Select value={criticalityFilter} onValueChange={setCriticalityFilter}>
                                            <SelectTrigger className="rounded-xl">
                                                <SelectValue placeholder="Todas las criticidades" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl">
                                                <SelectItem value="all">Todas</SelectItem>
                                                <SelectItem value="alta">Alta</SelectItem>
                                                <SelectItem value="media">Media</SelectItem>
                                                <SelectItem value="baja">Baja</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        className="w-full text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                        onClick={() => {
                                            setCategoryFilter("all");
                                            setCriticalityFilter("all");
                                        }}
                                    >
                                        Limpiar Filtros
                                    </Button>
                                </div>
                            </PopoverContent>
                        </Popover>

                        <Button
                            onClick={handleExportPDF}
                            disabled={isExporting}
                            className="gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 shadow-sm transition-all hover:scale-[1.02] disabled:opacity-70"
                        >
                            {isExporting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Download className="w-4 h-4" />
                            )}
                            <span>{isExporting ? "Generando..." : "Exportar PDF"}</span>
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
