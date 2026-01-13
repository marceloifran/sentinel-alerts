import { cn } from "@/lib/utils";

interface StatusCardProps {
  count: number;
  label: string;
  status: 'success' | 'warning' | 'danger';
  icon: React.ReactNode;
}

const StatusCard = ({ count, label, status, icon }: StatusCardProps) => {
  return (
    <div className={cn(
      "card-elevated p-6 transition-all duration-200 hover:shadow-elevated animate-fade-in",
      status === 'success' && "border-l-4 border-l-status-success",
      status === 'warning' && "border-l-4 border-l-status-warning",
      status === 'danger' && "border-l-4 border-l-status-danger"
    )}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className={cn(
            "text-4xl font-bold mt-2",
            status === 'success' && "text-status-success",
            status === 'warning' && "text-status-warning",
            status === 'danger' && "text-status-danger"
          )}>
            {count}
          </p>
        </div>
        <div className={cn(
          "p-3 rounded-xl",
          status === 'success' && "bg-status-success-bg",
          status === 'warning' && "bg-status-warning-bg",
          status === 'danger' && "bg-status-danger-bg"
        )}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default StatusCard;
