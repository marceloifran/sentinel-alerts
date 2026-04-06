import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/Header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useObligations, useDeleteObligation } from "@/hooks/useObligations";
import { useAccountantClients } from "@/hooks/useAccountantClients";
import { categoryLabels, statusLabels, calculateStatus } from "@/services/obligationService";
import type { Obligation } from "@/services/obligationService";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  ChevronRight,
  Trash2,
  Pencil,
  XCircle,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Building2,
  User,
  RefreshCw,
  Filter,
  ArrowLeft,
} from "lucide-react";
import { ObligationListSkeleton } from "@/components/skeletons/Skeletons";
import { ErrorState } from "@/components/ErrorState";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// ─── types ────────────────────────────────────────────────────────────────────

interface EnrichedObligation extends Obligation {
  companyName?: string;
  companyId?: string;
}

// ─── hooks ────────────────────────────────────────────────────────────────────

/** Fetches obligations for a list of company IDs (client companies) */
function useAllClientObligations(companyIds: string[]) {
  return useQuery({
    queryKey: ["all-client-obligations", companyIds.sort().join(",")],
    queryFn: async (): Promise<{ obligations: Obligation[]; companyNames: Record<string, string> }> => {
      if (companyIds.length === 0) return { obligations: [], companyNames: {} };

      const [obRes, compRes] = await Promise.all([
        supabase
          .from("obligations")
          .select("*")
          .in("company_id", companyIds)
          .order("due_date", { ascending: true }),
        supabase.from("companies").select("id, name").in("id", companyIds),
      ]);

      const companyNames: Record<string, string> = {};
      (compRes.data || []).forEach((c: any) => {
        companyNames[c.id] = c.name;
      });

      const obligations: Obligation[] = (obRes.data || []).map((o: any) => ({
        ...o,
        status: o.status !== "al_dia" ? calculateStatus(o.due_date) : o.status,
        recurrence: (o.recurrence || "none") as "none" | "monthly" | "annual",
        criticality: (o.criticality || "media") as "baja" | "media" | "alta",
      }));

      return { obligations, companyNames };
    },
    enabled: true,
    staleTime: 30_000,
  });
}

// ─── sub-components ───────────────────────────────────────────────────────────

function StatusPill({ status }: { status: Obligation["status"] }) {
  const cfg = {
    vencida: "bg-rose-100 text-rose-700 border-rose-200",
    por_vencer: "bg-amber-100 text-amber-700 border-amber-200",
    al_dia: "bg-emerald-100 text-emerald-700 border-emerald-200",
  };
  const icons = {
    vencida: <XCircle size={11} />,
    por_vencer: <AlertTriangle size={11} />,
    al_dia: <CheckCircle2 size={11} />,
  };
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold", cfg[status])}>
      {icons[status]}
      {statusLabels[status]}
    </span>
  );
}

function CategoryPill({ category }: { category: Obligation["category"] }) {
  const emojiMap: Record<string, string> = {
    legal: "⚖️",
    fiscal: "📊",
    seguridad: "🛡️",
    operativa: "⚙️",
  };
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
      {emojiMap[category]} {categoryLabels[category]}
    </span>
  );
}

function daysLabel(dueDate: string): { text: string; cls: string } {
  const days = Math.round((new Date(dueDate).getTime() - Date.now()) / 86_400_000);
  if (days < 0) return { text: `Venció hace ${Math.abs(days)}d`, cls: "text-rose-600" };
  if (days === 0) return { text: "¡Vence hoy!", cls: "text-rose-600 font-black" };
  if (days === 1) return { text: "Mañana", cls: "text-amber-600" };
  if (days <= 7) return { text: `En ${days} días`, cls: "text-amber-600" };
  return {
    text: `${new Date(dueDate).toLocaleDateString("es-AR", { day: "numeric", month: "short" })}`,
    cls: "text-slate-500",
  };
}

interface ObligationRowProps {
  obligation: EnrichedObligation;
  idx: number;
  onEdit: () => void;
  onDelete: () => void;
}

