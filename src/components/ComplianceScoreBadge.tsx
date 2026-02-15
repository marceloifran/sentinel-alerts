import { complianceLevelLabels, type ComplianceLevel } from '@/services/complianceScoreService';

interface ComplianceScoreBadgeProps {
    score: number;
    level: ComplianceLevel;
    size?: 'sm' | 'md' | 'lg';
    showLabel?: boolean;
    className?: string;
}

export function ComplianceScoreBadge({
    score,
    level,
    size = 'md',
    showLabel = true,
    className = ''
}: ComplianceScoreBadgeProps) {
    const getLevelColor = (lvl: ComplianceLevel) => {
        switch (lvl) {
            case 'alto':
                return 'bg-green-100 text-green-800 border-green-300';
            case 'medio':
                return 'bg-yellow-100 text-yellow-800 border-yellow-300';
            case 'bajo':
                return 'bg-red-100 text-red-800 border-red-300';
        }
    };

    const getSizeClasses = () => {
        switch (size) {
            case 'sm':
                return 'text-xs px-2 py-1';
            case 'md':
                return 'text-sm px-3 py-1.5';
            case 'lg':
                return 'text-base px-4 py-2';
        }
    };

    return (
        <div className={`inline-flex items-center gap-2 ${className}`}>
            <span className={`inline-flex items-center gap-1.5 rounded-full font-medium border ${getLevelColor(level)} ${getSizeClasses()}`}>
                <span className="font-bold">{score}</span>
                {showLabel && (
                    <>
                        <span className="text-muted-foreground/50">•</span>
                        <span>{complianceLevelLabels[level]}</span>
                    </>
                )}
            </span>
        </div>
    );
}
