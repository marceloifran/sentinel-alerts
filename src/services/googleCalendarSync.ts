import { supabase } from '@/integrations/supabase/client';

interface SyncObligationParams {
    id: string;
    title: string;
    description?: string;
    due_date: string;
    category: string;
    status: string;
}

export async function syncObligationToCalendar(obligation: SyncObligationParams): Promise<void> {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            console.warn('No session available for calendar sync');
            return;
        }

        // Check if sync is enabled
        const { data: integration } = await supabase
            .from('google_calendar_integrations')
            .select('sync_enabled')
            .eq('user_id', session.user.id)
            .single();

        if (!integration?.sync_enabled) {
            console.log('Calendar sync is disabled');
            return;
        }

        // Call Edge Function to sync
        const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-calendar-sync`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({
                    action: 'sync-obligation',
                    obligation: {
                        id: obligation.id,
                        title: obligation.title,
                        description: obligation.description || '',
                        due_date: obligation.due_date,
                        category: obligation.category,
                        status: obligation.status,
                    },
                }),
            }
        );

        if (!response.ok) {
            const error = await response.text();
            console.error('Calendar sync failed:', error);
        } else {
            console.log('Obligation synced to calendar successfully');
        }
    } catch (error) {
        console.error('Error syncing to calendar:', error);
    }
}

export async function deleteObligationFromCalendar(obligationId: string): Promise<void> {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-calendar-sync`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({
                    action: 'delete-obligation',
                    obligationId,
                }),
            }
        );

        if (!response.ok) {
            console.error('Failed to delete from calendar');
        }
    } catch (error) {
        console.error('Error deleting from calendar:', error);
    }
}
