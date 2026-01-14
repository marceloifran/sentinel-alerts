import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Mail, Send, Loader2 } from "lucide-react";
import { sendObligationAlert } from "@/services/emailService";
import { toast } from "sonner";

interface NotificationManagerProps {
    obligationId: string;
    userEmail: string;
    obligationName: string;
    dueDate?: string;
    daysUntilDue?: number;
}

const NotificationManager = ({ obligationId, userEmail, obligationName, dueDate, daysUntilDue }: NotificationManagerProps) => {
    const [isSendingTest, setIsSendingTest] = useState(false);

    const handleSendTestEmail = async () => {
        if (!userEmail) {
            toast.error("No hay email configurado");
            return;
        }

        setIsSendingTest(true);
        try {
            const testDueDate = dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            const testDaysUntilDue = daysUntilDue !== undefined ? daysUntilDue : 7;

            await sendObligationAlert({
                to: userEmail,
                userName: userEmail.split('@')[0],
                obligationName: obligationName,
                daysUntilDue: testDaysUntilDue,
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

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
                <Bell className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">Notificación de vencimiento</h3>
            </div>
            <Card className="p-4">
                <p className="text-sm text-muted-foreground mb-2">
                    Se notificará automáticamente sólo al creador.
                </p>
                <div className="flex items-center gap-2 mb-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{userEmail}</span>
                </div>
                <div className="bg-muted/50 rounded-md p-3 mt-2 mb-4">
                    <span className="text-sm">
                        La obligación <b>{obligationName}</b> tiene X días para su vencimiento.
                    </span>
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
            </Card>
        </div>
    );
};

export default NotificationManager;
