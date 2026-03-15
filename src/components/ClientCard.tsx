import { useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, AlertTriangle, CheckCircle, Clock, ChevronRight, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  red: 'border-status-danger/40 hover:border-status-danger/70',
  yellow: 'border-status-warning/40 hover:border-status-warning/70',
  green: 'border-status-success/30 hover:border-status-success/50',
};

const bgColors: Record<ClientStatus, string> = {
  red: 'from-status-danger/5 to-transparent',
  yellow: 'from-status-warning/5 to-transparent',
  green: 'from-status-success/5 to-transparent',
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
    if (days < 0) return `Venció hace ${Math.abs(days)} día${Math.abs(days) > 1 ? 's' : ''}`;
    if (days === 0) return '¡Vence hoy!';
    if (days === 1) return 'Vence mañana';
    return `Vence en ${days} días`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      whileHover={{ scale: 1.015, y: -2 }}
      onClick={onClick}
      className={`
        relative group cursor-pointer rounded-xl border bg-gradient-to-br ${bgColors[client.status]}
        ${borderColors[client.status]} bg-card shadow-sm hover:shadow-md
        transition-all duration-200 p-5
      `}
    >
      {/* Remove button */}
      {onRemove && !showConfirmRemove && (
        <button
          onClick={handleRemoveClick}
          className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
          title="Eliminar cliente"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}

      {/* Confirm remove */}
      {showConfirmRemove && (
        <div
          className="absolute top-2 right-2 flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2 shadow-lg z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="text-xs text-muted-foreground">¿Quitar cliente?</span>
          <Button size="sm" variant="destructive" className="h-6 text-xs px-2" onClick={handleConfirmRemove}>
            Sí
          </Button>
          <Button size="sm" variant="outline" className="h-6 text-xs px-2" onClick={handleCancelRemove}>
            No
          </Button>
        </div>
      )}

      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
            <Building2 className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-foreground text-sm truncate leading-tight">
              {client.nickname || client.companyName}
            </p>
            {client.nickname && (
              <p className="text-xs text-muted-foreground truncate">{client.companyName}</p>
            )}
            {client.cuit && (
              <p className="text-xs text-muted-foreground">CUIT {client.cuit}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
          <StatusDot status={client.status} />
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>

      {/* Status label */}
      <StatusLabel
        status={client.status}
        overdueCount={client.overdueCount}
        urgentCount={client.urgentCount}
      />

      {/* Next obligation */}
      {client.nextObligation ? (
        <div className="mt-2 p-2.5 rounded-lg bg-muted/50">
          <p className="text-xs text-muted-foreground truncate">{client.nextObligation.name}</p>
          <p className="text-xs font-medium text-foreground mt-0.5">
            {formatDate(client.nextObligation.dueDate)} ·{' '}
            <span
              className={
                client.nextObligation.daysUntilDue <= 0
                  ? 'text-status-danger'
                  : client.nextObligation.daysUntilDue <= 7
                  ? 'text-status-warning'
                  : 'text-muted-foreground'
              }
            >
              {formatDaysLeft(client.nextObligation.daysUntilDue)}
            </span>
          </p>
        </div>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground italic">Sin obligaciones cargadas</p>
      )}

      {/* Footer stats */}
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground border-t border-border/50 pt-2.5">
        <span>{client.totalObligations} obligación{client.totalObligations !== 1 ? 'es' : ''}</span>
        {client.overdueCount > 0 && (
          <span className="text-status-danger font-medium">{client.overdueCount} vencida{client.overdueCount > 1 ? 's' : ''}</span>
        )}
      </div>
    </motion.div>
  );
}
