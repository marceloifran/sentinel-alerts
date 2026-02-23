import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import {
    ShieldCheck,
    AlertTriangle,
    Calendar,
    Clock,
    ShieldAlert,
    ShieldQuestion,
    TrendingUp
} from 'lucide-react';
import { ComplianceScore } from '@/services/complianceScoreService';
import { Obligation } from '@/services/obligationService';
import { calculateRiskLevel } from '@/services/reportDataService';
import { motion } from 'framer-motion';

interface ExecutiveSummaryProps {
    complianceScore: ComplianceScore | null;
    obligations: Obligation[];
    className?: string;
}

export function ExecutiveSummary({ complianceScore, obligations, className = '' }: ExecutiveSummaryProps) {
    const risk = useMemo(() => {
        if (!complianceScore) return null;
        return calculateRiskLevel(obligations, complianceScore);
    }, [obligations, complianceScore]);

    const nextObligation = useMemo(() => {
        if (obligations.length === 0) return null;

        // Filter obligations that are not 'vencida' and sort by due_date
        const upcoming = obligations
            .filter(o => o.status !== 'vencida')
            .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());

        return upcoming.length > 0 ? upcoming[0] : null;
    }, [obligations]);

    const timeUntilNext = useMemo(() => {
        if (!nextObligation) return null;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const due = new Date(nextObligation.due_date);
        due.setHours(0, 0, 0, 0);

        const diffTime = due.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Hoy';
        if (diffDays === 1) return 'Mañana';
        if (diffDays < 0) return `${Math.abs(diffDays)} días de retraso`;
        return `${diffDays} días`;
    }, [nextObligation]);

    const getRiskStyles = (level: string) => {
        switch (level) {
            case 'bajo':
                return { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100', icon: ShieldCheck };
            case 'medio':
                return { color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-100', icon: ShieldQuestion };
            case 'alto':
                return { color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100', icon: ShieldAlert };
            case 'crítico':
                return { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100', icon: AlertTriangle };
            default:
                return { color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-100', icon: ShieldCheck };
        }
    };

    const riskStyles = risk ? getRiskStyles(risk.level) : getRiskStyles('bajo');
    const RiskIcon = riskStyles.icon;

    return (
        <Card className={`overflow-hidden border-none shadow-sm bg-gradient-to-br from-background to-muted/30 ${className}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-y md:divide-y-0 md:divide-x border border-border rounded-xl">
                {/* Compliance Score */}
                <div className="p-5 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-xs font-semibold uppercase tracking-wider">Cumplimiento</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-foreground">
                            {complianceScore?.score ?? 0}%
                        </span>
                    </div>
                </div>

                {/* Risk Level */}
                <div className={`p-5 flex flex-col justify-center`}>
                    <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                        <RiskIcon className="w-4 h-4" />
                        <span className="text-xs font-semibold uppercase tracking-wider">Riesgo</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`text-xl font-bold capitalize ${riskStyles.color}`}>
                            {risk?.level ?? 'Bajo'}
                        </span>
                        <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${riskStyles.bg} ${riskStyles.color} border ${riskStyles.border}`}>
                            Nivel {risk?.level === 'crítico' ? 'Max' : risk?.level ?? 'Base'}
                        </div>
                    </div>
                </div>

                {/* Next Obligation */}
                <div className="p-5 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span className="text-xs font-semibold uppercase tracking-wider">Próxima obligación</span>
                    </div>
                    <div className="text-foreground">
                        <span className="text-lg font-bold">
                            {nextObligation ? new Date(nextObligation.due_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Sin pendientes'}
                        </span>
                        {nextObligation && (
                            <p className="text-xs text-muted-foreground truncate max-w-[150px]" title={nextObligation.name}>
                                {nextObligation.name}
                            </p>
                        )}
                    </div>
                </div>

                {/* Days until expiry */}
                <div className="p-5 flex flex-col justify-center bg-primary/[0.02]">
                    <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span className="text-xs font-semibold uppercase tracking-wider">Próximo vencimiento</span>
                    </div>
                    <div className="text-foreground">
                        <span className="text-xl font-bold">
                            {timeUntilNext ?? '-'}
                        </span>
                        <p className="text-xs text-muted-foreground">
                            {nextObligation ? 'Restantes' : 'No hay vencimientos'}
                        </p>
                    </div>
                </div>
            </div>
        </Card>
    );
}
