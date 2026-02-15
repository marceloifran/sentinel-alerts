import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { ReportData, RiskLevel } from './reportDataService';
import type { Obligation } from './obligationService';
import { categoryLabels, criticalityLabels } from './obligationService';
import { complianceLevelLabels } from './complianceScoreService';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
    interface jsPDF {
        autoTable: typeof autoTable;
        lastAutoTable: {
            finalY: number;
        };
    }
}

/**
 * Color palette for the report
 */
const COLORS = {
    primary: '#1e3a8a',      // Dark blue
    secondary: '#64748b',    // Slate gray
    success: '#16a34a',      // Green
    warning: '#ca8a04',      // Yellow/Amber
    danger: '#dc2626',       // Red
    critical: '#991b1b',     // Dark red
    lightGray: '#f1f5f9',
    mediumGray: '#cbd5e1',
    darkGray: '#475569',
    white: '#ffffff'
};

/**
 * Get color for risk level
 */
function getRiskColor(level: RiskLevel['level']): string {
    switch (level) {
        case 'crítico': return COLORS.critical;
        case 'alto': return COLORS.danger;
        case 'medio': return COLORS.warning;
        case 'bajo': return COLORS.success;
    }
}

/**
 * Get color for compliance level
 */
function getComplianceColor(score: number): string {
    if (score >= 80) return COLORS.success;
    if (score >= 50) return COLORS.warning;
    return COLORS.danger;
}

/**
 * Add cover page
 */
function addCoverPage(doc: jsPDF, data: ReportData): void {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Background gradient effect (simulated with rectangles)
    doc.setFillColor(30, 58, 138); // primary color
    doc.rect(0, 0, pageWidth, 80, 'F');

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('REPORTE DE CUMPLIMIENTO', pageWidth / 2, 35, { align: 'center' });

    doc.setFontSize(22);
    doc.text('EMPRESARIAL', pageWidth / 2, 50, { align: 'center' });

    // Company info box
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(30, 100, pageWidth - 60, 60, 3, 3, 'F');

    doc.setTextColor(30, 58, 138);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Empresa:', 40, 115);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(14);
    doc.setTextColor(71, 85, 105);
    doc.text(data.companyInfo.name, 40, 130);

    if (data.companyInfo.address) {
        doc.setFontSize(11);
        doc.text(data.companyInfo.address, 40, 142);
    }

    if (data.companyInfo.taxId) {
        doc.setFontSize(11);
        doc.text(`CUIT/RUT: ${data.companyInfo.taxId}`, 40, 152);
    }

    // Report info
    doc.setFontSize(12);
    doc.setTextColor(100, 116, 139);
    const dateStr = format(data.generatedAt, "d 'de' MMMM 'de' yyyy, HH:mm", { locale: es });
    doc.text(`Fecha de generación: ${dateStr}`, pageWidth / 2, 185, { align: 'center' });
    doc.text(`Período: ${data.reportPeriod}`, pageWidth / 2, 195, { align: 'center' });

    // Footer
    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184);
    doc.text('Documento generado automáticamente por Sentinel Alerts', pageWidth / 2, pageHeight - 20, { align: 'center' });
}

/**
 * Add executive summary section
 */
