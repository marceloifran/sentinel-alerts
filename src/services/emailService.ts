import { supabase } from '@/integrations/supabase/client';

export interface SendObligationAlertParams {
    to: string;
    userName: string;
    obligationName: string;
    daysUntilDue: number;
    dueDate: string;
}

export async function sendObligationAlert({
    to,
    userName,
    obligationName,
    daysUntilDue,
    dueDate,
}: SendObligationAlertParams): Promise<void> {
    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
    if (!SUPABASE_URL) {
        throw new Error('VITE_SUPABASE_URL no está configurada');
    }

    try {
        const { data, error } = await supabase.functions.invoke('send-email', {
            body: {
                to,
                userName,
                obligationName,
                daysUntilDue,
                dueDate,
            },
        });

        if (error) {
            console.error('Error invocando función send-email:', error);
            throw error;
        }

        if (!data || !data.success) {
            const errorMessage = data?.error || 'Error desconocido al enviar email';
            console.error('Error enviando email:', errorMessage);
            throw new Error(errorMessage);
        }

        console.log('Email enviado exitosamente:', data);
    } catch (error) {
        console.error('Error en sendObligationAlert:', error);
        throw error;
    }
}
