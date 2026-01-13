import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import ObligationCard from "@/components/ObligationCard";
import EmptyState from "@/components/EmptyState";
import KanbanBoard from "@/components/KanbanBoard";
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
import { getObligations, Obligation, categoryLabels, statusLabels } from "@/services/obligationService";
import { Search, Filter, ArrowLeft, Loader2, LayoutGrid, List, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const AllObligations = () => {
  const navigate = useNavigate();
  const { user, profile, isAdmin, isLoading: authLoading, signOut } = useAuth();
  const [obligations, setObligations] = useState<Obligation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  // Reload obligations when window regains focus
  useEffect(() => {
    const handleFocus = () => {
      if (user) {
        loadObligations();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
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

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      const data = await getObligations();
      setObligations(data);
      toast.success("Obligaciones actualizadas");
    } catch (error) {
      console.error('Error refreshing obligations:', error);
      toast.error("Error al actualizar las obligaciones");
    } finally {
      setIsRefreshing(false);
    }
  };

  const filteredObligations = useMemo(() => {
    return obligations.filter(o => {
      const matchesSearch = o.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.responsible_name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === "all" || o.category === categoryFilter;
      const matchesStatus = statusFilter === "all" || o.status === statusFilter;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [obligations, searchTerm, categoryFilter, statusFilter]);

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

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="shrink-0"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
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
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredObligations.length === 0 ? (
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
            onUpdate={loadObligations}
          />
        ) : (
          <div className="space-y-3">
            {filteredObligations.map((obligation, index) => (
              <div
                key={obligation.id}
                style={{ animationDelay: `${index * 30}ms` }}
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
      </main>
    </div>
  );
};

export default AllObligations;
