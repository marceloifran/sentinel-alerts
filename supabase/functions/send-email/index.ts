import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const RESEND_FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") || "Sentinel Alerts <onboarding@resend.dev>";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string;
  type?: 'alert' | 'invitation';
  userName: string;
  obligationName?: string;
  daysUntilDue?: number;
  dueDate?: string;
  obligationId?: string;
  invitedBy?: string;
  inviteLink?: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    if (!RESEND_API_KEY) {
      console.error("❌ RESEND_API_KEY no configurada");
      return new Response(
        JSON.stringify({
          success: false,
          error: "RESEND_API_KEY no establecida en Supabase Secrets."
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resend = new Resend(RESEND_API_KEY);
    const body: EmailRequest = await req.json();
    console.log("📥 Payload recibido:", JSON.stringify(body));

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
        JSON.stringify({ success: false, error: "Faltan parámetros: to y userName" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
            <title>${subject}</title>
        </head>
        <body style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #7c3aed; padding: 20px; border-radius: 10px; text-align: center; color: white;">
                <h2>🎫 Tienes una invitación</h2>
            </div>
            <div style="padding: 20px;">
                <p>Hola <strong>${userName}</strong>,</p>
                <p><strong>${invitedBy || 'Un administrador'}</strong> te ha invitado a unirte a <strong>Sentinel Alerts</strong>.</p>
                <div style="text-align: center; margin: 20px 0;">
                    <a href="${inviteLink}" style="background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Completar Registro</a>
                </div>
                <p style="font-size: 12px; color: #666;">Si el botón no funciona, copia este enlace: ${inviteLink}</p>
            </div>
        </body>
        </html>
      `;
    } else {
      if (!obligationName) {
        return new Response(
          JSON.stringify({ success: false, error: "Faltan parámetros para alerta" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const isOverdue = (daysUntilDue || 0) < 0;
      const absDays = Math.abs(daysUntilDue || 0);

      subject = isOverdue
        ? `🚨 VENCIDA: ${obligationName}`
        : (daysUntilDue || 0) <= 7
          ? `⚠️ PRÓXIMO VENCIMIENTO: ${obligationName}`
          : `📅 Recordatorio: ${obligationName}`;

      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: sans-serif; padding: 20px;">
            <h2 style="color: ${isOverdue ? '#dc2626' : '#7c3aed'};">${subject}</h2>
            <p>Hola ${userName},</p>
            <p>La obligación <strong>${obligationName}</strong> ${isOverdue ? 'está vencida hace' : 'vence en'} ${absDays} días.</p>
            <p>Fecha de vencimiento: ${dueDate || '-'}</p>
            <div style="margin-top: 20px;">
                <a href="https://www.ifsinrem.site/obligaciones" style="background: #7c3aed; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Ver en el sistema</a>
            </div>
        </body>
        </html>
      `;
    }

    console.log(`🚀 Enviando email a: ${to}`);
    const { data: resendData, error: resendError } = await resend.emails.send({
      from: RESEND_FROM_EMAIL,
      to: [to],
      subject,
      html: htmlContent,
    });

    if (resendError) {
      console.error("❌ Error de Resend:", resendError);
      return new Response(
        JSON.stringify({ success: false, error: resendError }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: resendData }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ Error inesperado:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

