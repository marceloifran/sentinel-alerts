import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const anthropicTools = [
  {
    name: "quick_epp_delivery",
    description: "Registra la entrega de uno o varios elementos de protección personal (EPP) a un operario. Usalo cuando el supervisor pida entregar EPP.",
    input_schema: {
      type: "object",
      properties: {
        employee_id: { type: "string", description: "El UUID del operario receptor" },
        epp_item_ids: {
          type: "array",
          items: { type: "string" },
          description: "Lista de UUIDs de los EPPs entregados",
        },
        quantities: {
          type: "array",
          items: { type: "number" },
          description: "Cantidad entregada por cada EPP en orden correspondiente. Por defecto 1.",
        },
        notes: { type: "string", description: "Notas adicionales o justificación" },
      },
      required: ["employee_id", "epp_item_ids"],
    },
  },
  {
    name: "add_employee",
    description: "Registra un nuevo operario en la obra. Usalo si el operario mencionado no existe en la lista de operarios y tenés su nombre y DNI.",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Nombre completo del trabajador" },
        dni_cuil: { type: "string", description: "Número de DNI o CUIL" },
        job_title: { type: "string", description: "Puesto de trabajo / Especialidad" },
        file_number: { type: "string", description: "Número de legajo si lo menciona" },
      },
      required: ["name", "dni_cuil"],
    },
  },
  {
    name: "add_epp_item",
    description: "Registra un nuevo elemento EPP en el catálogo de inventario de la empresa.",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Nombre del elemento de protección personal (ej: Casco con visera)" },
        category: { type: "string", description: "Categoría del EPP (cabeza, manos, pies, visual, auditiva, respiratoria, cuerpo, otro)" },
        stock: { type: "number", description: "Stock o cantidad inicial disponible" },
        brand: { type: "string", description: "Marca comercial del EPP" },
        type_model: { type: "string", description: "Modelo o tipo específico del elemento" },
      },
      required: ["name", "category"],
    },
  },
  {
    name: "update_employee",
    description: "Modifica o actualiza los datos de un operario existente en la obra (como DNI, puesto, legajo, teléfono o estado).",
    input_schema: {
      type: "object",
      properties: {
        employee_id: { type: "string", description: "El UUID del operario a actualizar" },
        dni_cuil: { type: "string", description: "Nuevo número de DNI o CUIL (opcional)" },
        job_title: { type: "string", description: "Nuevo puesto de trabajo (opcional)" },
        file_number: { type: "string", description: "Nuevo número de legajo (opcional)" },
        phone: { type: "string", description: "Nuevo teléfono (opcional)" },
        status: { type: "string", enum: ["activo", "inactivo"], description: "Nuevo estado (opcional)" }
      },
      required: ["employee_id"]
    }
  }
];

const VALID_EPP_CATEGORIES = ["cabeza", "manos", "pies", "ocular", "auditivo", "respiratorio", "altura", "cuerpo", "otro"];

