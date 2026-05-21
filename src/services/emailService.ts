import { supabase } from '@/integrations/supabase/client';

export interface SendObligationAlertParams {
    to: string;
    userName: string;
    obligationName: string;
    daysUntilDue: number;
    dueDate: string;
    obligationId?: string;
}

export interface SendInvitationEmailParams {
    to: string;
    userName: string;
    invitedBy: string;
    inviteLink?: string;
}

/**
 * Sends an email alert for an obligation nearing its due date or overdue.
 */
export async function sendObligationAlert({
    to,
    userName,
    obligationName,
    daysUntilDue,
    dueDate,
    obligationId
}: SendObligationAlertParams): Promise<void> {
    try {
        console.log(`🚀 Iniciando envío de alerta para: ${obligationName} (${to})`);

        const { data, error } = await supabase.functions.invoke('send-email', {
            body: {
                type: 'alert',
                to,
                userName,
                obligationName,
                daysUntilDue,
                dueDate,
                obligationId,
                inviteLink: `https://www.ifsinrem.site/auth`
            },
        });

        if (error) {
            console.error('❌ Error de Supabase al invocar send-email (Alert):', error);
            throw new Error(`Error de comunicación: ${error.message || 'Sin detalles'}`);
        }

        if (data && data.success === false) {
            console.error('❌ La Edge Function reportó un fallo (Alert):', data.error);
            throw new Error(data.error || 'Error desconocido en el servidor de correo');
        }

        console.log('✅ Alerta enviada con éxito');
    } catch (error: any) {
        console.error('❌ Error fatal en sendObligationAlert:', error);
        throw error;
    }
}

/**
 * Sends an invitation email to a new user.
 */
export async function sendInvitationEmail({
    to,
    userName,
    invitedBy,
    inviteLink = "https://www.ifsinrem.site/auth"
}: SendInvitationEmailParams): Promise<void> {
    try {
        const payload = {
            type: 'invitation',
            to,
            userName,
            invitedBy,
            inviteLink,
        };
        console.log('🚀 Enviando invitación con payload:', payload);

        const { data, error } = await supabase.functions.invoke('send-email', {
            body: payload,
        });

        if (error) {
            console.error('❌ Error de Supabase al invocar send-email (Invite):', error);
            const errorMsg = error.message || 'Error de red o permisos';
            throw new Error(`Error de comunicación con Supabase: ${errorMsg}`);
        }

        if (data && data.success === false) {
            console.error('❌ La Edge Function reportó un fallo (Invite):', data.error);
            throw new Error(`Error del Servidor: ${data.error}`);
        }

        console.log('✅ Invitación enviada con éxito:', data);
    } catch (error: any) {
        console.error('❌ Error crítico en sendInvitationEmail:', error);
        throw error;
    }
}
