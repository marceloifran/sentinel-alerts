import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import StatusCard from "@/components/StatusCard";
import GeneralStatus from "@/components/GeneralStatus";
import ObligationCard from "@/components/ObligationCard";
import CalendarView from "@/components/CalendarView";
import EmptyState from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useObligations, useResponsibles } from "@/hooks/useObligations";
import { CheckCircle, AlertTriangle, XCircle, List, Calendar as CalendarIcon, Shield, Eye, Sparkles } from "lucide-react";
import { AIAssistantButton } from "@/components/ai/AIAssistantButton";
import { SmartObligationLoader } from "@/components/ai/SmartObligationLoader";
import { DashboardSkeleton } from "@/components/skeletons/Skeletons";
import { ErrorState } from "@/components/ErrorState";

type ViewMode = 'list' | 'calendar';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, profile, isAdmin, isLoading: authLoading, signOut } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [showSmartLoader, setShowSmartLoader] = useState(false);

  // Usar React Query hooks
  const { data: obligations = [], isLoading, error, refetch } = useObligations();
  const { data: responsibles = [] } = useResponsibles(isAdmin);

  // Redirect si no está autenticado
  if (!authLoading && !user) {
    navigate('/auth');
    return null;
  }

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

  const handleSelectObligation = (obligation: any) => {
    navigate(`/obligaciones/${obligation.id}`);
  };

  const handleObligationsCreated = () => {
    refetch(); // Refetch manual si es necesario
  };

  // Loading state
  if (authLoading || isLoading) {
    return <DashboardSkeleton />;
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header
          userName={profile?.name || user?.email || 'Usuario'}
          onLogout={handleLogout}
          isAdmin={isAdmin}
        />
        <ErrorState error={error as Error} onRetry={() => refetch()} />
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

        {/* View Toggle and Smart Loader */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <h2 className="text-2xl font-semibold text-foreground">
            {viewMode === 'list' ? 'Obligaciones críticas' : 'Vista de calendario'}
          </h2>
          <div className="flex items-center gap-2 flex-wrap">
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSmartLoader(true)}
                className="gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Carga inteligente
              </Button>
            )}
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
        {viewMode === 'calendar' ? (
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
                showButton={false}
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

      {/* AI Assistant floating button */}
      <AIAssistantButton />

      {/* Smart Obligation Loader */}
      {isAdmin && (
        <SmartObligationLoader
          open={showSmartLoader}
          onOpenChange={setShowSmartLoader}
          onObligationsCreated={handleObligationsCreated}
          existingObligations={obligations.map(o => ({ name: o.name }))}
          userId={user.id}
        />
      )}
    </div>
  );
};

export default Dashboard;
