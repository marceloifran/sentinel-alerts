import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import StatusCard from "@/components/StatusCard";
import GeneralStatus from "@/components/GeneralStatus";
import ObligationCard from "@/components/ObligationCard";
import EmptyState from "@/components/EmptyState";
import { mockObligations } from "@/data/mockData";
import { CheckCircle, AlertTriangle, XCircle } from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const [obligations] = useState(mockObligations);

  const stats = useMemo(() => {
    const overdue = obligations.filter(o => o.status === 'vencida').length;
    const upcoming = obligations.filter(o => o.status === 'por_vencer').length;
    const onTrack = obligations.filter(o => o.status === 'al_dia').length;
    return { overdue, upcoming, onTrack };
  }, [obligations]);

  const criticalObligations = useMemo(() => {
    return obligations
      .filter(o => o.status === 'vencida' || o.status === 'por_vencer')
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [obligations]);

  const hasOverdue = stats.overdue > 0;

  const handleLogout = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header userName="María García" onLogout={handleLogout} />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
          <h2 className="text-lg font-semibold text-foreground mb-4">
            {criticalObligations.length > 0 ? "Obligaciones críticas" : "Tus obligaciones"}
          </h2>
          
          {obligations.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-3">
              {(criticalObligations.length > 0 ? criticalObligations : obligations).map((obligation, index) => (
                <div 
                  key={obligation.id}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <ObligationCard 
                    obligation={obligation}
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
