import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Mail, Send, Loader2, CheckCircle2, Clock } from "lucide-react";
import { sendObligationAlert } from "@/services/emailService";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface NotificationManagerProps {
    obligationId: string;
    userEmail: string;
    obligationName: string;
    dueDate?: string;
    daysUntilDue?: number;
}

const NotificationManager = ({ obligationId, userEmail, obligationName, dueDate, daysUntilDue = 0 }: NotificationManagerProps) => {
    const [isSendingTest, setIsSendingTest] = useState(false);

    const handleSendTestEmail = async () => {
        if (!userEmail) {
            toast.error("No hay email configurado");
            return;
        }

        setIsSendingTest(true);
        try {
            const testDueDate = dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

            await sendObligationAlert({
                to: userEmail,
                userName: userEmail.split('@')[0],
                obligationName: obligationName,
                daysUntilDue: daysUntilDue,
                dueDate: testDueDate,
            });

            toast.success("✅ Email de prueba enviado! Revisa tu bandeja de entrada.");
        } catch (error: any) {
            console.error('Error enviando email de prueba:', error);
            toast.error("❌ Error enviando email: " + (error.message || 'Error desconocido'));
        } finally {
            setIsSendingTest(false);
        }
    };

    // Determine which notifications are pending
    const notifications = [
        { days: 30, label: "30 días antes", sent: daysUntilDue < 30 },
        { days: 7, label: "7 días antes", sent: daysUntilDue < 7 },
        { days: 0, label: "El día del vencimiento", sent: daysUntilDue < 0 },
    ];

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
                <Bell className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">Recordatorios automáticos</h3>
            </div>
            
            <Card className="p-4">
                <p className="text-sm text-muted-foreground mb-4">
                    Se enviarán recordatorios automáticos al responsable de esta obligación.
                </p>
                
                <div className="flex items-center gap-2 mb-4 p-2 bg-secondary/50 rounded-lg">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium text-sm">{userEmail}</span>
                </div>

                {/* Notification schedule */}
                <div className="space-y-2 mb-4">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Programación de recordatorios:
                    </p>
                    {notifications.map((notification) => (
                        <div 
                            key={notification.days}
                            className={cn(
                                "flex items-center gap-2 p-2 rounded-lg text-sm",
                                notification.sent ? "bg-muted/30" : "bg-primary/5"
                            )}
                        >
                            {notification.sent ? (
                                <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
                            ) : (
                                <Clock className="w-4 h-4 text-primary" />
                            )}
                            <span className={notification.sent ? "text-muted-foreground line-through" : "text-foreground"}>
                                {notification.label}
                            </span>
                            {notification.sent && (
                                <span className="text-xs text-muted-foreground ml-auto">
                                    Ya pasó
                                </span>
                            )}
                        </div>
                    ))}
                </div>

                <Button
                    onClick={handleSendTestEmail}
                    disabled={isSendingTest}
                    variant="outline"
                    size="sm"
                    className="w-full"
                >
                    {isSendingTest ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Enviando...
                        </>
                    ) : (
                        <>
                            <Send className="w-4 h-4 mr-2" />
                            Enviar email de prueba
                        </>
                    )}
                </Button>
                
                <p className="text-xs text-muted-foreground text-center mt-2">
                    Los recordatorios se procesan diariamente a las 8:00 AM UTC
                </p>
            </Card>
        </div>
    );
};

export default NotificationManager;
