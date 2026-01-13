import { Obligation, ObligationStatus } from "@/services/obligationService";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, User } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { categoryIcons } from "@/services/obligationService";

interface KanbanCardProps {
  obligation: Obligation;
  onClick: () => void;
}

const KanbanCard = ({ obligation, onClick }: KanbanCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: obligation.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="bg-card border border-border rounded-lg p-3 cursor-pointer hover:shadow-md transition-all group"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-medium text-sm text-foreground line-clamp-2 flex-1">
          {obligation.name}
        </h3>
        <span className="text-lg shrink-0">
          {categoryIcons[obligation.category]}
        </span>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="w-3 h-3" />
          <span>{format(new Date(obligation.due_date), "PPP", { locale: es })}</span>
        </div>

        {obligation.responsible_name && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <User className="w-3 h-3" />
            <span className="truncate">{obligation.responsible_name}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default KanbanCard;
