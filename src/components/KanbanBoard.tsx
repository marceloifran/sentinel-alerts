import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    DndContext,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import { Obligation, ObligationStatus, updateObligationStatus } from "@/services/obligationService";
import KanbanColumn from "./KanbanColumn";
import KanbanCard from "./KanbanCard";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface KanbanBoardProps {
    obligations: Obligation[];
    onUpdate: () => void;
}

const KanbanBoard = ({ obligations, onUpdate }: KanbanBoardProps) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [activeObligation, setActiveObligation] = useState<Obligation | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    const obligationsByStatus = {
        al_dia: obligations.filter((o) => o.status === "al_dia"),
        por_vencer: obligations.filter((o) => o.status === "por_vencer"),
        vencida: obligations.filter((o) => o.status === "vencida"),
    };

    const handleDragStart = (event: DragStartEvent) => {
        const obligation = obligations.find((o) => o.id === event.active.id);
        setActiveObligation(obligation || null);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveObligation(null);

        if (!over || active.id === over.id) return;

        const obligation = obligations.find((o) => o.id === active.id);
        if (!obligation) return;

        const newStatus = over.id as ObligationStatus;
        if (obligation.status === newStatus) return;

        if (!user) {
            toast.error("Debes iniciar sesión");
            return;
        }

        try {
            await updateObligationStatus(
                obligation.id,
                newStatus,
                obligation.status,
                user.id,
                `Estado cambiado desde ${obligation.status} a ${newStatus}`
            );
            toast.success("Estado actualizado correctamente");
            onUpdate();
        } catch (error) {
            console.error("Error updating status:", error);
            toast.error("Error al actualizar el estado");
        }
    };

    const handleCardClick = (id: string) => {
        navigate(`/obligaciones/${id}`);
    };

    return (
        <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="flex gap-4 overflow-x-auto pb-4">
                <KanbanColumn
                    status="al_dia"
                    obligations={obligationsByStatus.al_dia}
                    onCardClick={handleCardClick}
                />
                <KanbanColumn
                    status="por_vencer"
                    obligations={obligationsByStatus.por_vencer}
                    onCardClick={handleCardClick}
                />
                <KanbanColumn
                    status="vencida"
                    obligations={obligationsByStatus.vencida}
                    onCardClick={handleCardClick}
                />
            </div>

            <DragOverlay>
                {activeObligation ? (
                    <div className="rotate-3 scale-105">
                        <KanbanCard
                            obligation={activeObligation}
                            onClick={() => { }}
                        />
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
};

export default KanbanBoard;
