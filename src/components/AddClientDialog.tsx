import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Building2, Plus } from 'lucide-react';

interface AddClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (companyName: string, cuit?: string) => Promise<void>;
}

export function AddClientDialog({ open, onOpenChange, onConfirm }: AddClientDialogProps) {
  const [companyName, setCompanyName] = useState('');
  const [cuit, setCuit] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) return;
    setLoading(true);
    try {
      await onConfirm(companyName.trim(), cuit.trim() || undefined);
      setCompanyName('');
      setCuit('');
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setCompanyName('');
      setCuit('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <DialogTitle>Agregar cliente</DialogTitle>
          </div>
          <DialogDescription>
            Ingresá los datos del cliente que gestionás. Luego podrás cargar sus obligaciones y vencimientos.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="clientCompanyName">Nombre del cliente *</Label>
            <Input
              id="clientCompanyName"
              placeholder="Ej: Constructora Norte S.A."
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              disabled={loading}
              autoFocus
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="clientCuit">
              CUIT <span className="text-muted-foreground font-normal">(opcional)</span>
            </Label>
            <Input
              id="clientCuit"
              placeholder="Ej: 30-12345678-9"
              value={cuit}
              onChange={(e) => setCuit(e.target.value)}
              disabled={loading}
              className="h-11"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !companyName.trim()} className="gap-2">
              {loading ? (
                'Guardando...'
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Agregar cliente
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
