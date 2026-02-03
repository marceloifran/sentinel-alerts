import { supabase } from '@/integrations/supabase/client';

export interface Subscription {
  id: string;
  user_id: string;
  mercadopago_subscription_id: string | null;
  mercadopago_preapproval_id: string | null;
  plan: 'starter' | 'professional' | 'enterprise';
  status: string;
  price_monthly: number;
  current_period_start: string | null;
  current_period_end: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlanInfo {
  price: number;
  name: string;
  description: string;
}

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mercadopago`;

async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('No authenticated session');
  }
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`,
  };
}

export async function getPlans(): Promise<{ plans: Record<string, PlanInfo>; publicKey: string }> {
  const headers = await getAuthHeaders();
  
  const response = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ action: 'get-plans' }),
  });

  if (!response.ok) {
    throw new Error('Failed to get plans');
  }

  const data = await response.json();
  return { plans: data.plans, publicKey: data.publicKey };
}

export async function createSubscription(plan: 'professional' | 'enterprise', email: string): Promise<{ initPoint: string; preapprovalId: string }> {
  const headers = await getAuthHeaders();
  
  const response = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ action: 'create-subscription', plan, email }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create subscription');
  }

  const data = await response.json();
  return { initPoint: data.init_point, preapprovalId: data.preapproval_id };
}

export async function getSubscription(): Promise<Subscription | null> {
  const headers = await getAuthHeaders();
  
  const response = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ action: 'get-subscription' }),
  });

  if (!response.ok) {
    throw new Error('Failed to get subscription');
  }

  const data = await response.json();
  return data.subscription;
}

export async function cancelSubscription(): Promise<void> {
  const headers = await getAuthHeaders();
  
  const response = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ action: 'cancel-subscription' }),
  });

  if (!response.ok) {
    throw new Error('Failed to cancel subscription');
  }
}

export async function syncSubscriptionStatus(): Promise<string | null> {
  const headers = await getAuthHeaders();
  
  const response = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ action: 'sync-status' }),
  });

  if (!response.ok) {
    throw new Error('Failed to sync subscription');
  }

  const data = await response.json();
  return data.status;
}

// Format price for display
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
  }).format(price);
}

// Status labels in Spanish
export const subscriptionStatusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pendiente', color: 'text-yellow-600' },
  authorized: { label: 'Activa', color: 'text-green-600' },
  active: { label: 'Activa', color: 'text-green-600' },
  paused: { label: 'Pausada', color: 'text-orange-600' },
  cancelled: { label: 'Cancelada', color: 'text-red-600' },
};
