import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import { useObligations } from "@/hooks/useObligations";
import { useAccountantClients } from "@/hooks/useAccountantClients";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend
} from "recharts";
import {
  Download, Filter, CheckCircle2, XCircle, AlertTriangle,
  TrendingUp, BarChart3, Loader2, FileText, Calendar, Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { calculateComplianceScore } from "@/services/complianceScoreService";
import {
  generateComplianceReport, downloadReport, generateReportFileName
} from "@/services/reportGenerationService";
import { aggregateReportData } from "@/services/reportDataService";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { DashboardSkeleton } from "@/components/skeletons/Skeletons";
import { motion } from "framer-motion";

/* ── colour palette ───────────────────────────────────────────── */

const CLR = {
  danger: "#f43f5e",
  warning: "#f59e0b",
  success: "#10b981",
  primary: "#0e7490",
  purple: "#8b5cf6",
  muted: "#94a3b8",
};

const STATUS_COLORS: Record<string, string> = {
  vencida: CLR.danger,
  por_vencer: CLR.warning,
  al_dia: CLR.success,
};

const CATEGORY_COLORS: Record<string, string> = {
  legal: CLR.primary,
  fiscal: CLR.purple,
  seguridad: CLR.danger,
  operativa: CLR.warning,
};

/* ── recharts custom tooltip ──────────────────────────────────── */

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-xl text-sm">
      {label && <p className="font-semibold text-slate-700 mb-1">{label}</p>}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: p.fill || p.color }} />
          <span className="text-slate-500">{p.name}:</span>
          <span className="font-bold text-slate-800">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

/* ── last 6 months label  ─────────────────────────────────────── */

function last6Months() {
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    return d.toLocaleDateString("es-AR", { month: "short" });
  });
}

/* ── stat card ────────────────────────────────────────────────── */

function StatCard({
  icon, label, value, sub, color,
}: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string;
  color: "red" | "amber" | "emerald" | "sky" | "violet";
}) {
  const c = {
    red: "text-rose-600 bg-rose-50 border-rose-100",
    amber: "text-amber-600 bg-amber-50 border-amber-100",
    emerald: "text-emerald-600 bg-emerald-50 border-emerald-100",
    sky: "text-sky-600 bg-sky-50 border-sky-100",
    violet: "text-violet-600 bg-violet-50 border-violet-100",
  }[color];
  const textC = {
    red: "text-rose-600", amber: "text-amber-600", emerald: "text-emerald-700",
    sky: "text-sky-700", violet: "text-violet-700",
  }[color];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
        <div className={cn("h-8 w-8 rounded-xl border flex items-center justify-center", c)}>{icon}</div>
      </div>
      <p className={cn("text-3xl font-black leading-none", textC)}>{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1.5">{sub}</p>}
    </div>
  );
}

/* ── chart card wrapper ───────────────────────────────────────── */

function ChartCard({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5">
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
      {children}
    </div>
  );
}

/* ── custom pie label ─────────────────────────────────────────── */

const PIE_LABEL = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
  if (percent < 0.05) return null;
  const RAD = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + radius * Math.cos(-midAngle * RAD);
  const y = cy + radius * Math.sin(-midAngle * RAD);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

/* ── page ─────────────────────────────────────────────────────── */

