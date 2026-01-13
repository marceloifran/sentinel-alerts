import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { addNotificationUser } from "@/services/notificationService";
import { toast } from "sonner";
import { Loader2, UserPlus } from "lucide-react";

interface AddNotificationDialogProps {
    obligationId: string;
    onNotificationAdded: () => void;
}

const AddNotificationDialog = ({ obligationId, onNotificationAdded }: AddNotificationDialogProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [customMessage, setCustomMessage] = useState("");
    const [daysBefore, setDaysBefore] = useState("7");
    const [isAdding, setIsAdding] = useState(false);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !name) {
            toast.error("Email y nombre son requeridos");
            return;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            toast.error("Por favor ingresa un email válido");
            return;
        }

        setIsAdding(true);
        try {
            await addNotificationUser(
                obligationId,
                email,
                name,
                customMessage || undefined,
                parseInt(daysBefore)
            );

            toast.success("Usuario agregado a las notificaciones");
            setIsOpen(false);
            setEmail("");
            setName("");
            setCustomMessage("");
            setDaysBefore("7");
            onNotificationAdded();
        } catch (error: any) {
            console.error('Error adding notification:', error);
            toast.error(error.message || 'Error al agregar usuario');
        } finally {
            setIsAdding(false);
        }
    };

    return (
        <>
            <Button onClick={() => setIsOpen(true)} size="sm" className="gap-2">
                <UserPlus className="w-4 h-4" />
                Agregar usuario
            </Button>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Agregar usuario a notificaciones</DialogTitle>
                        <DialogDescription>
                            Máximo 3 usuarios por obligación. Recibirán un email cuando la obligación esté por vencer.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleAdd}>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email *</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="usuario@empresa.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="name">Nombre *</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    placeholder="Juan Pérez"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="days">Enviar alerta con anticipación</Label>
                                <Select value={daysBefore} onValueChange={setDaysBefore}>
                                    <SelectTrigger id="days">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="7">7 días antes</SelectItem>
                                        <SelectItem value="15">15 días antes</SelectItem>
                                        <SelectItem value="30">30 días antes</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="message">Mensaje personalizado (opcional)</Label>
                                <Textarea
                                    id="message"
                                    placeholder="Agrega un mensaje personalizado para este usuario..."
                                    value={customMessage}
                                    onChange={(e) => setCustomMessage(e.target.value)}
                                    rows={3}
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsOpen(false)}
                                disabled={isAdding}
                            >
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isAdding}>
                                {isAdding ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Agregando...
                                    </>
                                ) : (
                                    'Agregar'
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default AddNotificationDialog;
