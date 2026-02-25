import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const RESEND_FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") || "IfsinRem <onboarding@resend.dev>";

interface EmailRequest {
  to: string;
  type?: 'alert' | 'invitation';
  userName: string;
  // Fields for alert
  obligationName?: string;
  daysUntilDue?: number;
  dueDate?: string;
  obligationId?: string;
  // Fields for invitation
  invitedBy?: string;
  inviteLink?: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    if (!RESEND_API_KEY) {
      console.error("❌ Error: RESEND_API_KEY no está configurada.");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Configuración incompleta: RESEND_API_KEY no está establecida en Supabase Secrets."
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resend = new Resend(RESEND_API_KEY);

    let body: EmailRequest;
    try {
      body = await req.json();
      console.log("📥 Payload recibido:", JSON.stringify(body));
    } catch (e) {
      return new Response(
        JSON.stringify({ success: false, error: "Cuerpo de solicitud inválido (no es JSON)" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const {
      to,
      type = 'alert',
      userName,
      obligationName,
      daysUntilDue,
      dueDate,
      invitedBy,
      inviteLink = "https://www.ifsinrem.site/auth",
      obligationId
    } = body;

    if (!to || !userName) {
      return new Response(
        JSON.stringify({ success: false, error: "Faltan parámetros requeridos: 'to' y 'userName'" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let subject = "";
    let htmlContent = "";

    if (type === 'invitation') {
      subject = `🎫 Invitación a Sentinel Alerts`;
      htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">🎫 Tienes una invitación</h1>
    </div>
    <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
        <p style="font-size: 16px; margin-bottom: 20px;">Hola <strong>${userName}</strong>,</p>
        <p style="font-size: 16px; margin-bottom: 20px;"><strong>${invitedBy || 'Un administrador'}</strong> te ha invitado a unirte a <strong>Sentinel Alerts</strong>.</p>
        <p style="font-size: 16px; margin-bottom: 20px;">Sentinel Alerts es un sistema inteligente de gestión y notificación de obligaciones legales, fiscales y de seguridad.</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="${inviteLink}" style="background-color: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Completar Registro</a>
        </div>
        
        <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">Si el botón no funciona, puedes copiar y lanzar este enlace en tu navegador:</p>
        <p style="font-size: 12px; color: #9ca3af; word-break: break-all;">${inviteLink}</p>
    </div>
    <div style="text-align: center; margin-top: 20px; padding: 20px; color: #9ca3af; font-size: 12px;">
        <p>Este es un email de invitación de <strong>ifsinrem.site</strong>.</p>
    </div>
</body>
</html>
      `;
    } else {
      // ALERTS
      if (!obligationName) {
        return new Response(
          JSON.stringify({ success: false, error: "Faltan parámetros requeridos para alertas: 'obligationName'" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const isOverdue = (daysUntilDue || 0) < 0;
      const isDueToday = daysUntilDue === 0;
      const absDays = Math.abs(daysUntilDue || 0);
      const detailLink = obligationId
        ? `https://www.ifsinrem.site/obligaciones/${obligationId}`
        : `https://www.ifsinrem.site/obligaciones`;

      subject = isOverdue
        ? `🚨 URGENTE: ${obligationName} está vencida hace ${absDays} días`
        : isDueToday
          ? `⚠️ Atención: ${obligationName} vence HOY`
          : (daysUntilDue || 0) <= 7
            ? `⚠️ Atención: ${obligationName} vence en ${daysUntilDue} días`
            : `📅 Recordatorio: ${obligationName} vence en ${daysUntilDue} días`;

      const message = isOverdue
        ? `La obligación "${obligationName}" está <strong style="color: #dc2626;">VENCIDA hace ${absDays} días</strong>.`
        : isDueToday
          ? `La obligación "${obligationName}" <strong style="color: #f59e0b;">vence HOY</strong>.`
          : `La obligación "${obligationName}" vence en <strong>${daysUntilDue} días</strong>.`;

      const urgencyColor = isOverdue ? "#dc2626" : isDueToday ? "#f59e0b" : (daysUntilDue || 0) <= 7 ? "#f59e0b" : "#10b981";
      const urgencyEmoji = isOverdue ? "🚨" : isDueToday ? "⚠️" : (daysUntilDue || 0) <= 7 ? "⚠️" : "📅";

      const urgencyText = isOverdue
        ? "🚨 ¡VENCIDA! Requiere atención inmediata."
        : isDueToday
          ? "⚠️ ¡Vence hoy! Toma acción inmediata."
          : (daysUntilDue || 0) <= 7
            ? "⚠️ Vence pronto. Por favor, revísala."
            : "✅ Aún tienes tiempo, pero no lo dejes pasar.";

      const daysText = isOverdue
        ? `Vencida hace ${absDays} día${absDays !== 1 ? 's' : ''}`
        : isDueToday
          ? "¡Vence hoy!"
          : `${daysUntilDue} día${daysUntilDue !== 1 ? 's' : ''} restantes`;

      htmlContent = `
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
            <p style="margin: 0; font-size: 14px; color: #6b7280;"><strong>Fecha de vencimiento:</strong> ${dueDate ? new Date(dueDate).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '-'}</p>
            <p style="margin: 10px 0 0 0; font-size: 14px; color: ${urgencyColor}; font-weight: 600;"><strong>Estado:</strong> ${daysText}</p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
            <a href="${detailLink}" style="background-color: ${urgencyColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Ver Obligación</a>
        </div>

        <p style="font-size: 14px; color: ${urgencyColor}; font-weight: 600; text-align: center; padding: 15px; background: ${urgencyColor}15; border-radius: 8px;">${urgencyText}</p>
        <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">Por favor, revisa esta obligación en el sistema para mantener todo al día.</p>
    </div>
    <div style="text-align: center; margin-top: 20px; padding: 20px; color: #9ca3af; font-size: 12px;">
        <p>Este es un email automático de <strong>ifsinrem.site</strong>.</p>
    </div>
</body>
</html>
      `;
    }

    console.log(`🚀 Intentando enviar email via Resend a: ${to}`);
    const { data: resendData, error: resendError } = await resend.emails.send({
      from: RESEND_FROM_EMAIL,
      to: [to],
      subject,
      html: htmlContent,
    });

    if (resendError) {
      console.error("❌ Error de Resend:", resendError);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Resend Error: ${resendError.message}`
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: resendData }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ Error inesperado:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Error inesperado" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
