import { FileText, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

import { ReactNode } from "react";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
  showButton?: boolean;
}

const EmptyState = ({
  title = "No hay obligaciones registradas",
  description = "Comienza agregando obligaciones desde nuestras sugerencias inteligentes de vencimientos.",
  icon,
  showButton = true
}: EmptyStateProps) => {


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

      </div>


    </>
  );
};

export default EmptyState;
