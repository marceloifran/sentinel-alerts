import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import StatusCard from "@/components/StatusCard";
import GeneralStatus from "@/components/GeneralStatus";
import ObligationCard from "@/components/ObligationCard";
import CalendarView from "@/components/CalendarView";
import EmptyState from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { getObligations, Obligation, statusLabels, categoryLabels } from "@/services/obligationService";
import { CheckCircle, AlertTriangle, XCircle, Loader2, List, Calendar as CalendarIcon, Shield, Eye } from "lucide-react";
import { toast } from "sonner";

type ViewMode = 'list' | 'calendar';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, profile, isAdmin, isLoading: authLoading, signOut } = useAuth();
  const [obligations, setObligations] = useState<Obligation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      loadObligations();
    }
  }, [user]);

  // Reload obligations when window regains focus (e.g., after creating an obligation)
  useEffect(() => {
    const handleFocus = () => {
      if (user) {
        loadObligations();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user]);

  const loadObligations = async () => {
    try {
      setIsLoading(true);
      const data = await getObligations();
      setObligations(data);
    } catch (error) {
      console.error('Error loading obligations:', error);
      toast.error("Error al cargar las obligaciones");
    } finally {
      setIsLoading(false);
    }
  };

  const stats = useMemo(() => {
    const overdue = obligations.filter(o => o.status === 'vencida').length;
    const upcoming = obligations.filter(o => o.status === 'por_vencer').length;
    const onTrack = obligations.filter(o => o.status === 'al_dia').length;
    return { overdue, upcoming, onTrack };
  }, [obligations]);

  const criticalObligations = useMemo(() => {
    return obligations
      .filter(o => o.status === 'vencida' || o.status === 'por_vencer')
      .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
  }, [obligations]);

  const hasOverdue = stats.overdue > 0;

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const handleSelectObligation = (obligation: Obligation) => {
    navigate(`/obligaciones/${obligation.id}`);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header
        userName={profile?.name || user.email || 'Usuario'}
        onLogout={handleLogout}
        isAdmin={isAdmin}
      />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Role badge */}
        <div className="mb-4">
          <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${isAdmin ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-secondary text-secondary-foreground border border-border'
            }`}>
            {isAdmin ? (
              <>
                <Shield className="w-3.5 h-3.5" />
                Administrador
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5" />
                Responsable
              </>
            )}
          </span>
        </div>

        {/* General Status */}
        <div className="mb-8 animate-fade-in">
          {isLoading ? (
            <div className="card-elevated p-6 animate-pulse">
              <div className="h-6 bg-muted rounded w-32 mb-2"></div>
              <div className="h-8 bg-muted rounded w-48"></div>
            </div>
          ) : (
            <GeneralStatus hasOverdue={hasOverdue} />
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <StatusCard
            count={stats.overdue}
            label="Vencidas"
            status="danger"
            icon={<XCircle className="w-6 h-6 text-status-danger" />}
          />
          <StatusCard
            count={stats.upcoming}
            label="Por vencer (30 días)"
            status="warning"
            icon={<AlertTriangle className="w-6 h-6 text-status-warning" />}
          />
          <StatusCard
            count={stats.onTrack}
            label="Al día"
            status="success"
            icon={<CheckCircle className="w-6 h-6 text-status-success" />}
          />
        </div>

        {/* View Toggle */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-foreground">
            {viewMode === 'list' ? 'Obligaciones críticas' : 'Vista de calendario'}
          </h2>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="gap-2"
            >
              <List className="w-4 h-4" />
              Lista
            </Button>
            <Button
              variant={viewMode === 'calendar' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('calendar')}
              className="gap-2"
            >
              <CalendarIcon className="w-4 h-4" />
              Calendario
            </Button>
          </div>
        </div>

        {/* Content based on view mode */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : viewMode === 'calendar' ? (
          <CalendarView
            obligations={obligations}
            onSelectObligation={handleSelectObligation}
          />
        ) : (
          <>
            {/* Critical Obligations List */}
            {criticalObligations.length === 0 ? (
              <EmptyState
                title="¡Todo al día!"
                description="No hay obligaciones vencidas ni próximas a vencer"
                icon={<CheckCircle className="w-12 h-12 text-status-success" />}
              />
            ) : (
              <div className="space-y-4">
                {criticalObligations.map((obligation) => (
                  <ObligationCard
                    key={obligation.id}
                    obligation={obligation}
                    onClick={() => navigate(`/obligaciones/${obligation.id}`)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
