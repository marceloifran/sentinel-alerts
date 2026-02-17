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
        "card-elevated p-3.5 sm:p-5 cursor-pointer transition-all duration-200",
        "hover:shadow-elevated hover:border-primary/20",
        "animate-slide-up"
      )}
      onClick={onClick}
    >
      <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4">
        <div className="flex-1 min-w-0 w-full">
          {/* Header section with badges and category */}
          <div className="flex items-center gap-2 mb-2.5 flex-wrap">
            <div className="flex items-center gap-1.5 shrink-0">
              <CategoryIcon category={obligation.category} />
              <span className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider">
                {categoryLabels[obligation.category]}
              </span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {obligation.criticality && (
                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 flex items-center gap-1 font-semibold ${getCriticalityColor(obligation.criticality)}`}>
                  <AlertCircle className="w-3 h-3" />
                  {criticalityLabels[obligation.criticality]}
                </Badge>
              )}
              {obligation.recurrence && obligation.recurrence !== 'none' && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 flex items-center gap-1 font-medium bg-secondary/30">
                  <RefreshCw className="w-2.5 h-2.5" />
                  {recurrenceLabels[obligation.recurrence]}
                </Badge>
              )}
            </div>

            {/* Status badge moved here for mobile if needed, or keep it on top right */}
            <div className="sm:hidden ml-auto">
              <StatusBadge status={obligation.status} size="sm" />
            </div>
          </div>

          <h3 className="font-bold text-base sm:text-lg text-foreground leading-tight mb-3">
            {obligation.name}
          </h3>

          <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-center gap-y-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                <Calendar className="w-3.5 h-3.5 text-blue-500" />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
                <span className="font-medium text-foreground/80">{formattedDate}</span>
                <div className="flex items-center">
                  {daysUntilDue > 0 && daysUntilDue <= 30 && (
                    <span className="text-[10px] px-1.5 rounded-full bg-orange-100 text-orange-700 font-bold whitespace-nowrap">
                      {daysUntilDue} días
                    </span>
                  )}
                  {daysUntilDue < 0 && (
                    <span className="text-[10px] px-1.5 rounded-full bg-red-100 text-red-700 font-bold whitespace-nowrap">
                      vencida
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-slate-50 flex items-center justify-center shrink-0">
                <User className="w-3.5 h-3.5 text-slate-500" />
              </div>
              <span className="font-medium">{obligation.responsible_name || 'Sin asignar'}</span>
            </div>
          </div>
        </div>

        <div className="hidden sm:block">
          <StatusBadge status={obligation.status} />
        </div>
      </div>
    </div>
  );
};

export default ObligationCard;
