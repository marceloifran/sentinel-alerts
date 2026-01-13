import { supabase } from '@/integrations/supabase/client';

export interface ObligationNotification {
    id: string;
    obligation_id: string;
    user_email: string;
    user_name: string;
    custom_message: string | null;
    days_before: number;
    is_active: boolean;
    created_at: string;
}

export async function getObligationNotifications(
    obligationId: string
): Promise<ObligationNotification[]> {
    const { data, error } = await supabase
        .from('obligation_notifications' as any)
        .select('*')
        .eq('obligation_id', obligationId)
        .eq('is_active', true)
        .order('created_at', { ascending: true });

    if (error) throw error;
    return (data as any) || [];
}

export async function addNotificationUser(
    obligationId: string,
    userEmail: string,
    userName: string,
    customMessage?: string,
    daysBefore: number = 7
): Promise<ObligationNotification> {
    // Check if we already have 3 active notifications
    const existing = await getObligationNotifications(obligationId);
    if (existing.length >= 3) {
        throw new Error('Máximo 3 usuarios por obligación');
    }

    // Check if email already exists for this obligation
    const duplicate = existing.find(n => n.user_email === userEmail);
    if (duplicate) {
        throw new Error('Este email ya está agregado a las notificaciones');
    }

    const { data, error } = await supabase
        .from('obligation_notifications' as any)
        .insert({
            obligation_id: obligationId,
            user_email: userEmail,
            user_name: userName,
            custom_message: customMessage || null,
            days_before: daysBefore,
        })
        .select()
        .single();

    if (error) throw error;
    return data as any;
}

export async function removeNotificationUser(
    notificationId: string
): Promise<void> {
    const { error } = await supabase
        .from('obligation_notifications' as any)
        .update({ is_active: false })
        .eq('id', notificationId);

    if (error) throw error;
}

export async function updateNotificationMessage(
    notificationId: string,
    message: string,
    daysBefore?: number
): Promise<void> {
    const updates: any = { custom_message: message };
    if (daysBefore !== undefined) {
        updates.days_before = daysBefore;
    }

    const { error } = await supabase
        .from('obligation_notifications' as any)
        .update(updates)
        .eq('id', notificationId);

    if (error) throw error;
}

// This would be called from a backend cron job or edge function
export async function sendObligationAlerts(): Promise<void> {
    // Get obligations that are due in the next 7, 15, or 30 days
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + 30);

    const { data: obligations, error: obligationsError } = await supabase
        .from('obligations')
        .select('*, obligation_notifications(*)')
        .gte('due_date', today.toISOString())
        .lte('due_date', futureDate.toISOString())
        .eq('obligation_notifications.is_active', true);

    if (obligationsError) throw obligationsError;

    // For each obligation, check if we need to send alerts
    for (const obligation of obligations || []) {
        const dueDate = new Date((obligation as any).due_date);
        const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        // Send alerts to users whose days_before matches
        const notifications = (obligation as any).obligation_notifications || [];
        for (const notification of notifications) {
            if (notification.days_before === daysUntilDue) {
                // Here you would call the email service
                console.log(`Sending alert to ${notification.user_email} for obligation ${(obligation as any).name}`);
            }
        }
    }
}
