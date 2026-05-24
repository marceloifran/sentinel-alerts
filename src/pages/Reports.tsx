import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend
} from "recharts";
import {
  Download, Filter, Loader2, FileText, Shield, Boxes, Users, AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { DashboardSkeleton } from "@/components/skeletons/Skeletons";
import { motion } from "framer-motion";
import {
  getEmployees,
  getEPPItems,
  getEPPDeliveries,
  type Employee,
  type EPPItem,
  type EPPDelivery,
} from "@/services/eppService";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/* ── color palette ───────────────────────────────────────────── */

const CLR = {
  danger: "#ef4444",
  warning: "#f59e0b",
  success: "#10b981",
  primary: "#06b6d4",
  purple: "#8b5cf6",
  muted: "#64748b",
};

/* ── recharts custom tooltip ──────────────────────────────────── */

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c101d] px-4 py-3 shadow-xl text-xs text-slate-800 dark:text-white">
      {label && <p className="font-bold text-slate-700 dark:text-slate-350 mb-1">{label}</p>}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 mt-0.5">
          <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: p.fill || p.color }} />
          <span className="text-slate-500 dark:text-slate-400">{p.name}:</span>
          <span className="font-bold text-slate-900 dark:text-white">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

/* ── stat card ────────────────────────────────────────────────── */

