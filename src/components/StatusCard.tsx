import { cn } from "@/lib/utils";

interface StatusCardProps {
  count: number;
  label: string;
  status: 'success' | 'warning' | 'danger';
  icon: React.ReactNode;
  active?: boolean;
}

const StatusCard = ({ count, label, status, icon, active = false }: StatusCardProps) => {
  const statusColors = {
    success: 'text-emerald-600 border-emerald-100 bg-emerald-50/50',
    warning: 'text-amber-600 border-amber-100 bg-amber-50/50',
    danger: 'text-rose-600 border-rose-100 bg-rose-50/50',
  };

  const ringColors = {
    success: 'ring-emerald-500/20',
    warning: 'ring-amber-500/20',
    danger: 'ring-rose-500/20',
  };

  return (
    <div className={cn(
      "relative flex items-center justify-between p-4 rounded-xl border bg-card transition-all duration-300",
      "hover:shadow-md hover:-translate-y-0.5",
      statusColors[status],
      active && cn("ring-4", ringColors[status])
    )}>
      <div>
        <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">{label}</p>
        <p className="text-2xl font-extrabold tracking-tight mt-0.5">{count}</p>
      </div>
      <div className={cn(
        "h-9 w-9 rounded-lg flex items-center justify-center bg-white shadow-sm border border-inherit/20",
        statusColors[status]
      )}>
        {icon}
      </div>
    </div>
  );
};

export default StatusCard;
