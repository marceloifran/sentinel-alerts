import { AIInsight } from '@/services/aiAnalysisService';
import { Sparkles, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';

interface AIInsightsPanelProps {
    insights: AIInsight[];
}

export function AIInsightsPanel({ insights }: AIInsightsPanelProps) {
    const getIcon = (type: string) => {
        switch (type) {
            case 'success': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
            case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
            case 'critical': return <AlertCircle className="w-5 h-5 text-red-500" />;
            default: return <Info className="w-5 h-5 text-blue-500" />;
        }
    };

    const getBadgeColor = (type: string) => {
        switch (type) {
            case 'success': return 'bg-green-50 text-green-700 border-green-100';
            case 'warning': return 'bg-amber-50 text-amber-700 border-amber-100';
            case 'critical': return 'bg-red-50 text-red-700 border-red-100';
            default: return 'bg-blue-50 text-blue-700 border-blue-100';
        }
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-purple-50 rounded-xl">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-gray-800">Análisis con IA</h3>
                    <p className="text-sm text-gray-500">Insights y recomendaciones personalizadas</p>
                </div>
            </div>

            <div className="space-y-4">
                {insights.map((insight, index) => (
                    <div
                        key={index}
                        className="p-4 rounded-xl border border-gray-50 bg-gray-50/30 hover:bg-gray-50 transition-colors"
                    >
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5">
                                {getIcon(insight.type)}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                    <h4 className="font-semibold text-gray-900">{insight.title}</h4>
                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getBadgeColor(insight.type)}`}>
                                        {insight.type}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 mb-2 leading-relaxed">
                                    {insight.description}
                                </p>
                                <div className="bg-white/60 p-3 rounded-lg border border-gray-100/50">
                                    <p className="text-xs font-medium text-gray-800 flex gap-2">
                                        <span className="text-purple-600 font-bold italic">R:</span>
                                        {insight.recommendation}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {insights.length === 0 && (
                    <div className="text-center py-8">
                        <p className="text-sm text-gray-500 italic">No hay suficientes datos para generar insights en este momento.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
