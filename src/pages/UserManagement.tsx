import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import UserTable from "@/components/UserTable";
import InviteUserDialog from "@/components/InviteUserDialog";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { getAllUsers, UserWithRole, AppRole } from "@/services/userService";
import { Search, ArrowLeft, Loader2, Users } from "lucide-react";
import { toast } from "sonner";

const UserManagement = () => {
    const navigate = useNavigate();
    const { user, profile, isAdmin, isLoading: authLoading, signOut } = useAuth();
    const [users, setUsers] = useState<UserWithRole[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState<string>("all");

    useEffect(() => {
        if (!authLoading && !user) {
            navigate('/auth');
        }
        if (!authLoading && user && !isAdmin) {
            toast.error("Solo los administradores pueden acceder a esta página");
            navigate('/dashboard');
        }
    }, [user, authLoading, isAdmin, navigate]);

    useEffect(() => {
        if (user && isAdmin) {
            loadUsers();
        }
    }, [user, isAdmin]);

    const loadUsers = async () => {
        try {
            setIsLoading(true);
            const data = await getAllUsers();
            setUsers(data);
        } catch (error) {
            console.error('Error loading users:', error);
            toast.error("Error al cargar los usuarios");
        } finally {
            setIsLoading(false);
        }
    };

    const filteredUsers = useMemo(() => {
        return users.filter(u => {
            const matchesSearch =
                u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                u.email.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesRole = roleFilter === "all" || u.role === roleFilter;
            return matchesSearch && matchesRole;
        });
    }, [users, searchTerm, roleFilter]);

    const handleLogout = async () => {
        await signOut();
        navigate('/');
    };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!user || !isAdmin) return null;

    return (
        <div className="min-h-screen bg-background">
            <Header
                userName={profile?.name || user.email || 'Usuario'}
                onLogout={handleLogout}
                isAdmin={isAdmin}
            />

            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Volver al dashboard
                </button>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <Users className="w-8 h-8 text-primary" />
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">
                                Gestión de Usuarios
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                {filteredUsers.length} {filteredUsers.length === 1 ? 'usuario' : 'usuarios'}
                            </p>
                        </div>
                    </div>

                    <InviteUserDialog onUserInvited={loadUsers} />
                </div>

                {/* Filters */}
                <div className="card-elevated p-4 mb-6 animate-fade-in">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por nombre o email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        <Select value={roleFilter} onValueChange={setRoleFilter}>
                            <SelectTrigger className="w-full sm:w-[200px]">
                                <SelectValue placeholder="Filtrar por rol" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos los roles</SelectItem>
                                <SelectItem value="admin">👑 Administradores</SelectItem>
                                <SelectItem value="responsable">👤 Responsables</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Users table */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <UserTable users={filteredUsers} onRoleChanged={loadUsers} />
                )}
            </main>
        </div>
    );
};

export default UserManagement;
