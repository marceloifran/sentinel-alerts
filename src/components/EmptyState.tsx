import { FileText, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { SimpleSuggestionsModal } from "./SimpleSuggestionsModal";
import { ReactNode } from "react";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
  showButton?: boolean;
}

const EmptyState = ({
  title = "No hay obligaciones registradas",
  description = "Comienza agregando obligaciones desde nuestras sugerencias inteligentes basadas en tu sector.",
  icon,
  showButton = true
}: EmptyStateProps) => {
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mb-6">
          {icon || <FileText className="w-8 h-8 text-accent-foreground" />}
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">
          {title}
        </h3>
        <p className="text-muted-foreground mb-6 max-w-sm">
          {description}
        </p>
        {showButton && (
          <Button
            onClick={() => setSuggestionsOpen(true)}
            className="gap-2"
            size="lg"
          >
            <Lightbulb className="w-5 h-5" />
            Ver Sugerencias Inteligentes
          </Button>
        )}
      </div>

      <SimpleSuggestionsModal
        open={suggestionsOpen}
        onOpenChange={setSuggestionsOpen}
      />
    </>
  );
};

export default EmptyState;
