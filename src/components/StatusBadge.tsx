import { cn } from "@/lib/utils";
import { ObligationStatus, statusLabels } from "@/types/obligation";
import { CheckCircle, AlertTriangle, XCircle } from "lucide-react";

interface StatusBadgeProps {
  status: ObligationStatus;
  size?: 'sm' | 'md';
}

const StatusBadge = ({ status, size = 'md' }: StatusBadgeProps) => {
  const icons = {
    al_dia: CheckCircle,
    por_vencer: AlertTriangle,
    vencida: XCircle,
  };

  const Icon = icons[status];

  return (
    <span className={cn(
      "status-badge",
      status === 'al_dia' && "status-success",
      status === 'por_vencer' && "status-warning",
      status === 'vencida' && "status-danger",
      size === 'sm' && "text-xs px-2 py-0.5",
      size === 'md' && "text-sm px-3 py-1"
    )}>
      <Icon className={cn(
        size === 'sm' && "w-3 h-3",
        size === 'md' && "w-4 h-4"
      )} />
      {statusLabels[status]}
    </span>
  );
};

export default StatusBadge;
