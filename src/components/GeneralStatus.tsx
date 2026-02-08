import { cn } from "@/lib/utils";
import { ShieldCheck, ShieldAlert } from "lucide-react";

interface GeneralStatusProps {
  hasOverdue: boolean;
}

const GeneralStatus = ({ hasOverdue }: GeneralStatusProps) => {
  return (
    <div className={cn(
      "flex items-center gap-3 px-5 py-4 rounded-xl border",
      hasOverdue 
        ? "bg-status-danger-bg border-status-danger/20" 
        : "bg-status-success-bg border-status-success/20"
    )}>
      {hasOverdue ? (
        <>
          <ShieldAlert className="w-6 h-6 text-status-danger animate-pulse-subtle" />
          <div>
            <p className="text-sm font-medium text-status-danger-foreground">Mi resumen</p>
            <p className="text-lg font-bold text-status-danger">En riesgo</p>
          </div>
        </>
      ) : (
        <>
          <ShieldCheck className="w-6 h-6 text-status-success" />
          <div>
            <p className="text-sm font-medium text-status-success-foreground">Mi resumen</p>
            <p className="text-lg font-bold text-status-success">Cubierto</p>
          </div>
        </>
      )}
    </div>
  );
};

export default GeneralStatus;