const Reports = () => {
  const navigate = useNavigate();
  const { user, profile, isAdmin, isLoading: authLoading, signOut } = useAuth();
  const { data: obligations = [], isLoading } = useObligations();
  const { data: clients = [] } = useAccountantClients();
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isExporting, setIsExporting] = useState(false);

  const filtered = useMemo(
    () => (categoryFilter === "all" ? obligations : obligations.filter((o) => o.category === categoryFilter)),
    [obligations, categoryFilter]
  );

  /* ── derived metrics ── */

  const metrics = useMemo(() => {
    const total = filtered.length;
    const overdue = filtered.filter((o) => o.status === "vencida").length;
    const upcoming = filtered.filter((o) => o.status === "por_vencer").length;
    const ok = filtered.filter((o) => o.status === "al_dia").length;
    const score = calculateComplianceScore(filtered);
    return { total, overdue, upcoming, ok, score: score.score };
  }, [filtered]);

  /* ── status distribution (pie) ── */

  const statusData = useMemo(() => [
    { name: "Al día", value: metrics.ok, color: CLR.success },
    { name: "Por vencer", value: metrics.upcoming, color: CLR.warning },
    { name: "Vencidas", value: metrics.overdue, color: CLR.danger },
  ].filter((d) => d.value > 0), [metrics]);

  /* ── category distribution (bar) ── */

  const categoryData = useMemo(() => {
    const cats: Record<string, { vencida: number; por_vencer: number; al_dia: number }> = {};
    for (const o of filtered) {
      if (!cats[o.category]) cats[o.category] = { vencida: 0, por_vencer: 0, al_dia: 0 };
      cats[o.category][o.status]++;
    }
    return Object.entries(cats).map(([cat, v]) => ({
      name: { legal: "⚖️ Legal", fiscal: "📊 Fiscal", seguridad: "🛡️ Seg.", operativa: "⚙️ Oper." }[cat] || cat,
      Vencidas: v.vencida,
      "Por vencer": v.por_vencer,
      "Al día": v.al_dia,
    }));
  }, [filtered]);

  /* ── monthly trend (line) — simulated from due_dates ── */

  const months = last6Months();
  const trendData = useMemo(() => {
    return months.map((month, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const inMonth = obligations.filter((o) => o.due_date.startsWith(monthStr));
      return {
        mes: month,
        Vencidas: inMonth.filter((o) => o.status === "vencida").length,
        "Por vencer": inMonth.filter((o) => o.status === "por_vencer").length,
        "Al día": inMonth.filter((o) => o.status === "al_dia").length,
      };
    });
  }, [obligations, months]);

  /* ── client risk data ── */

  const clientRiskData = useMemo(() => [
    { name: "🔴 En riesgo", value: clients.filter((c) => c.status === "red").length, color: CLR.danger },
    { name: "🟡 Por vencer", value: clients.filter((c) => c.status === "yellow").length, color: CLR.warning },
    { name: "🟢 Al día", value: clients.filter((c) => c.status === "green").length, color: CLR.success },
  ].filter((d) => d.value > 0), [clients]);

  /* ── export ── */

  const handleExport = async () => {
    if (!user) return;
    try {
      setIsExporting(true);
      const score = calculateComplianceScore(filtered);
      const reportData = aggregateReportData(filtered, score, profile?.name || user.email || "Usuario", user.email || "");
      const blob = await generateComplianceReport(reportData);
      downloadReport(blob, generateReportFileName(profile?.name || "Empresa", new Date()));
      toast.success("Reporte PDF generado exitosamente");
    } catch (e) {
      toast.error("Error al generar el reporte");
    } finally {
      setIsExporting(false);
    }
  };

  const handleLogout = async () => { await signOut(); navigate("/"); };

  if (authLoading || isLoading) return <DashboardSkeleton />;
  if (!user) { navigate("/auth"); return null; }

  return (
    <div className="min-h-screen bg-[#F4F6F9]">
      <Header userName={profile?.name || user.email || "Usuario"} onLogout={handleLogout} isAdmin={isAdmin} userPlan={profile?.plan} />

      <main className="mx-auto max-w-5xl px-4 pb-20 pt-8 md:px-8">

        {/* HEADER */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Reportes y análisis</h1>
            <p className="text-sm text-slate-400 mt-0.5">Visión consolidada del cumplimiento de tus obligaciones</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-9 w-[140px] text-sm rounded-xl">
                <Filter size={13} className="mr-1.5 text-slate-400 shrink-0" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="legal">⚖️ Legal</SelectItem>
                <SelectItem value="fiscal">📊 Fiscal</SelectItem>
                <SelectItem value="seguridad">🛡️ Seguridad</SelectItem>
                <SelectItem value="operativa">⚙️ Operativa</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={handleExport}
              disabled={isExporting}
              className="h-9 gap-2 rounded-xl font-semibold text-sm"
            >
              {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              {isExporting ? "Generando..." : "Exportar PDF"}
            </Button>
          </div>
        </motion.div>

        {/* STAT CARDS */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
          className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4"
        >
          <StatCard icon={<Shield size={15} />} label="Cumplimiento" value={`${metrics.score}%`} sub="score general" color="emerald" />
          <StatCard icon={<BarChart3 size={15} />} label="Total" value={metrics.total} sub="obligaciones activas" color="sky" />
          <StatCard icon={<AlertTriangle size={15} />} label="Por vencer" value={metrics.upcoming} sub="próximos 30 días" color="amber" />
          <StatCard icon={<XCircle size={15} />} label="Vencidas" value={metrics.overdue} sub="requieren atención" color="red" />
        </motion.div>

        {/* ROW 1: status pie + category bar */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="mb-6 grid gap-6 lg:grid-cols-2"
        >
          <ChartCard title="Distribución por estado" sub="Porcentaje de obligaciones según su situación actual">
            {statusData.length === 0 ? (
              <div className="flex h-48 items-center justify-center text-sm text-slate-300">Sin datos</div>
            ) : (
              <div className="flex items-center gap-6">
                <ResponsiveContainer width={180} height={180}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={80}
                      dataKey="value"
                      labelLine={false}
                      label={PIE_LABEL}
                    >
                      {statusData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2.5">
                  {statusData.map((d) => (
                    <div key={d.name} className="flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                      <span className="text-sm text-slate-600">{d.name}</span>
                      <span className="ml-auto text-sm font-bold text-slate-900">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </ChartCard>

          <ChartCard title="Obligaciones por categoría" sub="Desglose de estado dentro de cada categoría">
            {categoryData.length === 0 ? (
              <div className="flex h-48 items-center justify-center text-sm text-slate-300">Sin datos</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={categoryData} barSize={18} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={24} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: "#f8fafc" }} />
                  <Bar dataKey="Vencidas" fill={CLR.danger} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Por vencer" fill={CLR.warning} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Al día" fill={CLR.success} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </motion.div>

        {/* ROW 2: monthly trend line */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="mb-6"
        >
          <ChartCard title="Evolución mensual" sub="Distribución de obligaciones por vencimiento en los últimos 6 meses">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trendData} margin={{ left: -8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={24} />
                <Tooltip content={<ChartTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
                <Line type="monotone" dataKey="Vencidas" stroke={CLR.danger} strokeWidth={2.5} dot={{ r: 4, fill: CLR.danger }} />
                <Line type="monotone" dataKey="Por vencer" stroke={CLR.warning} strokeWidth={2.5} dot={{ r: 4, fill: CLR.warning }} />
                <Line type="monotone" dataKey="Al día" stroke={CLR.success} strokeWidth={2.5} dot={{ r: 4, fill: CLR.success }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </motion.div>

        {/* ROW 3: client risk + compliance score */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
          className="grid gap-6 lg:grid-cols-2"
        >
          {/* Client risk pie */}
          {clients.length > 0 && (
            <ChartCard title="Estado de clientes" sub="Riesgo actual del portfolio de clientes">
              <div className="flex items-center gap-6">
                <ResponsiveContainer width={160} height={160}>
                  <PieChart>
                    <Pie
                      data={clientRiskData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={72}
                      dataKey="value"
                      labelLine={false}
                      label={PIE_LABEL}
                    >
                      {clientRiskData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-3">
                  {clientRiskData.map((d) => (
                    <div key={d.name} className="flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                      <span className="text-sm text-slate-600">{d.name}</span>
                      <span className="ml-auto text-sm font-bold text-slate-900">{d.value}</span>
                    </div>
                  ))}
                  <p className="text-xs text-slate-400 pt-1">{clients.length} clientes totales</p>
                </div>
              </div>
            </ChartCard>
          )}

          {/* Score + projection */}
          <ChartCard title="Score de cumplimiento" sub="Indicador de salud fiscal global">
            <div className="flex flex-col items-center gap-4 py-3">
              <div className="relative">
                <svg width={140} height={140} className="-rotate-90">
                  <circle cx={70} cy={70} r={56} fill="none" stroke="#f1f5f9" strokeWidth={12} />
                  <circle
                    cx={70} cy={70} r={56} fill="none"
                    stroke={metrics.score >= 80 ? CLR.success : metrics.score >= 50 ? CLR.warning : CLR.danger}
                    strokeWidth={12}
                    strokeDasharray={`${2 * Math.PI * 56}`}
                    strokeDashoffset={`${2 * Math.PI * 56 * (1 - metrics.score / 100)}`}
                    strokeLinecap="round"
                    style={{ transition: "stroke-dashoffset 1s ease" }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className={cn(
                    "text-3xl font-black",
                    metrics.score >= 80 ? "text-emerald-600" : metrics.score >= 50 ? "text-amber-600" : "text-rose-600"
                  )}>
                    {metrics.score}%
                  </span>
                  <span className="text-xs text-slate-400 -mt-1">cumplimiento</span>
                </div>
              </div>
              <div className="w-full text-center">
                <p className="text-sm text-slate-500 leading-relaxed">
                  {metrics.score >= 90
                    ? "✅ Excelente — estudio en orden"
                    : metrics.score >= 70
                    ? "🟡 Bueno, pero hay margen para mejorar"
                    : metrics.score >= 50
                    ? "⚠️ Atención — hay obligaciones en riesgo"
                    : "🚨 Crítico — acción inmediata requerida"}
                </p>
                <button
                  onClick={handleExport}
                  disabled={isExporting}
                  className="mt-4 flex items-center gap-1.5 mx-auto text-xs font-semibold text-primary hover:underline"
                >
                  <FileText size={13} />
                  Descargar reporte completo en PDF
                </button>
              </div>
            </div>
          </ChartCard>
        </motion.div>
      </main>
    </div>
  );
};

export default Reports;
