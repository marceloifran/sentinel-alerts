import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { User, Mail, Lock, Save, ArrowLeft, Lightbulb, Sun, Moon } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

const UserSettings = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { user, profile, refreshProfile, signOut } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [name, setName] = useState(profile?.name || '');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Theme local state for UI sync
    const [activeTheme, setActiveTheme] = useState(() => {
        if (typeof window !== "undefined") {
            return document.documentElement.classList.contains("dark") ? "dark" : "light";
        }
        return "light";
    });

    useEffect(() => {
        if (profile) {
            setName(profile.name);
        }
    }, [profile]);

    useEffect(() => {
        const handleGlobalThemeChange = (e: any) => {
            setActiveTheme(e.detail);
        };
        window.addEventListener("theme-changed", handleGlobalThemeChange);
        return () => {
            window.removeEventListener("theme-changed", handleGlobalThemeChange);
        };
    }, []);

    const changeTheme = (themeName: "light" | "dark") => {
        setActiveTheme(themeName);
        if (themeName === "dark") {
            document.documentElement.classList.add("dark");
            localStorage.setItem("theme", "dark");
        } else {
            document.documentElement.classList.remove("dark");
            localStorage.setItem("theme", "light");
        }
        // Dispatch global sync event
        window.dispatchEvent(new CustomEvent("theme-changed", { detail: themeName }));
        toast.success(`Modo ${themeName === "dark" ? "Oscuro" : "Claro"} activado`);
    };

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
        <div className="min-h-screen bg-background text-foreground transition-colors duration-250">
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
                    className="mb-6 gap-2 text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Volver al dashboard
                </Button>

                <h1 className="text-3xl font-bold text-foreground mb-8 text-center sm:text-left">Configuración de Cuenta</h1>

                <div className="space-y-6">
                    {/* Profile Information */}
                    <Card className="p-6 overflow-hidden border-primary/10 shadow-md bg-card">
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
                                        className="pl-10 bg-muted/50 border-muted opacity-70 dark:bg-slate-900 dark:border-slate-800 text-slate-800 dark:text-slate-300"
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
                                        placeholder="ifsinrem S.A."
                                        className="pl-10 rounded-xl focus-visible:ring-primary/30 dark:bg-slate-950 dark:border-slate-800"
                                    />
                                </div>
                            </div>

                            {/* Action Button */}
                            <div className="pt-2 flex flex-col sm:flex-row gap-3">
                                <Button
                                    onClick={handleUpdateProfile}
                                    disabled={isLoading || !name.trim() || !hasChanges}
                                    className="gap-2 rounded-xl h-11 px-8 shadow-sm hover:shadow-md transition-all active:scale-95 flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 border-0 text-white"
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

                    {/* Preferences Selection */}
                    <Card className="p-6 border-primary/10 shadow-md bg-card">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                                <Lightbulb className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-foreground">Preferencias de Interfaz</h2>
                                <p className="text-sm text-muted-foreground">Elegí la apariencia visual para trabajar en obra</p>
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2 max-w-md">
                            <button
                                type="button"
                                onClick={() => changeTheme("light")}
                                className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${
                                    activeTheme === "light"
                                        ? "border-emerald-600 bg-emerald-500/5 text-emerald-600 font-bold shadow-sm"
                                        : "border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 bg-transparent text-muted-foreground"
                                }`}
                            >
                                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                                    <Sun className="w-4 h-4 text-amber-500" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold">Modo Claro</p>
                                    <p className="text-[10px] text-muted-foreground">Apariencia limpia y de alto contraste al sol</p>
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => changeTheme("dark")}
                                className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${
                                    activeTheme === "dark"
                                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-400 font-bold shadow-sm"
                                        : "border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 bg-transparent text-muted-foreground"
                                }`}
                            >
                                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                                    <Moon className="w-4 h-4 text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold">Modo Oscuro</p>
                                    <p className="text-[10px] text-muted-foreground">Apariencia oscura, moderna y de bajo consumo</p>
                                </div>
                            </button>
                        </div>
                    </Card>

                    {/* Change Password */}
                    <Card className="p-6 border-primary/10 shadow-md bg-card">
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
                                        className="rounded-xl dark:bg-slate-950 dark:border-slate-800"
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
                                        className="rounded-xl dark:bg-slate-950 dark:border-slate-800"
                                    />
                                </div>
                            </div>

                            <Button
                                onClick={handleChangePassword}
                                disabled={isLoading || !newPassword || !confirmPassword}
                                variant="outline"
                                className="w-fit gap-2 rounded-xl h-11 px-6 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all font-bold"
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
                            <span>ifsinrem v1.3</span>
                            <span className="text-primary/40">ID: {user?.id.substring(0, 8)}</span>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default UserSettings;
