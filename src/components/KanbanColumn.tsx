import { Obligation, ObligationStatus, statusLabels } from "@/services/obligationService";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import KanbanCard from "./KanbanCard";
import { CheckCircle, AlertTriangle, XCircle } from "lucide-react";

interface KanbanColumnProps {
    status: ObligationStatus;
    obligations: Obligation[];
    onCardClick: (id: string) => void;
}

const statusConfig = {
    al_dia: {
        icon: CheckCircle,
        color: "text-status-success",
        bgColor: "bg-status-success/10",
        borderColor: "border-status-success/20",
    },
    por_vencer: {
        icon: AlertTriangle,
        color: "text-status-warning",
        bgColor: "bg-status-warning/10",
        borderColor: "border-status-warning/20",
    },
    vencida: {
        icon: XCircle,
        color: "text-status-danger",
        bgColor: "bg-status-danger/10",
        borderColor: "border-status-danger/20",
    },
};

const KanbanColumn = ({ status, obligations, onCardClick }: KanbanColumnProps) => {
    const { setNodeRef, isOver } = useDroppable({
        id: status,
    });

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
        <div className="flex flex-col h-full min-w-[280px]">
            <div className={`flex items-center gap-2 p-3 rounded-t-lg border ${config.borderColor} ${config.bgColor}`}>
                <Icon className={`w-5 h-5 ${config.color}`} />
                <h3 className="font-semibold text-foreground">
                    {statusLabels[status]}
                </h3>
                <span className="ml-auto text-sm text-muted-foreground font-medium">
                    {obligations.length}
                </span>
            </div>

            <div
                ref={setNodeRef}
                className={`flex-1 p-3 space-y-2 bg-muted/30 rounded-b-lg border border-t-0 ${config.borderColor
                    } min-h-[400px] transition-colors ${isOver ? "bg-primary/5 border-primary" : ""
                    }`}
            >
                <SortableContext
                    items={obligations.map((o) => o.id)}
                    strategy={verticalListSortingStrategy}
                >
                    {obligations.length === 0 ? (
                        <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
                            Sin obligaciones
                        </div>
                    ) : (
                        obligations.map((obligation) => (
                            <KanbanCard
                                key={obligation.id}
                                obligation={obligation}
                                onClick={() => onCardClick(obligation.id)}
                            />
                        ))
                    )}
                </SortableContext>
            </div>
        </div>
    );
};

export default KanbanColumn;