function StatCard({
  icon, label, value, sub, color,
}: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string;
  color: "red" | "amber" | "emerald" | "cyan";
}) {
  const c = {
    red: "text-red-650 dark:text-red-400 bg-red-500/5 dark:bg-red-500/10 border-red-200 dark:border-red-500/20",
    amber: "text-amber-650 dark:text-amber-400 bg-amber-500/5 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20",
    emerald: "text-emerald-655 dark:text-emerald-400 bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-250 dark:border-emerald-500/20",
    cyan: "text-cyan-650 dark:text-cyan-400 bg-cyan-500/5 dark:bg-cyan-500/10 border-cyan-200 dark:border-cyan-500/20",
  }[color];

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-900 bg-white dark:bg-[#080b11] p-5 shadow-sm relative overflow-hidden group hover:border-slate-300 dark:hover:border-slate-700 transition-all">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{label}</p>
        <div className={cn("h-8 w-8 rounded-xl border flex items-center justify-center", c)}>{icon}</div>
      </div>
      <p className="text-3xl font-black leading-none text-slate-900 dark:text-white">{value}</p>
      {sub && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-medium">{sub}</p>}
    </div>
  );
}

/* ── chart card wrapper ───────────────────────────────────────── */

function ChartCard({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-900 bg-white dark:bg-[#080b11] p-6 shadow-sm">
      <div className="mb-5">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h3>
        {sub && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{sub}</p>}
      </div>
      {children}
    </div>
  );
}

/* ── custom pie label ─────────────────────────────────────────── */

const PIE_LABEL = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
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
  const { user, profile, isAdmin, signOut } = useAuth();
  const companyId = profile?.company_id;

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [eppItems, setEppItems] = useState<EPPItem[]>([]);
  const [deliveries, setDeliveries] = useState<EPPDelivery[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isExporting, setIsExporting] = useState(false);

  // Sync theme check for compliance circle stroke
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== "undefined") {
      return document.documentElement.classList.contains("dark");
    }
    return false;
  });

  useEffect(() => {
    if (!companyId) return;
    loadReportData();
  }, [companyId]);

  useEffect(() => {
    const handleThemeGlobal = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };
    window.addEventListener("theme-changed", handleThemeGlobal);
    return () => {
      window.removeEventListener("theme-changed", handleThemeGlobal);
    };
  }, []);

  const loadReportData = async () => {
    try {
      setLoading(true);
      const [empList, eppList, delList] = await Promise.all([
        getEmployees(companyId!),
        getEPPItems(companyId!),
        getEPPDeliveries(companyId!),
      ]);
      setEmployees(empList);
      setEppItems(eppList);
      setDeliveries(delList);
    } catch (e: any) {
      toast.error("Error al cargar reportes: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter deliveries by EPP category if needed
  const filteredDeliveries = useMemo(() => {
    if (categoryFilter === "all") return deliveries;
    return deliveries.filter(d => d.epp_item?.category === categoryFilter);
  }, [deliveries, categoryFilter]);

  // Calculate high-level compliance metrics
  const metrics = useMemo(() => {
    const total = filteredDeliveries.reduce((sum, d) => sum + d.quantity, 0);
    const signed = filteredDeliveries.filter(d => d.status === "firmado").reduce((sum, d) => sum + d.quantity, 0);
    const pending = total - signed;
    const complianceRate = total > 0 ? Math.round((signed / total) * 100) : 100;
    
    // Count items in inventory below critical level (stock <= 5)
    const lowStockCount = eppItems.filter(item => item.stock <= 5).length;

    return { total, signed, pending, complianceRate, lowStockCount };
  }, [filteredDeliveries, eppItems]);

  // Status distribution (Pie chart data)
  const statusData = useMemo(() => [
    { name: "Firmados", value: metrics.signed, color: CLR.success },
    { name: "Pendientes Firma", value: metrics.pending, color: CLR.warning },
  ].filter(d => d.value > 0), [metrics]);

  // EPP Category distribution (Bar chart data)
  const categoryData = useMemo(() => {
    const cats: Record<string, number> = {};
    for (const d of filteredDeliveries) {
      const cat = d.epp_item?.category || "otros";
      const label = {
        cabeza: "🪖 Cabeza",
        manos: "🧤 Manos",
        pies: "🥾 Pies",
        cuerpo: "🛡️ Cuerpo",
        visual: "🥽 Visual",
        auditiva: "🎧 Auditiva",
        respiratoria: "😷 Respiratoria",
        otros: "📦 Otros"
      }[cat] || cat;
      cats[label] = (cats[label] || 0) + d.quantity;
    }
    return Object.entries(cats).map(([name, value]) => ({
      name,
      Cantidad: value
    }));
  }, [filteredDeliveries]);

  // Monthly trend (Line chart data)
  const trendData = useMemo(() => {
    const monthlyCounts: Record<string, { month: string; Firmados: number; Pendientes: number }> = {};
    
    // Generate last 6 months keys
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString("es-AR", { month: "short" });
      monthlyCounts[monthKey] = { month: label, Firmados: 0, Pendientes: 0 };
    }

    for (const d of filteredDeliveries) {
      const dateStr = d.delivery_date;
      if (!dateStr) continue;
      const key = dateStr.substring(0, 7); // YYYY-MM
      if (monthlyCounts[key]) {
        if (d.status === "firmado") {
          monthlyCounts[key].Firmados += d.quantity;
        } else {
          monthlyCounts[key].Pendientes += d.quantity;
        }
      }
    }

    return Object.values(monthlyCounts);
  }, [filteredDeliveries]);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const doc = new jsPDF();
      
      // Header Box
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.3);
      doc.rect(10, 15, 190, 30);
      
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(12);
      doc.text("AUDITORÍA DE CONTROL DE EPP Y SEGURIDAD LABORAL", 15, 25);
      doc.setFontSize(9);
      doc.setFont("Helvetica", "normal");
      doc.text(`Empresa: ${profile?.company_name || "Mi Empresa ifsinrem"}`, 15, 33);
      doc.text(`Fecha de Generación: ${new Date().toLocaleDateString("es-AR")}`, 15, 38);
      doc.text(`Tasa de Cumplimiento de Firmas: ${metrics.complianceRate}%`, 130, 33);
      doc.text(`Total EPP Entregados: ${metrics.total} u.`, 130, 38);

      // Employees Compliance Table
      doc.setFontSize(10);
      doc.setFont("Helvetica", "bold");
      doc.text("Resumen de Firmas por Operario:", 10, 52);

      const tableRows = employees.map(emp => {
        const empDels = deliveries.filter(d => d.employee_id === emp.id);
        const totalEmp = empDels.reduce((sum, d) => sum + d.quantity, 0);
        const signedEmp = empDels.filter(d => d.status === "firmado").reduce((sum, d) => sum + d.quantity, 0);
        const pendingEmp = totalEmp - signedEmp;
        const rate = totalEmp > 0 ? `${Math.round((signedEmp / totalEmp) * 100)}%` : "N/A";
        return [emp.name, emp.dni_cuil, emp.job_title || "General", totalEmp.toString(), signedEmp.toString(), pendingEmp.toString(), rate];
      });

      autoTable(doc, {
        startY: 55,
        head: [['Operario', 'DNI / CUIL', 'Puesto', 'Entregados', 'Firmados', 'Pendientes', 'Cumplimiento']],
        body: tableRows,
        theme: 'striped',
        styles: { fontSize: 8, cellPadding: 2.5 },
        headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255] }
      });

      // Stock alerts table
      const finalY = (doc as any).lastAutoTable.finalY + 12;
      doc.setFont("Helvetica", "bold");
      doc.text("Estado Crítico de Stock en Depósito:", 10, finalY);

      const stockRows = eppItems.map(item => {
        const isCritical = item.stock <= 5 ? "SÍ (CRÍTICO)" : "NO (SUFICIENTE)";
        return [item.name, item.brand || "-", item.type_model || "-", item.certified === "Si" ? "SÍ" : "NO", `${item.stock} u.`, isCritical];
      });

      autoTable(doc, {
        startY: finalY + 3,
        head: [['Elemento', 'Marca', 'Modelo', 'Certificado', 'Stock Actual', 'Alerta']],
        body: stockRows,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2.5 },
        headStyles: { fillColor: [59, 130, 246], textColor: [255, 255, 255] }
      });

      doc.save(`Reporte_Cumplimiento_EPP_${new Date().toISOString().split("T")[0]}.pdf`);
      toast.success("Reporte consolidado descargado con éxito");
    } catch (e: any) {
      toast.error("Error al exportar reporte: " + e.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  if (loading) return <DashboardSkeleton />;
  if (!user) { navigate("/auth"); return null; }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#04060a] text-slate-800 dark:text-slate-200 transition-colors duration-250">
      <Header
        userName={profile?.name || user.email || "Usuario"}
        onLogout={handleLogout}
        isAdmin={isAdmin}
        userPlan={profile?.plan}
      />

      <main className="mx-auto max-w-5xl px-4 pb-20 pt-8 md:px-8 space-y-6">

        {/* HEADER */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 dark:border-slate-900 pb-5"
        >
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Reportes y Auditoría EPP</h1>
            <p className="text-xs text-slate-450 dark:text-slate-500 mt-0.5">Visión consolidada del cumplimiento de firmas y stock de seguridad.</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-9 w-auto min-w-[180px] text-xs">
                <Filter size={12} className="text-slate-400 dark:text-slate-500 shrink-0" />
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las EPP</SelectItem>
                <SelectItem value="cabeza">🪖 Cabeza</SelectItem>
                <SelectItem value="manos">🧤 Manos</SelectItem>
                <SelectItem value="pies">🥾 Pies</SelectItem>
                <SelectItem value="cuerpo">🛡️ Cuerpo</SelectItem>
                <SelectItem value="visual">🥽 Visual</SelectItem>
                <SelectItem value="auditiva">🎧 Auditiva</SelectItem>
                <SelectItem value="respiratoria">😷 Respiratoria</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={handleExport}
              disabled={isExporting}
              className="h-9 gap-1.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white border-0 shadow-lg shadow-emerald-500/10"
            >
              {isExporting ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
              {isExporting ? "Generando..." : "Exportar Auditoría"}
            </Button>
          </div>
        </motion.div>

        {/* STAT CARDS */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-2 gap-4 lg:grid-cols-4"
        >
          <StatCard icon={<Shield size={15} />} label="Cumplimiento" value={`${metrics.complianceRate}%`} sub="Tasa de entregas firmadas" color="emerald" />
          <StatCard icon={<Boxes size={15} />} label="Total Entregado" value={`${metrics.total} u.`} sub="Elementos provistos" color="cyan" />
          <StatCard icon={<AlertTriangle size={15} />} label="Pendiente Firma" value={`${metrics.pending} u.`} sub="Falta firma del operario" color="amber" />
          <StatCard icon={<Users size={15} />} label="Stock Crítico" value={`${metrics.lowStockCount} items`} sub="EPP con stock <= 5" color="red" />
        </motion.div>

        {/* ROW 1: status pie + category bar */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid gap-6 lg:grid-cols-2"
        >
          <ChartCard title="Distribución de Firmas" sub="Porcentaje de elementos firmados digitalmente vs pendientes">
            {statusData.length === 0 ? (
              <div className="flex h-48 items-center justify-center text-xs text-slate-400 dark:text-slate-555">Sin datos registrados</div>
            ) : (
              <div className="flex items-center justify-around gap-4 h-48">
                <ResponsiveContainer width={150} height={150}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
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
                <div className="space-y-2">
                  {statusData.map((d) => (
                    <div key={d.name} className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                      <span className="text-xs text-slate-500 dark:text-slate-400">{d.name}</span>
                      <span className="ml-auto text-xs font-bold text-slate-800 dark:text-white">{d.value} u.</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </ChartCard>

          <ChartCard title="Entregas por Categoría EPP" sub="Cantidad de unidades provistas por tipo de protección">
            {categoryData.length === 0 ? (
              <div className="flex h-48 items-center justify-center text-xs text-slate-400 dark:text-slate-555">Sin entregas registradas</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={categoryData} barSize={16}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#1e293b" : "#e2e8f0"} vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} width={20} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(128,128,128,0.03)" }} />
                  <Bar dataKey="Cantidad" fill={CLR.primary} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </motion.div>

        {/* ROW 2: monthly trend line */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <ChartCard title="Evolución Mensual de Entregas" sub="Historial de cantidades distribuidas por firma en el tiempo">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trendData} margin={{ left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#1e293b" : "#e2e8f0"} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} width={20} />
                <Tooltip content={<ChartTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 10, color: '#94a3b8' }} />
                <Line type="monotone" dataKey="Firmados" stroke={CLR.success} strokeWidth={2} dot={{ r: 3, fill: CLR.success }} />
                <Line type="monotone" dataKey="Pendientes" stroke={CLR.warning} strokeWidth={2} dot={{ r: 3, fill: CLR.warning }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </motion.div>

        {/* ROW 3: compliance audit score details */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid gap-6 lg:grid-cols-2"
        >
          <ChartCard title="Score de Cumplimiento Legal" sub="Indice de resguardo frente a reclamos de ART">
            <div className="flex flex-col items-center gap-4 py-3">
              <div className="relative">
                <svg width={130} height={130} className="-rotate-90">
                  <circle cx={65} cy={65} r={52} fill="none" stroke={isDark ? "#0f172a" : "#f1f5f9"} strokeWidth={10} />
                  <circle
                    cx={65} cy={65} r={52} fill="none"
                    stroke={metrics.complianceRate >= 80 ? CLR.success : metrics.complianceRate >= 50 ? CLR.warning : CLR.danger}
                    strokeWidth={10}
                    strokeDasharray={`${2 * Math.PI * 52}`}
                    strokeDashoffset={`${2 * Math.PI * 52 * (1 - metrics.complianceRate / 100)}`}
                    strokeLinecap="round"
                    style={{ transition: "stroke-dashoffset 1s ease" }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className={cn(
                    "text-3xl font-black",
                    metrics.complianceRate >= 80 ? "text-emerald-500 dark:text-emerald-400" : metrics.complianceRate >= 50 ? "text-amber-500 dark:text-amber-400" : "text-red-500 dark:text-red-400"
                  )}>
                    {metrics.complianceRate}%
                  </span>
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider -mt-1">Firmado</span>
                </div>
              </div>
              <div className="w-full text-center">
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed px-4">
                  {metrics.complianceRate >= 90
                    ? "✅ Empresa blindada — Cumplimiento legal excelente. Excelente resguardo legal ante siniestros."
                    : metrics.complianceRate >= 70
                    ? "🟡 Nivel Aceptable — Algunas firmas táctiles están pendientes. Completar firmas pendientes."
                    : metrics.complianceRate >= 50
                    ? "⚠️ Alerta — Más del 30% de tus entregas no tienen firma táctil de operario. Riesgo de multa."
                    : "🚨 Nivel Crítico — Riesgo inminente de sanción e inaplicabilidad del Formulario 299 SRT."}
                </p>
                <button
                  type="button"
                  onClick={handleExport}
                  disabled={isExporting}
                  className="mt-3 flex items-center gap-1.5 mx-auto text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-350 hover:underline"
                >
                  <FileText size={12} />
                  Descargar Reporte de Auditoría EPP (PDF)
                </button>
              </div>
            </div>
          </ChartCard>

          <ChartCard title="Estado del Inventario" sub="Relación de elementos en stock frente al stock crítico">
            <div className="space-y-3.5 h-48 overflow-y-auto pr-1">
              {eppItems.length === 0 ? (
                <div className="flex h-full items-center justify-center text-xs text-slate-400 dark:text-slate-550">Sin stock registrado</div>
              ) : (
                eppItems.map(item => {
                  const isLow = item.stock <= 5;
                  return (
                    <div key={item.id} className="flex items-center justify-between border-b border-slate-100 dark:border-slate-900 pb-2 last:border-0 last:pb-0">
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-white">{item.name}</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">{item.category ? `Categoría: ${item.category}` : 'Sin categoría'}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-650 dark:text-slate-300">{item.stock} u.</span>
                        <span className={cn(
                          "text-[9px] font-bold px-2 py-0.5 rounded-full border",
                          isLow 
                            ? "bg-red-500/10 text-red-650 dark:text-red-400 border-red-200 dark:border-red-500/25" 
                            : "bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-slate-850 text-slate-500 dark:text-slate-400"
                        )}>
                          {isLow ? "CRÍTICO" : "Suficiente"}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ChartCard>
        </motion.div>
      </main>
    </div>
  );
};

export default Reports;
