import { FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const EmptyState = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mb-6">
        <FileText className="w-8 h-8 text-accent-foreground" />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">
        No hay obligaciones registradas
      </h3>
      <p className="text-muted-foreground mb-6 max-w-sm">
        Comienza agregando tu primera obligación para que el sistema te ayude a estar al día.
      </p>
      <Button onClick={() => navigate('/obligaciones/nueva')} className="gap-2">
        <Plus className="w-4 h-4" />
        Nueva obligación
      </Button>
    </div>
  );
};

export default EmptyState;