function addExecutiveSummary(doc: jsPDF, data: ReportData): void {
    doc.addPage();
    let yPos = 20;

    // Section title
    doc.setFillColor(30, 58, 138);
    doc.rect(0, yPos, doc.internal.pageSize.getWidth(), 12, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('RESUMEN EJECUTIVO', 15, yPos + 8);

    yPos += 25;

    // Compliance Score Box
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(15, yPos, 85, 45, 2, 2, 'F');

    doc.setTextColor(71, 85, 105);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Score de Cumplimiento', 20, yPos + 10);

    const scoreColor = getComplianceColor(data.complianceScore.score);
    doc.setTextColor(scoreColor);
    doc.setFontSize(32);
    doc.text(data.complianceScore.score.toString(), 57, yPos + 30, { align: 'center' });

    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139);
    doc.text(complianceLevelLabels[data.complianceScore.level], 57, yPos + 40, { align: 'center' });

    // Risk Level Box
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(110, yPos, 85, 45, 2, 2, 'F');

    doc.setTextColor(71, 85, 105);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Nivel de Riesgo Legal', 115, yPos + 10);

    const riskColor = getRiskColor(data.riskLevel.level);
    doc.setTextColor(riskColor);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(data.riskLevel.level.toUpperCase(), 152, yPos + 28, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.text(`Score: ${data.riskLevel.score}`, 152, yPos + 38, { align: 'center' });

    yPos += 60;

    // Statistics table
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 58, 138);
    doc.text('Estadísticas Generales', 15, yPos);

    yPos += 5;

    autoTable(doc, {
        startY: yPos,
        head: [['Métrica', 'Cantidad', 'Porcentaje']],
        body: [
            ['Total de Obligaciones', data.statistics.total.toString(), '100%'],
            ['Al Día', data.statistics.alDia.toString(), `${Math.round((data.statistics.alDia / data.statistics.total) * 100)}%`],
            ['Por Vencer', data.statistics.porVencer.toString(), `${Math.round((data.statistics.porVencer / data.statistics.total) * 100)}%`],
            ['Vencidas', data.statistics.vencidas.toString(), `${Math.round((data.statistics.vencidas / data.statistics.total) * 100)}%`],
            ['Críticas', data.statistics.criticas.toString(), `${Math.round((data.statistics.criticas / data.statistics.total) * 100)}%`]
        ],
        theme: 'striped',
        headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 10, cellPadding: 5 },
        columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 80 },
            1: { halign: 'center', cellWidth: 40 },
            2: { halign: 'center', cellWidth: 40 }
        }
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;

    // Risk Factors
    if (data.riskLevel.factors.length > 0) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 58, 138);
        doc.text('Factores de Riesgo Identificados', 15, yPos);

        yPos += 8;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);

        data.riskLevel.factors.forEach((factor, index) => {
            doc.text(`• ${factor}`, 20, yPos);
            yPos += 7;
        });
    }
}

/**
 * Add obligations table
 */
