import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const RESEND_FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") || "Sentinel Alerts <onboarding@resend.dev>";

interface EmailRequest {
  to: string;
  userName: string;
  obligationName: string;
  daysUntilDue: number;
  dueDate: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY no está configurada en las variables de entorno de Supabase");
    }

    const resend = new Resend(RESEND_API_KEY);
    const body: EmailRequest = await req.json();

    const { to, userName, obligationName, daysUntilDue, dueDate } = body;

    if (!to || !userName || !obligationName) {
      throw new Error("Faltan parámetros requeridos");
    }

    // Determine email subject and content based on days until due
    const isOverdue = daysUntilDue < 0;
    const isDueToday = daysUntilDue === 0;
    const absDays = Math.abs(daysUntilDue);

    const subject = isOverdue
      ? `🚨 URGENTE: ${obligationName} está vencida hace ${absDays} días`
      : isDueToday
        ? `⚠️ Atención: ${obligationName} vence HOY`
        : daysUntilDue <= 7
          ? `⚠️ Atención: ${obligationName} vence en ${daysUntilDue} días`
          : `📅 Recordatorio: ${obligationName} vence en ${daysUntilDue} días`;

    const message = isOverdue
      ? `La obligación "${obligationName}" está <strong style="color: #dc2626;">VENCIDA hace ${absDays} días</strong>.`
      : isDueToday
        ? `La obligación "${obligationName}" <strong style="color: #f59e0b;">vence HOY</strong>.`
        : `La obligación "${obligationName}" vence en <strong>${daysUntilDue} días</strong>.`;

    const urgencyColor = isOverdue ? "#dc2626" : isDueToday ? "#f59e0b" : daysUntilDue <= 7 ? "#f59e0b" : "#10b981";
    const urgencyEmoji = isOverdue ? "🚨" : isDueToday ? "⚠️" : daysUntilDue <= 7 ? "⚠️" : "📅";
    
    const urgencyText = isOverdue
      ? "🚨 ¡VENCIDA! Requiere atención inmediata."
      : isDueToday
        ? "⚠️ ¡Vence hoy! Toma acción inmediata."
        : daysUntilDue <= 7
          ? "⚠️ Vence pronto. Por favor, revísala."
          : "✅ Aún tienes tiempo, pero no lo dejes pasar.";

    const daysText = isOverdue
      ? `Vencida hace ${absDays} día${absDays !== 1 ? 's' : ''}`
      : isDueToday
        ? "¡Vence hoy!"
        : `${daysUntilDue} día${daysUntilDue !== 1 ? 's' : ''} restantes`;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, ${isOverdue ? '#dc2626' : '#667eea'} 0%, ${isOverdue ? '#991b1b' : '#764ba2'} 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">${urgencyEmoji} ${isOverdue ? 'Obligación Vencida' : 'Notificación de Vencimiento'}</h1>
    </div>
    <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
        <p style="font-size: 16px; margin-bottom: 20px;">Hola <strong>${userName}</strong>,</p>
        <p style="font-size: 16px; margin-bottom: 20px;">${message}</p>
        <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid ${urgencyColor}; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #6b7280;"><strong>Fecha de vencimiento:</strong> ${new Date(dueDate).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p style="margin: 10px 0 0 0; font-size: 14px; color: ${urgencyColor}; font-weight: 600;"><strong>Estado:</strong> ${daysText}</p>
        </div>
        <p style="font-size: 14px; color: ${urgencyColor}; font-weight: 600; text-align: center; padding: 15px; background: ${urgencyColor}15; border-radius: 8px;">${urgencyText}</p>
        <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">Por favor, revisa esta obligación en el sistema para mantener todo al día.</p>
    </div>
    <div style="text-align: center; margin-top: 20px; padding: 20px; color: #9ca3af; font-size: 12px;">
        <p>Este es un email automático del sistema de gestión de obligaciones.</p>
    </div>
</body>
</html>
    `;

    const { data, error } = await resend.emails.send({
      from: RESEND_FROM_EMAIL,
      to: [to],
      subject,
      html: htmlContent,
    });

    if (error) {
      console.error("Error enviando email con Resend:", error);
      throw error;
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    console.error("Error en send-email function:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido"
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});
