import { Button } from "@/components/ui/button";
import { Plus, LogOut, User, LayoutDashboard, ClipboardList, Users } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

interface HeaderProps {
  userName?: string;
  onLogout?: () => void;
  isAdmin?: boolean;
}

const Header = ({ userName = "Usuario", onLogout, isAdmin = false }: HeaderProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isDashboard = location.pathname === "/dashboard";

  const navItems = [
    {
      path: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      path: '/obligaciones',
      label: 'Obligaciones',
      icon: ClipboardList,
    },
    ...(isAdmin ? [{
      path: '/usuarios',
      label: 'Usuarios',
      icon: Users,
    }] : []),
  ];

  return (
    <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => navigate('/dashboard')}
          >
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">I</span>
            </div>
            <span className="text-xl font-bold text-foreground">IfsinRem</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Navigation pills */}
            <nav className="hidden md:flex items-center gap-2 bg-muted/50 p-1 rounded-lg">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path ||
                  (item.path === '/obligaciones' && location.pathname.startsWith('/obligaciones'));

                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium
                      transition-all duration-200
                      ${isActive
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* New obligation button */}
            {isAdmin && isDashboard && (
              <Button
                onClick={() => navigate('/obligaciones/nueva')}
                size="sm"
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Nueva</span>
              </Button>
            )}

            {/* User info */}
            <button
              onClick={() => navigate('/configuracion')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors cursor-pointer"
            >
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-secondary-foreground hidden sm:inline">
                {userName}
              </span>
            </button>

            {/* Logout button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onLogout}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