function ObligationRow({ obligation, idx, onEdit, onDelete }: ObligationRowProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const dl = daysLabel(obligation.due_date);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: idx * 0.03 }}
        className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3.5 transition-all hover:border-primary/20 hover:shadow-sm"
      >
        {/* colored left bar */}
        <div
          className={cn(
            "h-10 w-1 shrink-0 rounded-full",
            obligation.status === "vencida"
              ? "bg-rose-500"
              : obligation.status === "por_vencer"
              ? "bg-amber-400"
              : "bg-emerald-400"
          )}
        />

        {/* main info */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <p className="text-sm font-bold text-slate-900 truncate">{obligation.name}</p>
            {obligation.companyName && (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                <Building2 size={9} />
                {obligation.companyName}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill status={obligation.status} />
            <CategoryPill category={obligation.category} />
            {obligation.responsible_name && (
              <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                <User size={10} />
                {obligation.responsible_name}
              </span>
            )}
            {obligation.recurrence && obligation.recurrence !== "none" && (
              <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                <RefreshCw size={10} />
                {obligation.recurrence === "monthly" ? "Mensual" : "Anual"}
              </span>
            )}
          </div>
        </div>

        {/* date */}
        <div className="shrink-0 text-right hidden sm:block">
          <p className={cn("text-sm font-bold", dl.cls)}>{dl.text}</p>
          <p className="text-[11px] text-slate-400 mt-0.5 flex items-center justify-end gap-1">
            <Calendar size={10} />
            {format(new Date(obligation.due_date), "d MMM yyyy", { locale: es })}
          </p>
        </div>

        {/* actions */}
        <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="rounded-lg p-2 text-slate-400 hover:bg-primary/10 hover:text-primary transition-colors"
            title="Ver / editar"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); }}
            className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
            title="Eliminar"
          >
            <Trash2 size={14} />
          </button>
        </div>

        <ChevronRight
          size={15}
          className="shrink-0 text-slate-200 group-hover:text-slate-400 transition-colors cursor-pointer"
          onClick={onEdit}
        />
      </motion.div>

      {/* inline confirm */}
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta obligación?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminarán todos los archivos, notificaciones e historial asociados. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { onDelete(); setConfirmDelete(false); }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ─── page ────────────────────────────────────────────────────────────────────

type ScopeFilter = "all" | "own" | string; // string = companyId

