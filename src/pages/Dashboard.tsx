import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Users,
  Boxes,
  ClipboardCheck,
  AlertTriangle,
  Plus,
  FileSignature,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { useEmployees, useEPPItems, useEPPDeliveries, eppKeys } from "@/hooks/useEPPData";
import {
  addEPPDelivery,
  signEPPDelivery,
  getSignatureUrl,
  type Employee,
  type EPPItem,
  type EPPDelivery,
} from "@/services/eppService";
import { SignaturePad } from "@/components/SignaturePad";
import { AIAssistantButton } from "@/components/ai/AIAssistantButton";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, profile, isAdmin, signOut } = useAuth();
  const companyId = profile?.company_id;

  // React Query queries
  const { data: employees = [], isLoading: loadingEmployees } = useEmployees(companyId);
  const { data: eppItems = [], isLoading: loadingItems } = useEPPItems(companyId);
  const { data: deliveries = [], isLoading: loadingDeliveries } = useEPPDeliveries(companyId);

  const loading = loadingEmployees || loadingItems || loadingDeliveries;

  // Form / Dialog states
  const [showDeliveryDialog, setShowDeliveryDialog] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [selectedEppId, setSelectedEppId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");

  // Signature states
  const [showSignatureDialog, setShowSignatureDialog] = useState(false);
  const [deliveryToSign, setDeliveryToSign] = useState<EPPDelivery | null>(null);

  // Loading state for saving
  const [savingDelivery, setSavingDelivery] = useState(false);

  // Load signature URLs whenever deliveries change
  const [sigUrls, setSigUrls] = useState<Record<string, string>>({});
  const sigUrlsRef = useRef(sigUrls);

  // Keep ref updated
  useEffect(() => {
    sigUrlsRef.current = sigUrls;
  }, [sigUrls]);

  useEffect(() => {
    const loadUrls = async () => {
      const urls: Record<string, string> = {};
      const signedDels = deliveries.filter((d) => d.status === "firmado" && d.signature_path);
      for (const del of signedDels) {
        if (del.signature_path && !sigUrlsRef.current[del.id]) {
          try {
            const url = await getSignatureUrl(del.signature_path);
            urls[del.id] = url;
          } catch (err) {
            console.error(err);
          }
        }
      }
      if (Object.keys(urls).length > 0) {
        setSigUrls((prev) => ({ ...prev, ...urls }));
      }
    };
    loadUrls();
  }, [deliveries]);

  useEffect(() => {
    if (!companyId) return;

    // Auto-reload data on voice change event
    const handleDataChange = () => {
      loadAllData();
    };

    window.addEventListener("epp-data-changed", handleDataChange);
    return () => {
      window.removeEventListener("epp-data-changed", handleDataChange);
    };
  }, [companyId]);

  const queryClient = useQueryClient();

  const loadAllData = async () => {
    await queryClient.invalidateQueries({ queryKey: eppKeys.all });
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  // Stats calculation
  const stats = useMemo(() => {
    const activeWorkers = employees.filter((e) => e.status === "activo").length;
    const pendingSigs = deliveries.filter((d) => d.status === "pendiente").length;
    const totalDelivered = deliveries.length;
    const signedCount = deliveries.filter((d) => d.status === "firmado").length;
    const complianceRate =
      totalDelivered > 0 ? Math.round((signedCount / totalDelivered) * 100) : 100;

    return {
      activeWorkers,
      pendingSigs,
      totalDelivered,
      complianceRate,
    };
  }, [employees, deliveries]);

  // Stock alerts (stock <= 5)
  const stockAlerts = useMemo(() => {
    return eppItems.filter((item) => item.stock <= 5);
  }, [eppItems]);

  const handleOpenDelivery = () => {
    setSelectedEmployeeId(employees[0]?.id || "");
    setSelectedEppId(eppItems[0]?.id || "");
    setQuantity(1);
    setNotes("");
    setShowDeliveryDialog(true);
  };

  const handleCreateDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeId || !selectedEppId) {
      toast.warning("Operario y EPP son obligatorios");
      return;
    }

    try {
      setSavingDelivery(true);
      const newDel = await addEPPDelivery(companyId!, {
        employee_id: selectedEmployeeId,
        epp_item_id: selectedEppId,
        quantity,
        delivery_date: new Date().toISOString().split("T")[0],
        supervisor_id: user!.id,
        status: "pendiente",
        notes: notes || "Entrega manual registrada en obra",
      });

      toast.success("Entrega registrada con éxito. Lista para firmar.");
      setShowDeliveryDialog(false);
      
      // Open signature dialog immediately for this delivery!
      setDeliveryToSign(newDel);
      setShowSignatureDialog(true);

      // Reload
      loadAllData();
    } catch (err: any) {
      toast.error("Error al registrar entrega: " + err.message);
    } finally {
      setSavingDelivery(false);
    }
  };

  const handleOpenSignature = (del: EPPDelivery) => {
    setDeliveryToSign(del);
    setShowSignatureDialog(true);
  };

  const handleSaveSignature = async (sigBase64: string) => {
    if (!deliveryToSign) return;
    try {
      toast.loading("Guardando firma...");
      await signEPPDelivery(deliveryToSign.id, sigBase64);
      toast.dismiss();
      toast.success("Firma cargada con éxito. Entrega completada.");
      setShowSignatureDialog(false);
      setDeliveryToSign(null);
      loadAllData();
    } catch (err: any) {
      toast.dismiss();
      toast.error("Error al guardar firma: " + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#04060a] text-slate-800 dark:text-slate-200 transition-colors duration-250">
      <Header
        userName={profile?.name || user?.email || "Usuario"}
        onLogout={handleLogout}
        isAdmin={isAdmin}
        userPlan={profile?.plan}
      />

      <main className="mx-auto max-w-5xl px-4 py-8 md:px-8 space-y-6">
        {/* Greetings and CTA */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
              {profile?.company_name || "Mi Empresa"}
            </h1>
            <p className="text-base text-slate-500 dark:text-slate-400 mt-1">
              Panel de control de elementos de protección personal y firmas.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => navigate("/operarios")}
              variant="outline"
              className="border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 rounded-xl bg-white dark:bg-[#080b11] text-base h-11 px-5"
            >
              Ver Personal
            </Button>
            <Button
              onClick={handleOpenDelivery}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 rounded-xl shadow-sm border-0 font-semibold text-base h-11 px-5"
            >
              <Plus size={18} /> Entregar EPP
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              title: "Tasa de Cumplimiento",
              val: `${stats.complianceRate}%`,
              desc: "EPP entregados con firma",
              icon: <TrendingUp className="text-emerald-500" />,
              bg: "bg-emerald-50/50 dark:bg-emerald-500/5 border-emerald-100 dark:border-emerald-500/10",
            },
            {
              title: "Firmas Pendientes",
              val: stats.pendingSigs.toString(),
              desc: "Requieren firma manuscrita",
              icon: <FileSignature className="text-amber-500" />,
              bg: stats.pendingSigs > 0 ? "bg-amber-50/50 dark:bg-amber-500/5 border-amber-100 dark:border-amber-500/10 animate-pulse" : "bg-slate-50 dark:bg-slate-900/10 border-slate-100 dark:border-slate-850",
            },
            {
              title: "Operarios Activos",
              val: stats.activeWorkers.toString(),
              desc: "Personal registrado",
              icon: <Users className="text-indigo-500" />,
              bg: "bg-indigo-50/50 dark:bg-indigo-500/5 border-indigo-100 dark:border-indigo-500/10",
            },
            {
              title: "EPP Entregados",
              val: stats.totalDelivered.toString(),
              desc: "Total histórico de entregas",
              icon: <ClipboardCheck className="text-teal-500" />,
              bg: "bg-teal-50/50 dark:bg-teal-500/5 border-teal-100 dark:border-teal-500/10",
            },
          ].map((card, i) => (
            <div key={i} className={`p-5 rounded-2xl border bg-white dark:bg-[#080b11] shadow-sm flex flex-col justify-between ${card.bg}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{card.title}</span>
                {card.icon}
              </div>
              <div className="mt-4">
                <p className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white leading-none">{card.val}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">{card.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Warning / Stock alerts */}
        {stockAlerts.length > 0 && (
          <div className="rounded-2xl border border-amber-200 dark:border-amber-900/30 bg-amber-50/30 dark:bg-amber-500/5 p-5 flex gap-3 items-start">
            <AlertTriangle className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" size={22} />
            <div>
              <p className="text-sm font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider">Alerta de Stock Crítico</p>
              <p className="text-sm text-amber-700 dark:text-slate-400 mt-1">
                Los siguientes elementos del catálogo tienen poco stock disponible. Reponer a la brevedad:
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {stockAlerts.map((item) => (
                  <span
                    key={item.id}
                    onClick={() => navigate("/inventario")}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold bg-white dark:bg-slate-950 border border-amber-200 dark:border-amber-900/30 text-amber-700 dark:text-amber-400 cursor-pointer hover:bg-amber-50 dark:hover:bg-slate-900"
                  >
                    {item.name}: {item.stock} unidades
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Recent deliveries and inventory status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Feed of Deliveries */}
          <div className="lg:col-span-2 bg-white dark:bg-[#080b11] border border-slate-200 dark:border-slate-900 rounded-2xl shadow-sm overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-900 bg-slate-50 dark:bg-slate-950/40 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Planilla de Entregas Recientes</h2>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-500 uppercase">Empresa</span>
            </div>

            <div className="flex-1">
              {loading ? (
                <div className="p-8 text-center text-base text-slate-500 dark:text-slate-400">Cargando entregas...</div>
              ) : deliveries.length === 0 ? (
                <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center">
                  <ClipboardCheck size={48} className="text-slate-300 dark:text-slate-800 mb-3" />
                  <p className="font-semibold text-slate-600 dark:text-slate-400 text-base">No hay entregas registradas</p>
                  <p className="text-sm text-slate-500 dark:text-slate-500 mt-1 mb-4">Hacé clic en "Entregar EPP" para iniciar.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-900 max-h-[450px] overflow-y-auto">
                  {deliveries.map((del) => (
                    <div key={del.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors">
                      <div className="min-w-0 flex-1 pr-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-base font-bold text-slate-900 dark:text-white truncate">
                            {del.employee?.name || "Operario"}
                          </p>
                          <span className="text-xs text-slate-500 dark:text-slate-500 font-mono">
                            DNI: {del.employee?.dni_cuil}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mt-1 truncate">
                          {del.quantity} u. de {del.epp_item?.name || "EPP"}
                        </p>
                        {del.notes && <p className="text-xs text-slate-500 dark:text-slate-500 mt-1 italic">"{del.notes}"</p>}
                        {del.status === "firmado" && sigUrls[del.id] && (
                          <div className="mt-2 flex items-center gap-1.5">
                            <span className="text-[9px] text-slate-400 dark:text-slate-550">Firma:</span>
                            <img
                              src={sigUrls[del.id]}
                              className="h-7 object-contain bg-white dark:bg-slate-100 border border-slate-250 dark:border-slate-800 rounded px-1"
                              alt="Firma"
                            />
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-500 dark:text-slate-500 font-medium shrink-0">{del.delivery_date}</span>
                        {del.status === "firmado" ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30 px-3 py-1 rounded-full">
                            <CheckCircle2 size={12} /> Firmado
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleOpenSignature(del)}
                            className="bg-amber-600 hover:bg-amber-500 text-white text-sm h-9 px-4 rounded-xl border-0 gap-1 font-bold"
                          >
                            <FileSignature size={13} /> Firmar
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions and Inventory Widget */}
          <div className="space-y-6">
            {/* Quick Catalog list */}
            <div className="bg-white dark:bg-[#080b11] border border-slate-200 dark:border-slate-900 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-900 bg-slate-50 dark:bg-slate-950/40 flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Catálogo Rápido</h2>
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => navigate("/inventario")}
                  className="text-sm font-bold text-emerald-600 hover:text-emerald-500 px-0 h-auto"
                >
                  Gestionar
                </Button>
              </div>
              <div className="p-4 space-y-2 max-h-[300px] overflow-y-auto">
                {eppItems.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-500 text-center py-4">Catálogo vacío</p>
                ) : (
                  eppItems.map((item) => (
                    <div key={item.id} className="flex justify-between items-center bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-900 rounded-xl p-3">
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate max-w-[160px]">{item.name}</span>
                      <span className={`text-sm font-mono font-bold ${item.stock <= 5 ? "text-amber-600 dark:text-amber-400" : "text-slate-500"}`}>
                        {item.stock} u.
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Helper card */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-900 bg-gradient-to-br from-slate-900 to-slate-950 p-5 text-white shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
              <h3 className="text-lg font-black text-white">Dictá por voz</h3>
              <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                ¿Estás ocupado o con las manos llenas? Tocá el micrófono abajo a la derecha y decile al asistente qué estás entregando y a quién. Se cargará solo.
              </p>
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold uppercase mt-4">
                <CheckCircle2 size={14} /> Manos Libres · Optimizado
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* AI Assistant Button in the lower right */}
      <AIAssistantButton />

      {/* Register EPP Delivery Dialog */}
      <Dialog open={showDeliveryDialog} onOpenChange={setShowDeliveryDialog}>
        <DialogContent className="sm:max-w-md rounded-2xl bg-white dark:bg-[#0c101d] border-slate-250 dark:border-slate-800 text-slate-900 dark:text-white">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-white">Registrar Entrega de EPP</DialogTitle>
          </DialogHeader>
          {employees.length === 0 ? (
            <div className="py-6 text-center text-slate-400 text-sm">
              Primero tenés que registrar operarios en la sección{" "}
              <button onClick={() => navigate("/operarios")} className="text-emerald-600 font-bold underline">
                Operarios
              </button>
            </div>
          ) : eppItems.length === 0 ? (
            <div className="py-6 text-center text-slate-400 text-sm">
              Primero tenés que catalogar artículos en la sección{" "}
              <button onClick={() => navigate("/inventario")} className="text-emerald-600 font-bold underline">
                Catálogo EPP
              </button>
            </div>
          ) : (
            <form onSubmit={handleCreateDelivery} className="space-y-4 py-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Seleccionar Trabajador</label>
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  className="select-field select-field-md"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id} className="dark:bg-[#0c101d]">
                      {emp.name} ({emp.dni_cuil})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Seleccionar EPP</label>
                <select
                  value={selectedEppId}
                  onChange={(e) => setSelectedEppId(e.target.value)}
                  className="select-field select-field-md"
                >
                  {eppItems.map((item) => (
                    <option key={item.id} value={item.id} className="dark:bg-[#0c101d]">
                      {item.name} (Stock: {item.stock})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Cantidad</label>
                <Input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Notas / Observaciones (Opcional)</label>
                <Input
                  placeholder="Ej. Reemplazo por desgaste"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>

              <DialogFooter className="pt-4 gap-2">
                <Button type="button" variant="outline" onClick={() => setShowDeliveryDialog(false)} className="rounded-xl border-slate-200 dark:border-slate-800 dark:text-slate-300">
                  Cancelar
                </Button>
                <Button type="submit" disabled={savingDelivery} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl border-0 font-bold">
                  {savingDelivery ? "Registrando..." : "Registrar y Firmar"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Signature Dialog */}
      <Dialog open={showSignatureDialog} onOpenChange={setShowSignatureDialog}>
        <DialogContent className="sm:max-w-md rounded-2xl p-0 overflow-hidden border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c101d]">
          <SignaturePad
            title={`Firma de ${deliveryToSign?.employee?.name || "Operario"}`}
            onSave={handleSaveSignature}
            onCancel={() => setShowSignatureDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
