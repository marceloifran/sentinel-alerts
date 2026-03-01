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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { updateUserRole, AppRole, roleLabels } from "@/services/userService";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2, Shield, Eye, Crown } from "lucide-react";

interface RoleSelectorProps {
    userId: string;
    userName: string;
    currentRole: AppRole;
    onRoleChanged: () => void;
}

const RoleSelector = ({ userId, userName, currentRole, onRoleChanged }: RoleSelectorProps) => {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [selectedRole, setSelectedRole] = useState<AppRole>(currentRole);
    const [isUpdating, setIsUpdating] = useState(false);

    const handleConfirm = async () => {
        if (!user || selectedRole === currentRole) {
            setIsOpen(false);
            return;
        }

        setIsUpdating(true);
        try {
            await updateUserRole(userId, selectedRole, user.id);
            toast.success(`Rol actualizado a ${roleLabels[selectedRole]}`);
            onRoleChanged();
            setIsOpen(false);
        } catch (error: any) {
            console.error('Error updating role:', error);
            toast.error(error.message || 'Error al actualizar el rol');
            setSelectedRole(currentRole); // Reset to current role
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <>
            <Button
                variant="outline"
                size="sm"
                onClick={() => {
                    setSelectedRole(currentRole);
                    setIsOpen(true);
                }}
            >
                Cambiar rol
            </Button>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Cambiar rol de usuario</DialogTitle>
                        <DialogDescription>
                            Cambiar el rol de <strong>{userName}</strong>
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        <label className="text-sm font-medium mb-2 block">Nuevo rol</label>
                        <Select
                            value={selectedRole}
                            onValueChange={(value: AppRole) => setSelectedRole(value)}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {(currentRole as string) === 'owner' && (
                                    <SelectItem value="owner">
                                        <div className="flex items-center gap-2">
                                            <Crown className="w-4 h-4 text-amber-500" />
                                            {roleLabels.owner}
                                        </div>
                                    </SelectItem>
                                )}
                                <SelectItem value="admin">
                                    <div className="flex items-center gap-2">
                                        <Shield className="w-4 h-4" />
                                        {roleLabels.admin}
                                    </div>
                                </SelectItem>
                                <SelectItem value="operativo">
                                    <div className="flex items-center gap-2">
                                        <Eye className="w-4 h-4" />
                                        {roleLabels.operativo}
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsOpen(false)}
                            disabled={isUpdating}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleConfirm}
                            disabled={isUpdating || selectedRole === currentRole}
                        >
                            {isUpdating ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Actualizando...
                                </>
                            ) : (
                                'Confirmar'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default RoleSelector;
