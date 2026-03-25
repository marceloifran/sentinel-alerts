import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/Header";
import StatusCard from "@/components/StatusCard";
import ObligationCard from "@/components/ObligationCard";
import CalendarView from "@/components/CalendarView";
import EmptyState from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useObligations } from "@/hooks/useObligations";
import { useRealtimeComplianceScore } from "@/hooks/useComplianceScore";
import { useAccountantClients, useAddClientCompany, useRemoveClientCompany } from "@/hooks/useAccountantClients";
import { ClientCard } from "@/components/ClientCard";
import { AddClientDialog } from "@/components/AddClientDialog";
import {
  CheckCircle, AlertTriangle, XCircle, List,
  Shield, Building2, Plus, Search, Users, LayoutDashboard,
  TrendingUp, Sparkles, Clock, Calendar, ShieldAlert,
  ArrowRight, Filter
} from "lucide-react";
import { AIAssistantButton } from "@/components/ai/AIAssistantButton";
import { DashboardSkeleton } from "@/components/skeletons/Skeletons";
import { ErrorState } from "@/components/ErrorState";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type ViewMode = 'list' | 'calendar';

interface AgendaItem {
  id: string;
  name: string;
  dueDate: string;
  status: string;
  type: 'personal' | 'client';
  companyName?: string;
  companyId?: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, profile, isAdmin, isLoading: authLoading, signOut } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [clientSearch, setClientSearch] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const isMobile = useIsMobile();

  // Own obligations
  const { data: obligations = [], isLoading, error, refetch } = useObligations();
  const complianceScore = useRealtimeComplianceScore();

  // Client panel
  const { data: clients = [], isLoading: clientsLoading } = useAccountantClients();
  const addMutation = useAddClientCompany();
  const removeMutation = useRemoveClientCompany();

  // UNIFIED STATS
  const unifiedStats = useMemo(() => {
    const personalOverdue = obligations.filter(o => o.status === 'vencida').length;
    const personalUpcoming = obligations.filter(o => o.status === 'por_vencer').length;
    
    const clientOverdue = clients.reduce((acc, c) => acc + (c.overdueCount || 0), 0);
    const clientUpcoming = clients.reduce((acc, c) => acc + (c.urgentCount || 0), 0);

    return {
      totalOverdue: personalOverdue + clientOverdue,
      totalUpcoming: personalUpcoming + clientUpcoming,
      personalOnTime: obligations.filter(o => o.status === 'al_dia').length,
    };
  }, [obligations, clients]);

  // UNIFIED AGENDA
  const agendaItems = useMemo(() => {
    const items: AgendaItem[] = [];

    // Add personal items
    obligations
      .filter(o => o.status !== 'al_dia')
      .forEach(o => {
        items.push({
          id: o.id,
          name: o.name,
          dueDate: o.due_date,
          status: o.status,
          type: 'personal',
          companyName: 'Personal'
        });
      });

    // Add client next obligations
    clients.forEach(c => {
      if (c.nextObligation && (c.status === 'red' || c.status === 'yellow')) {
        items.push({
          id: `${c.id}-next`,
          name: c.nextObligation.name,
          dueDate: c.nextObligation.dueDate,
          status: c.status === 'red' ? 'vencida' : 'por_vencer',
          type: 'client',
          companyName: c.companyName,
          companyId: c.companyId
        });
      }
    });

    return items.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [obligations, clients]);

  const filteredClients = useMemo(() => {
    let list = clients;
    if (clientSearch.trim()) {
      const q = clientSearch.toLowerCase();
      list = list.filter(c =>
        c.companyName.toLowerCase().includes(q) ||
        c.nickname?.toLowerCase().includes(q) ||
        c.cuit?.includes(q)
      );
    }
    return [...list].sort((a, b) => {
      const order = { red: 0, yellow: 1, green: 2 };
      if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
      return a.companyName.localeCompare(b.companyName, 'es-AR');
    });
  }, [clients, clientSearch]);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const handleAddClient = async (companyName: string, cuit?: string) => {
    try {
      await addMutation.mutateAsync({ companyName, cuit });
      toast.success(`${companyName} agregada con éxito`);
    } catch (err: any) {
      toast.error(err?.message || 'Error al agregar el cliente');
      throw err;
    }
  };

  const handleRemoveClient = async (linkId: string, companyName: string) => {
    try {
      await removeMutation.mutateAsync(linkId);
      toast.success(`${companyName} eliminado del panel`);
    } catch (err: any) {
      toast.error(err?.message || 'Error al eliminar el cliente');
    }
  };

  if (!authLoading && !user) navigate('/auth');
  if (authLoading || isLoading) return <DashboardSkeleton />;
  if (error) return (
    <div className="min-h-screen bg-background">
      <Header userName={profile?.name || user?.email || 'Usuario'} onLogout={handleLogout} isAdmin={isAdmin} userPlan={profile?.plan} />
      <ErrorState error={error as Error} onRetry={() => refetch()} />
    </div>
  );
  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Header userName={profile?.name || user.email || 'Usuario'} onLogout={handleLogout} isAdmin={isAdmin} userPlan={profile?.plan} />

      <main className="container mx-auto px-4 md:px-8 py-8 space-y-12 pb-24">
        {/* SECTION: SUMMARY HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
              <LayoutDashboard className="h-8 w-8 text-primary" strokeWidth={2.5} />
              Panel de Control
            </h1>
            <p className="text-slate-500 font-medium">
              Gestioná tus impuestos y los de tus clientes desde un solo lugar.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
               <div className="h-10 w-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                 <TrendingUp size={22} />
               </div>
               <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cumplimiento</p>
                  <p className="text-xl font-black text-slate-900">{complianceScore?.score ?? 100}%</p>
               </div>
            </div>
            <Button onClick={() => setShowAddDialog(true)} className="h-12 rounded-xl gap-2 shadow-md px-6 font-bold">
              <Plus size={20} /> Nuevo Cliente
            </Button>
          </div>
        </div>

        {/* SECTION: UNIFIED STATS */}
        <section className="space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
                <div>
                   <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Riesgo Fiscal</p>
                   <p className={cn(
                     "text-2xl font-black h-8 mt-1",
                     complianceScore?.level === 'bajo' ? 'text-rose-600' : 'text-emerald-600'
                   )}>{complianceScore?.level ? (complianceScore.level.charAt(0).toUpperCase() + complianceScore.level.slice(1)) : 'Bajo'}</p>
                </div>
                <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-slate-50 text-slate-300">
                   <ShieldAlert size={24} />
                </div>
              </div>
              <StatusCard count={unifiedStats.totalOverdue} label="Vencidas" status="danger" icon={<XCircle size={24} />} />
              <StatusCard count={unifiedStats.totalUpcoming} label="Próximas" status="warning" icon={<AlertTriangle size={24} />} />
              <StatusCard count={unifiedStats.personalOnTime} label="Tus Al Día" status="success" icon={<CheckCircle size={24} />} />
           </div>
        </section>

        {/* SECTION: GLOBAL AGENDA */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <List className="text-primary" size={24} />
              Atención Prioritaria
            </h2>
            <div className="flex items-center gap-4">
              <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('list')} className="h-7 rounded-md text-[10px] font-black px-3">
                  LISTA
                </Button>
                <Button variant={viewMode === 'calendar' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('calendar')} className="h-7 rounded-md text-[10px] font-black px-3">
                  CALENDARIO
                </Button>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/obligaciones')} className="h-9 px-4 rounded-xl text-xs font-bold gap-2 text-primary hover:bg-primary/5">
                Ver todas <ArrowRight size={14} />
              </Button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {viewMode === 'calendar' ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <CalendarView obligations={obligations} onSelectObligation={(o: any) => navigate(`/obligaciones/${o.id}`)} />
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={cn(
                "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
                agendaItems.length === 0 && "grid-cols-1"
              )}>
                {agendaItems.length === 0 ? (
                  <div className="bg-white py-12 rounded-3xl border border-slate-200 text-center space-y-4">
                    <CheckCircle size={40} className="mx-auto text-emerald-200" />
                    <p className="text-slate-500 font-medium">Todo al día por aquí.</p>
                  </div>
                ) : (
                  agendaItems.slice(0, 6).map(item => (
                    <div 
                      key={item.id} 
                      onClick={() => navigate(item.type === 'personal' ? `/obligaciones/${item.id}` : `/empresa/${item.companyId}`)}
                      className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md hover:border-primary/20 transition-all cursor-pointer group flex items-start gap-4"
                    >
                      <div className={cn(
                        "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
                        item.status === 'vencida' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                      )}>
                        {item.status === 'vencida' ? <XCircle size={20} /> : <Clock size={20} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className={cn(
                            "px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest",
                            item.type === 'personal' ? 'bg-cyan-50 text-cyan-600' : 'bg-slate-100 text-slate-500'
                          )}>
                            {item.type === 'personal' ? 'Personal' : item.companyName}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 truncate group-hover:text-primary transition-colors">
                          {item.name}
                        </h3>
                        <p className="text-[10px] font-medium text-slate-400 mt-1">
                          Vence: {new Date(item.dueDate).toLocaleDateString('es-AR')}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* SECTION: CLIENTS */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Users className="text-primary" size={24} />
              Mis Clientes
            </h2>
            <div className="relative group max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={16} />
              <Input
                placeholder="Buscar cliente..."
                value={clientSearch}
                onChange={e => setClientSearch(e.target.value)}
                className="h-10 pl-9 rounded-xl border-slate-200 bg-white shadow-sm focus:ring-4 focus:ring-primary/5 transition-all font-medium text-sm"
              />
            </div>
          </div>

          {clientsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => <div key={i} className="h-40 rounded-2xl bg-slate-100 animate-pulse" />)}
            </div>
          ) : clients.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border-2 border-dashed border-slate-200 space-y-4">
              <Users size={40} className="mx-auto text-slate-200" />
              <p className="text-slate-500 font-medium">Aún no agregaste clientes.</p>
              <Button variant="outline" onClick={() => setShowAddDialog(true)} className="rounded-lg h-10 px-6">Agregar primer cliente</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredClients.map(client => (
                <ClientCard 
                  key={client.id} 
                  client={client} 
                  onClick={() => navigate(`/empresa/${client.companyId}`)} 
                  onRemove={() => handleRemoveClient(client.id, client.companyName)} 
                />
              ))}
            </div>
          )}
        </section>
      </main>

      <AIAssistantButton />
      <AddClientDialog open={showAddDialog} onOpenChange={setShowAddDialog} onConfirm={handleAddClient} />
    </div>
  );
};

export default Dashboard;
