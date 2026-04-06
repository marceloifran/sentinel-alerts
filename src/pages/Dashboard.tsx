import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useObligations } from "@/hooks/useObligations";
import { useRealtimeComplianceScore } from "@/hooks/useComplianceScore";
import {
  useAccountantClients,
  useAddClientCompany,
  useRemoveClientCompany,
} from "@/hooks/useAccountantClients";
import { AddClientDialog } from "@/components/AddClientDialog";
import {
  AlertTriangle, XCircle, CheckCircle2, ChevronRight,
  Plus, Building2, Trash2, Zap, Shield, Clock,
} from "lucide-react";
import { AIAssistantButton } from "@/components/ai/AIAssistantButton";
import { DashboardSkeleton } from "@/components/skeletons/Skeletons";
import { ErrorState } from "@/components/ErrorState";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { ClientCompany, ClientStatus } from "@/services/accountantClientService";

/* ── helpers ──────────────────────────────────────────────────── */

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("es-AR", { day: "numeric", month: "short" });

const daysLabel = (days: number) => {
  if (days < 0) return `Venció hace ${Math.abs(days)}d`;
  if (days === 0) return "¡HOY!";
  if (days === 1) return "Mañana";
  return `En ${days} días`;
};

interface AgendaItem {
  id: string;
  name: string;
  dueDate: string;
  daysLeft: number;
  status: "vencida" | "por_vencer";
  scope: string;
  href: string;
}

/* ── Emergency Banner ─────────────────────────────────────────── */

function EmergencyBanner({ items }: { items: AgendaItem[] }) {
  const todayItems = items.filter((i) => i.daysLeft <= 0);
  if (todayItems.length === 0) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-600">
        <Zap size={16} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-red-700 mb-0.5">
          🚨 {todayItems.length} vencimiento{todayItems.length > 1 ? "s" : ""} HOY
        </p>
        <p className="text-xs text-red-500/70 truncate">
          {todayItems.map((i) => i.name).join(" · ")}
        </p>
      </div>
      <span className="shrink-0 animate-pulse rounded-full bg-red-100 border border-red-300 px-2.5 py-0.5 text-[11px] font-bold text-red-700">
        URGENTE
      </span>
    </motion.div>
  );
}

/* ── Status Dot ───────────────────────────────────────────────── */

function StatusDot({ status }: { status: ClientStatus }) {
  const cfg: Record<ClientStatus, { cls: string; glow: string }> = {
    red: { cls: "bg-red-500", glow: "0 0 6px 2px rgba(239,68,68,0.4)" },
    yellow: { cls: "bg-amber-400", glow: "0 0 6px 2px rgba(251,191,36,0.4)" },
    green: { cls: "bg-emerald-500", glow: "0 0 5px 2px rgba(52,211,153,0.35)" },
  };
  return (
    <span
      className={cn("inline-block w-2.5 h-2.5 rounded-full shrink-0", cfg[status].cls)}
      style={{ boxShadow: cfg[status].glow }}
    />
  );
}

/* ── Agenda Row ───────────────────────────────────────────────── */

function AgendaRow({ item, idx }: { item: AgendaItem; idx: number }) {
  const navigate = useNavigate();
  const overdue = item.daysLeft <= 0;
  const soon = item.daysLeft > 0 && item.daysLeft <= 2;

  return (
    <motion.button
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: idx * 0.04 }}
      onClick={() => navigate(item.href)}
      className={cn(
        "group w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200",
        overdue
          ? "bg-red-50 border-red-200 hover:border-red-300"
          : soon
          ? "bg-amber-50 border-amber-200 hover:border-amber-300"
          : "bg-white border-slate-200 hover:border-slate-300"
      )}
    >
      <div
        className={cn(
          "h-8 w-8 shrink-0 rounded-lg flex items-center justify-center",
          overdue ? "bg-red-100" : soon ? "bg-amber-100" : "bg-slate-100"
        )}
      >
        {overdue ? (
          <XCircle size={15} className="text-red-600" />
        ) : soon ? (
          <Clock size={15} className="text-amber-600" />
        ) : (
          <AlertTriangle size={15} className="text-slate-400" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-900 truncate">{item.name}</p>
        <p className="text-[11px] text-slate-400 mt-0.5">{item.scope}</p>
      </div>
      <div className="text-right shrink-0">
        <p className={cn(
          "text-sm font-bold",
          overdue ? "text-red-600" : soon ? "text-amber-600" : "text-slate-400"
        )}>
          {daysLabel(item.daysLeft)}
        </p>
        <p className="text-[10px] text-slate-300 mt-0.5">{fmtDate(item.dueDate)}</p>
      </div>
      <ChevronRight size={14} className="shrink-0 text-slate-300 group-hover:text-slate-500 transition-colors" />
    </motion.button>
  );
}

