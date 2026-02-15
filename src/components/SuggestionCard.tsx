import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Calendar,
    CheckCircle2,
    XCircle,
    FileText,
    AlertTriangle,
    Scale,
    DollarSign,
    Clock,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { type TemplateSuggestion } from '@/services/templateService';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface SuggestionCardProps {
    suggestion: TemplateSuggestion;
    onAccept: () => void;
    onReject: () => void;
    isLoading?: boolean;
}

const CRITICALITY_CONFIG = {
    alta: {
        label: 'Alta',
        color: 'bg-status-danger text-status-danger-foreground',
        icon: AlertTriangle,
    },
    media: {
        label: 'Media',
        color: 'bg-status-warning text-status-warning-foreground',
        icon: Clock,
    },
    baja: {
        label: 'Baja',
        color: 'bg-status-success text-status-success-foreground',
        icon: CheckCircle2,
    },
};

const CATEGORY_CONFIG: Record<string, { label: string; color: string }> = {
    fiscal: { label: 'Fiscal', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
    laboral: { label: 'Laboral', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
    legal: { label: 'Legal', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' },
    ambiental: { label: 'Ambiental', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
    sanitario: { label: 'Sanitario', color: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200' },
    otro: { label: 'Otro', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200' },
};

const FREQUENCY_LABELS: Record<string, string> = {
    mensual: 'Mensual',
    bimestral: 'Bimestral',
    trimestral: 'Trimestral',
    semestral: 'Semestral',
    anual: 'Anual',
    unica: 'Única vez',
};

export function SuggestionCard({ suggestion, onAccept, onReject, isLoading }: SuggestionCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const criticalityConfig = CRITICALITY_CONFIG[suggestion.criticality];
    const CriticalityIcon = criticalityConfig.icon;
    const categoryConfig = CATEGORY_CONFIG[suggestion.category] || CATEGORY_CONFIG.otro;

    return (
        <Card className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="p-4 sm:p-6">
                {/* Header */}
                <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <Badge className={cn('text-xs font-medium', criticalityConfig.color)}>
                                <CriticalityIcon className="w-3 h-3 mr-1" />
                                {criticalityConfig.label}
                            </Badge>
                            <Badge variant="outline" className={cn('text-xs', categoryConfig.color)}>
                                {categoryConfig.label}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                                <Clock className="w-3 h-3 mr-1" />
                                {FREQUENCY_LABELS[suggestion.frequency]}
                            </Badge>
                        </div>

                        <h3 className="text-lg font-semibold text-foreground mb-1 line-clamp-2">
                            {suggestion.title}
                        </h3>

                        {suggestion.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                                {suggestion.description}
                            </p>
                        )}
                    </div>
                </div>

                {/* Match Reason */}
                <div className="mb-4 p-3 bg-primary/5 rounded-lg border border-primary/10">
                    <p className="text-xs text-primary font-medium">
                        💡 {suggestion.match_reason}
                    </p>
                </div>

                {/* Expandable Details */}
                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                        >
                            <div className="space-y-4 mb-4 pt-4 border-t border-border">
                                {/* Required Documents */}
                                {suggestion.required_documents && suggestion.required_documents.length > 0 && (
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <FileText className="w-4 h-4 text-muted-foreground" />
                                            <span className="text-sm font-medium text-foreground">Documentación requerida:</span>
                                        </div>
                                        <ul className="list-disc list-inside space-y-1 ml-6">
                                            {suggestion.required_documents.map((doc, idx) => (
                                                <li key={idx} className="text-sm text-muted-foreground">{doc}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Legal Reference */}
                                {suggestion.legal_reference && (
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <Scale className="w-4 h-4 text-muted-foreground" />
                                            <span className="text-sm font-medium text-foreground">Marco legal:</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground ml-6">{suggestion.legal_reference}</p>
                                    </div>
                                )}

                                {/* Penalty Description */}
                                {suggestion.penalty_description && (
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <AlertTriangle className="w-4 h-4 text-status-danger" />
                                            <span className="text-sm font-medium text-status-danger">Consecuencias de incumplimiento:</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground ml-6">{suggestion.penalty_description}</p>
                                    </div>
                                )}

                                {/* Estimated Cost */}
                                {suggestion.estimated_cost && (
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <DollarSign className="w-4 h-4 text-muted-foreground" />
                                            <span className="text-sm font-medium text-foreground">Costo estimado:</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground ml-6">{suggestion.estimated_cost}</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Toggle Details Button */}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-full mb-4 text-xs"
                >
                    {isExpanded ? (
                        <>
                            <ChevronUp className="w-4 h-4 mr-1" />
                            Ver menos
                        </>
                    ) : (
                        <>
                            <ChevronDown className="w-4 h-4 mr-1" />
                            Ver más detalles
                        </>
                    )}
                </Button>

                {/* Actions */}
                <div className="flex gap-2">
                    <Button
                        onClick={onAccept}
                        disabled={isLoading}
                        className="flex-1 gap-2"
                    >
                        <CheckCircle2 className="w-4 h-4" />
                        Aceptar
                    </Button>
                    <Button
                        onClick={onReject}
                        disabled={isLoading}
                        variant="outline"
                        className="flex-1 gap-2"
                    >
                        <XCircle className="w-4 h-4" />
                        Rechazar
                    </Button>
                </div>
            </div>
        </Card>
    );
}
