import { Button } from '@/components/ui/button';
import { FileText, Download, Loader2 } from 'lucide-react';
import { useGenerateReport, useCanGenerateReport } from '@/hooks/useReportGeneration';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

interface ReportGeneratorProps {
    variant?: 'default' | 'outline' | 'ghost';
    size?: 'default' | 'sm' | 'lg' | 'icon';
    showIcon?: boolean;
    showText?: boolean;
    className?: string;
}

export function ReportGenerator({
    variant = 'default',
    size = 'default',
    showIcon = true,
    showText = true,
    className = ''
}: ReportGeneratorProps) {
    const { mutate: generateReport, isPending } = useGenerateReport();
    const canGenerate = useCanGenerateReport();

    const handleGenerateReport = () => {
        if (!canGenerate) return;
        generateReport();
    };

    const buttonContent = (
        <>
            {isPending ? (
                <Loader2 className={`${showText ? 'mr-2' : ''} h-4 w-4 animate-spin`} />
            ) : showIcon ? (
                <FileText className={`${showText ? 'mr-2' : ''} h-4 w-4`} />
            ) : null}
            {showText && (isPending ? 'Generando...' : 'Generar Reporte PDF')}
        </>
    );

    if (!canGenerate) {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <span>
                            <Button
                                variant={variant}
                                size={size}
                                disabled
                                className={className}
                            >
                                {buttonContent}
                            </Button>
                        </span>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Necesitas tener obligaciones registradas para generar un reporte</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant={variant}
                        size={size}
                        onClick={handleGenerateReport}
                        disabled={isPending}
                        className={className}
                    >
                        {buttonContent}
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Descargar reporte de cumplimiento en PDF</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

/**
 * Compact version for use in headers or toolbars
 */
export function ReportGeneratorCompact() {
    return (
        <ReportGenerator
            variant="outline"
            size="sm"
            showIcon={true}
            showText={false}
        />
    );
}

/**
 * Full button version for use in cards or prominent locations
 */
export function ReportGeneratorButton() {
    return (
        <ReportGenerator
            variant="default"
            size="default"
            showIcon={true}
            showText={true}
            className="gap-2"
        />
    );
}