/* ── Client Row ───────────────────────────────────────────────── */

function ClientRow({
  client, idx, onClick, onRemove,
}: {
  client: ClientCompany; idx: number; onClick: () => void; onRemove: () => void;
}) {
  const [confirm, setConfirm] = useState(false);

  const labelCls: Record<ClientStatus, string> = {
    red: "text-red-700 bg-red-50 border-red-200",
    yellow: "text-amber-700 bg-amber-50 border-amber-200",
    green: "text-emerald-700 bg-emerald-50 border-emerald-200",
  };
  const labelTxt: Record<ClientStatus, string> = { red: "En riesgo", yellow: "Por vencer", green: "Al día" };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.04 }}
      className="group flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 hover:border-slate-300 hover:shadow-sm transition-all"
      onClick={onClick}
    >
      <StatusDot status={client.status} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-900 truncate">{client.nickname || client.companyName}</p>
        <p className="text-[11px] text-slate-400 mt-0.5">
          {client.cuit ? `CUIT ${client.cuit}` : "Sin CUIT"} · {client.totalObligations} oblig.
        </p>
      </div>
      {client.nextObligation && client.status !== "green" && (
        <div className="hidden sm:block shrink-0 text-right max-w-[130px]">
          <p className="text-[11px] text-slate-400 truncate">{client.nextObligation.name}</p>
          <p className={cn("text-[11px] font-bold mt-0.5", client.status === "red" ? "text-red-600" : "text-amber-600")}>
            {daysLabel(client.nextObligation.daysUntilDue)}
          </p>
        </div>
      )}
      <span className={cn("shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-bold", labelCls[client.status])}>
        {labelTxt[client.status]}
      </span>
      {!confirm ? (
        <button
          onClick={(e) => { e.stopPropagation(); setConfirm(true); }}
          className="shrink-0 rounded-lg p-1.5 text-slate-300 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 transition-all"
        >
          <Trash2 size={12} />
        </button>
      ) : (
        <div className="flex shrink-0 items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => { onRemove(); setConfirm(false); }} className="rounded-lg bg-red-600 px-2 py-1 text-[11px] font-bold text-white hover:bg-red-700 transition-colors">Sí</button>
          <button onClick={() => setConfirm(false)} className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-500 hover:bg-slate-50 transition-colors">No</button>
        </div>
      )}
      <ChevronRight size={13} className="shrink-0 text-slate-300 group-hover:text-slate-500 transition-colors" />
    </motion.div>
  );
}

/* ── Stat Card ────────────────────────────────────────────────── */

function StatCard({
  value, label, sub, icon, variant,
}: {
  value: number | string; label: string; sub: string;
  icon: React.ReactNode;
  variant: "danger" | "warning" | "neutral" | "score";
}) {
  const showDanger = variant === "danger" && Number(value) > 0;
  const showWarning = variant === "warning" && Number(value) > 0;

  const borderCls = showDanger
    ? "border-red-200"
    : showWarning
    ? "border-amber-200"
    : "border-slate-200";

  const valCls = showDanger
    ? "text-red-600"
    : showWarning
    ? "text-amber-600"
    : variant === "score"
    ? Number(value) >= 80 ? "text-emerald-600" : Number(value) >= 50 ? "text-amber-600" : "text-red-600"
    : "text-slate-800";

  const labelCls = showDanger
    ? "text-red-500"
    : showWarning
    ? "text-amber-500"
    : "text-slate-400";

  const iconCls = showDanger
    ? "bg-red-50 text-red-500"
    : showWarning
    ? "bg-amber-50 text-amber-500"
    : "bg-slate-50 text-slate-400";

  return (
    <div className={cn("rounded-2xl border bg-white p-5", borderCls)}>
      <div className="flex items-center justify-between mb-4">
        <p className={cn("text-[10px] font-bold uppercase tracking-widest", labelCls)}>{label}</p>
        <div className={cn("h-8 w-8 rounded-xl flex items-center justify-center", iconCls)}>
          {icon}
        </div>
      </div>
      <p className={cn("text-4xl font-black leading-none tabular-nums", valCls)}>
        {value}{variant === "score" ? "%" : ""}
      </p>
      <p className="mt-2 text-[11px] text-slate-400">{sub}</p>
    </div>
  );
}

