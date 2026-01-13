import { cn } from "@/lib/utils";
import { categoryLabels, categoryIcons, ObligationStatus, ObligationCategory } from "@/services/obligationService";
import StatusBadge from "./StatusBadge";
import { Calendar, User } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Obligation {
  id: string;
  name: string;
  category: ObligationCategory;
  dueDate: Date;
  responsibleId: string;
  responsibleName: string;
  status: ObligationStatus;
  createdAt: Date;
  updatedAt: Date;
}

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

  const dueDate = parseDueDate(obligation.dueDate);
  const isValidDate = !isNaN(dueDate.getTime());
  const formattedDate = isValidDate ? format(dueDate, "d 'de' MMMM, yyyy", { locale: es }) : 'Fecha inválida';
  const daysUntilDue = isValidDate ? Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0;

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
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{categoryIcons[obligation.category]}</span>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {categoryLabels[obligation.category]}
            </span>
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
              <span>{obligation.responsibleName}</span>
            </div>
          </div>
        </div>

        <StatusBadge status={obligation.status} />
      </div>
    </div>
  );
};

export default ObligationCard;
