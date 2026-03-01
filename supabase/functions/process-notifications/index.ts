import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Obligation {
  id: string;
  name: string;
  due_date: string;
  responsible_id: string;
  status: string;
}

interface Profile {
  id: string;
  email: string;
  name: string;
}

const NOTIFICATION_TYPES = {
  THIRTY_DAYS: "30_days",
  SEVEN_DAYS: "7_days",
  DUE_DATE: "due_date",
} as const;

function getDaysUntilDue(dueDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const diffTime = due.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function getNotificationType(daysUntilDue: number): string | null {
  if (daysUntilDue === 0) return NOTIFICATION_TYPES.DUE_DATE;
  if (daysUntilDue === 7) return NOTIFICATION_TYPES.SEVEN_DAYS;
  if (daysUntilDue === 30) return NOTIFICATION_TYPES.THIRTY_DAYS;
  return null;
}

function generateEmailHtml(
  userName: string,
  obligationName: string,
  dueDate: string,
  daysUntilDue: number,
  notificationType: string
): string {
  const urgencyColor = daysUntilDue === 0 ? "#dc2626" : daysUntilDue <= 7 ? "#f59e0b" : "#10b981";
  const urgencyEmoji = daysUntilDue === 0 ? "🚨" : daysUntilDue <= 7 ? "⚠️" : "📅";

  const message = daysUntilDue === 0
    ? `La obligación "${obligationName}" vence HOY.`
    : `La obligación "${obligationName}" vence en ${daysUntilDue} días.`;

  const urgencyText = daysUntilDue === 0
    ? "¡VENCE HOY! Toma acción inmediata."
    : daysUntilDue <= 7
      ? "Vence pronto. Por favor, revísala."
      : "Aún tienes tiempo, pero no lo dejes pasar.";

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Recordatorio de Obligación</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
    <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">${urgencyEmoji} Recordatorio de Vencimiento</h1>
    </div>
    <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <p style="font-size: 16px; margin-bottom: 20px;">Hola <strong>${userName}</strong>,</p>
        <p style="font-size: 16px; margin-bottom: 20px;">${message}</p>
        
        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; border-left: 4px solid ${urgencyColor}; margin: 20px 0;">
            <p style="margin: 0 0 10px 0; font-size: 18px; font-weight: 600; color: #1a1a2e;">
                ${obligationName}
            </p>
            <p style="margin: 0 0 5px 0; font-size: 14px; color: #6b7280;">
                <strong>Fecha de vencimiento:</strong> ${new Date(dueDate).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <p style="margin: 0; font-size: 14px; color: ${urgencyColor}; font-weight: 600;">
                <strong>Días restantes:</strong> ${daysUntilDue === 0 ? '¡Vence hoy!' : `${daysUntilDue} días`}
            </p>
        </div>
        
        <p style="font-size: 14px; color: ${urgencyColor}; font-weight: 600; text-align: center; padding: 15px; background: ${urgencyColor}15; border-radius: 8px;">
            ${urgencyText}
        </p>
        
        <p style="font-size: 14px; color: #6b7280; margin-top: 25px;">
            Por favor, revisa esta obligación en el sistema para mantener todo al día.
        </p>
    </div>
    <div style="text-align: center; margin-top: 20px; padding: 20px; color: #9ca3af; font-size: 12px;">
        <p style="margin: 0;">Este es un email automático del sistema IfsinRem.</p>
        <p style="margin: 5px 0 0 0;">No responda a este correo.</p>
    </div>
</body>
</html>
  `;
}

async function sendNotificationEmail(
  resend: InstanceType<typeof Resend>,
  fromEmail: string,
  to: string,
  userName: string,
  obligationName: string,
  dueDate: string,
  daysUntilDue: number,
  notificationType: string
): Promise<{ success: boolean; error?: string }> {
  const subject = daysUntilDue === 0
    ? `🚨 ¡URGENTE! "${obligationName}" vence HOY`
    : daysUntilDue <= 7
      ? `⚠️ "${obligationName}" vence en ${daysUntilDue} días`
      : `📅 Recordatorio: "${obligationName}" vence en ${daysUntilDue} días`;

  const html = generateEmailHtml(userName, obligationName, dueDate, daysUntilDue, notificationType);

  try {
    const { error } = await resend.emails.send({
      from: fromEmail,
      to: [to],
      subject,
      html,
    });

    if (error) {
      console.error("Error sending email:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("Exception sending email:", errorMessage);
    return { success: false, error: errorMessage };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    const FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") || "IfsinRem <no-reply@ifsinrem.site>";



    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY no está configurada");
    }
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Variables de Supabase no configuradas");
    }

    const resend = new Resend(RESEND_API_KEY);
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Disable automated notifications as requested
    return new Response(
      JSON.stringify({
        success: true,
        message: "Procesamiento de notificaciones deshabilitado",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

    console.log("Iniciando procesamiento de notificaciones...");

    const { data: obligations, error: obligationsError } = await supabase
      .from("obligations")
      .select("id, name, due_date, responsible_id, status")
      .neq("status", "vencida");

    if (obligationsError) {
      throw new Error(`Error fetching obligations: ${obligationsError.message}`);
    }

    console.log(`Encontradas ${obligations?.length || 0} obligaciones activas`);

    const results = {
      processed: 0,
      emailsSent: 0,
      skipped: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const obligation of obligations || []) {
      const daysUntilDue = getDaysUntilDue(obligation.due_date);
      const notificationType = getNotificationType(daysUntilDue);

      if (!notificationType) {
        results.skipped++;
        continue;
      }

      results.processed++;

      const { data: existingNotification } = await supabase
        .from("email_notifications")
        .select("id")
        .eq("obligation_id", obligation.id)
        .eq("user_id", obligation.responsible_id)
        .eq("notification_type", notificationType)
        .single();

      if (existingNotification) {
        console.log(`Notificación ${notificationType} ya enviada para obligación ${obligation.id}`);
        results.skipped++;
        continue;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, email, name")
        .eq("id", obligation.responsible_id)
        .single();

      if (profileError || !profile) {
        console.error(`No se encontró perfil para usuario ${obligation.responsible_id}`);
        results.failed++;
        results.errors.push(`Profile not found for user ${obligation.responsible_id}`);
        continue;
      }

      const emailResult = await sendNotificationEmail(
        resend,
        FROM_EMAIL,
        profile.email,
        profile.name,
        obligation.name,
        obligation.due_date,
        daysUntilDue,
        notificationType
      );

      if (emailResult.success) {
        console.log(`✅ Email enviado a ${profile.email} para obligación "${obligation.name}" (${notificationType})`);
        results.emailsSent++;
      } else {
        console.error(`❌ Error enviando email a ${profile.email}: ${emailResult.error}`);
        results.failed++;
        results.errors.push(`Failed to send email to ${profile.email}: ${emailResult.error}`);
      }

      const { error: insertError } = await supabase
        .from("email_notifications")
        .insert({
          obligation_id: obligation.id,
          user_id: obligation.responsible_id,
          notification_type: notificationType,
          email_to: profile.email,
          status: emailResult.success ? "sent" : "failed",
          error_message: emailResult.error || null,
        });

      if (insertError) {
        console.error(`Error recording notification: ${insertError.message}`);
      }
    }

    console.log("Procesamiento completado:", results);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Procesamiento de notificaciones completado",
        results,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error) {
    console.error("Error en process-notifications:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
