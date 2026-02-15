import {
    AlertTriangle,
    Clock,
    UserX,
    FileX,
    XCircle
} from 'lucide-react';
import type { ScoreBreakdown as ScoreBreakdownType } from '@/services/complianceScoreService';

interface ScoreBreakdownProps {
    breakdown: ScoreBreakdownType;
}

export function ScoreBreakdown({ breakdown }: ScoreBreakdownProps) {
    const { penalties, totalObligations } = breakdown;

    if (penalties.length === 0) {
        return (
            <div className="p-6 text-center text-muted-foreground">
                <p>No hay penalizaciones. ¡Excelente trabajo!</p>
            </div>
        );
    }

    const getPenaltyIcon = (type: string) => {
        if (type.startsWith('overdue')) {
            return <XCircle className="w-5 h-5 text-red-600" />;
        }
        if (type.startsWith('upcoming')) {
            return <Clock className="w-5 h-5 text-yellow-600" />;
        }
        if (type === 'no_responsible') {
            return <UserX className="w-5 h-5 text-orange-600" />;
        }
        if (type === 'no_docs_critical') {
            return <FileX className="w-5 h-5 text-purple-600" />;
        }
        return <AlertTriangle className="w-5 h-5 text-gray-600" />;
    };

    const getPenaltyColor = (type: string) => {
        if (type.startsWith('overdue')) {
            return 'border-l-red-500 bg-red-50/50';
        }
        if (type.startsWith('upcoming')) {
            return 'border-l-yellow-500 bg-yellow-50/50';
        }
        if (type === 'no_responsible') {
            return 'border-l-orange-500 bg-orange-50/50';
        }
        if (type === 'no_docs_critical') {
            return 'border-l-purple-500 bg-purple-50/50';
        }
        return 'border-l-gray-500 bg-gray-50/50';
    };

    return (
        <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Desglose de Penalizaciones</h3>

            <div className="space-y-3 mb-6">
                {penalties.map((penalty, index) => (
                    <div
                        key={index}
                        className={`flex items-start gap-3 p-4 rounded-lg border-l-4 ${getPenaltyColor(penalty.type)}`}
                    >
                        <div className="flex-shrink-0 mt-0.5">
                            {getPenaltyIcon(penalty.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <p className="font-medium text-foreground">
                                        {penalty.description}
                                    </p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {penalty.count} {penalty.count === 1 ? 'obligación' : 'obligaciones'}
                                    </p>
                                </div>
                                <div className="flex-shrink-0 text-right">
                                    <p className="text-lg font-bold text-red-600">
                                        -{penalty.pointsDeducted}
                                    </p>
                                    <p className="text-xs text-muted-foreground">puntos</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recommendations */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Recomendaciones
                </h4>
                <ul className="text-sm text-blue-800 space-y-1 ml-6 list-disc">
                    {penalties.some(p => p.type.startsWith('overdue')) && (
                        <li>Prioriza resolver las obligaciones vencidas lo antes posible</li>
                    )}
                    {penalties.some(p => p.type.startsWith('upcoming')) && (
                        <li>Revisa las obligaciones próximas a vencer y planifica su cumplimiento</li>
                    )}
                    {penalties.some(p => p.type === 'no_responsible') && (
                        <li>Asigna responsables a todas las obligaciones pendientes</li>
                    )}
                    {penalties.some(p => p.type === 'no_docs_critical') && (
                        <li>Adjunta documentación a las obligaciones críticas</li>
                    )}
                </ul>
            </div>

            <div className="mt-4 text-sm text-muted-foreground text-center">
                Total de obligaciones: {totalObligations}
            </div>
        </div>
    );
}
