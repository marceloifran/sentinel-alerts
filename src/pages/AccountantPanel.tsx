import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  Plus,
  Search,
  AlertTriangle,
  Users,
  CheckCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ClientCard } from '@/components/ClientCard';
import { AddClientDialog } from '@/components/AddClientDialog';
import Header from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';
import {
  useAccountantClients,
  useAddClientCompany,
  useRemoveClientCompany,
} from '@/hooks/useAccountantClients';
import { toast } from 'sonner';

type FilterMode = 'all' | 'urgent';

const AccountantPanel = () => {
  const navigate = useNavigate();
  const { user, profile, isAdmin, signOut, isLoading: authLoading } = useAuth();
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);

  const { data: clients = [], isLoading } = useAccountantClients();
  const addMutation = useAddClientCompany();
  const removeMutation = useRemoveClientCompany();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const filteredClients = useMemo(() => {
    let list = clients;

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.companyName.toLowerCase().includes(q) ||
          c.nickname?.toLowerCase().includes(q) ||
          c.cuit?.includes(q)
      );
    }

    if (filterMode === 'urgent') {
      list = list.filter((c) => c.status === 'red' || c.status === 'yellow');
    }

    // Sort: red → yellow → green, then alphabetically
    return [...list].sort((a, b) => {
      const order = { red: 0, yellow: 1, green: 2 };
      if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
      return a.companyName.localeCompare(b.companyName, 'es-AR');
    });
  }, [clients, search, filterMode]);

  const stats = useMemo(() => {
    const red = clients.filter((c) => c.status === 'red').length;
    const yellow = clients.filter((c) => c.status === 'yellow').length;
    const green = clients.filter((c) => c.status === 'green').length;
    return { red, yellow, green };
  }, [clients]);

  const handleAddClient = async (companyName: string, cuit?: string) => {
    try {
      await addMutation.mutateAsync({ companyName, cuit });
      toast.success(`${companyName} agregado como cliente`);
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

  // Redirect if not authenticated
  if (!authLoading && !user) {
    navigate('/auth');
    return null;
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
        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Panel del Contador
            </h1>
            <p className="text-muted-foreground mt-1">
              Todos tus clientes en una sola pantalla
            </p>
          </div>
          <Button
            onClick={() => setShowAddDialog(true)}
            className="gap-2 self-start sm:self-auto"
            size="lg"
          >
            <Plus className="w-4 h-4" />
            Agregar cliente
          </Button>
        </motion.div>

        {/* Summary stats */}
        {clients.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-3 gap-3 mb-6"
          >
            {[
              {
                label: 'Con urgencias',
                value: stats.red,
                color: 'text-status-danger',
                bg: 'bg-status-danger-bg',
                icon: AlertTriangle,
              },
              {
                label: 'Por vencer',
                value: stats.yellow,
                color: 'text-status-warning',
                bg: 'bg-status-warning-bg',
                icon: AlertTriangle,
              },
              {
                label: 'Al día',
                value: stats.green,
                color: 'text-status-success',
                bg: 'bg-status-success-bg',
                icon: CheckCircle,
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className={`rounded-xl border border-border p-4 ${stat.bg}`}
              >
                <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </motion.div>
        )}

        {/* Search + filter bar */}
        {clients.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="flex flex-col sm:flex-row gap-3 mb-6"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar empresa, CUIT..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10"
              />
            </div>
            <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg h-10">
              <button
                onClick={() => setFilterMode('all')}
                className={`px-3 h-8 rounded-md text-sm font-medium transition-all ${
                  filterMode === 'all'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  Todas ({clients.length})
                </span>
              </button>
              <button
                onClick={() => setFilterMode('urgent')}
                className={`px-3 h-8 rounded-md text-sm font-medium transition-all ${
                  filterMode === 'urgent'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Urgentes ({stats.red + stats.yellow})
                </span>
              </button>
            </div>
          </motion.div>
        )}

        {/* Content */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-44 rounded-xl bg-muted animate-pulse"
                style={{ animationDelay: `${i * 80}ms` }}
              />
            ))}
          </div>
        ) : clients.length === 0 ? (
          /* Empty state */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col items-center justify-center py-24 text-center max-w-md mx-auto"
          >
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
              <Building2 className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">
              Todavía no tenés clientes
            </h2>
            <p className="text-muted-foreground mb-8 text-sm leading-relaxed">
              Agregá las empresas que gestionás para ver el estado de sus vencimientos en una sola pantalla. Verde, amarillo o rojo — de un vistazo.
            </p>
            <Button onClick={() => setShowAddDialog(true)} className="gap-2" size="lg">
              <Plus className="w-4 h-4" />
              Agregar primer cliente
            </Button>
          </motion.div>
        ) : filteredClients.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 text-muted-foreground"
          >
            <Search className="w-8 h-8 mx-auto mb-3 opacity-30" />
            <p>No se encontraron empresas con ese criterio</p>
          </motion.div>
        ) : (
          <AnimatePresence>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredClients.map((client, idx) => (
                <ClientCard
                  key={client.id}
                  client={client}
                  delay={idx * 0.04}
                  onClick={() => navigate(`/panel/empresa/${client.companyId}`)}
                  onRemove={() => handleRemoveClient(client.id, client.companyName)}
                />
              ))}
            </div>
          </AnimatePresence>
        )}
      </main>

      <AddClientDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onConfirm={handleAddClient}
      />
    </div>
  );
};

export default AccountantPanel;