function addObligationsTable(
    doc: jsPDF,
    title: string,
    obligations: Obligation[],
    startY: number
): number {
    if (obligations.length === 0) {
        doc.setFontSize(10);
        doc.setTextColor(148, 163, 184);
        doc.setFont('helvetica', 'italic');
        doc.text('No hay obligaciones en esta categoría', 15, startY + 5);
        return startY + 15;
    }

    const tableData = obligations.slice(0, 50).map(o => [
        o.name,
        categoryLabels[o.category],
        format(new Date(o.due_date), 'dd/MM/yyyy'),
        o.criticality ? criticalityLabels[o.criticality] : 'Media',
        o.responsible_name || 'Sin asignar'
    ]);

    autoTable(doc, {
        startY,
        head: [['Obligación', 'Categoría', 'Vencimiento', 'Criticidad', 'Responsable']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
        styles: { fontSize: 8, cellPadding: 3 },
        columnStyles: {
            0: { cellWidth: 60 },
            1: { cellWidth: 30 },
            2: { cellWidth: 25, halign: 'center' },
            3: { cellWidth: 25, halign: 'center' },
            4: { cellWidth: 40 }
        },
        didParseCell: (data) => {
            // Color code criticality column
            if (data.column.index === 3 && data.section === 'body') {
                const criticality = data.cell.raw as string;
                if (criticality === 'Alta') {
                    data.cell.styles.textColor = [220, 38, 38]; // red
                    data.cell.styles.fontStyle = 'bold';
                } else if (criticality === 'Media') {
                    data.cell.styles.textColor = [202, 138, 4]; // yellow
                } else {
                    data.cell.styles.textColor = [22, 163, 74]; // green
                }
            }
        }
    });

    return (doc as any).lastAutoTable.finalY;
}

/**
 * Add obligations analysis section
 */
function addObligationsAnalysis(doc: jsPDF, data: ReportData): void {
    doc.addPage();
    let yPos = 20;

    // Section title
    doc.setFillColor(30, 58, 138);
    doc.rect(0, yPos, doc.internal.pageSize.getWidth(), 12, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('ANÁLISIS DE OBLIGACIONES', 15, yPos + 8);

    yPos += 25;

    // Obligations on track
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(22, 163, 74); // green
    doc.text(`✓ Obligaciones al Día (${data.categorizedObligations.alDia.length})`, 15, yPos);
    yPos += 8;

    yPos = addObligationsTable(doc, 'Al Día', data.categorizedObligations.alDia, yPos);
    yPos += 15;

    // Check if we need a new page
    if (yPos > 240) {
        doc.addPage();
        yPos = 20;
    }

    // Upcoming obligations
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(202, 138, 4); // yellow
    doc.text(`⚠ Obligaciones Por Vencer (${data.categorizedObligations.porVencer.length})`, 15, yPos);
    yPos += 8;

    yPos = addObligationsTable(doc, 'Por Vencer', data.categorizedObligations.porVencer, yPos);
    yPos += 15;

    // Check if we need a new page
    if (yPos > 240) {
        doc.addPage();
        yPos = 20;
    }

    // Overdue obligations
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(220, 38, 38); // red
    doc.text(`✗ Obligaciones Vencidas (${data.categorizedObligations.vencidas.length})`, 15, yPos);
    yPos += 8;

    addObligationsTable(doc, 'Vencidas', data.categorizedObligations.vencidas, yPos);
}

/**
 * Add critical alerts section
 */
function addCriticalAlerts(doc: jsPDF, data: ReportData): void {
    doc.addPage();
    let yPos = 20;

    // Section title
    doc.setFillColor(153, 27, 27); // critical red
    doc.rect(0, yPos, doc.internal.pageSize.getWidth(), 12, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('⚠ ALERTAS CRÍTICAS', 15, yPos + 8);

    yPos += 25;

    const criticalOverdue = data.criticalObligations.filter(o => o.status === 'vencida');

    if (criticalOverdue.length === 0 && data.obligationsWithoutDocs.length === 0) {
        doc.setFillColor(220, 252, 231); // light green
        doc.roundedRect(15, yPos, doc.internal.pageSize.getWidth() - 30, 30, 2, 2, 'F');

        doc.setTextColor(22, 163, 74);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('✓ No hay alertas críticas', doc.internal.pageSize.getWidth() / 2, yPos + 15, { align: 'center' });

        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text('Todas las obligaciones críticas están bajo control', doc.internal.pageSize.getWidth() / 2, yPos + 23, { align: 'center' });

        return;
    }

    // Critical overdue obligations
    if (criticalOverdue.length > 0) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(153, 27, 27);
        doc.text(`Obligaciones Críticas Vencidas (${criticalOverdue.length})`, 15, yPos);

        yPos += 8;

        autoTable(doc, {
            startY: yPos,
            head: [['Obligación', 'Categoría', 'Vencimiento', 'Días Vencida', 'Responsable']],
            body: criticalOverdue.map(o => {
                const dueDate = new Date(o.due_date);
                const today = new Date();
                const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

                return [
                    o.name,
                    categoryLabels[o.category],
                    format(dueDate, 'dd/MM/yyyy'),
                    daysOverdue.toString(),
                    o.responsible_name || 'Sin asignar'
                ];
            }),
            theme: 'striped',
            headStyles: { fillColor: [153, 27, 27], textColor: [255, 255, 255], fontStyle: 'bold' },
            styles: { fontSize: 9, cellPadding: 4 },
            columnStyles: {
                0: { cellWidth: 70 },
                1: { cellWidth: 35 },
                2: { cellWidth: 28, halign: 'center' },
                3: { cellWidth: 25, halign: 'center', textColor: [220, 38, 38], fontStyle: 'bold' },
                4: { cellWidth: 40 }
            }
        });
    }
}

/**
 * Add recommendations section
 */
function addRecommendations(doc: jsPDF, data: ReportData): void {
    doc.addPage();
    let yPos = 20;

    // Section title
    doc.setFillColor(30, 58, 138);
    doc.rect(0, yPos, doc.internal.pageSize.getWidth(), 12, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('💡 RECOMENDACIONES', 15, yPos + 8);

    yPos += 25;

    doc.setFontSize(11);
    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'normal');
    doc.text('Acciones sugeridas para mejorar el cumplimiento empresarial:', 15, yPos);

    yPos += 12;

    data.recommendations.forEach((rec, index) => {
        // Check if we need a new page
        if (yPos > 270) {
            doc.addPage();
            yPos = 20;
        }

        doc.setFillColor(241, 245, 249);
        doc.roundedRect(15, yPos, doc.internal.pageSize.getWidth() - 30, 18, 2, 2, 'F');

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 58, 138);
        doc.text(`${index + 1}.`, 20, yPos + 7);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        const lines = doc.splitTextToSize(rec, doc.internal.pageSize.getWidth() - 50);
        doc.text(lines, 28, yPos + 7);

        yPos += 22;
    });

    // Methodology note
    yPos += 10;

    if (yPos > 250) {
        doc.addPage();
        yPos = 20;
    }

    doc.setFillColor(254, 249, 195); // light yellow
    doc.roundedRect(15, yPos, doc.internal.pageSize.getWidth() - 30, 35, 2, 2, 'F');

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(133, 77, 14);
    doc.text('ℹ Nota sobre la Metodología', 20, yPos + 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const methodologyText = 'Este reporte se genera automáticamente basándose en el estado actual de las obligaciones. El score de cumplimiento se calcula considerando vencimientos, criticidad, responsables asignados y documentación adjunta. Se recomienda revisar este reporte mensualmente.';
    const methodologyLines = doc.splitTextToSize(methodologyText, doc.internal.pageSize.getWidth() - 50);
    doc.text(methodologyLines, 20, yPos + 18);
}

/**
 * Add footer to all pages
 */
function addFooters(doc: jsPDF, data: ReportData): void {
    const pageCount = doc.getNumberOfPages();
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();

    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);

        // Footer line
        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.5);
        doc.line(15, pageHeight - 15, pageWidth - 15, pageHeight - 15);

        // Footer text
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.setFont('helvetica', 'normal');
        doc.text(
            `Reporte de Cumplimiento - ${data.companyInfo.name}`,
            15,
            pageHeight - 10
        );
        doc.text(
            `Página ${i} de ${pageCount}`,
            pageWidth - 15,
            pageHeight - 10,
            { align: 'right' }
        );
    }
}

/**
 * Generate complete compliance report PDF
 */
export async function generateComplianceReport(data: ReportData): Promise<Blob> {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    // Add all sections
    addCoverPage(doc, data);
    addExecutiveSummary(doc, data);
    addObligationsAnalysis(doc, data);
    addCriticalAlerts(doc, data);
    addRecommendations(doc, data);

    // Add footers to all pages
    addFooters(doc, data);

    // Generate blob
    const pdfBlob = doc.output('blob');

    return pdfBlob;
}

/**
 * Download PDF report
 */
export function downloadReport(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Generate filename for report
 */
export function generateReportFileName(companyName: string, date: Date): string {
    const dateStr = format(date, 'yyyy-MM-dd');
    const sanitizedName = companyName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    return `reporte_cumplimiento_${sanitizedName}_${dateStr}.pdf`;
}
