import { cn } from "@/lib/utils";
import { ShieldCheck, ShieldAlert, AlertTriangle } from "lucide-react";
import { useRealtimeComplianceScore } from "@/hooks/useComplianceScore";

const GeneralStatus = () => {
  const score = useRealtimeComplianceScore();

  if (!score) {
    return (
      <div className="flex items-center gap-3 px-5 py-4 rounded-xl border bg-muted/50 border-border animate-pulse">
        <div className="w-6 h-6 bg-muted rounded"></div>
        <div>
          <div className="h-4 w-20 bg-muted rounded mb-2"></div>
          <div className="h-5 w-24 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  const { score: scoreValue, level } = score;

  // Determine status based on compliance level
  const getStatusConfig = () => {
    if (level === 'alto') {
      return {
        icon: ShieldCheck,
        bgClass: "bg-status-success-bg border-status-success/20",
        iconClass: "text-status-success",
        textClass: "text-status-success-foreground",
        titleClass: "text-status-success",
        title: "Cumplimiento Alto",
        subtitle: `Score: ${scoreValue}/100`
      };
    } else if (level === 'medio') {
      return {
        icon: AlertTriangle,
        bgClass: "bg-status-warning-bg border-status-warning/20",
        iconClass: "text-status-warning",
        textClass: "text-status-warning-foreground",
        titleClass: "text-status-warning",
        title: "Cumplimiento Medio",
        subtitle: `Score: ${scoreValue}/100`
      };
    } else {
      return {
        icon: ShieldAlert,
        bgClass: "bg-status-danger-bg border-status-danger/20",
        iconClass: "text-status-danger animate-pulse-subtle",
        textClass: "text-status-danger-foreground",
        titleClass: "text-status-danger",
        title: "En Riesgo",
        subtitle: `Score: ${scoreValue}/100`
      };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className={cn(
      "flex items-center gap-3 px-5 py-4 rounded-xl border",
      config.bgClass
    )}>
      <Icon className={cn("w-6 h-6", config.iconClass)} />
      <div>
        <p className={cn("text-sm font-medium", config.textClass)}>Mi resumen</p>
        <p className={cn("text-lg font-bold", config.titleClass)}>{config.title}</p>
      </div>
    </div>
  );
};

export default GeneralStatus;
