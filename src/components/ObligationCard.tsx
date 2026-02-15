import { cn } from "@/lib/utils";
import { categoryLabels, Obligation, recurrenceLabels, criticalityLabels } from "@/services/obligationService";
import { CategoryIcon } from "./CategoryIcon";
import StatusBadge from "./StatusBadge";
import { Calendar, User, RefreshCw, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

interface ObligationCardProps {
  obligation: Obligation;
  onClick?: () => void;
}

const ObligationCard = ({ obligation, onClick }: ObligationCardProps) => {
  // Parse date - handle both Date objects and string dates
  const parseDueDate = (dateValue: any): Date => {
    if (dateValue instanceof Date) return dateValue;
    if (typeof dateValue === 'string') {
      // Try parsing as ISO date first
      const parsed = new Date(dateValue);
      if (!isNaN(parsed.getTime())) return parsed;

      // Try parsing DD/MM/YYYY format
      const parts = dateValue.split('/');
      if (parts.length === 3) {
        const [day, month, year] = parts;
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        if (!isNaN(date.getTime())) return date;
      }
    }
    return new Date(); // Fallback to today
  };

  const dueDate = parseDueDate(obligation.due_date);
  const isValidDate = !isNaN(dueDate.getTime());
  const formattedDate = isValidDate ? format(dueDate, "d 'de' MMMM, yyyy", { locale: es }) : 'Fecha inválida';
  const daysUntilDue = isValidDate ? Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0;

  const getCriticalityColor = (criticality: string) => {
    switch (criticality) {
      case 'alta':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'media':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'baja':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div
      className={cn(
        "card-elevated p-5 cursor-pointer transition-all duration-200",
        "hover:shadow-elevated hover:border-primary/20",
        "animate-slide-up"
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <CategoryIcon category={obligation.category} />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {categoryLabels[obligation.category]}
            </span>
            {obligation.criticality && (
              <Badge variant="outline" className={`text-xs flex items-center gap-1 ${getCriticalityColor(obligation.criticality)}`}>
                <AlertCircle className="w-3 h-3" />
                {criticalityLabels[obligation.criticality]}
              </Badge>
            )}
            {obligation.recurrence && obligation.recurrence !== 'none' && (
              <Badge variant="outline" className="text-xs flex items-center gap-1">
                <RefreshCw className="w-3 h-3" />
                {recurrenceLabels[obligation.recurrence]}
              </Badge>
            )}
          </div>

          <h3 className="font-semibold text-foreground truncate mb-3">
            {obligation.name}
          </h3>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              <span>{formattedDate}</span>
              {daysUntilDue > 0 && daysUntilDue <= 30 && (
                <span className="text-xs text-status-warning">
                  ({daysUntilDue} días)
                </span>
              )}
              {daysUntilDue < 0 && (
                <span className="text-xs text-status-danger">
                  (vencida hace {Math.abs(daysUntilDue)} días)
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <User className="w-4 h-4" />
              <span>{obligation.responsible_name || 'Sin asignar'}</span>
            </div>
          </div>
        </div>

        <StatusBadge status={obligation.status} />
      </div>
    </div>
  );
};

export default ObligationCard;
