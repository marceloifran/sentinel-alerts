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
import { AppRole, roleLabels } from "@/services/userService";
import { toast } from "sonner";
import { Loader2, UserPlus, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface InviteUserDialogProps {
    onUserInvited: () => void;
}

const InviteUserDialog = ({ onUserInvited }: InviteUserDialogProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [role, setRole] = useState<AppRole | "operativo">("operativo");
    const [isCreating, setIsCreating] = useState(false);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !name || !password) {
            toast.error("Por favor completa todos los campos");
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            toast.error("Por favor ingresa un email válido");
            return;
        }

        if (password.length < 6) {
            toast.error("La contraseña debe tener al menos 6 caracteres");
            return;
        }

        setIsCreating(true);
        try {
            const { data: sessionData } = await supabase.auth.getSession();
            const token = sessionData?.session?.access_token;

            if (!token) {
                toast.error("No estás autenticado");
                return;
            }

            const response = await supabase.functions.invoke("create-user", {
                body: { email, password, name, role },
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.error) {
                throw new Error(response.error.message || "Error al crear el usuario");
            }

            const result = response.data as { success: boolean; message?: string; error?: string };

            if (!result.success) {
                toast.error(result.error || "Error al crear el usuario");
                return;
            }

            toast.success(result.message || `Usuario ${name} creado exitosamente`);
            setIsOpen(false);
            setEmail("");
            setName("");
            setPassword("");
            setRole("operativo" as any);
            onUserInvited();
        } catch (error: any) {
            console.error("Error creating user:", error);
            toast.error(error.message || "Error al crear el usuario");
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <>
            <Button onClick={() => setIsOpen(true)} className="gap-2">
                <UserPlus className="w-4 h-4" />
                Crear Usuario
            </Button>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Crear nuevo usuario</DialogTitle>
                        <DialogDescription>
                            El usuario podrá iniciar sesión inmediatamente con las credenciales que definas.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleCreate}>
                        <div className="space-y-4 py-4">
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
                                <Label htmlFor="password">Contraseña</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Mínimo 6 caracteres"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="w-4 h-4" />
                                        ) : (
                                            <Eye className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Comunícale esta contraseña al usuario para que pueda ingresar
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="role">Rol</Label>
                                <Select
                                    value={role}
                                    onValueChange={(value: string) => setRole(value as any)}
                                >
                                    <SelectTrigger id="role">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="operativo">
                                            👤 {roleLabels.operativo}
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
                                disabled={isCreating}
                            >
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isCreating}>
                                {isCreating ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Creando...
                                    </>
                                ) : (
                                    "Crear Usuario"
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
