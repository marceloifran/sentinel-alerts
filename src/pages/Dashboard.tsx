import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import StatusCard from "@/components/StatusCard";
import GeneralStatus from "@/components/GeneralStatus";
import ObligationCard from "@/components/ObligationCard";
import EmptyState from "@/components/EmptyState";
import { useAuth } from "@/contexts/AuthContext";
import { getObligations, Obligation, statusLabels, categoryLabels } from "@/services/obligationService";
import { CheckCircle, AlertTriangle, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, profile, isAdmin, isLoading: authLoading, signOut } = useAuth();
  const [obligations, setObligations] = useState<Obligation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
            isAdmin ? 'bg-primary/10 text-primary' : 'bg-secondary text-secondary-foreground'
          }`}>
            {isAdmin ? '👑 Administrador' : '👤 Responsable'}
          </span>
        </div>

        {/* General Status */}
        <div className="mb-8 animate-fade-in">
          <GeneralStatus hasOverdue={hasOverdue} />
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

        {/* Critical Obligations */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">
              {criticalObligations.length > 0 ? "Obligaciones críticas" : "Tus obligaciones"}
            </h2>
            {obligations.length > 0 && (
              <button
                onClick={() => navigate('/obligaciones')}
                className="text-sm text-primary hover:underline"
              >
                Ver todas ({obligations.length})
              </button>
            )}
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : obligations.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-3">
              {(criticalObligations.length > 0 ? criticalObligations : obligations.slice(0, 5)).map((obligation, index) => (
                <div 
                  key={obligation.id}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <ObligationCard 
                    obligation={{
                      id: obligation.id,
                      name: obligation.name,
                      category: obligation.category,
                      dueDate: new Date(obligation.due_date),
                      responsibleId: obligation.responsible_id,
                      responsibleName: obligation.responsible_name || 'Sin asignar',
                      status: obligation.status,
                      createdAt: new Date(obligation.created_at),
                      updatedAt: new Date(obligation.updated_at)
                    }}
                    onClick={() => navigate(`/obligaciones/${obligation.id}`)}
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
