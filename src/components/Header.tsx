import { Button } from "@/components/ui/button";
import { LogOut, User, LayoutDashboard, ClipboardList, Users, Sparkles, Lightbulb } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { SmartObligationLoader } from "@/components/ai/SmartObligationLoader";
import { useAuth } from "@/contexts/AuthContext";
import { useObligations } from "@/hooks/useObligations";
import { ObligationSuggestionsModal } from "./ObligationSuggestionsModal";
import { useSuggestionCount } from "@/hooks/useTemplateSuggestions";


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
  const { data: obligations = [], refetch } = useObligations();
  const [showSmartLoader, setShowSmartLoader] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const { data: suggestionCount = 0 } = useSuggestionCount();


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
    ...(isAdmin && userPlan !== 'starter' ? [{
      path: '/usuarios',
      label: 'Usuarios',
      icon: Users,
    }] : []),
  ];

  return (
    <>
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => navigate('/dashboard')}
            >
              <img src="/logo.png" alt="IfsinRem Logo" className="w-10 h-10 object-contain rounded-xl" />
              <span className="text-xl font-bold text-foreground hidden sm:inline">IfsinRem</span>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              {/* Navigation pills - visible on all screen sizes */}
              <nav className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path ||
                    (item.path === '/obligaciones' && location.pathname.startsWith('/obligaciones'));

                  return (
                    <button
                      key={item.path}
                      onClick={() => navigate(item.path)}
                      className={`
                        flex items-center gap-1.5 px-2.5 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium
                        transition-all duration-200
                        ${isActive
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                        }
                      `}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="hidden xs:inline sm:inline">{item.label}</span>
                    </button>
                  );
                })}
              </nav>

              {/* Smart loader button - replaces manual creation */}
              {isAdmin && (
                <Button
                  onClick={() => setShowSmartLoader(true)}
                  size="sm"
                  className="gap-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  <span className="hidden sm:inline">Nueva</span>
                </Button>
              )}

              {/* Suggestions button - always visible */}
              <Button
                onClick={() => setSuggestionsOpen(true)}
                size="sm"
                variant="outline"
                className="gap-1.5 relative"
              >
                <Lightbulb className="w-4 h-4" />
                <span className="hidden sm:inline">Sugerencias</span>
                {suggestionCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center">
                    {suggestionCount}
                  </span>
                )}
              </Button>

              {/* User info */}
              <button
                onClick={() => navigate('/configuracion')}
                className="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors cursor-pointer"
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

      {/* Smart Obligation Loader */}
      {isAdmin && user && (
        <SmartObligationLoader
          open={showSmartLoader}
          onOpenChange={setShowSmartLoader}
          onObligationsCreated={() => refetch()}
          existingObligations={obligations.map(o => ({ name: o.name }))}
          userId={user.id}
        />
      )}

      {/* Suggestions Modal */}
      <ObligationSuggestionsModal
        open={suggestionsOpen}
        onOpenChange={setSuggestionsOpen}
      />
    </>
  );
};

export default Header;