/* ── Dashboard ────────────────────────────────────────────────── */

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, profile, isAdmin, isLoading: authLoading, signOut } = useAuth();
  const [showAddDialog, setShowAddDialog] = useState(false);

  const { data: obligations = [], isLoading, error, refetch } = useObligations();
  const complianceScore = useRealtimeComplianceScore();
  const { data: clients = [], isLoading: clientsLoading } = useAccountantClients();
  const addMutation = useAddClientCompany();
  const removeMutation = useRemoveClientCompany();

  const stats = useMemo(() => {
    const ownOverdue = obligations.filter((o) => o.status === "vencida").length;
    const ownUpcoming = obligations.filter((o) => o.status === "por_vencer").length;
    const ownOk = obligations.filter((o) => o.status === "al_dia").length;
    const clientOverdue = clients.reduce((acc, c) => acc + (c.overdueCount || 0), 0);
    const clientUpcoming = clients.reduce((acc, c) => acc + (c.urgentCount || 0), 0);
    return {
      overdue: ownOverdue + clientOverdue,
      upcoming: ownUpcoming + clientUpcoming,
      ok: ownOk,
      score: complianceScore?.score ?? 100,
    };
  }, [obligations, clients, complianceScore]);

  const agendaItems = useMemo<AgendaItem[]>(() => {
    const items: AgendaItem[] = [];
    obligations.filter((o) => o.status !== "al_dia").forEach((o) => {
      const days = Math.round((new Date(o.due_date).getTime() - Date.now()) / 86_400_000);
      items.push({ id: o.id, name: o.name, dueDate: o.due_date, daysLeft: days, status: o.status as any, scope: "Mi empresa", href: `/obligaciones/${o.id}` });
    });
    clients.forEach((c) => {
      if (c.nextObligation && (c.status === "red" || c.status === "yellow")) {
        items.push({ id: `${c.id}-next`, name: c.nextObligation.name, dueDate: c.nextObligation.dueDate, daysLeft: c.nextObligation.daysUntilDue, status: c.status === "red" ? "vencida" : "por_vencer", scope: c.nickname || c.companyName, href: `/empresa/${c.companyId}` });
      }
    });
    return items.sort((a, b) => a.daysLeft - b.daysLeft);
  }, [obligations, clients]);

  const sortedClients = useMemo(
    () => [...clients].sort((a, b) => {
      const ord: Record<string, number> = { red: 0, yellow: 1, green: 2 };
      const diff = ord[a.status] - ord[b.status];
      return diff !== 0 ? diff : a.companyName.localeCompare(b.companyName, "es-AR");
    }),
    [clients]
  );

  const handleLogout = async () => { await signOut(); navigate("/"); };
  const handleAddClient = async (name: string, cuit?: string) => {
    try { await addMutation.mutateAsync({ companyName: name, cuit }); toast.success(`${name} agregada`); }
    catch (e: any) { toast.error(e?.message || "Error"); throw e; }
  };
  const handleRemove = async (linkId: string, name: string) => {
    try { await removeMutation.mutateAsync(linkId); toast.success(`${name} eliminado`); }
    catch (e: any) { toast.error(e?.message || "Error"); }
  };

  if (!authLoading && !user) navigate("/auth");
  if (authLoading || isLoading) return <DashboardSkeleton />;
  if (error) return (
    <div className="min-h-screen bg-[#F4F6F9]">
      <Header userName={profile?.name || user?.email || "Usuario"} onLogout={handleLogout} isAdmin={isAdmin} userPlan={profile?.plan} />
      <ErrorState error={error as Error} onRetry={() => refetch()} />
    </div>
  );
  if (!user) return null;

  const h = new Date().getHours();
  const greeting = h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches";
  const firstName = (profile?.name || user.email || "").split(" ")[0];

  return (
    <div className="min-h-screen bg-[#F4F6F9]">
      <Header userName={profile?.name || user.email || "Usuario"} onLogout={handleLogout} isAdmin={isAdmin} userPlan={profile?.plan} />

      <main className="mx-auto max-w-4xl px-4 pb-28 pt-8 md:px-8">

        {/* GREETING */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-900">{greeting}, {firstName} 👋</h1>
              <p className="text-sm text-slate-400 mt-0.5">
                {new Date().toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="gap-2 rounded-xl border-slate-200 bg-white text-slate-600 hover:bg-slate-50 font-semibold text-sm shadow-sm"
              onClick={() => setShowAddDialog(true)}
            >
              <Plus size={14} /> Cliente
            </Button>
          </div>
        </motion.div>

        {/* EMERGENCY BANNER */}
        <EmergencyBanner items={agendaItems} />

        {/* STATS */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
          className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4"
        >
          <StatCard value={stats.overdue} label="Vencidas" sub="atención ya" icon={<XCircle size={16} />} variant="danger" />
          <StatCard value={stats.upcoming} label="Por vencer" sub="próximos 7 días" icon={<AlertTriangle size={16} />} variant="warning" />
          <StatCard value={stats.ok} label="Al día" sub="sin urgencias" icon={<CheckCircle2 size={16} />} variant="neutral" />
          <StatCard value={stats.score} label="Cumplimiento" sub="score fiscal" icon={<Shield size={16} />} variant="score" />
        </motion.div>

        {/* AGENDA */}
        <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-8">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-600">Panel de riesgo</h2>
              {agendaItems.length > 0 && (
                <span className="rounded-full bg-red-100 border border-red-200 px-2 py-0.5 text-[10px] font-bold text-red-700">
                  {agendaItems.length}
                </span>
              )}
            </div>
            <button
              onClick={() => navigate("/obligaciones")}
              className="text-[11px] text-slate-400 hover:text-slate-700 transition-colors font-medium"
            >
              Ver todas →
            </button>
          </div>

          {agendaItems.length === 0 ? (
            <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3.5">
              <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
              <p className="text-sm text-emerald-700 font-medium">Todo en orden — sin vencimientos urgentes.</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {agendaItems.slice(0, 7).map((item, idx) => <AgendaRow key={item.id} item={item} idx={idx} />)}
              {agendaItems.length > 7 && (
                <button
                  onClick={() => navigate("/obligaciones")}
                  className="w-full rounded-xl py-2.5 text-center text-xs font-medium text-slate-400 hover:text-slate-700 hover:bg-white transition-all border border-transparent hover:border-slate-200"
                >
                  + {agendaItems.length - 7} más
                </button>
              )}
            </div>
          )}
        </motion.section>

        {/* CLIENTES */}
        <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-600">
              Mis clientes
              {clients.length > 0 && (
                <span className="ml-2 rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                  {clients.length}
                </span>
              )}
            </h2>
          </div>

          {clientsLoading ? (
            <div className="space-y-1.5">{[...Array(3)].map((_, i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100" />)}</div>
          ) : clients.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-10 text-center">
              <Building2 size={28} className="mx-auto mb-3 text-slate-300" />
              <p className="text-sm text-slate-400 mb-4">Sin clientes agregados</p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowAddDialog(true)}
                className="gap-2 rounded-xl border-slate-200"
              >
                <Plus size={13} /> Agregar cliente
              </Button>
            </div>
          ) : (
            <AnimatePresence>
              <div className="space-y-1.5">
                {sortedClients.map((client, idx) => (
                  <ClientRow
                    key={client.id}
                    client={client}
                    idx={idx}
                    onClick={() => navigate(`/empresa/${client.companyId}`)}
                    onRemove={() => handleRemove(client.id, client.companyName)}
                  />
                ))}
              </div>
            </AnimatePresence>
          )}
        </motion.section>
      </main>

      <AIAssistantButton />
      <AddClientDialog open={showAddDialog} onOpenChange={setShowAddDialog} onConfirm={handleAddClient} />
    </div>
  );
};

export default Dashboard;
