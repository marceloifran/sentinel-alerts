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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { inviteUser, AppRole, roleLabels } from "@/services/userService";
import { toast } from "sonner";
import { Loader2, UserPlus } from "lucide-react";

interface InviteUserDialogProps {
    onUserInvited: () => void;
}

const InviteUserDialog = ({ onUserInvited }: InviteUserDialogProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [role, setRole] = useState<AppRole>("responsable");
    const [isInviting, setIsInviting] = useState(false);

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !name) {
            toast.error("Por favor completa todos los campos");
            return;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            toast.error("Por favor ingresa un email válido");
            return;
        }

        setIsInviting(true);
        try {
            const result = await inviteUser(email, name, role);

            if (result.success) {
                toast.success(result.message);
                setIsOpen(false);
                setEmail("");
                setName("");
                setRole("responsable");
                onUserInvited();
            } else {
                toast.error(result.message);
            }
        } catch (error: any) {
            console.error('Error inviting user:', error);
            toast.error(error.message || 'Error al invitar usuario');
        } finally {
            setIsInviting(false);
        }
    };

    return (
        <>
            <Button onClick={() => setIsOpen(true)} className="gap-2">
                <UserPlus className="w-4 h-4" />
                Invitar Usuario
            </Button>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Invitar nuevo usuario</DialogTitle>
                        <DialogDescription>
                            El usuario recibirá instrucciones para registrarse en el sistema
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleInvite}>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
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
                                <Label htmlFor="name">Nombre completo</Label>
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
                                <Label htmlFor="role">Rol</Label>
                                <Select
                                    value={role}
                                    onValueChange={(value: AppRole) => setRole(value)}
                                >
                                    <SelectTrigger id="role">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="responsable">
                                            👤 {roleLabels.responsable}
                                        </SelectItem>
                                        <SelectItem value="admin">
                                            👑 {roleLabels.admin}
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsOpen(false)}
                                disabled={isInviting}
                            >
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isInviting}>
                                {isInviting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Invitando...
                                    </>
                                ) : (
                                    'Enviar Invitación'
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default InviteUserDialog;
