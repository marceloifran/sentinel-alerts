import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const tools = [
  {
    type: "function",
    function: {
      name: "update_due_date",
      description: "Cambiar la fecha de vencimiento de una obligación",
      parameters: {
        type: "object",
        properties: {
          obligation_id: { type: "string", description: "UUID de la obligación" },
          new_due_date: { type: "string", description: "Nueva fecha en formato YYYY-MM-DD" },
        },
        required: ["obligation_id", "new_due_date"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "renew_obligation",
      description: "Renovar una obligación extendiendo su fecha de vencimiento N meses desde hoy",
      parameters: {
        type: "object",
        properties: {
          obligation_id: { type: "string", description: "UUID de la obligación" },
          months: { type: "number", description: "Cantidad de meses a extender" },
        },
        required: ["obligation_id", "months"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_obligation",
      description: "Eliminar una obligación. Solo usar DESPUÉS de que el usuario confirme explícitamente.",
      parameters: {
        type: "object",
        properties: {
          obligation_id: { type: "string", description: "UUID de la obligación" },
        },
        required: ["obligation_id"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_obligation_notes",
      description: "Actualizar las notas de una obligación",
      parameters: {
        type: "object",
        properties: {
          obligation_id: { type: "string", description: "UUID de la obligación" },
          notes: { type: "string", description: "Nuevas notas" },
        },
        required: ["obligation_id", "notes"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_recurrence",
      description: "Cambiar la recurrencia de una obligación",
      parameters: {
        type: "object",
        properties: {
          obligation_id: { type: "string", description: "UUID de la obligación" },
          recurrence: { type: "string", enum: ["ninguna", "mensual", "anual"], description: "Nueva recurrencia" },
        },
        required: ["obligation_id", "recurrence"],
        additionalProperties: false,
      },
    },
  },
];

async function executeTool(
  toolName: string,
  args: Record<string, unknown>,
  supabaseClient: ReturnType<typeof createClient>,
  userId: string
): Promise<string> {
  try {
    switch (toolName) {
      case "update_due_date": {
        const { obligation_id, new_due_date } = args as { obligation_id: string; new_due_date: string };
        // Verify ownership
        const { data: obl } = await supabaseClient
          .from("obligations")
          .select("id, name")
          .eq("id", obligation_id)
          .or(`responsible_id.eq.${userId},created_by.eq.${userId}`)
          .single();
        if (!obl) return JSON.stringify({ error: "Obligación no encontrada o sin permisos" });

        const { error } = await supabaseClient
          .from("obligations")
          .update({ due_date: new_due_date, status: calculateStatus(new_due_date) })
          .eq("id", obligation_id);
        if (error) return JSON.stringify({ error: error.message });

        // Log history
        await supabaseClient.from("obligation_history").insert({
          obligation_id,
          changed_by: userId,
          previous_status: null,
          new_status: calculateStatus(new_due_date),
          note: `Fecha cambiada a ${new_due_date} vía asistente IA`,
        });

        return JSON.stringify({ success: true, message: `Fecha de "${obl.name}" actualizada a ${new_due_date}` });
      }

      case "renew_obligation": {
        const { obligation_id, months } = args as { obligation_id: string; months: number };
        const { data: obl } = await supabaseClient
          .from("obligations")
          .select("id, name, status")
          .eq("id", obligation_id)
          .or(`responsible_id.eq.${userId},created_by.eq.${userId}`)
          .single();
        if (!obl) return JSON.stringify({ error: "Obligación no encontrada o sin permisos" });

        const newDate = new Date();
        newDate.setMonth(newDate.getMonth() + months);
        const newDueDate = newDate.toISOString().split("T")[0];
        const newStatus = calculateStatus(newDueDate);

        const { error } = await supabaseClient
          .from("obligations")
          .update({ due_date: newDueDate, status: newStatus })
          .eq("id", obligation_id);
        if (error) return JSON.stringify({ error: error.message });

        await supabaseClient.from("obligation_history").insert({
          obligation_id,
          changed_by: userId,
          previous_status: obl.status,
          new_status: newStatus,
          note: `Renovada ${months} meses vía asistente IA. Nueva fecha: ${newDueDate}`,
        });

        return JSON.stringify({ success: true, message: `"${obl.name}" renovada. Nuevo vencimiento: ${newDueDate}` });
      }

      case "delete_obligation": {
        const { obligation_id } = args as { obligation_id: string };
        const { data: obl } = await supabaseClient
          .from("obligations")
          .select("id, name")
          .eq("id", obligation_id)
          .or(`responsible_id.eq.${userId},created_by.eq.${userId}`)
          .single();
        if (!obl) return JSON.stringify({ error: "Obligación no encontrada o sin permisos" });

        // Delete related records first
        await supabaseClient.from("obligation_history").delete().eq("obligation_id", obligation_id);
        await supabaseClient.from("obligation_files").delete().eq("obligation_id", obligation_id);
        await supabaseClient.from("email_notifications").delete().eq("obligation_id", obligation_id);

        const { error } = await supabaseClient.from("obligations").delete().eq("id", obligation_id);
        if (error) return JSON.stringify({ error: error.message });

        return JSON.stringify({ success: true, message: `"${obl.name}" eliminada correctamente` });
      }

      case "update_obligation_notes": {
        const { obligation_id, notes } = args as { obligation_id: string; notes: string };
        const { data: obl } = await supabaseClient
          .from("obligations")
          .select("id, name")
          .eq("id", obligation_id)
          .or(`responsible_id.eq.${userId},created_by.eq.${userId}`)
          .single();
        if (!obl) return JSON.stringify({ error: "Obligación no encontrada o sin permisos" });

        const { error } = await supabaseClient
          .from("obligations")
          .update({ notes })
          .eq("id", obligation_id);
        if (error) return JSON.stringify({ error: error.message });

        return JSON.stringify({ success: true, message: `Notas de "${obl.name}" actualizadas` });
      }

      case "update_recurrence": {
        const { obligation_id, recurrence } = args as { obligation_id: string; recurrence: string };
        const { data: obl } = await supabaseClient
          .from("obligations")
          .select("id, name")
          .eq("id", obligation_id)
          .or(`responsible_id.eq.${userId},created_by.eq.${userId}`)
          .single();
        if (!obl) return JSON.stringify({ error: "Obligación no encontrada o sin permisos" });

        const { error } = await supabaseClient
          .from("obligations")
          .update({ recurrence })
          .eq("id", obligation_id);
        if (error) return JSON.stringify({ error: error.message });

        return JSON.stringify({ success: true, message: `Recurrencia de "${obl.name}" cambiada a ${recurrence}` });
      }

      default:
        return JSON.stringify({ error: `Herramienta desconocida: ${toolName}` });
    }
  } catch (e) {
    console.error(`Tool ${toolName} error:`, e);
    return JSON.stringify({ error: e instanceof Error ? e.message : "Error ejecutando acción" });
  }
}

function calculateStatus(dueDate: string): "al_dia" | "por_vencer" | "vencida" {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate + "T00:00:00");
  const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "vencida";
  if (diffDays <= 30) return "por_vencer";
  return "al_dia";
}

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

    const { messages: chatMessages } = await req.json();

    if (!chatMessages || !Array.isArray(chatMessages) || chatMessages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Se requiere al menos un mensaje" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = userData.user.id;

    // Fetch obligations for context
    const { data: obligations, error: oblError } = await supabaseClient
      .from("obligations")
      .select("id, name, category, status, due_date, responsible_id, recurrence, notes")
      .or(`responsible_id.eq.${userId},created_by.eq.${userId}`)
      .order("due_date", { ascending: true });

    if (oblError) console.error("Error fetching obligations:", oblError);

    const responsibleIds = [...new Set((obligations || []).map((o) => o.responsible_id))];
    const { data: profiles } = await supabaseClient
      .from("profiles")
      .select("id, name")
      .in("id", responsibleIds);

    const profileMap = new Map((profiles || []).map((p) => [p.id, p.name]));
    const obligationsWithNames = (obligations || []).map((o) => ({
      ...o,
      responsible_name: profileMap.get(o.responsible_id) || "Sin asignar",
    }));

    const today = new Date().toISOString().split("T")[0];
    const stats = {
      total: obligationsWithNames.length,
      vencidas: obligationsWithNames.filter((o) => o.status === "vencida").length,
      por_vencer: obligationsWithNames.filter((o) => o.status === "por_vencer").length,
      al_dia: obligationsWithNames.filter((o) => o.status === "al_dia").length,
    };

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `Sos el agente operativo de IfsinRem, un sistema de gestión de obligaciones legales y vencimientos.
NO sos un bot informativo. Sos un asistente que EJECUTA acciones reales.

Fecha actual: ${today}

ESTADÍSTICAS DEL USUARIO:
- Total: ${stats.total} | Vencidas: ${stats.vencidas} | Por vencer: ${stats.por_vencer} | Al día: ${stats.al_dia}

OBLIGACIONES DEL USUARIO:
${JSON.stringify(obligationsWithNames, null, 2)}

REGLAS:
1. Si el usuario pide una acción, EJECUTALA con las herramientas disponibles. No expliques cómo hacerlo.
2. Para ELIMINAR: SIEMPRE pedí confirmación antes. Decí "¿Seguro que querés eliminar [nombre]?" y esperá respuesta.
3. Para editar fechas, renovar, cambiar notas o recurrencia: ejecutá directamente.
4. Respondé brevemente. Confirmá con una línea: "Listo, [acción realizada]."
5. Cuando listes obligaciones, usá formato markdown con enlaces: [Nombre](/obligaciones/ID)
6. Sé proactivo: si detectás vencimientos críticos, sugerí acciones.
7. Usá emojis para hacer la respuesta visual.
8. Si no encontrás la obligación que el usuario menciona, decilo claramente.
9. Cuando el usuario mencione una obligación por nombre parcial, buscá la más parecida en la lista.

CATEGORÍAS: legal, fiscal, seguridad, operativa
ESTADOS: vencida ❌, por_vencer ⚠️, al_dia ✅

HERRAMIENTAS DISPONIBLES:
- update_due_date: Cambiar fecha de vencimiento
- renew_obligation: Renovar (extender N meses desde hoy)
- delete_obligation: Eliminar (PEDIR CONFIRMACIÓN ANTES)
- update_obligation_notes: Actualizar notas
- update_recurrence: Cambiar recurrencia (ninguna/mensual/anual)`;

    const aiMessages = [
      { role: "system", content: systemPrompt },
      ...chatMessages,
    ];

    // Tool calling loop (max 5 iterations)
    let finalContent = "";
    for (let i = 0; i < 5; i++) {
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: aiMessages,
          tools,
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
      const choice = aiResponse.choices?.[0];

      if (!choice) throw new Error("No response from AI");

      // If the AI wants to call tools
      if (choice.finish_reason === "tool_calls" || choice.message?.tool_calls?.length > 0) {
        const assistantMessage = choice.message;
        aiMessages.push(assistantMessage);

        for (const toolCall of assistantMessage.tool_calls) {
          const toolArgs = typeof toolCall.function.arguments === "string"
            ? JSON.parse(toolCall.function.arguments)
            : toolCall.function.arguments;

          console.log(`Executing tool: ${toolCall.function.name}`, toolArgs);
          const result = await executeTool(toolCall.function.name, toolArgs, supabaseClient, userId);
          console.log(`Tool result: ${result}`);

          aiMessages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: result,
          });
        }
        // Continue loop to get final response
        continue;
      }

      // No tool calls - we have the final response
      finalContent = choice.message?.content || "No pude procesar tu consulta.";
      break;
    }

    return new Response(
      JSON.stringify({ response: finalContent, stats }),
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
