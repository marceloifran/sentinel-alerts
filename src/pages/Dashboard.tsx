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
import { useObligations } from "@/hooks/useObligations";
import { CheckCircle, AlertTriangle, XCircle, List, Calendar as CalendarIcon, Shield, Eye } from "lucide-react";
import { AIAssistantButton } from "@/components/ai/AIAssistantButton";
import { DashboardSkeleton } from "@/components/skeletons/Skeletons";
import { ErrorState } from "@/components/ErrorState";
import type { Obligation } from "@/services/obligationService";

type ViewMode = 'list' | 'calendar';
type StatusFilter = 'all' | 'vencida' | 'por_vencer' | 'al_dia';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, profile, isAdmin, isLoading: authLoading, signOut } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const { data: obligations = [], isLoading, error, refetch } = useObligations();

  const stats = useMemo(() => {
    const overdue = obligations.filter(o => o.status === 'vencida').length;
    const upcoming = obligations.filter(o => o.status === 'por_vencer').length;
    const onTrack = obligations.filter(o => o.status === 'al_dia').length;
    return { overdue, upcoming, onTrack };
  }, [obligations]);

  const displayedObligations = useMemo(() => {
    let filtered: Obligation[];
    if (statusFilter === 'all') {
      // Default: show critical (vencida + por_vencer)
      filtered = obligations
        .filter(o => o.status === 'vencida' || o.status === 'por_vencer')
        .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
    } else {
      filtered = obligations
        .filter(o => o.status === statusFilter)
        .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
    }
    return filtered;
  }, [obligations, statusFilter]);

  const hasOverdue = stats.overdue > 0;

  // Redirect if not authenticated
  if (!authLoading && !user) {
    navigate('/auth');
    return null;
  }

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const handleCardClick = (status: StatusFilter) => {
    setStatusFilter(prev => prev === status ? 'all' : status);
  };

  const getListTitle = () => {
    switch (statusFilter) {
      case 'vencida': return 'Obligaciones vencidas';
      case 'por_vencer': return 'Obligaciones por vencer';
      case 'al_dia': return 'Obligaciones al día';
      default: return 'Obligaciones críticas';
    }
  };

  if (authLoading || isLoading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header
          userName={profile?.name || user?.email || 'Usuario'}
          onLogout={handleLogout}
          isAdmin={isAdmin}
          userPlan={profile?.plan}
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
        userPlan={profile?.plan}
      />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Role badge */}
        <div className="mb-4">
          <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${isAdmin ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-secondary text-secondary-foreground border border-border'}`}>
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

        {/* General Status - renamed */}
        <div className="mb-8 animate-fade-in">
          <GeneralStatus hasOverdue={hasOverdue} />
        </div>

        {/* Stats Cards - clickable to filter */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <div className="cursor-pointer" onClick={() => handleCardClick('vencida')}>
            <StatusCard
              count={stats.overdue}
              label="Vencidas"
              status="danger"
              icon={<XCircle className="w-6 h-6 text-status-danger" />}
              active={statusFilter === 'vencida'}
            />
          </div>
          <div className="cursor-pointer" onClick={() => handleCardClick('por_vencer')}>
            <StatusCard
              count={stats.upcoming}
              label="Por vencer (30 días)"
              status="warning"
              icon={<AlertTriangle className="w-6 h-6 text-status-warning" />}
              active={statusFilter === 'por_vencer'}
            />
          </div>
          <div className="cursor-pointer" onClick={() => handleCardClick('al_dia')}>
            <StatusCard
              count={stats.onTrack}
              label="Al día"
              status="success"
              icon={<CheckCircle className="w-6 h-6 text-status-success" />}
              active={statusFilter === 'al_dia'}
            />
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <h2 className="text-2xl font-semibold text-foreground">
            {viewMode === 'list' ? getListTitle() : 'Vista de calendario'}
          </h2>
          <div className="flex items-center gap-2 flex-wrap">
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

        {/* Content */}
        {viewMode === 'calendar' ? (
          <CalendarView
            obligations={obligations}
            onSelectObligation={(o: any) => navigate(`/obligaciones/${o.id}`)}
          />
        ) : (
          <>
            {displayedObligations.length === 0 ? (
              <EmptyState
                title={statusFilter === 'all' ? "¡Todo al día!" : "Sin obligaciones"}
                description={statusFilter === 'all' ? "No hay obligaciones vencidas ni próximas a vencer" : `No hay obligaciones con estado "${getListTitle().toLowerCase()}"`}
                icon={<CheckCircle className="w-12 h-12 text-status-success" />}
                showButton={false}
              />
            ) : (
              <div className="space-y-4">
                {displayedObligations.map((obligation) => (
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

      <AIAssistantButton />
    </div>
  );
};

export default Dashboard;
