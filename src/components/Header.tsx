import { Button } from "@/components/ui/button";
import { LogOut, User, LayoutDashboard, BarChart3, Users, Boxes, Shield, Sun, Moon, Menu, X } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";

interface HeaderProps {
  userName?: string;
  onLogout?: () => void;
  isAdmin?: boolean;
  userPlan?: string;
}

const Header = ({ userName = "Usuario", onLogout, isAdmin = false, userPlan }: HeaderProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  // Theme state synced with documentElement class list and localStorage
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("theme") || "light";
    }
    return "light";
  });

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [theme]);

  useEffect(() => {
    const handleGlobalTheme = (e: any) => {
      setTheme(e.detail);
    };
    window.addEventListener("theme-changed", handleGlobalTheme);
    return () => {
      window.removeEventListener("theme-changed", handleGlobalTheme);
    };
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    window.dispatchEvent(new CustomEvent("theme-changed", { detail: nextTheme }));
  };

  const navItems = [
    {
      path: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      path: '/operarios',
      label: 'Operarios',
      icon: Users,
    },
    {
      path: '/inventario',
      label: 'Inventario EPP',
      icon: Boxes,
    },
    {
      path: '/reportes',
      label: 'Reportes',
      icon: BarChart3,
    },
  ];

  return (
    <header className="sticky top-0 z-50 bg-background/85 dark:bg-[#070b14]/85 backdrop-blur-md border-b border-border dark:border-slate-800/80 transition-colors duration-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => {
              setMobileMenuOpen(false);
              navigate('/dashboard');
            }}
          >
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Shield className="text-emerald-500 h-5 w-5" />
            </div>
            <span className="text-xl font-bold text-foreground dark:text-white tracking-tight">
              ifsin<span className="text-emerald-500">rem</span>
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2 sm:gap-4">
            <nav className="flex items-center gap-1 bg-muted/50 dark:bg-slate-900/60 p-1 rounded-lg border border-slate-200/20 dark:border-slate-800/40">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`
                      flex items-center gap-1.5 px-3.5 py-2 rounded-md text-sm font-semibold
                      transition-all duration-200
                      ${isActive
                        ? 'bg-white dark:bg-[#0c101d] text-slate-900 dark:text-white shadow-sm border border-slate-200/10 dark:border-slate-800/30'
                        : 'text-muted-foreground dark:text-slate-400 hover:text-foreground dark:hover:text-white hover:bg-white/40 dark:hover:bg-slate-800/40'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="text-muted-foreground dark:text-slate-400 hover:text-foreground dark:hover:text-white"
              title="Cambiar tema de la interfaz"
            >
              {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </Button>

            <button
              onClick={() => navigate('/configuracion')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary dark:bg-[#0d1220] hover:bg-secondary/80 dark:hover:bg-[#12192c] border border-transparent dark:border-slate-800/35 transition-colors cursor-pointer"
            >
              <User className="w-4 h-4 text-muted-foreground dark:text-slate-400" />
              <span className="text-sm font-medium text-secondary-foreground dark:text-slate-350">
                {userName}
              </span>
            </button>

            <Button
              variant="ghost"
              size="icon"
              onClick={onLogout}
              className="text-muted-foreground dark:text-slate-400 hover:text-foreground dark:hover:text-white"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>

          {/* Mobile controls */}
          <div className="flex md:hidden items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="text-muted-foreground dark:text-slate-400 hover:text-foreground dark:hover:text-white"
            >
              {theme === "dark" ? <Sun className="w-4.5 h-4.5 text-amber-400" /> : <Moon className="w-4.5 h-4.5 text-slate-600" />}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-muted-foreground dark:text-slate-400 hover:text-foreground dark:hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Panel */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border dark:border-slate-800/80 bg-background dark:bg-[#080c14] px-4 py-4 space-y-3 animate-in slide-in-from-top duration-200">
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <button
                  key={item.path}
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate(item.path);
                  }}
                  className={`
                    flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-semibold transition-all
                    ${isActive
                      ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                      : 'text-muted-foreground dark:text-slate-400 hover:bg-muted/50 dark:hover:bg-slate-900/60'
                    }
                  `}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}

            <div className="h-px bg-border dark:bg-slate-800/80 my-2" />

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                navigate('/configuracion');
              }}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-semibold text-muted-foreground dark:text-slate-400 hover:bg-muted/50 dark:hover:bg-slate-900/60"
            >
              <User className="w-5 h-5 shrink-0" />
              <span>Mi Perfil ({userName})</span>
            </button>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                if (onLogout) onLogout();
              }}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-500/10"
            >
              <LogOut className="w-5 h-5 shrink-0" />
              <span>Cerrar Sesión</span>
            </button>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
