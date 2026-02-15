import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SuggestionCard } from './SuggestionCard';
import { useTemplateSuggestions, useAcceptTemplate, useRejectTemplate } from '@/hooks/useTemplateSuggestions';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Sparkles, Filter, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ObligationSuggestionsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ObligationSuggestionsModal({ open, onOpenChange }: ObligationSuggestionsModalProps) {
    const { user } = useAuth();
    const { data: suggestions = [], isLoading } = useTemplateSuggestions();
    const acceptTemplate = useAcceptTemplate();
    const rejectTemplate = useRejectTemplate();

    const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
    const [dueDate, setDueDate] = useState('');
    const [responsibleId, setResponsibleId] = useState(user?.id || '');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [criticalityFilter, setCriticalityFilter] = useState<string>('all');

    // Filter suggestions
    const filteredSuggestions = suggestions.filter(s => {
        if (categoryFilter !== 'all' && s.category !== categoryFilter) return false;
        if (criticalityFilter !== 'all' && s.criticality !== criticalityFilter) return false;
        return true;
    });

    const handleAccept = (templateId: string) => {
        setSelectedTemplate(templateId);
        // Set default due date to 30 days from now
        const defaultDate = new Date();
        defaultDate.setDate(defaultDate.getDate() + 30);
        setDueDate(defaultDate.toISOString().split('T')[0]);
    };

    const handleConfirmAccept = () => {
        if (!selectedTemplate || !dueDate || !responsibleId) return;

        acceptTemplate.mutate({
            templateId: selectedTemplate,
            dueDate: new Date(dueDate),
            responsibleId,
        }, {
            onSuccess: () => {
                setSelectedTemplate(null);
                setDueDate('');
            },
        });
    };

    const handleReject = (templateId: string) => {
        rejectTemplate.mutate(templateId);
    };

    const categories = Array.from(new Set(suggestions.map(s => s.category)));
    const hasFilters = categoryFilter !== 'all' || criticalityFilter !== 'all';

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-6 h-6 text-primary" />
                            <DialogTitle className="text-2xl">Sugerencias Inteligentes</DialogTitle>
                        </div>
                        <DialogDescription>
                            Basadas en tu sector, te sugerimos estas obligaciones comunes que podrías necesitar gestionar.
                        </DialogDescription>
                    </DialogHeader>

                    {/* Filters */}
                    <div className="flex flex-wrap gap-2 pb-4 border-b border-border">
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Filtros:</span>
                        </div>

                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                            <SelectTrigger className="w-[150px] h-8">
                                <SelectValue placeholder="Categoría" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas</SelectItem>
                                {categories.map(cat => (
                                    <SelectItem key={cat} value={cat}>
                                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={criticalityFilter} onValueChange={setCriticalityFilter}>
                            <SelectTrigger className="w-[150px] h-8">
                                <SelectValue placeholder="Criticidad" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas</SelectItem>
                                <SelectItem value="alta">Alta</SelectItem>
                                <SelectItem value="media">Media</SelectItem>
                                <SelectItem value="baja">Baja</SelectItem>
                            </SelectContent>
                        </Select>

                        {hasFilters && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setCategoryFilter('all');
                                    setCriticalityFilter('all');
                                }}
                                className="h-8"
                            >
                                <X className="w-4 h-4 mr-1" />
                                Limpiar
                            </Button>
                        )}

                        <div className="ml-auto">
                            <Badge variant="secondary">
                                {filteredSuggestions.length} sugerencias
                            </Badge>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto pr-2">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            </div>
                        ) : filteredSuggestions.length === 0 ? (
                            <div className="text-center py-12">
                                <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                <p className="text-lg font-medium text-foreground mb-2">
                                    {hasFilters ? 'No hay sugerencias con estos filtros' : '¡Excelente!'}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {hasFilters
                                        ? 'Intenta ajustar los filtros para ver más sugerencias'
                                        : 'No tenemos más sugerencias para tu sector en este momento'
                                    }
                                </p>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {filteredSuggestions.map((suggestion) => (
                                    <SuggestionCard
                                        key={suggestion.template_id}
                                        suggestion={suggestion}
                                        onAccept={() => handleAccept(suggestion.template_id)}
                                        onReject={() => handleReject(suggestion.template_id)}
                                        isLoading={acceptTemplate.isPending || rejectTemplate.isPending}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Accept Confirmation Dialog */}
            <Dialog open={!!selectedTemplate} onOpenChange={() => setSelectedTemplate(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Configurar Obligación</DialogTitle>
                        <DialogDescription>
                            Define la fecha de vencimiento y el responsable para esta obligación.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="due-date">Fecha de vencimiento</Label>
                            <Input
                                id="due-date"
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="responsible">Responsable</Label>
                            <Input
                                id="responsible"
                                value={responsibleId}
                                disabled
                                className="bg-muted"
                            />
                            <p className="text-xs text-muted-foreground">
                                Por defecto, tú serás el responsable. Podrás cambiarlo después.
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-2 justify-end">
                        <Button
                            variant="outline"
                            onClick={() => setSelectedTemplate(null)}
                            disabled={acceptTemplate.isPending}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleConfirmAccept}
                            disabled={!dueDate || acceptTemplate.isPending}
                        >
                            {acceptTemplate.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Crear Obligación
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
