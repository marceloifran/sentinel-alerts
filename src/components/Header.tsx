import { Button } from "@/components/ui/button";
import { Plus, LogOut, User } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

interface HeaderProps {
  userName?: string;
  onLogout?: () => void;
}

const Header = ({ userName = "Usuario", onLogout }: HeaderProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isDashboard = location.pathname === "/dashboard";

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

          <div className="flex items-center gap-3">
            {isDashboard && (
              <Button 
                onClick={() => navigate('/obligaciones/nueva')}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Nueva obligación</span>
              </Button>
            )}
            
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-secondary-foreground hidden sm:inline">
                {userName}
              </span>
            </div>
            
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
