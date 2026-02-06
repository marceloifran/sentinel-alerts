import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "No autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !userData.user) {
      return new Response(
        JSON.stringify({ error: "No autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { message } = await req.json();

    if (!message || typeof message !== "string") {
      return new Response(
        JSON.stringify({ error: "Se requiere un mensaje" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch only the current user's obligations
    const userId = userData.user.id;
    const { data: obligations, error: oblError } = await supabaseClient
      .from("obligations")
      .select("id, name, category, status, due_date, responsible_id, recurrence, notes")
      .or(`responsible_id.eq.${userId},created_by.eq.${userId}`)
      .order("due_date", { ascending: true });

    if (oblError) {
      console.error("Error fetching obligations:", oblError);
    }

    // Fetch profiles for responsible names
    const responsibleIds = [...new Set((obligations || []).map(o => o.responsible_id))];
    const { data: profiles } = await supabaseClient
      .from("profiles")
      .select("id, name")
      .in("id", responsibleIds);

    const profileMap = new Map((profiles || []).map(p => [p.id, p.name]));

    const obligationsWithNames = (obligations || []).map(o => ({
      ...o,
      responsible_name: profileMap.get(o.responsible_id) || "Sin asignar"
    }));

    const today = new Date().toISOString().split("T")[0];
    
    // Calculate stats
    const stats = {
      total: obligationsWithNames.length,
      vencidas: obligationsWithNames.filter(o => o.status === "vencida").length,
      por_vencer: obligationsWithNames.filter(o => o.status === "por_vencer").length,
      al_dia: obligationsWithNames.filter(o => o.status === "al_dia").length,
    };

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Eres el asistente de IfsinRem, un sistema de gestión de obligaciones legales y vencimientos.

Fecha actual: ${today}

ESTADÍSTICAS DEL USUARIO:
- Total de obligaciones: ${stats.total}
- Vencidas: ${stats.vencidas}
- Por vencer (próximos 30 días): ${stats.por_vencer}
- Al día: ${stats.al_dia}

OBLIGACIONES DEL USUARIO:
${JSON.stringify(obligationsWithNames, null, 2)}

INSTRUCCIONES:
1. Responde preguntas sobre el estado de las obligaciones
2. Cuando listes obligaciones, usa formato markdown con enlaces
3. Para enlaces a obligaciones usa: [Nombre](/obligaciones/ID)
4. Sé conciso y directo
5. Si preguntan por vencimientos, ordena por fecha
6. Si preguntan por categorías, agrupa correctamente
7. Sugiere acciones cuando sea apropiado
8. Usa emojis para hacer la respuesta más visual
9. Si no hay obligaciones que coincidan, dilo claramente

CATEGORÍAS:
- legal: Habilitaciones, permisos, registros
- fiscal: Impuestos, AFIP, balances
- seguridad: Seguros, ART, SST
- operativa: Mantenimiento, licencias

ESTADOS:
- vencida: Fecha ya pasó ❌
- por_vencer: Vence en próximos 30 días ⚠️
- al_dia: Más de 30 días ✅`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Límite de solicitudes excedido, intenta de nuevo más tarde" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes para el asistente IA" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Error al procesar con IA");
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content || "No pude procesar tu consulta.";

    return new Response(
      JSON.stringify({ response: content, stats }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("ai-assistant error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Error desconocido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
