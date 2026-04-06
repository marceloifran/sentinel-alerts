import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Building2, Plus, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import Header from '@/components/Header';
import EmptyState from '@/components/EmptyState';
import { SmartObligationLoader } from '@/components/ai/SmartObligationLoader';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { calculateStatus } from '@/services/obligationService';
import type { Obligation } from '@/services/obligationService';
import { cn } from '@/lib/utils';


/* ── hook ─────────────────────────────────────────────────────── */

function useCompanyObligations(companyId: string | undefined) {
  return useQuery({
    queryKey: ['company-obligations', companyId],
    queryFn: async () => {
      if (!companyId) return { company: null, obligations: [] };
      const [companyRes, obRes] = await Promise.all([
        supabase.from('companies').select('id, name, cuit').eq('id', companyId).maybeSingle(),
        supabase.from('obligations').select('*').eq('company_id', companyId).order('due_date', { ascending: true }),
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

/* ── obligation row ───────────────────────────────────────────── */

const fmtDays = (due: string) => {
  const days = Math.round((new Date(due).getTime() - Date.now()) / 86_400_000);
  if (days < 0) return { text: `Venció hace ${Math.abs(days)}d`, cls: 'text-rose-500' };
  if (days === 0) return { text: '¡HOY!', cls: 'text-rose-500 font-black' };
  if (days === 1) return { text: 'Mañana', cls: 'text-amber-500' };
  if (days <= 7) return { text: `En ${days} días`, cls: 'text-amber-500' };
  return { text: `En ${days} días`, cls: 'text-slate-400' };
};

const catEmoji: Record<string, string> = { legal: '⚖️', fiscal: '📊', seguridad: '🛡️', operativa: '⚙️' };

function ObligationRow({ ob, idx, onClick }: { ob: Obligation; idx: number; onClick: () => void }) {
  const dl = fmtDays(ob.due_date);
  const leftBar =
    ob.status === 'vencida' ? 'bg-rose-500' : ob.status === 'por_vencer' ? 'bg-amber-400' : 'bg-emerald-400';

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.04 }}
      onClick={onClick}
      className="group flex cursor-pointer items-center gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm hover:border-primary/25 hover:shadow-md transition-all"
    >
      <div className={cn('h-full w-1 shrink-0 self-stretch rounded-full', leftBar)} style={{ minHeight: 36 }} />
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <p className="text-sm font-bold text-slate-900 truncate">{ob.name}</p>
          <span className="text-[11px] rounded-full bg-slate-100 px-2 py-0.5 text-slate-500 font-medium">
            {catEmoji[ob.category]} {ob.category}
          </span>
        </div>
        <p className="text-xs text-slate-400">
          {ob.responsible_name && `👤 ${ob.responsible_name}`}
          {ob.recurrence && ob.recurrence !== 'none' && ` · 🔁 ${ob.recurrence === 'monthly' ? 'Mensual' : 'Anual'}`}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className={cn('text-sm font-bold', dl.cls)}>{dl.text}</p>
        <p className="text-[11px] text-slate-400 mt-0.5">
          {new Date(ob.due_date).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
      </div>
    </motion.div>
  );
}

/* ── page ─────────────────────────────────────────────────────── */

const CompanyObligations = () => {
  const navigate = useNavigate();
  const { companyId } = useParams<{ companyId: string }>();
  const { user, profile, isAdmin, signOut, isLoading: authLoading } = useAuth();
  const [showSmartLoader, setShowSmartLoader] = useState(false);

  const { data, isLoading, refetch } = useCompanyObligations(companyId);
  const company = data?.company;
  const obligations = data?.obligations ?? [];

  const stats = useMemo(() => ({
    overdue: obligations.filter((o) => o.status === 'vencida').length,
    upcoming: obligations.filter((o) => o.status === 'por_vencer').length,
    onTime: obligations.filter((o) => o.status === 'al_dia').length,
  }), [obligations]);

  const handleLogout = async () => { await signOut(); navigate('/'); };
  if (!authLoading && !user) { navigate('/auth'); return null; }
  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#F4F6F9]">
      <Header
        userName={profile?.name || user.email || 'Usuario'}
        onLogout={handleLogout}
        isAdmin={isAdmin}
        userPlan={profile?.plan}
      />

      <main className="mx-auto max-w-4xl px-4 pb-32 pt-8 md:px-8">
        {/* BACK + TITLE */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="mb-4 flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-700 transition-colors"
          >
            <ArrowLeft size={14} /> Volver al dashboard
          </button>
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Building2 size={20} className="text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                {isLoading ? '...' : company?.name ?? 'Empresa'}
              </h1>
              {company?.cuit && <p className="text-xs text-slate-400 mt-0.5">CUIT {company.cuit}</p>}
            </div>
          </div>
        </motion.div>

        {/* STATS — 3 mini chips */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.06 }}
          className="mb-6 flex gap-3 flex-wrap"
        >
          {[
            { count: stats.overdue, label: 'Vencidas', icon: <XCircle size={13} />, cls: stats.overdue > 0 ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-white border-slate-200 text-slate-400' },
            { count: stats.upcoming, label: 'Por vencer', icon: <AlertTriangle size={13} />, cls: stats.upcoming > 0 ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-white border-slate-200 text-slate-400' },
            { count: stats.onTime, label: 'Al día', icon: <CheckCircle size={13} />, cls: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
          ].map((s) => (
            <div key={s.label} className={cn('flex items-center gap-2 rounded-xl border px-4 py-2', s.cls)}>
              {s.icon}
              <span className="text-sm font-bold">{s.count}</span>
              <span className="text-xs font-medium">{s.label}</span>
            </div>
          ))}
        </motion.div>

        {/* OBLIGATIONS */}
        <h2 className="text-sm font-semibold text-slate-500 mb-3 uppercase tracking-wide">Obligaciones</h2>

        {isLoading ? (
          <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-slate-100 animate-pulse" />)}</div>
        ) : obligations.length === 0 ? (
          <EmptyState
            title="Sin obligaciones"
            description="Todavía no hay obligaciones cargadas para esta empresa."
            icon={<CheckCircle className="w-12 h-12 text-emerald-400" />}
            showButton={false}
          />
        ) : (
          <div className="space-y-2">
            {obligations.map((ob, idx) => (
              <ObligationRow key={ob.id} ob={ob} idx={idx} onClick={() => navigate(`/obligaciones/${ob.id}`)} />
            ))}
          </div>
        )}
      </main>

      {/* FAB — floating action button at bottom center */}
      {companyId && user && isAdmin && (
        <div className="pointer-events-none fixed bottom-0 left-0 right-0 z-40 flex justify-center pb-8">
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.07 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowSmartLoader(true)}
            className="pointer-events-auto flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-bold text-white shadow-2xl shadow-primary/30 hover:bg-primary/90 transition-colors"
          >
            <Plus size={18} />
            Nueva obligación
          </motion.button>
        </div>
      )}

      {companyId && user && (
        <SmartObligationLoader
          open={showSmartLoader}
          onOpenChange={setShowSmartLoader}
          onObligationsCreated={() => refetch()}
          existingObligations={obligations.map((o) => ({ name: o.name }))}
          userId={user.id}
          preselectedCompanyId={companyId}
        />
      )}
    </div>
  );
};

export default CompanyObligations;
