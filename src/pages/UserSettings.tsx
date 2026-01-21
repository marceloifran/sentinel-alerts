import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { User, Mail, Lock, Save, ArrowLeft, Phone, MessageCircle } from 'lucide-react';
import PlanCard, { PlanType } from '@/components/PlanCard';

const UserSettings = () => {
    const navigate = useNavigate();
    const { user, profile, signOut } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [name, setName] = useState(profile?.name || '');
    const [phone, setPhone] = useState(profile?.phone || '');
    const [whatsappEnabled, setWhatsappEnabled] = useState(profile?.whatsapp_enabled || false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [userPlan, setUserPlan] = useState<{ plan: PlanType; max_obligations: number; max_users: number }>({
        plan: 'starter',
        max_obligations: 10,
        max_users: 1
    });

    useEffect(() => {
        if (profile) {
            setName(profile.name);
            setPhone(profile.phone || '');
            setWhatsappEnabled(profile.whatsapp_enabled || false);
        }
    }, [profile]);

    useEffect(() => {
        const fetchPlan = async () => {
            if (user?.id) {
                const { data } = await supabase
                    .from('profiles')
                    .select('plan, max_obligations, max_users')
                    .eq('id', user.id)
                    .single();
                
                if (data) {
                    setUserPlan({
                        plan: (data.plan as PlanType) || 'starter',
                        max_obligations: data.max_obligations ?? 10,
                        max_users: data.max_users ?? 1
                    });
                }
            }
        };
        fetchPlan();
    }, [user]);

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
                    phone: phone.trim() || null,
                    whatsapp_enabled: whatsappEnabled
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

                    {/* WhatsApp Notifications */}
                    <Card className="p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                                <MessageCircle className="w-5 h-5 text-green-500" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-foreground">Notificaciones por WhatsApp</h2>
                                <p className="text-sm text-muted-foreground">Recibe recordatorios en tu WhatsApp</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="phone">Número de Teléfono</Label>
                                <div className="flex items-center gap-2 mt-1.5">
                                    <Phone className="w-4 h-4 text-muted-foreground" />
                                    <Input
                                        id="phone"
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="Ej: 1123456789 (sin 0 ni 15)"
                                        className="flex-1"
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Ingresa tu número sin el 0 inicial ni el 15. Ejemplo: 1123456789
                                </p>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <MessageCircle className="w-5 h-5 text-green-500" />
                                    <div>
                                        <p className="font-medium text-sm">Activar notificaciones WhatsApp</p>
                                        <p className="text-xs text-muted-foreground">
                                            Recibirás recordatorios de vencimientos
                                        </p>
                                    </div>
                                </div>
                                <Switch
                                    checked={whatsappEnabled}
                                    onCheckedChange={setWhatsappEnabled}
                                />
                            </div>

                            <Button
                                onClick={handleUpdateProfile}
                                disabled={isLoading}
                                className="gap-2"
                            >
                                <Save className="w-4 h-4" />
                                Guardar configuración
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

                    {/* Plan Information */}
                    <PlanCard 
                        currentPlan={userPlan.plan}
                        maxObligations={userPlan.max_obligations}
                        maxUsers={userPlan.max_users}
                    />

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