const AllObligations = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, profile, isAdmin, isLoading: authLoading, signOut } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>("all");

  // own obligations
  const { data: ownObligations = [], isLoading: ownLoading, error, refetch: refetchOwn } = useObligations();

  // accountant clients
  const { data: clients = [] } = useAccountantClients();
  const clientCompanyIds = useMemo(() => clients.map((c) => c.companyId), [clients]);

  // client obligations
  const { data: clientData, isLoading: clientLoading, refetch: refetchClient } =
    useAllClientObligations(clientCompanyIds);

  const deleteMutation = useDeleteObligation();

  // build company name map from clients
  const clientCompanyNamesById = useMemo(() => {
    const map: Record<string, string> = {};
    clients.forEach((c) => {
      map[c.companyId] = c.nickname || c.companyName;
    });
    // also add from clientData
    if (clientData?.companyNames) {
      Object.entries(clientData.companyNames).forEach(([id, name]) => {
        if (!map[id]) map[id] = name;
      });
    }
    return map;
  }, [clients, clientData]);

  // enrich own obligations with "Mi empresa" label
  const ownEnriched = useMemo<EnrichedObligation[]>(
    () => ownObligations.map((o) => ({ ...o, companyName: undefined, companyId: profile?.company_id || undefined })),
    [ownObligations, profile]
  );

  // enrich client obligations
  const clientEnriched = useMemo<EnrichedObligation[]>(() => {
    if (!clientData) return [];
    return clientData.obligations.map((o) => ({
      ...o,
      companyName: o.company_id ? (clientCompanyNamesById[o.company_id] || o.company_id) : undefined,
      companyId: o.company_id || undefined,
    }));
  }, [clientData, clientCompanyNamesById]);

  // all merged & filtered
  const allObligations = useMemo<EnrichedObligation[]>(() => {
    let list: EnrichedObligation[] = [];

    if (scopeFilter === "all") {
      list = [...ownEnriched, ...clientEnriched];
    } else if (scopeFilter === "own") {
      list = ownEnriched;
    } else {
      // specific client company
      list = clientEnriched.filter((o) => o.companyId === scopeFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (o) =>
          o.name.toLowerCase().includes(q) ||
          o.companyName?.toLowerCase().includes(q) ||
          o.responsible_name?.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== "all") list = list.filter((o) => o.status === statusFilter);
    if (categoryFilter !== "all") list = list.filter((o) => o.category === categoryFilter);

    return list.sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
  }, [ownEnriched, clientEnriched, scopeFilter, search, statusFilter, categoryFilter]);

  // stats for the filtered list
  const stats = useMemo(() => ({
    overdue: allObligations.filter((o) => o.status === "vencida").length,
    upcoming: allObligations.filter((o) => o.status === "por_vencer").length,
    ok: allObligations.filter((o) => o.status === "al_dia").length,
  }), [allObligations]);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteMutation.mutateAsync(id);
        refetchOwn();
        refetchClient();
      } catch {
        // error already toasted by mutation
      }
    },
    [deleteMutation, refetchOwn, refetchClient]
  );

  const isLoading = authLoading || ownLoading || clientLoading;

  if (isLoading)
    return (
      <div className="min-h-screen bg-background">
        <Header userName={profile?.name || user?.email || "Usuario"} onLogout={handleLogout} isAdmin={isAdmin} userPlan={profile?.plan} />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ObligationListSkeleton />
        </main>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen bg-background">
        <Header userName={profile?.name || user?.email || "Usuario"} onLogout={handleLogout} isAdmin={isAdmin} userPlan={profile?.plan} />
        <ErrorState error={error as Error} onRetry={() => refetchOwn()} />
      </div>
    );

  if (!user) return null;

  const hasClients = clients.length > 0;
  const hasFilters = search || statusFilter !== "all" || categoryFilter !== "all" || scopeFilter !== "all";

  return (
    <div className="min-h-screen bg-[#F4F6F9]">
      <Header
        userName={profile?.name || user.email || "Usuario"}
        onLogout={handleLogout}
        isAdmin={isAdmin}
        userPlan={profile?.plan}
      />

      <main className="mx-auto max-w-5xl px-4 pb-24 pt-8 md:px-8">
        {/* ── HEADER */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => navigate("/dashboard")}
            className="mb-4 flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-700 transition-colors"
          >
            <ArrowLeft size={15} /> Volver al dashboard
          </button>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-black text-slate-900">Obligaciones</h1>
              <p className="mt-0.5 text-sm text-slate-400">
                Todas tus obligaciones y las de tus clientes en un solo lugar
              </p>
            </div>

            {/* mini stats */}
            <div className="flex items-center gap-3">
              {[
                { val: stats.overdue, lbl: "Vencidas", cls: stats.overdue > 0 ? "text-rose-600 bg-rose-50 border-rose-200" : "text-slate-400 bg-white border-slate-200" },
                { val: stats.upcoming, lbl: "Próximas", cls: stats.upcoming > 0 ? "text-amber-600 bg-amber-50 border-amber-200" : "text-slate-400 bg-white border-slate-200" },
                { val: stats.ok, lbl: "Al día", cls: "text-emerald-600 bg-emerald-50 border-emerald-200" },
              ].map((s) => (
                <div key={s.lbl} className={cn("rounded-xl border px-3 py-2 text-center", s.cls)}>
                  <p className="text-lg font-black leading-none">{s.val}</p>
                  <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide">{s.lbl}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ── FILTERS */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.08 }}
          className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div className="flex flex-wrap gap-3">
            {/* search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Buscar por nombre, empresa, responsable..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 pl-8 text-sm"
              />
            </div>

            {/* scope */}
            {hasClients && (
              <Select value={scopeFilter} onValueChange={setScopeFilter}>
                <SelectTrigger className="h-9 w-[160px]">
                  <Building2 size={13} className="mr-1.5 text-slate-400 shrink-0" />
                  <SelectValue placeholder="Empresa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las empresas</SelectItem>
                  <SelectItem value="own">Mi empresa</SelectItem>
                  {clients.map((c) => (
                    <SelectItem key={c.companyId} value={c.companyId}>
                      {c.nickname || c.companyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* status */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-[140px]">
                <Filter size={13} className="mr-1.5 text-slate-400 shrink-0" />
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="vencida">🔴 Vencida</SelectItem>
                <SelectItem value="por_vencer">🟡 Por vencer</SelectItem>
                <SelectItem value="al_dia">🟢 Al día</SelectItem>
              </SelectContent>
            </Select>

            {/* category */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-9 w-[140px]">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="legal">⚖️ Legal</SelectItem>
                <SelectItem value="fiscal">📊 Fiscal</SelectItem>
                <SelectItem value="seguridad">🛡️ Seguridad</SelectItem>
                <SelectItem value="operativa">⚙️ Operativa</SelectItem>
              </SelectContent>
            </Select>

            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="h-9 text-slate-400 hover:text-slate-700"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                  setCategoryFilter("all");
                  setScopeFilter("all");
                }}
              >
                Limpiar
              </Button>
            )}
          </div>
        </motion.div>

        {/* ── LIST */}
        <AnimatePresence mode="wait">
          {allObligations.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-2xl border-2 border-dashed border-slate-200 py-16 text-center"
            >
              {hasFilters ? (
                <>
                  <Search size={32} className="mx-auto mb-3 text-slate-200" />
                  <p className="text-sm font-medium text-slate-400">
                    No hay obligaciones con esos filtros
                  </p>
                  <button
                    onClick={() => { setSearch(""); setStatusFilter("all"); setCategoryFilter("all"); setScopeFilter("all"); }}
                    className="mt-3 text-xs font-semibold text-primary hover:underline"
                  >
                    Limpiar filtros
                  </button>
                </>
              ) : (
                <>
                  <CheckCircle2 size={36} className="mx-auto mb-3 text-emerald-200" />
                  <p className="text-sm font-medium text-slate-400">
                    No hay obligaciones cargadas todavía
                  </p>
                </>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <p className="mb-3 text-xs font-semibold text-slate-400">
                {allObligations.length} obligacion{allObligations.length !== 1 ? "es" : ""}
                {hasFilters ? " con los filtros aplicados" : " en total"}
              </p>
              <div className="space-y-2">
                {allObligations.map((ob, idx) => (
                  <ObligationRow
                    key={ob.id}
                    obligation={ob}
                    idx={idx}
                    onEdit={() => navigate(`/obligaciones/${ob.id}`)}
                    onDelete={() => handleDelete(ob.id)}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default AllObligations;
