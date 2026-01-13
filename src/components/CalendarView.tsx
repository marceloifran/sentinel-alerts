import { useMemo, useState } from 'react';
import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Obligation, ObligationStatus, statusLabels, categoryIcons } from '@/services/obligationService';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './CalendarView.css';

const locales = {
    'es': es,
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

interface CalendarViewProps {
    obligations: Obligation[];
    onSelectObligation: (obligation: Obligation) => void;
}

interface CalendarEvent {
    id: string;
    title: string;
    start: Date;
    end: Date;
    resource: Obligation;
}

const CalendarView = ({ obligations, onSelectObligation }: CalendarViewProps) => {
    const [statusFilter, setStatusFilter] = useState<ObligationStatus | 'all'>('all');
    const [view, setView] = useState<View>('month');

    // Filter obligations by status
    const filteredObligations = useMemo(() => {
        if (statusFilter === 'all') return obligations;
        return obligations.filter(o => o.status === statusFilter);
    }, [obligations, statusFilter]);

    // Convert obligations to calendar events
    const events: CalendarEvent[] = useMemo(() => {
        return filteredObligations.map(obligation => ({
            id: obligation.id,
            title: `${categoryIcons[obligation.category]} ${obligation.name}`,
            start: new Date(obligation.due_date),
            end: new Date(obligation.due_date),
            resource: obligation,
        }));
    }, [filteredObligations]);

    // Custom event style based on status
    const eventStyleGetter = (event: CalendarEvent) => {
        const status = event.resource.status;

        let backgroundColor = '';
        let borderColor = '';

        switch (status) {
            case 'al_dia':
                backgroundColor = 'hsl(142 76% 95%)';
                borderColor = 'hsl(142 76% 36%)';
                break;
            case 'por_vencer':
                backgroundColor = 'hsl(38 92% 95%)';
                borderColor = 'hsl(38 92% 50%)';
                break;
            case 'vencida':
                backgroundColor = 'hsl(0 84% 96%)';
                borderColor = 'hsl(0 84% 60%)';
                break;
        }

        return {
            style: {
                backgroundColor,
                borderLeft: `4px solid ${borderColor}`,
                borderRadius: '4px',
                padding: '2px 6px',
                fontSize: '0.875rem',
                fontWeight: '500',
            },
        };
    };

    // Custom event component
    const EventComponent = ({ event }: { event: CalendarEvent }) => {
        return (
            <div className="flex items-center gap-1 overflow-hidden">
                <span className="truncate">{event.title}</span>
            </div>
        );
    };

    const statusCounts = useMemo(() => {
        return {
            all: obligations.length,
            al_dia: obligations.filter(o => o.status === 'al_dia').length,
            por_vencer: obligations.filter(o => o.status === 'por_vencer').length,
            vencida: obligations.filter(o => o.status === 'vencida').length,
        };
    }, [obligations]);

    return (
        <div className="space-y-4">
            {/* Filter Controls */}
            <Card className="p-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h3 className="font-semibold text-foreground mb-1">Vista de Calendario</h3>
                        <p className="text-sm text-muted-foreground">
                            Mostrando {filteredObligations.length} de {obligations.length} obligaciones
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as ObligationStatus | 'all')}>
                            <SelectTrigger className="w-[200px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">
                                    <div className="flex items-center justify-between w-full gap-2">
                                        <span>Todos los estados</span>
                                        <Badge variant="secondary" className="ml-2">{statusCounts.all}</Badge>
                                    </div>
                                </SelectItem>
                                <SelectItem value="al_dia">
                                    <div className="flex items-center justify-between w-full gap-2">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-status-success"></span>
                                            <span>{statusLabels.al_dia}</span>
                                        </div>
                                        <Badge variant="secondary" className="ml-2">{statusCounts.al_dia}</Badge>
                                    </div>
                                </SelectItem>
                                <SelectItem value="por_vencer">
                                    <div className="flex items-center justify-between w-full gap-2">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-status-warning"></span>
                                            <span>{statusLabels.por_vencer}</span>
                                        </div>
                                        <Badge variant="secondary" className="ml-2">{statusCounts.por_vencer}</Badge>
                                    </div>
                                </SelectItem>
                                <SelectItem value="vencida">
                                    <div className="flex items-center justify-between w-full gap-2">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-status-danger"></span>
                                            <span>{statusLabels.vencida}</span>
                                        </div>
                                        <Badge variant="secondary" className="ml-2">{statusCounts.vencida}</Badge>
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </Card>

            {/* Calendar */}
            <Card className="p-4">
                <div className="calendar-container">
                    <Calendar
                        localizer={localizer}
                        events={events}
                        startAccessor="start"
                        endAccessor="end"
                        style={{ height: 600 }}
                        culture="es"
                        messages={{
                            next: "Siguiente",
                            previous: "Anterior",
                            today: "Hoy",
                            month: "Mes",
                            week: "Semana",
                            day: "Día",
                            agenda: "Agenda",
                            date: "Fecha",
                            time: "Hora",
                            event: "Obligación",
                            noEventsInRange: "No hay obligaciones en este rango de fechas",
                            showMore: (total) => `+ Ver ${total} más`,
                        }}
                        eventPropGetter={eventStyleGetter}
                        components={{
                            event: EventComponent,
                        }}
                        onSelectEvent={(event) => onSelectObligation(event.resource)}
                        view={view}
                        onView={setView}
                        views={['month', 'week', 'agenda']}
                    />
                </div>
            </Card>
        </div>
    );
};

export default CalendarView;
