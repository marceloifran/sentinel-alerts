import { supabase } from '@/integrations/supabase/client';

export type ClientStatus = 'red' | 'yellow' | 'green';

export interface ClientCompany {
  id: string;           // accountant_clients row id
  companyId: string;    // companies.id
  companyName: string;
  cuit: string | null;
  nickname: string | null;
  status: ClientStatus;
  nextObligation: {
    name: string;
    dueDate: string;
    daysUntilDue: number;
  } | null;
  totalObligations: number;
  overdueCount: number;
  urgentCount: number;  // vencen en <= 7 días
}

function diffDays(dueDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function getClientStatus(obligations: { due_date: string; status: string }[]): ClientStatus {
  if (obligations.length === 0) return 'green';

  const hasCritical = obligations.some((o) => {
    const days = diffDays(o.due_date);
    return o.status === 'vencida' || days <= 1;
  });
  if (hasCritical) return 'red';

  const hasUrgent = obligations.some((o) => {
    const days = diffDays(o.due_date);
    return days <= 7;
  });
  if (hasUrgent) return 'yellow';

  return 'green';
}

export async function getAccountantClients(accountantId: string): Promise<ClientCompany[]> {
  // 1. Get all client relationships for this accountant
  const { data: clientLinks, error: linksError } = await supabase
    .from('accountant_clients' as any)
    .select('id, client_company_id, nickname')
    .eq('accountant_id', accountantId)
    .order('created_at', { ascending: true });

  if (linksError) throw linksError;
  if (!clientLinks || clientLinks.length === 0) return [];

  const companyIds = clientLinks.map((l: any) => l.client_company_id);

  // 2. Get company info
  const { data: companies, error: companiesError } = await supabase
    .from('companies')
    .select('id, name, cuit')
    .in('id', companyIds);

  if (companiesError) throw companiesError;

  // 3. Get obligations for all client companies
  const { data: obligations, error: obligationsError } = await supabase
    .from('obligations')
    .select('id, name, due_date, status, company_id')
    .in('company_id', companyIds)
    .order('due_date', { ascending: true });

  if (obligationsError) throw obligationsError;

  const companiesMap = new Map((companies || []).map((c: any) => [c.id, c]));
  const obligationsMap = new Map<string, any[]>();

  for (const companyId of companyIds) {
    obligationsMap.set(companyId, []);
  }
  for (const o of obligations || []) {
    if (o.company_id && obligationsMap.has(o.company_id)) {
      obligationsMap.get(o.company_id)!.push(o);
    }
  }

  return clientLinks.map((link: any) => {
    const company = companiesMap.get(link.client_company_id);
    const obs = obligationsMap.get(link.client_company_id) || [];

    // Pending/active obligations sorted by due date
    const activeObs = obs.filter((o) => o.status !== 'al_dia' || diffDays(o.due_date) <= 30)
      .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());

    const overdueCount = obs.filter((o) => o.status === 'vencida' || diffDays(o.due_date) < 0).length;
    const urgentCount = obs.filter((o) => {
      const d = diffDays(o.due_date);
      return d >= 0 && d <= 7;
    }).length;

    const nextOb = activeObs[0] || null;
    const status = getClientStatus(obs);

    return {
      id: link.id,
      companyId: link.client_company_id,
      companyName: company?.name ?? 'Empresa sin nombre',
      cuit: company?.cuit ?? null,
      nickname: link.nickname ?? null,
      status,
      nextObligation: nextOb
        ? {
            name: nextOb.name,
            dueDate: nextOb.due_date,
            daysUntilDue: diffDays(nextOb.due_date),
          }
        : null,
      totalObligations: obs.length,
      overdueCount,
      urgentCount,
    };
  });
}

export async function addClientCompany(
  accountantId: string,
  companyName: string,
  cuit?: string
): Promise<ClientCompany> {
  // 1. Create the company
  const { data: company, error: companyError } = await supabase
    .from('companies')
    .insert({ name: companyName, cuit: cuit || null, plan: 'professional' })
    .select()
    .single();

  if (companyError) throw companyError;

  // 2. Link to accountant
  const { data: link, error: linkError } = await supabase
    .from('accountant_clients' as any)
    .insert({ accountant_id: accountantId, client_company_id: company.id })
    .select()
    .single();

  if (linkError) throw linkError;

  return {
    id: (link as any).id,
    companyId: company.id,
    companyName: company.name,
    cuit: company.cuit,
    nickname: null,
    status: 'green',
    nextObligation: null,
    totalObligations: 0,
    overdueCount: 0,
    urgentCount: 0,
  };
}

export async function removeClientCompany(linkId: string): Promise<void> {
  const { error } = await supabase
    .from('accountant_clients' as any)
    .delete()
    .eq('id', linkId);

  if (error) throw error;
}
