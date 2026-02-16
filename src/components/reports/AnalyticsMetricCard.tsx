import { LucideIcon } from "lucide-react";

interface AnalyticsMetricCardProps {
    title: string;
    value: string | number;
    trend?: string;
    trendType?: 'positive' | 'negative' | 'neutral';
    icon: LucideIcon;
    description?: string;
    color?: string;
}

export function AnalyticsMetricCard({
    title,
    value,
    trend,
    trendType = 'neutral',
    icon: Icon,
    description,
    color = 'blue'
}: AnalyticsMetricCardProps) {
    const trendColor = trendType === 'positive' ? 'text-green-600' : trendType === 'negative' ? 'text-red-600' : 'text-gray-500';
    const bgColor = {
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-green-50 text-green-600',
        orange: 'bg-orange-50 text-orange-600',
        purple: 'bg-purple-50 text-purple-600',
        red: 'bg-red-50 text-red-600'
    }[color] || 'bg-blue-50 text-blue-600';

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-1 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-xl ${bgColor}`}>
                    <Icon className="w-5 h-5" />
                </div>
                {trend && (
                    <span className={`text-xs font-semibold ${trendColor}`}>
                        {trend}
                    </span>
                )}
            </div>
            <div>
                <h3 className="text-sm font-medium text-gray-500">{title}</h3>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                {description && (
                    <p className="text-xs text-gray-400 mt-1">{description}</p>
                )}
            </div>
        </div>
    );
}
