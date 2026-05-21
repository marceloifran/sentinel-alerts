import { UserWithRole, roleLabels, roleIcons } from "@/services/userService";
import RoleSelector from "./RoleSelector";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Mail, Calendar, User, ShieldCheck } from "lucide-react";

interface UserTableProps {
    users: UserWithRole[];
    onRoleChanged: () => void;
}

const UserTable = ({ users, onRoleChanged }: UserTableProps) => {
    if (users.length === 0) {
        return (
            <div className="card-elevated p-8 text-center animate-fade-in">
                <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No hay usuarios registrados</h3>
                <p className="text-muted-foreground">No se encontraron usuarios que coincidan con los filtros.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Mobile View: Cards */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
                {users.map((user) => (
                    <div key={user.id} className="card-elevated p-5 flex flex-col gap-4 animate-fade-in">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                    <User className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <div className="font-bold text-foreground leading-tight">{user.name}</div>
                                    <span
                                        className={`inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${(user.role as string) === 'owner'
                                            ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                            : user.role === 'admin'
                                                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                                : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                            }`}
                                    >
                                        {(() => {
                                            const Icon = roleIcons[user.role] || User;
                                            return <Icon className="w-3 h-3" />;
                                        })()}
                                        {roleLabels[user.role]}
                                    </span>
                                </div>
                            </div>
                            <RoleSelector
                                userId={user.id}
                                userName={user.name}
                                currentRole={user.role}
                                onRoleChanged={onRoleChanged}
                            />
                        </div>

                        <div className="space-y-2.5 pt-2 border-t border-border/50">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors overflow-hidden">
                                <Mail className="w-4 h-4 shrink-0 text-primary/60" />
                                <span className="truncate">{user.email}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="w-4 h-4 shrink-0 text-primary/60" />
                                <span>Desde: {format(new Date(user.created_at), "d 'de' MMMM, yyyy", { locale: es })}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Desktop View: Table */}
            <div className="hidden md:block card-elevated overflow-hidden border-none shadow-lg">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-muted/30 border-b border-border/50">
                            <tr>
                                <th className="text-left p-4 font-bold text-xs uppercase tracking-wider text-muted-foreground">Usuario</th>
                                <th className="text-left p-4 font-bold text-xs uppercase tracking-wider text-muted-foreground">Email</th>
                                <th className="text-left p-4 font-bold text-xs uppercase tracking-wider text-muted-foreground">Rol</th>
                                <th className="text-left p-4 font-bold text-xs uppercase tracking-wider text-muted-foreground">Registro</th>
                                <th className="text-right p-4 font-bold text-xs uppercase tracking-wider text-muted-foreground">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                            {users.map((user) => (
                                <tr
                                    key={user.id}
                                    className="hover:bg-primary/[0.02] transition-colors"
                                >
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                                <User className="w-4 h-4 text-primary" />
                                            </div>
                                            <div className="font-semibold text-foreground">{user.name}</div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="text-sm text-muted-foreground">{user.email}</div>
                                    </td>
                                    <td className="p-4">
                                        <span
                                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${(user.role as string) === 'owner'
                                                ? 'bg-amber-50 text-amber-700 border border-amber-100'
                                                : user.role === 'admin'
                                                    ? 'bg-blue-50 text-blue-700 border border-blue-100'
                                                    : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                                }`}
                                        >
                                            {(() => {
                                                const Icon = roleIcons[user.role] || User;
                                                return <Icon className="w-3.5 h-3.5" />;
                                            })()}
                                            <span>{roleLabels[user.role]}</span>
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {format(new Date(user.created_at), "PPP", { locale: es })}
                                        </div>
                                    </td>
                                    <td className="p-4 text-right">
                                        <RoleSelector
                                            userId={user.id}
                                            userName={user.name}
                                            currentRole={user.role}
                                            onRoleChanged={onRoleChanged}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default UserTable;
