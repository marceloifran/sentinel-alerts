import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import ObligationCard from "@/components/ObligationCard";
import EmptyState from "@/components/EmptyState";
import KanbanBoard from "@/components/KanbanBoard";
import DuplicateObligationsDialog from "@/components/DuplicateObligationsDialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useObligations } from "@/hooks/useObligations";
import { categoryLabels, statusLabels, getResponsibles } from "@/services/obligationService";
import { Search, Filter, ArrowLeft, LayoutGrid, List, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { ObligationListSkeleton } from "@/components/skeletons/Skeletons";
import { ErrorState } from "@/components/ErrorState";

const AllObligations = () => {
  const navigate = useNavigate();
  const { user, profile, isAdmin, isLoading: authLoading, signOut } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");

  // React Query hook
  const { data: obligations = [], isLoading, error, refetch } = useObligations();
  const { data: responsibles = [] } = useQuery({
    queryKey: ['responsibles'],
    queryFn: getResponsibles,
  });

  // Redirect si no está autenticado
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const filteredObligations = useMemo(() => {
    return obligations.filter(o => {
      const matchesSearch = o.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.responsible_name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === "all" || o.category === categoryFilter;
      const matchesStatus = statusFilter === "all" || o.status === statusFilter;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [obligations, searchTerm, categoryFilter, statusFilter]);

  const handleRefresh = async () => {
    await refetch();
    toast.success("Obligaciones actualizadas");
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  // Loading state
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header
          userName={profile?.name || user?.email || 'Usuario'}
          onLogout={handleLogout}
          isAdmin={isAdmin}
          userPlan={profile?.plan}
        />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ObligationListSkeleton />
        </main>
      </div>
    );
  }

  // Error state
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
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al dashboard
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-foreground">
            Todas las obligaciones
            <span className="ml-2 text-muted-foreground font-normal text-base">
              ({filteredObligations.length})
            </span>
          </h1>

          <div className="flex items-center gap-2 flex-wrap">
            {isAdmin && (
              <DuplicateObligationsDialog
                obligations={obligations}
                responsibles={responsibles}
              />
            )}
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              className="shrink-0"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>

            <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="gap-2"
              >
                <List className="w-4 h-4" />
                Lista
              </Button>
              <Button
                variant={viewMode === "kanban" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("kanban")}
                className="gap-2"
              >
                <LayoutGrid className="w-4 h-4" />
                Kanban
              </Button>
            </div>
          </div>
        </div>
        </div>

        {/* Filters */}
        <div className="card-elevated p-4 mb-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o responsable..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                <SelectItem value="legal">⚖️ Legal</SelectItem>
                <SelectItem value="fiscal">📊 Fiscal</SelectItem>
                <SelectItem value="seguridad">🛡️ Seguridad</SelectItem>
                <SelectItem value="operativa">⚙️ Operativa</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="al_dia">🟢 Al día</SelectItem>
                <SelectItem value="por_vencer">🟡 Por vencer</SelectItem>
                <SelectItem value="vencida">🔴 Vencida</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Obligations display */}
        {filteredObligations.length === 0 ? (
          obligations.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              <p>No se encontraron obligaciones con los filtros seleccionados</p>
            </div>
          )
        ) : viewMode === "kanban" ? (
          <KanbanBoard
            obligations={filteredObligations}
            onUpdate={() => refetch()}
          />
        ) : (
          <div className="space-y-3">
            {filteredObligations.map((obligation, index) => (
              <div
                key={obligation.id}
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <ObligationCard
                  obligation={obligation}
                  onClick={() => navigate(`/obligaciones/${obligation.id}`)}
                />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default AllObligations;
