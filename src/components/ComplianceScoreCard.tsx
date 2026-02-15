import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    TrendingUp,
    TrendingDown,
    Minus,
    ChevronDown,
    ChevronUp,
    RefreshCw
} from 'lucide-react';
import { useRealtimeComplianceScore, useRecalculateComplianceScore } from '@/hooks/useComplianceScore';
import {
    complianceLevelLabels,
    getScoreColor,
    type ComplianceLevel
} from '@/services/complianceScoreService';
import { ScoreBreakdown } from './ScoreBreakdown';
import { motion, AnimatePresence } from 'framer-motion';

interface ComplianceScoreCardProps {
    className?: string;
}

export function ComplianceScoreCard({ className = '' }: ComplianceScoreCardProps) {
    const score = useRealtimeComplianceScore();
    const { mutate: recalculate, isPending } = useRecalculateComplianceScore();
    const [isExpanded, setIsExpanded] = useState(false);

    if (!score) {
        return (
            <Card className={`p-6 ${className}`}>
                <div className="animate-pulse">
                    <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
                    <div className="h-32 bg-muted rounded"></div>
                </div>
            </Card>
        );
    }

    const { score: scoreValue, level, breakdown } = score;
    const color = getScoreColor(scoreValue);
    const circumference = 2 * Math.PI * 70; // radius = 70
    const strokeDashoffset = circumference - (scoreValue / 100) * circumference;

    // Determine trend (for now, we'll show neutral - in future, compare with previous score)
    const trend: 'up' | 'down' | 'neutral' = 'neutral';

    const getLevelBadgeColor = (lvl: ComplianceLevel) => {
        switch (lvl) {
            case 'alto':
                return 'bg-green-100 text-green-800 border-green-300';
            case 'medio':
                return 'bg-yellow-100 text-yellow-800 border-yellow-300';
            case 'bajo':
                return 'bg-red-100 text-red-800 border-red-300';
        }
    };

    const getBackgroundGradient = (lvl: ComplianceLevel) => {
        switch (lvl) {
            case 'alto':
                return 'from-green-50 to-emerald-50';
            case 'medio':
                return 'from-yellow-50 to-amber-50';
            case 'bajo':
                return 'from-red-50 to-rose-50';
        }
    };

    return (
        <Card className={`overflow-hidden ${className}`}>
            <div className={`bg-gradient-to-br ${getBackgroundGradient(level)} p-6`}>
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-foreground mb-2">
                            Score de Cumplimiento
                        </h2>
                        <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getLevelBadgeColor(level)}`}>
                                {complianceLevelLabels[level]}
                            </span>
                            {trend !== 'neutral' && (
                                <span className="text-muted-foreground text-sm flex items-center gap-1">
                                    {trend === 'up' ? (
                                        <TrendingUp className="w-4 h-4 text-green-600" />
                                    ) : trend === 'down' ? (
                                        <TrendingDown className="w-4 h-4 text-red-600" />
                                    ) : (
                                        <Minus className="w-4 h-4" />
                                    )}
                                </span>
                            )}
                        </div>
                    </div>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => recalculate()}
                        disabled={isPending}
                        className="gap-2"
                    >
                        <RefreshCw className={`w-4 h-4 ${isPending ? 'animate-spin' : ''}`} />
                        Actualizar
                    </Button>
                </div>

                <div className="flex items-center justify-between gap-8">
                    {/* Circular Progress */}
                    <div className="relative flex-shrink-0">
                        <svg className="transform -rotate-90 w-40 h-40">
                            {/* Background circle */}
                            <circle
                                cx="80"
                                cy="80"
                                r="70"
                                stroke="currentColor"
                                strokeWidth="12"
                                fill="none"
                                className="text-muted/20"
                            />
                            {/* Progress circle */}
                            <motion.circle
                                cx="80"
                                cy="80"
                                r="70"
                                stroke={color}
                                strokeWidth="12"
                                fill="none"
                                strokeLinecap="round"
                                strokeDasharray={circumference}
                                initial={{ strokeDashoffset: circumference }}
                                animate={{ strokeDashoffset }}
                                transition={{ duration: 1, ease: 'easeOut' }}
                            />
                        </svg>
                        {/* Score text */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                                <motion.div
                                    className="text-4xl font-bold"
                                    style={{ color }}
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.5, delay: 0.3 }}
                                >
                                    {scoreValue}
                                </motion.div>
                                <div className="text-sm text-muted-foreground">de 100</div>
                            </div>
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="flex-1">
                        <p className="text-muted-foreground leading-relaxed">
                            {breakdown.summary}
                        </p>
                        {breakdown.penalties.length > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="mt-4 gap-2"
                            >
                                {isExpanded ? (
                                    <>
                                        <ChevronUp className="w-4 h-4" />
                                        Ocultar detalles
                                    </>
                                ) : (
                                    <>
                                        <ChevronDown className="w-4 h-4" />
                                        Ver detalles
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Expandable Breakdown */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                    >
                        <div className="border-t">
                            <ScoreBreakdown breakdown={breakdown} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </Card>
    );
}
