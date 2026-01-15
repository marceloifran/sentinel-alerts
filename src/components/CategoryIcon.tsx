import {
    Scale,
    PieChart,
    ShieldCheck,
    Briefcase,
    LucideIcon
} from "lucide-react";
import { ObligationCategory } from "@/services/obligationService";
import { cn } from "@/lib/utils";

export const categoryIconMap: Record<ObligationCategory, LucideIcon> = {
    legal: Scale,
    fiscal: PieChart,
    seguridad: ShieldCheck,
    operativa: Briefcase,
};

export const categoryColors: Record<ObligationCategory, string> = {
    legal: "text-blue-500",
    fiscal: "text-emerald-500",
    seguridad: "text-indigo-500",
    operativa: "text-slate-500",
};

export const categoryBackgrounds: Record<ObligationCategory, string> = {
    legal: "bg-blue-500/10",
    fiscal: "bg-emerald-500/10",
    seguridad: "bg-indigo-500/10",
    operativa: "bg-slate-500/10",
};

interface CategoryIconProps {
    category: ObligationCategory;
    className?: string;
    withBackground?: boolean;
}

export function CategoryIcon({ category, className, withBackground = false }: CategoryIconProps) {
    const Icon = categoryIconMap[category];

    if (!Icon) return null;

    if (withBackground) {
        return (
            <div className={cn(
                "p-2 rounded-lg flex items-center justify-center",
                categoryBackgrounds[category],
                className
            )}>
                <Icon className={cn("w-5 h-5", categoryColors[category])} />
            </div>
        );
    }

    return <Icon className={cn("w-5 h-5", categoryColors[category], className)} />;
}
