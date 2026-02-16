import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Lightbulb, Building2, Factory, ShoppingBag, Utensils, Briefcase } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface SimpleSuggestionsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    sector?: string;
}

// Simple text suggestions based on business sector
const SECTOR_SUGGESTIONS: Record<string, { icon: typeof Building2; suggestions: string[] }> = {
    comercio: {
        icon: ShoppingBag,
        suggestions: [
            'Mantén actualizado el registro de ventas y compras para declaraciones mensuales',
            'Verifica que todos los productos tengan precios visibles según la ley del consumidor',
            'Revisa periódicamente las condiciones de seguridad del local comercial',
            'Asegúrate de tener los permisos municipales de funcionamiento al día',
            'Capacita al personal en atención al cliente y manejo de quejas',
        ],
    },
    manufactura: {
        icon: Factory,
        suggestions: [
            'Implementa un programa de mantenimiento preventivo para maquinaria',
            'Realiza inspecciones regulares de seguridad en el área de producción',
            'Mantén registros actualizados de inventario de materias primas',
            'Asegura el cumplimiento de normas ambientales en el manejo de residuos',
            'Capacita al personal en el uso seguro de equipos y maquinaria',
        ],
    },
    servicios: {
        icon: Briefcase,
        suggestions: [
            'Documenta todos los contratos de servicios con clientes',
            'Mantén actualizados los seguros de responsabilidad profesional',
            'Implementa un sistema de control de calidad en la prestación de servicios',
            'Asegura el cumplimiento de normativas específicas de tu sector',
            'Capacita continuamente al equipo en nuevas técnicas y herramientas',
        ],
    },
    gastronomia: {
        icon: Utensils,
        suggestions: [
            'Realiza controles periódicos de higiene y manipulación de alimentos',
            'Mantén actualizados los certificados de salud del personal',
            'Verifica el correcto almacenamiento y rotación de productos perecederos',
            'Asegura el cumplimiento de normas de seguridad alimentaria',
            'Implementa protocolos de limpieza y desinfección diaria',
        ],
    },
    default: {
        icon: Building2,
        suggestions: [
            'Mantén al día las declaraciones fiscales mensuales y anuales',
            'Verifica que todos los empleados tengan contratos formalizados',
            'Asegura el cumplimiento de normativas laborales vigentes',
            'Implementa medidas de seguridad e higiene en el lugar de trabajo',
            'Revisa periódicamente los permisos y licencias de operación',
        ],
    },
};

export function SimpleSuggestionsModal({ open, onOpenChange, sector }: SimpleSuggestionsModalProps) {
    const sectorKey = sector?.toLowerCase() || 'default';
    const sectorData = SECTOR_SUGGESTIONS[sectorKey] || SECTOR_SUGGESTIONS.default;
    const SectorIcon = sectorData.icon;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <Lightbulb className="w-6 h-6 text-primary" />
                        <DialogTitle className="text-2xl">Sugerencias para tu Negocio</DialogTitle>
                    </div>
                    <DialogDescription>
                        Ideas y recomendaciones generales basadas en tu sector de actividad
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto pr-2">
                    <Card className="p-6 mb-4 bg-primary/5 border-primary/20">
                        <div className="flex items-center gap-3 mb-3">
                            <SectorIcon className="w-8 h-8 text-primary" />
                            <h3 className="text-lg font-semibold">
                                {sector ? `Sector: ${sector.charAt(0).toUpperCase() + sector.slice(1)}` : 'Recomendaciones Generales'}
                            </h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Estas son sugerencias generales que pueden ayudarte a mejorar la gestión de tu negocio.
                            Recuerda adaptarlas a tus necesidades específicas.
                        </p>
                    </Card>

                    <div className="space-y-3">
                        {sectorData.suggestions.map((suggestion, index) => (
                            <Card key={index} className="p-4 hover:shadow-md transition-shadow">
                                <div className="flex gap-3">
                                    <div className="flex-shrink-0 mt-1">
                                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                                            <span className="text-sm font-semibold text-primary">{index + 1}</span>
                                        </div>
                                    </div>
                                    <p className="text-sm text-foreground leading-relaxed">{suggestion}</p>
                                </div>
                            </Card>
                        ))}
                    </div>

                    <Card className="p-4 mt-6 bg-blue-50 border-blue-200">
                        <p className="text-xs text-blue-800">
                            💡 <strong>Nota:</strong> Estas son sugerencias generales de buenas prácticas.
                            Consulta con un profesional para asesoramiento específico sobre obligaciones legales en tu jurisdicción.
                        </p>
                    </Card>
                </div>
            </DialogContent>
        </Dialog>
    );
}
