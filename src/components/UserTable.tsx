import { UserWithRole, roleLabels, roleIcons } from "@/services/userService";
import RoleSelector from "./RoleSelector";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface UserTableProps {
    users: UserWithRole[];
    onRoleChanged: () => void;
}

const UserTable = ({ users, onRoleChanged }: UserTableProps) => {
    return (
        <div className="card-elevated overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-muted/50 border-b">
                        <tr>
                            <th className="text-left p-4 font-semibold text-sm">Nombre</th>
                            <th className="text-left p-4 font-semibold text-sm">Email</th>
                            <th className="text-left p-4 font-semibold text-sm">Rol</th>
                            <th className="text-left p-4 font-semibold text-sm">Fecha de registro</th>
                            <th className="text-left p-4 font-semibold text-sm">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="text-center py-8 text-muted-foreground">
                                    No hay usuarios registrados
                                </td>
                            </tr>
                        ) : (
                            users.map((user) => (
                                <tr
                                    key={user.id}
                                    className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                                >
                                    <td className="p-4">
                                        <div className="font-medium text-foreground">{user.name}</div>
                                    </td>
                                    <td className="p-4">
                                        <div className="text-sm text-muted-foreground">{user.email}</div>
                                    </td>
                                    <td className="p-4">
                                        <span
                                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${user.role === 'admin'
                                                    ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                                                    : 'bg-blue-500/10 text-blue-700 dark:text-blue-400'
                                                }`}
                                        >
                                            <span>{roleIcons[user.role]}</span>
                                            <span>{roleLabels[user.role]}</span>
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="text-sm text-muted-foreground">
                                            {format(new Date(user.created_at), "PPP", { locale: es })}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <RoleSelector
                                            userId={user.id}
                                            userName={user.name}
                                            currentRole={user.role}
                                            onRoleChanged={onRoleChanged}
                                        />
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UserTable;