function normalizeEppCategory(raw: string): string {
  const n = (raw || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (n.includes("cabeza") || n.includes("casco") || n.includes("crane")) return "cabeza";
  if (n.includes("mano") || n.includes("guante")) return "manos";
  if (n.includes("pie") || n.includes("bota") || n.includes("calzado")) return "pies";
  if (n.includes("visual") || n.includes("ocular") || n.includes("lente") || n.includes("antiparra")) return "ocular";
  if (n.includes("auditiv") || n.includes("oido") || n.includes("tapon")) return "auditivo";
  if (n.includes("respirat") || n.includes("barbijo") || n.includes("mascara")) return "respiratorio";
  if (n.includes("arnes") || n.includes("altura") || n.includes("cabo")) return "altura";
  if (n.includes("cuerpo") || n.includes("ropa")) return "cuerpo";
  if (VALID_EPP_CATEGORIES.includes(n)) return n;
  return "otro";
}

function sanitizeAnthropicMessages(chatMessages: Array<{ role: string; content: string }>) {
  const result: Array<{ role: string; content: string }> = [];
  for (const m of chatMessages) {
    const role = m.role === "assistant" ? "assistant" : "user";
    const content = String(m.content || "").trim();
    if (!content) continue;
    if (result.length > 0 && result[result.length - 1].role === role) {
      result[result.length - 1].content += `\n\n${content}`;
    } else {
      result.push({ role, content });
    }
  }
  if (result.length === 0) {
    result.push({ role: "user", content: "Hola" });
  }
  if (result[0].role !== "user") {
    result.unshift({ role: "user", content: "(contexto previo)" });
  }
  return result;
}

async function executeTool(
  toolName: string,
  args: Record<string, any>,
  supabaseClient: any,
  companyId: string,
  supervisorId: string
): Promise<string> {
  try {
    switch (toolName) {
      case "quick_epp_delivery": {
        const { employee_id, epp_item_ids, quantities = [], notes = "" } = args;

        const results = [];
        for (let idx = 0; idx < epp_item_ids.length; idx++) {
          const eppId = epp_item_ids[idx];
          const qty = Number(quantities[idx]) || 1;

          // 1. Check stock and EPP details
          const { data: epp } = await supabaseClient
            .from("epp_items")
            .select("id, name, stock")
            .eq("id", eppId)
            .eq("company_id", companyId)
            .single();

          if (!epp) {
            results.push({ error: `EPP con ID ${eppId} no encontrado.` });
            continue;
          }

          // 2. Insert EPP delivery record (pending signature)
          const { data: delivery, error } = await supabaseClient
            .from("epp_deliveries")
            .insert({
              company_id: companyId,
              employee_id,
              epp_item_id: eppId,
              quantity: qty,
              supervisor_id: supervisorId,
              status: "pendiente",
              notes: notes || `Entregado por comando de voz/IA`
            })
            .select("id, epp_items(name)")
            .single();

          if (error) {
            results.push({ error: `Error al registrar entrega de ${epp.name}: ${error.message}` });
          } else {
            // 3. Discount from stock
            const newStock = Math.max(0, epp.stock - qty);
            await supabaseClient
              .from("epp_items")
              .update({ stock: newStock })
              .eq("id", eppId);

            results.push({ success: true, deliveryId: delivery.id, name: epp.name, qty });
          }
        }

        return JSON.stringify({ success: true, deliveries: results });
      }

      case "add_employee": {
        const { name, dni_cuil, job_title = "", file_number = "" } = args;

        const { data: emp, error } = await supabaseClient
          .from("employees")
          .insert({
            company_id: companyId,
            name,
            dni_cuil,
            job_title: job_title || "General",
            file_number: file_number || null,
            status: "activo"
          })
          .select("id, name")
          .single();

        if (error) return JSON.stringify({ error: `No se pudo crear el operario: ${error.message}` });
        return JSON.stringify({ success: true, message: `Operario ${emp.name} creado correctamente con ID ${emp.id}` });
      }

      case "add_epp_item": {
        const { name, category, stock = 0, brand = "", type_model = "" } = args;
        const safeCategory = normalizeEppCategory(category || name || "");

        const { data: item, error } = await supabaseClient
          .from("epp_items")
          .insert({
            company_id: companyId,
            name,
            category: safeCategory,
            stock,
            brand: brand || null,
            type_model: type_model || null,
            certified: "Si",
            description: "Registrado por comando del Asistente IA"
          })
          .select("id, name")
          .single();

        if (error) return JSON.stringify({ error: `No se pudo crear el elemento EPP: ${error.message}` });
        return JSON.stringify({ success: true, message: `EPP ${item.name} catalogado correctamente en stock con ID ${item.id}` });
      }

      case "update_employee": {
        const { employee_id, dni_cuil, job_title, file_number, phone, status } = args;
        const updates: Record<string, any> = {};
        if (dni_cuil !== undefined) updates.dni_cuil = dni_cuil;
        if (job_title !== undefined) updates.job_title = job_title;
        if (file_number !== undefined) updates.file_number = file_number;
        if (phone !== undefined) updates.phone = phone;
        if (status !== undefined) updates.status = status;

        const { data: emp, error } = await supabaseClient
          .from("employees")
          .update(updates)
          .eq("id", employee_id)
          .select("id, name")
          .single();

        if (error) return JSON.stringify({ error: `No se pudo actualizar el operario: ${error.message}` });
        return JSON.stringify({ success: true, message: `Operario ${emp.name} actualizado correctamente` });
      }

      default:
        return JSON.stringify({ error: `Herramienta desconocida: ${toolName}` });
    }
  } catch (e) {
    console.error(`Tool ${toolName} error:`, e);
    return JSON.stringify({ error: e instanceof Error ? e.message : "Error ejecutando acción" });
  }
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

    const supervisorId = userData.user.id;

    // 1. Get supervisor's company
    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("company_id")
      .eq("id", supervisorId)
      .single();

    if (profileError || !profile?.company_id) {
      return new Response(
        JSON.stringify({ error: "El usuario no tiene una empresa asociada" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const companyId = profile.company_id;

    // 2. Fetch context: Employees and EPP Catalog
    const { data: employees } = await supabaseClient
      .from("employees")
      .select("id, name, dni_cuil, job_title")
      .eq("company_id", companyId)
      .eq("status", "activo");

    const { data: eppItems } = await supabaseClient
      .from("epp_items")
      .select("id, name, category, stock")
      .eq("company_id", companyId);

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not configured");

    const today = new Date().toISOString().split("T")[0];

    const systemPrompt = `Sos el asistente inteligente de Sentinel EPP, un sistema móvil y web para registrar entregas de Elementos de Protección Personal (EPP) y ropa de trabajo en obras.
NO sos un chatbot informativo. Tu función es interpretar comandos de voz/texto y EJECUTAR acciones para registrar entregas de EPP o dar de alta trabajadores en obra de manera inmediata.

Fecha de hoy: ${today}

OPERARIOS REGISTRADOS EN LA OBRA:
${JSON.stringify(employees || [], null, 2)}

CATÁLOGO DE EPP DISPONIBLES EN STOCK:
${JSON.stringify(eppItems || [], null, 2)}

REGLAS DE OPERACIÓN:
1. Si el supervisor te dice algo como "Entregado casco a Marcelo Ifran hoy", buscá el operario "Marcelo Ifran" (hacé fuzzy match de su nombre si no coincide exacto) y buscá el EPP más parecido a "casco" en el catálogo. Si los encontrás, ejecutá la herramienta "quick_epp_delivery".
2. Si el supervisor menciona un operario que NO existe, decí claramente que el operario no está en la base de datos de la obra. Si tenés el DNI y el nombre, sugerí crearlo. Si el usuario te lo pide, ejecutá "add_employee".
3. Si el supervisor te pide entregar un EPP que NO está en el catálogo, avísale que el elemento no está catalogado.
4. Sé directo, breve y confirmá lo que hiciste usando emojis de seguridad. Ej: "✅ Listo, registré la entrega de 1 Casco para Marcelo Ifran. Queda pendiente la firma."
5. NO expliques las herramientas técnicas. Hacé la llamada a la herramienta silenciosamente y confirmá el resultado al supervisor de manera amigable.`;

    const anthropicMessages: Array<{ role: string; content: unknown }> = sanitizeAnthropicMessages(chatMessages);

    let finalContent = "";

    for (let i = 0; i < 5; i++) {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-5",
          max_tokens: 1024,
          system: systemPrompt,
          messages: anthropicMessages,
          tools: anthropicTools,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Anthropic API error:", response.status, errorText);
        let detail = "Error de red con el asistente de IA (Claude)";
        try {
          const parsed = JSON.parse(errorText);
          detail = parsed?.error?.message || detail;
        } catch {
          /* ignore */
        }
        throw new Error(detail);
      }

      const aiResponse = await response.json();

      if (aiResponse.stop_reason === "tool_use") {
        const toolUseBlocks = (aiResponse.content || []).filter(
          (block: { type: string }) => block.type === "tool_use"
        );

        if (toolUseBlocks.length > 0) {
          const toolCall = toolUseBlocks[0];
          const toolName = toolCall.name;
          const args = toolCall.input;

          let responseText = "";
          if (toolName === "quick_epp_delivery") {
            const emp = employees?.find((e: any) => e.id === args.employee_id);
            const empName = emp ? emp.name : "Operario desconocido";
            
            responseText = `📋 **Confirmar entrega de EPP**\n\n¿Confirmás el registro de esta entrega?\n\n`;
            const itemsList = [];
            const eppIds = args.epp_item_ids || [];
            const quantities = args.quantities || [];
            for (let idx = 0; idx < eppIds.length; idx++) {
              const eppId = eppIds[idx];
              const qty = quantities[idx] || 1;
              const epp = eppItems?.find((item: any) => item.id === eppId);
              const eppName = epp ? epp.name : "EPP desconocido";
              itemsList.push(`* **${qty}x ${eppName}** para **${empName}**`);
            }
            responseText += itemsList.join("\n");
          } else if (toolName === "add_employee") {
            responseText = `👤 **Confirmar alta de operario**\n\n¿Confirmás que querés crear el siguiente operario?\n\n* **Nombre:** ${args.name}\n* **DNI/CUIL:** ${args.dni_cuil}\n* **Puesto:** ${args.job_title || "General"}`;
          } else if (toolName === "add_epp_item") {
            const categoryLabel = {
              cabeza: "Protección Craneana (Cascos)",
              manos: "Protección de Manos (Guantes)",
              pies: "Protección de Pies (Calzado)",
              ocular: "Protección Ocular (Anteojos)",
              auditivo: "Protección Auditiva (Tapones/Copas)",
              respiratorio: "Protección Respiratoria (Semimáscaras)",
              altura: "Trabajo en Altura (Arneses)",
              cuerpo: "Ropa de Trabajo / Cuerpo",
              otro: "Otros"
            }[normalizeEppCategory(args.category)] || "Otros";

            responseText = `📦 **Confirmar nuevo EPP en catálogo**\n\n¿Confirmás el registro de este elemento?\n\n* **Nombre:** ${args.name}\n* **Categoría:** ${categoryLabel}\n* **Stock inicial:** ${args.stock || 0}\n* **Marca:** ${args.brand || "-"}\n* **Modelo:** ${args.type_model || "-"}`;
          } else if (toolName === "update_employee") {
            const emp = employees?.find((e: any) => e.id === args.employee_id);
            const empName = emp ? emp.name : "Operario";
            const changes = [];
            if (args.dni_cuil) changes.push(`* **DNI/CUIL:** ${args.dni_cuil}`);
            if (args.job_title) changes.push(`* **Puesto:** ${args.job_title}`);
            if (args.file_number) changes.push(`* **Legajo:** ${args.file_number}`);
            if (args.phone) changes.push(`* **Teléfono:** ${args.phone}`);
            if (args.status) changes.push(`* **Estado:** ${args.status}`);
            
            responseText = `👤 **Confirmar actualización de operario**\n\n¿Confirmás actualizar los datos de **${empName}**?\n\n${changes.join("\n")}`;
          } else {
            responseText = `⚠️ Acción detectada: **${toolName}**. ¿Confirmás realizar esta acción?`;
          }

          return new Response(
            JSON.stringify({
              response: responseText,
              pendingAction: {
                type: toolName,
                args: args
              }
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      const textBlock = (aiResponse.content || []).find(
        (block: { type: string }) => block.type === "text"
      );
      finalContent = textBlock?.text || "No pude procesar tu dictado.";
      break;
    }

    if (!finalContent) {
      throw new Error("No se obtuvo respuesta del asistente de IA");
    }

    return new Response(
      JSON.stringify({ response: finalContent }),
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
