import { supabase } from '@/integrations/supabase/client';

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-calendar-sync`;

async function callFunction(action: string, params: Record<string, unknown> = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('No session');

  const response = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ action, ...params }),
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
}

export async function getGoogleAuthUrl(redirectUri: string): Promise<string> {
  const { authUrl } = await callFunction('get-auth-url', { redirectUri });
  return authUrl;
}

export async function exchangeGoogleCode(code: string, redirectUri: string): Promise<void> {
  await callFunction('exchange-code', { code, redirectUri });
}

export async function listGoogleCalendars(): Promise<{ id: string; summary: string }[]> {
  const { calendars } = await callFunction('list-calendars');
  return calendars;
}

export async function updateGoogleCalendarSettings(
  calendarId: string,
  syncEnabled: boolean
): Promise<void> {
  await callFunction('update-settings', { calendarId, syncEnabled });
}

export async function disconnectGoogleCalendar(): Promise<void> {
  await callFunction('disconnect');
}

export async function syncObligationToCalendar(
  obligation: {
    id: string;
    name: string;
    due_date: string;
    status: string;
    responsible_name?: string;
    notes?: string;
  }
): Promise<void> {
  const appUrl = window.location.origin;
  await callFunction('sync-obligation', { obligation, appUrl });
}

export async function deleteCalendarEvent(obligationId: string): Promise<void> {
  await callFunction('delete-event', { obligationId });
}

export async function syncAllObligations(): Promise<number> {
  const appUrl = window.location.origin;
  const { synced } = await callFunction('sync-all', { appUrl });
  return synced;
}

export async function getGoogleCalendarStatus(): Promise<{
  connected: boolean;
  selected_calendar_id?: string;
  sync_enabled?: boolean;
  created_at?: string;
}> {
  return await callFunction('get-status');
}
