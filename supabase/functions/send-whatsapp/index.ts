import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WhatsAppRequest {
  to: string;
  userName: string;
  obligationName: string;
  daysUntilDue: number;
  dueDate: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
    const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
    const TWILIO_WHATSAPP_FROM = Deno.env.get("TWILIO_WHATSAPP_FROM");

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_WHATSAPP_FROM) {
      throw new Error("Twilio credentials not configured");
    }

    const { to, userName, obligationName, daysUntilDue, dueDate }: WhatsAppRequest = await req.json();

    console.log(`Sending WhatsApp to ${to} for obligation "${obligationName}"`);

    // Determine message based on days until due
    const isOverdue = daysUntilDue < 0;
    const isDueToday = daysUntilDue === 0;
    const absDays = Math.abs(daysUntilDue);

    const formattedDate = new Date(dueDate).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    let emoji: string;
    let statusText: string;
    let urgencyText: string;

    if (isOverdue) {
      emoji = "🚨";
      statusText = `*VENCIDA* hace ${absDays} día${absDays !== 1 ? 's' : ''}`;
      urgencyText = "¡Requiere atención inmediata!";
    } else if (isDueToday) {
      emoji = "⚠️";
      statusText = "*¡Vence HOY!*";
      urgencyText = "¡Toma acción ahora!";
    } else if (daysUntilDue <= 7) {
      emoji = "⚠️";
      statusText = `Vence en *${daysUntilDue} días*`;
      urgencyText = "Por favor, revísala pronto.";
    } else {
      emoji = "📅";
      statusText = `Vence en *${daysUntilDue} días*`;
      urgencyText = "Aún tienes tiempo, pero no lo dejes pasar.";
    }

    const message = `${emoji} *Recordatorio de IfsinRem*

Hola *${userName}*,

La obligación *"${obligationName}"* ${statusText}.

📆 Fecha de vencimiento: ${formattedDate}

${urgencyText}

_Este es un mensaje automático del sistema IfsinRem._`;

    // Format phone number for WhatsApp
    let formattedPhone = to.replace(/\D/g, ''); // Remove non-digits
    if (!formattedPhone.startsWith('54')) {
      formattedPhone = '54' + formattedPhone;
    }
    const whatsappTo = `whatsapp:+${formattedPhone}`;
    const whatsappFrom = TWILIO_WHATSAPP_FROM.startsWith('whatsapp:') 
      ? TWILIO_WHATSAPP_FROM 
      : `whatsapp:${TWILIO_WHATSAPP_FROM}`;

    // Send via Twilio
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
    
    const formData = new URLSearchParams();
    formData.append('To', whatsappTo);
    formData.append('From', whatsappFrom);
    formData.append('Body', message);

    const twilioResponse = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const twilioResult = await twilioResponse.json();

    if (!twilioResponse.ok) {
      console.error('Twilio error:', twilioResult);
      throw new Error(twilioResult.message || 'Error sending WhatsApp message');
    }

    console.log('WhatsApp sent successfully:', twilioResult.sid);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'WhatsApp enviado exitosamente',
        sid: twilioResult.sid,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error) {
    console.error("Error in send-whatsapp:", error);
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
