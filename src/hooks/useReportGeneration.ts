import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useObligations } from './useObligations';
import { useRealtimeComplianceScore } from './useComplianceScore';
import {
    aggregateReportData,
    type ReportData
} from '@/services/reportDataService';
import {
    generateComplianceReport,
    downloadReport,
    generateReportFileName
} from '@/services/reportGenerationService';
import { toast } from 'sonner';

/**
 * Hook for generating and downloading compliance reports
 */
export function useGenerateReport() {
    const { user, profile } = useAuth();
    const { data: obligations = [] } = useObligations();
    const complianceScore = useRealtimeComplianceScore();

    const mutation = useMutation({
        mutationFn: async (): Promise<Blob> => {
            if (!user) {
                throw new Error('Usuario no autenticado');
            }

            if (!complianceScore) {
                throw new Error('Score de cumplimiento no disponible');
            }

            // Show progress toast
            const loadingToast = toast.loading('Generando reporte PDF...');

            try {
                // Aggregate all report data
                const reportData: ReportData = aggregateReportData(
                    obligations,
                    complianceScore,
                    profile?.name || user.email || 'Usuario',
                    user.email || ''
                );

                // Generate PDF
                const pdfBlob = await generateComplianceReport(reportData);

                toast.dismiss(loadingToast);
                return pdfBlob;
            } catch (error) {
                toast.dismiss(loadingToast);
                throw error;
            }
        },
        onSuccess: (blob) => {
            // Generate filename
            const fileName = generateReportFileName(
                profile?.name || user?.email || 'empresa',
                new Date()
            );

            // Download the PDF
            downloadReport(blob, fileName);

            toast.success('Reporte generado exitosamente', {
                description: 'El archivo PDF se ha descargado automáticamente'
            });
        },
        onError: (error) => {
            console.error('Error generating report:', error);
            toast.error('Error al generar el reporte', {
                description: error instanceof Error ? error.message : 'Ocurrió un error inesperado'
            });
        }
    });

    return mutation;
}

/**
 * Hook to check if report can be generated
 */
export function useCanGenerateReport(): boolean {
    const { user } = useAuth();
    const { data: obligations = [] } = useObligations();
    const complianceScore = useRealtimeComplianceScore();

    return !!(user && obligations.length > 0 && complianceScore);
}
