import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Copy, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import type { Obligation } from '@/services/obligationService';
import { calculateStatus } from '@/services/obligationService';

interface DuplicateObligationsDialogProps {
  obligations: Obligation[];
  responsibles: { id: string; name: string; email: string }[];
}

const DuplicateObligationsDialog = ({ obligations, responsibles }: DuplicateObligationsDialogProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [sourceResponsible, setSourceResponsible] = useState('');
  const [targetResponsible, setTargetResponsible] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Get unique responsibles that have obligations
  const responsiblesWithObligations = responsibles.filter(r =>
    obligations.some(o => o.responsible_id === r.id)
  );

  const sourceObligations = obligations.filter(o => o.responsible_id === sourceResponsible);

  const handleDuplicate = async () => {
    if (!sourceResponsible || !targetResponsible || !user) return;
    if (sourceResponsible === targetResponsible) {
      toast.error('El origen y destino no pueden ser el mismo');
      return;
    }

    setIsLoading(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const newObligations = sourceObligations.map(o => {
        // Calculate relative date: keep the same day offset from today
        const originalDue = new Date(o.due_date);
        const daysFromNow = Math.max(
          30,
          Math.ceil((originalDue.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        );
        const newDueDate = new Date(today);
        newDueDate.setDate(newDueDate.getDate() + daysFromNow);
        const dueDateStr = newDueDate.toISOString().split('T')[0];

        return {
          name: o.name,
          category: o.category,
          due_date: dueDateStr,
          responsible_id: targetResponsible,
          created_by: user.id,
          status: calculateStatus(dueDateStr),
          recurrence: o.recurrence || 'none',
          notes: o.notes || null,
        };
      });

      const { error } = await supabase
        .from('obligations')
        .insert(newObligations as any);

      if (error) throw error;

      toast.success(`${newObligations.length} obligaciones duplicadas correctamente`);
      queryClient.invalidateQueries({ queryKey: ['obligations'] });
      setOpen(false);
      setSourceResponsible('');
      setTargetResponsible('');
    } catch (error: any) {
      console.error('Error duplicating:', error);
      toast.error(error.message || 'Error al duplicar obligaciones');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Copy className="w-4 h-4" />
          Duplicar estructura
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Duplicar obligaciones</DialogTitle>
          <DialogDescription>
            Copia todas las obligaciones de un responsable a otro. Las fechas se mantienen relativas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Copiar de (origen)</label>
            <Select value={sourceResponsible} onValueChange={setSourceResponsible}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar responsable origen" />
              </SelectTrigger>
              <SelectContent>
                {responsiblesWithObligations.map(r => (
                  <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {sourceResponsible && (
              <p className="text-xs text-muted-foreground">
                {sourceObligations.length} obligaciones para copiar
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Copiar a (destino)</label>
            <Select value={targetResponsible} onValueChange={setTargetResponsible}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar responsable destino" />
              </SelectTrigger>
              <SelectContent>
                {responsibles
                  .filter(r => r.id !== sourceResponsible)
                  .map(r => (
                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {sourceResponsible && sourceObligations.length > 0 && (
            <div className="border rounded-lg p-3 bg-muted/50 max-h-40 overflow-y-auto">
              <p className="text-xs font-medium text-muted-foreground mb-2">Se copiarán:</p>
              {sourceObligations.map(o => (
                <div key={o.id} className="text-sm py-1 flex justify-between">
                  <span>{o.name}</span>
                  <span className="text-xs text-muted-foreground">{o.recurrence !== 'none' ? `🔄 ${o.recurrence}` : ''}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button
            onClick={handleDuplicate}
            disabled={!sourceResponsible || !targetResponsible || isLoading || sourceObligations.length === 0}
            className="gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Duplicando...
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Duplicar {sourceObligations.length} obligaciones
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DuplicateObligationsDialog;
