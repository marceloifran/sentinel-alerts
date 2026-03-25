import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Trash2, Clock, Building2, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from "@/lib/utils";
import type { ClientCompany, ClientStatus } from '@/services/accountantClientService';

interface ClientCardProps {
  client: ClientCompany;
  delay?: number;
  onClick: () => void;
  onRemove?: () => void;
}

function StatusDot({ status }: { status: ClientStatus }) {
  const colors: Record<ClientStatus, string> = {
    red: 'bg-status-danger shadow-[0_0_8px_2px_rgba(239,68,68,0.4)]',
    yellow: 'bg-status-warning shadow-[0_0_8px_2px_rgba(245,158,11,0.35)]',
    green: 'bg-status-success shadow-[0_0_8px_2px_rgba(34,197,94,0.35)]',
  };
  return (
    <span className={`inline-block w-3 h-3 rounded-full flex-shrink-0 ${colors[status]}`} />
  );
}

function StatusLabel({ status, overdueCount, urgentCount }: { status: ClientStatus; overdueCount: number; urgentCount: number }) {
  if (status === 'red') {
    return (
      <span className="text-xs font-medium text-status-danger flex items-center gap-1">
        <AlertTriangle className="w-3 h-3" />
        {overdueCount > 0 ? `${overdueCount} vencida${overdueCount > 1 ? 's' : ''}` : '¡Vence hoy!'}
      </span>
    );
  }
  if (status === 'yellow') {
    return (
      <span className="text-xs font-medium text-status-warning flex items-center gap-1">
        <Clock className="w-3 h-3" />
        {urgentCount} vence{urgentCount > 1 ? 'n' : ''} pronto
      </span>
    );
  }
  return (
    <span className="text-xs font-medium text-status-success flex items-center gap-1">
      <CheckCircle className="w-3 h-3" />
      Al día
    </span>
  );
}

const borderColors: Record<ClientStatus, string> = {
  red: 'hover:border-rose-500/50 border-border/50 shadow-rose-500/5',
  yellow: 'hover:border-amber-500/50 border-border/50 shadow-amber-500/5',
  green: 'hover:border-emerald-500/50 border-border/50 shadow-emerald-500/5',
};

const bgGradients: Record<ClientStatus, string> = {
  red: 'hover:from-rose-500/[0.03] hover:to-transparent',
  yellow: 'hover:from-amber-500/[0.03] hover:to-transparent',
  green: 'hover:from-emerald-500/[0.03] hover:to-transparent',
};

export function ClientCard({ client, delay = 0, onClick, onRemove }: ClientCardProps) {
  const [showConfirmRemove, setShowConfirmRemove] = useState(false);

  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowConfirmRemove(true);
  };

  const handleConfirmRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove?.();
    setShowConfirmRemove(false);
  };

  const handleCancelRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowConfirmRemove(false);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
  };

  const formatDaysLeft = (days: number) => {
    if (days < 0) return `Venció hace ${Math.abs(days)}d`;
    if (days === 0) return '¡Vence hoy!';
    if (days === 1) return 'Mañana';
    return `En ${days} días`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      whileHover={{ y: -4 }}
      onClick={onClick}
      className={cn(
        "relative group cursor-pointer rounded-2xl border bg-card transition-all duration-300",
        "shadow-sm hover:shadow-xl",
        borderColors[client.status],
        bgGradients[client.status],
        "p-5"
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary/50 border border-border/50 transition-colors group-hover:bg-background">
            <Building2 className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-foreground leading-tight truncate group-hover:text-primary transition-colors">
              {client.nickname || client.companyName}
            </h3>
            <p className="text-[11px] font-medium text-muted-foreground/70 uppercase tracking-wider mt-0.5 truncate">
              {client.cuit ? `CUIT ${client.cuit}` : 'Sin CUIT'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <StatusDot status={client.status} />
          <div className="h-6 w-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all bg-secondary/80">
            <ChevronRight className="h-3.5 w-3.5 text-foreground" />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {client.nextObligation ? (
          <div className="rounded-xl bg-muted/30 p-3 border border-border/30 transition-colors group-hover:bg-background/50 group-hover:border-primary/10">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-tight truncate">
                {client.nextObligation.name}
              </span>
              <span className={cn(
                "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                client.status === 'red' ? "bg-rose-500/10 text-rose-600" : 
                client.status === 'yellow' ? "bg-amber-500/10 text-amber-600" : 
                "bg-emerald-500/10 text-emerald-600"
              )}>
                {formatDate(client.nextObligation.dueDate)}
              </span>
            </div>
            <p className={cn(
              "text-xs font-medium mt-1.5 flex items-center gap-1.5",
              client.nextObligation.daysUntilDue <= 0 ? "text-rose-500" : 
              client.nextObligation.daysUntilDue <= 7 ? "text-amber-500" : 
              "text-emerald-500"
            )}>
              <Clock className="h-3 w-3" />
              {formatDaysLeft(client.nextObligation.daysUntilDue)}
            </p>
          </div>
        ) : (
          <div className="rounded-xl bg-muted/30 p-3 border border-dashed border-border/50 text-center">
             <p className="text-[11px] italic text-muted-foreground">Sin obligaciones futuras</p>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <div className="flex -space-x-1">
             <span className="text-[10px] font-bold text-muted-foreground/80 bg-secondary/50 px-2 py-0.5 rounded-full border border-border/50">
               {client.totalObligations} totales
             </span>
          </div>
          <StatusLabel
            status={client.status}
            overdueCount={client.overdueCount}
            urgentCount={client.urgentCount}
          />
        </div>
      </div>

      {onRemove && !showConfirmRemove && (
        <button
          onClick={handleRemoveClick}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all p-1.5 rounded-lg hover:bg-rose-500/10 hover:text-rose-600 text-muted-foreground/50"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}

      {showConfirmRemove && (
        <div
          className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-card/95 backdrop-blur-sm rounded-2xl p-4 text-center animate-in fade-in zoom-in duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-xs font-bold mb-3">¿Eliminar este cliente?</p>
          <div className="flex gap-2">
            <Button size="sm" variant="destructive" className="h-8 text-[11px] font-bold px-4" onClick={handleConfirmRemove}>
              Sí, eliminar
            </Button>
            <Button size="sm" variant="ghost" className="h-8 text-[11px] px-4" onClick={handleCancelRemove}>
              No
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
