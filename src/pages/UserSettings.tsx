import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { User, Mail, Lock, Save, ArrowLeft, Building2, Lightbulb } from 'lucide-react';

import { useQueryClient } from '@tanstack/react-query';
// import GoogleCalendarCard from '@/components/GoogleCalendarCard';


const SECTORS = [
    { value: "construccion", label: "Construcción" },
    { value: "comercio", label: "Comercio" },
    { value: "servicios", label: "Servicios" },
    { value: "industria", label: "Industria" },
    { value: "transporte", label: "Transporte" },
    { value: "gastronomia", label: "Gastronomía" },
    { value: "salud", label: "Salud" },
    { value: "educacion", label: "Educación" },
    { value: "tecnologia", label: "Tecnología" },
    { value: "agricultura", label: "Agricultura" },
    { value: "otro", label: "Otro" },
];

const UserSettings = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { user, profile, signOut, isAdmin } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [name, setName] = useState(profile?.name || '');
    const [sector, setSector] = useState(profile?.sector || '');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    useEffect(() => {
        if (profile) {
            setName(profile.name);
            setSector(profile.sector || '');
        }
    }, [profile]);

    const handleUpdateProfile = async () => {
        if (!name.trim()) {
            toast.error('El nombre no puede estar vacío');
            return;
        }

        try {
            setIsLoading(true);
            const { error } = await supabase
                .from('profiles')
                .update({
                    name: name.trim(),
                } as any)
                .eq('id', user?.id);

            if (error) throw error;
            toast.success('Perfil actualizado correctamente');
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error('Error al actualizar el perfil');
        } finally {
            setIsLoading(false);
        }
    };


    const handleChangePassword = async () => {
        if (!newPassword || !confirmPassword) {
            toast.error('Por favor completa todos los campos de contraseña');
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error('Las contraseñas no coinciden');
            return;
        }

        if (newPassword.length < 6) {
            toast.error('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        try {
            setIsLoading(true);
            const { error } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (error) throw error;

            toast.success('Contraseña actualizada correctamente');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            console.error('Error changing password:', error);
            toast.error('Error al cambiar la contraseña');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = async () => {
        await signOut();
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-background">
            <Header
                userName={profile?.name || user?.email || 'Usuario'}
                onLogout={handleLogout}
                isAdmin={false}
                userPlan={profile?.plan}
            />

            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-4xl">
                <Button
                    variant="ghost"
                    onClick={() => navigate('/dashboard')}
                    className="mb-6 gap-2"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Volver al dashboard
                </Button>

                <h1 className="text-3xl font-bold text-foreground mb-8">Configuración de Usuario</h1>

                <div className="space-y-6">
                    {/* Profile Information */}
                    <Card className="p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-foreground">Información del Perfil</h2>
                                <p className="text-sm text-muted-foreground">Actualiza tu información personal</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="email">Email</Label>
                                <div className="flex items-center gap-2 mt-1.5">
                                    <Mail className="w-4 h-4 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="email"
                                        value={user?.email || ''}
                                        disabled
                                        className="flex-1"
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">El email no se puede modificar</p>
                            </div>

                            <div>
                                <Label htmlFor="name">Nombre</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Tu nombre completo"
                                    className="mt-1.5"
                                />
                            </div>

                            <Button
                                onClick={handleUpdateProfile}
                                disabled={isLoading || !name.trim()}
                                className="gap-2"
                            >
                                <Save className="w-4 h-4" />
                                Guardar cambios
                            </Button>
                        </div>
                    </Card>

                    {/* Sector/Industry Management */}
                    <Card className="p-6 border-primary/20">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <Building2 className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-foreground">Sector / Industria</h2>
                                <p className="text-sm text-muted-foreground">Tu sector determina las sugerencias inteligentes de obligaciones</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg flex items-start gap-3">
                                <Lightbulb className="w-5 h-5 text-primary mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-foreground mb-1">
                                        Sector actual: <span className="text-primary">{SECTORS.find(s => s.value === profile?.sector)?.label || "No especificado"}</span>
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Al cambiar tu sector, las sugerencias de obligaciones se actualizarán automáticamente para mostrarte las más relevantes para tu industria.
                                    </p>
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="sector">Cambiar sector</Label>
                                <Select
                                    value={sector}
                                    onValueChange={setSector}
                                >
                                    <SelectTrigger id="sector" className="mt-1.5">
                                        <SelectValue placeholder="Selecciona tu sector" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {SECTORS.map((s) => (
                                            <SelectItem key={s.value} value={s.value}>
                                                {s.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {sector !== profile?.sector && (
                                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                                    <p className="text-sm text-amber-700 dark:text-amber-400">
                                        ⚠️ Cambiar de sector actualizará tus sugerencias de obligaciones
                                    </p>
                                </div>
                            )}

                            <Button
                                onClick={async () => {
                                    if (!user) return;
                                    setIsLoading(true);
                                    try {
                                        const { error } = await supabase
                                            .from('profiles')
                                            .update({ sector } as any)
                                            .eq('id', user.id);
                                        if (error) throw error;

                                        queryClient.invalidateQueries({ queryKey: ['profile'] });

                                        toast.success('Sector actualizado correctamente');
                                    } catch (error) {
                                        console.error('Error updating sector:', error);
                                        toast.error('Error al actualizar el sector');
                                    } finally {
                                        setIsLoading(false);
                                    }
                                }}
                                disabled={isLoading || sector === profile?.sector}
                                className="gap-2"
                            >
                                <Save className="w-4 h-4" />
                                Guardar sector
                            </Button>
                        </div>
                    </Card>

                    {/* Change Password */}
                    <Card className="p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <Lock className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-foreground">Cambiar Contraseña</h2>
                                <p className="text-sm text-muted-foreground">Actualiza tu contraseña de acceso</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="new-password">Nueva Contraseña</Label>
                                <Input
                                    id="new-password"
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Mínimo 6 caracteres"
                                    className="mt-1.5"
                                />
                            </div>

                            <div>
                                <Label htmlFor="confirm-password">Confirmar Contraseña</Label>
                                <Input
                                    id="confirm-password"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Repite la nueva contraseña"
                                    className="mt-1.5"
                                />
                            </div>

                            <Button
                                onClick={handleChangePassword}
                                disabled={isLoading || !newPassword || !confirmPassword}
                                variant="outline"
                                className="gap-2"
                            >
                                <Lock className="w-4 h-4" />
                                Cambiar contraseña
                            </Button>
                        </div>
                    </Card>

                    {/* Google Calendar - TEMPORALMENTE DESHABILITADO */}
                    {/* <GoogleCalendarCard /> */}



                    {/* Account Info */}
                    <Card className="p-6">
                        <h2 className="text-xl font-semibold text-foreground mb-4">Información de la Cuenta</h2>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Usuario desde:</span>
                                <span className="font-medium">{new Date(user?.created_at || '').toLocaleDateString('es-ES')}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Última actualización:</span>
                                <span className="font-medium">{new Date().toLocaleDateString('es-ES')}</span>
                            </div>
                        </div>
                    </Card>
                </div>
            </main>
        </div>
    );
};

export default UserSettings;
