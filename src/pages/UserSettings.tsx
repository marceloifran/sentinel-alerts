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


const UserSettings = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { user, profile, refreshProfile, signOut } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [name, setName] = useState(profile?.name || '');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    useEffect(() => {
        if (profile) {
            setName(profile.name);
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
                    name: name.trim()
                })
                .eq('id', user?.id);

            if (error) throw error;

            await refreshProfile();
            queryClient.invalidateQueries({ queryKey: ['profile'] });

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

    const hasChanges = name !== profile?.name;

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

                <h1 className="text-3xl font-bold text-foreground mb-8 text-center sm:text-left">Configuración de Cuenta</h1>

                <div className="space-y-6">
                    {/* Profile Information */}
                    <Card className="p-6 overflow-hidden border-primary/10 shadow-md">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                                <User className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-foreground">Información del Perfil</h2>
                                <p className="text-sm text-muted-foreground">Gestiona tu identidad y datos básicos</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {/* Email (Readonly) */}
                            <div className="grid gap-2">
                                <Label htmlFor="email" className="text-sm font-semibold">Email</Label>
                                <div className="relative group">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <Input
                                        id="email"
                                        type="email"
                                        value={user?.email || ''}
                                        disabled
                                        className="pl-10 bg-muted/50 border-muted opacity-70"
                                    />
                                </div>
                                <p className="text-[10px] text-muted-foreground italic px-1">El email corporativo no se puede modificar.</p>
                            </div>

                            {/* Name */}
                            <div className="grid gap-2">
                                <Label htmlFor="name" className="text-sm font-semibold">Nombre Completo / Empresa</Label>
                                <div className="relative group">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <Input
                                        id="name"
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Sentinel Alerts S.A."
                                        className="pl-10 rounded-xl focus-visible:ring-primary/30"
                                    />
                                </div>
                            </div>

                            {/* Action Button */}
                            <div className="pt-2 flex flex-col sm:flex-row gap-3">
                                <Button
                                    onClick={handleUpdateProfile}
                                    disabled={isLoading || !name.trim() || !hasChanges}
                                    className="gap-2 rounded-xl h-11 px-8 shadow-sm hover:shadow-md transition-all active:scale-95 flex-1 sm:flex-none"
                                >
                                    {isLoading ? (
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <Save className="w-4 h-4" />
                                    )}
                                    Guardar Cambios
                                </Button>
                                {hasChanges && (
                                    <Button
                                        variant="ghost"
                                        className="rounded-xl h-11"
                                        onClick={() => {
                                            setName(profile?.name || '');
                                        }}
                                    >
                                        Descartar
                                    </Button>
                                )}
                            </div>
                        </div>
                    </Card>

                    {/* Change Password */}
                    <Card className="p-6 border-primary/10 shadow-md">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                                <Lock className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-foreground">Seguridad</h2>
                                <p className="text-sm text-muted-foreground">Actualiza tu contraseña periódicamente</p>
                            </div>
                        </div>

                        <div className="grid gap-6">
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="new-password">Nueva Contraseña</Label>
                                    <Input
                                        id="new-password"
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Mínimo 6 caracteres"
                                        className="rounded-xl"
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="confirm-password">Confirmar</Label>
                                    <Input
                                        id="confirm-password"
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Repite la contraseña"
                                        className="rounded-xl"
                                    />
                                </div>
                            </div>

                            <Button
                                onClick={handleChangePassword}
                                disabled={isLoading || !newPassword || !confirmPassword}
                                variant="outline"
                                className="w-fit gap-2 rounded-xl h-11 px-6 border-primary/20 hover:bg-primary/5 hover:border-primary/40 transition-all"
                            >
                                <Lock className="w-4 h-4" />
                                Actualizar Contraseña
                            </Button>
                        </div>
                    </Card>

                    {/* Account Info Footer */}
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 px-2 py-4 text-[11px] text-muted-foreground uppercase tracking-widest font-medium border-t border-border/50">
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            Cuenta Activa: {new Date(user?.created_at || '').toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                        </div>
                        <div className="flex items-center gap-4">
                            <span>Sentinel Alerts v1.2</span>
                            <span className="text-primary/40">ID: {user?.id.substring(0, 8)}</span>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default UserSettings;
