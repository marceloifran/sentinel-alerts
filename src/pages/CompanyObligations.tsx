import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Building2, Plus, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import ObligationCard from '@/components/ObligationCard';
import EmptyState from '@/components/EmptyState';
import StatusCard from '@/components/StatusCard';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { calculateStatus } from '@/services/obligationService';
import type { Obligation } from '@/services/obligationService';

function useCompanyObligations(companyId: string | undefined) {
  return useQuery({
    queryKey: ['company-obligations', companyId],
    queryFn: async () => {
      if (!companyId) return { company: null, obligations: [] };

      const [companyRes, obRes] = await Promise.all([
        supabase.from('companies').select('id, name, cuit').eq('id', companyId).maybeSingle(),
        supabase
          .from('obligations')
          .select('*')
          .eq('company_id', companyId)
          .order('due_date', { ascending: true }),
      ]);

      const obligations: Obligation[] = (obRes.data || []).map((o: any) => ({
        ...o,
        status: o.status !== 'al_dia' ? calculateStatus(o.due_date) : o.status,
        recurrence: (o.recurrence || 'none') as 'none' | 'monthly' | 'annual',
        criticality: (o.criticality || 'media') as 'baja' | 'media' | 'alta',
      }));

      return { company: companyRes.data, obligations };
    },
    enabled: !!companyId,
    staleTime: 30_000,
  });
}

const CompanyObligations = () => {
  const navigate = useNavigate();
  const { companyId } = useParams<{ companyId: string }>();
  const { user, profile, isAdmin, signOut, isLoading: authLoading } = useAuth();

  const { data, isLoading } = useCompanyObligations(companyId);
  const company = data?.company;
  const obligations = data?.obligations ?? [];

  const stats = useMemo(() => ({
    overdue: obligations.filter((o) => o.status === 'vencida').length,
    upcoming: obligations.filter((o) => o.status === 'por_vencer').length,
    onTime: obligations.filter((o) => o.status === 'al_dia').length,
  }), [obligations]);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

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
        {/* Back button + title */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button
            variant="ghost"
            className="gap-2 -ml-2 mb-4 text-muted-foreground hover:text-foreground"
            onClick={() => navigate('/panel')}
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al panel
          </Button>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  {isLoading ? '...' : company?.name ?? 'Empresa'}
                </h1>
                {company?.cuit && (
                  <p className="text-sm text-muted-foreground">CUIT {company.cuit}</p>
                )}
              </div>
            </div>
            {isAdmin && companyId && (
              <Button
                className="gap-2 self-start sm:self-auto"
                onClick={() => navigate(`/obligaciones/nueva?company_id=${companyId}`)}
              >
                <Plus className="w-4 h-4" />
                Nueva obligación
              </Button>
            )}
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <StatusCard
            count={stats.overdue}
            label="Vencidas"
            status="danger"
            icon={<XCircle className="w-6 h-6 text-status-danger" />}
          />
          <StatusCard
            count={stats.upcoming}
            label="Por vencer"
            status="warning"
            icon={<AlertTriangle className="w-6 h-6 text-status-warning" />}
          />
          <StatusCard
            count={stats.onTime}
            label="Al día"
            status="success"
            icon={<CheckCircle className="w-6 h-6 text-status-success" />}
          />
        </div>

        {/* Obligations list */}
        <h2 className="text-lg font-semibold text-foreground mb-4">Obligaciones</h2>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : obligations.length === 0 ? (
          <EmptyState
            title="Sin obligaciones"
            description="Esta empresa todavía no tiene obligaciones cargadas."
            icon={<CheckCircle className="w-12 h-12 text-status-success" />}
            showButton={false}
          />
        ) : (
          <div className="space-y-3">
            {obligations.map((obligation) => (
              <ObligationCard
                key={obligation.id}
                obligation={obligation}
                onClick={() => navigate(`/obligaciones/${obligation.id}`)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default CompanyObligations;
