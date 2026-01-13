import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import AddNotificationDialog from "./AddNotificationDialog";
import {
    getObligationNotifications,
    removeNotificationUser,
    ObligationNotification,
} from "@/services/notificationService";
import { toast } from "sonner";
import { Bell, Mail, Trash2, Calendar } from "lucide-react";

interface NotificationManagerProps {
    obligationId: string;
}

const NotificationManager = ({ obligationId }: NotificationManagerProps) => {
    const [notifications, setNotifications] = useState<ObligationNotification[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadNotifications();
    }, [obligationId]);

    const loadNotifications = async () => {
        try {
            setIsLoading(true);
            const data = await getObligationNotifications(obligationId);
            setNotifications(data);
        } catch (error) {
            console.error('Error loading notifications:', error);
            toast.error("Error al cargar las notificaciones");
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemove = async (notificationId: string) => {
        try {
            await removeNotificationUser(notificationId);
            toast.success("Usuario removido de las notificaciones");
            loadNotifications();
        } catch (error) {
            console.error('Error removing notification:', error);
            toast.error("Error al remover usuario");
        }
    };

    const getDaysLabel = (days: number) => {
        if (days === 1) return "1 día antes";
        return `${days} días antes`;
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold">Notificaciones por Email</h3>
                </div>
                {notifications.length < 3 && (
                    <AddNotificationDialog
                        obligationId={obligationId}
                        onNotificationAdded={loadNotifications}
                    />
                )}
            </div>

            {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                    Cargando notificaciones...
                </div>
            ) : notifications.length === 0 ? (
                <Card className="p-6 text-center">
                    <p className="text-muted-foreground mb-4">
                        No hay usuarios configurados para recibir notificaciones
                    </p>
                    <AddNotificationDialog
                        obligationId={obligationId}
                        onNotificationAdded={loadNotifications}
                    />
                </Card>
            ) : (
                <div className="space-y-3">
                    {notifications.map((notification) => (
                        <Card key={notification.id} className="p-4">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Mail className="w-4 h-4 text-muted-foreground" />
                                        <span className="font-medium">{notification.user_name}</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        {notification.user_email}
                                    </p>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Calendar className="w-3 h-3" />
                                        <span>{getDaysLabel(notification.days_before)}</span>
                                    </div>
                                    {notification.custom_message && (
                                        <div className="mt-2 p-3 bg-muted/50 rounded-md">
                                            <p className="text-sm italic">"{notification.custom_message}"</p>
                                        </div>
                                    )}
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleRemove(notification.id)}
                                    className="text-muted-foreground hover:text-destructive"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </Card>
                    ))}
                    {notifications.length < 3 && (
                        <p className="text-sm text-muted-foreground text-center">
                            Puedes agregar hasta {3 - notifications.length} usuario{3 - notifications.length !== 1 ? 's' : ''} más
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationManager;
