import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ParsedObligation {
  name: string;
  category: "legal" | "fiscal" | "seguridad" | "operativa";
  due_date: string;
  recurrence: "none" | "monthly" | "annual";
  responsible_hint?: string;
  confidence: number;
  warnings: string[];
}

interface FileInput {
  name: string;
  type: string;
  base64: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, existingObligations, files } = await req.json();

    const hasText = text && typeof text === "string" && text.trim().length > 0;
    const hasFiles = files && Array.isArray(files) && files.length > 0;

    if (!hasText && !hasFiles) {
      return new Response(
        JSON.stringify({ error: "Se requiere texto o archivos para analizar" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const today = new Date().toISOString().split("T")[0];
    const existingNames = existingObligations?.map((o: { name: string }) => o.name.toLowerCase()) || [];

    const systemPrompt = `Eres un asistente especializado en identificar obligaciones legales, fiscales, de seguridad y operativas para empresas.

Tu tarea es analizar texto libre, archivos (PDF, imágenes) y audios, y extraer todas las obligaciones mencionadas con sus fechas y periodicidad.

Fecha actual: ${today}

Categorías disponibles:
- legal: Habilitaciones, permisos, registros legales, contratos
- fiscal: Impuestos, declaraciones, balances, AFIP
- seguridad: Seguros, ART, matafuegos, capacitaciones SST, elementos de seguridad
- operativa: Mantenimiento, renovaciones de equipos, licencias software

Obligaciones existentes del usuario (para detectar duplicados):
${existingNames.length > 0 ? existingNames.join(", ") : "Ninguna"}

Reglas:
1. Detecta TODAS las obligaciones mencionadas en el texto, archivos o audios.
2. Si se menciona una fecha específica, úsala en formato YYYY-MM-DD.
3. Si no hay fecha específica pero hay periodicidad, calcula la próxima fecha lógica.
4. Identifica la periodicidad: none (única), monthly (mensual), annual (anual).
5. Si se menciona un responsable o persona, inclúyelo en responsible_hint.
6. Añade warnings si:
   - La fecha ya pasó (quedará como vencida)
   - Es muy similar a una obligación existente (posible duplicado)
   - La fecha es muy lejana (>2 años)
   - La periodicidad parece inconsistente con el tipo de obligación
7. confidence: 0.0 a 1.0 basado en qué tan claro es el contenido (texto o audio).`;

    // Build user message content (text + images/PDFs)
    const userContent: Array<{ type: string; text?: string; image_url?: { url: string } }> = [];

    // Add text content if present
    if (hasText) {
      userContent.push({
        type: "text",
        text: `Analiza el siguiente texto y extrae las obligaciones:\n\n${text}`,
      });
    }

    // Add files (Images, PDFs, Audio)
    if (hasFiles) {
      const filesList = files as FileInput[];

      // Add a text description of what we're analyzing
      if (!hasText) {
        userContent.push({
          type: "text",
          text: `Analiza los siguientes ${filesList.length} archivo(s)/audios y extrae todas las obligaciones que encuentres (fechas, vencimientos, renovaciones, etc.):`,
        });
      } else {
        userContent.push({
          type: "text",
          text: `\n\nAdemás, analiza los siguientes ${filesList.length} archivo(s)/audios adjuntos:`,
        });
      }

      for (const file of filesList) {
        if (file.type.startsWith("audio/")) {
          userContent.push({
            type: "text",
            text: `[Audio: ${file.name}]`,
          });
          userContent.push({
            type: "image_url", // Most multimodal gateways use image_url for any data URL
            image_url: {
              url: `data:${file.type};base64,${file.base64}`,
            },
          });
        } else if (file.type === "application/pdf") {
          userContent.push({
            type: "text",
            text: `[Archivo PDF: ${file.name}]`,
          });
          userContent.push({
            type: "image_url",
            image_url: {
              url: `data:${file.type};base64,${file.base64}`,
            },
          });
        } else {
          // For images
          userContent.push({
            type: "image_url",
            image_url: {
              url: `data:${file.type};base64,${file.base64}`,
            },
          });
        }
      }
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_obligations",
              description: "Extrae las obligaciones detectadas del texto",
              parameters: {
                type: "object",
                properties: {
                  obligations: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string", description: "Nombre claro y conciso de la obligación" },
                        category: { type: "string", enum: ["legal", "fiscal", "seguridad", "operativa"] },
                        due_date: { type: "string", description: "Fecha en formato YYYY-MM-DD" },
                        recurrence: { type: "string", enum: ["none", "monthly", "annual"] },
                        responsible_hint: { type: "string", description: "Nombre del responsable si se menciona" },
                        confidence: { type: "number", description: "Confianza de 0 a 1" },
                        warnings: { type: "array", items: { type: "string" }, description: "Advertencias sobre esta obligación" },
                      },
                      required: ["name", "category", "due_date", "recurrence", "confidence", "warnings"],
                    },
                  },
                  summary: { type: "string", description: "Resumen breve del análisis" },
                },
                required: ["obligations", "summary"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_obligations" } },
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
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      return new Response(
        JSON.stringify({
          obligations: [],
          summary: "No se pudieron identificar obligaciones en el texto proporcionado"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = JSON.parse(toolCall.function.arguments);

    // Post-process: add additional validation warnings
    const processedObligations = result.obligations.map((obl: ParsedObligation) => {
      const warnings = [...obl.warnings];
      const dueDate = new Date(obl.due_date);
      const todayDate = new Date(today);

      // Check if date is in the past
      if (dueDate < todayDate && !warnings.some(w => w.includes("vencida"))) {
        warnings.push("⚠️ La fecha ya pasó, se creará como vencida");
      }

      // Check for very distant dates
      const twoYearsLater = new Date(todayDate);
      twoYearsLater.setFullYear(twoYearsLater.getFullYear() + 2);
      if (dueDate > twoYearsLater && !warnings.some(w => w.includes("lejana"))) {
        warnings.push("⚠️ Fecha muy lejana (más de 2 años)");
      }

      // Check for potential duplicates
      const nameLower = obl.name.toLowerCase();
      const isDuplicate = existingNames.some((existing: string) =>
        existing.includes(nameLower) || nameLower.includes(existing)
      );
      if (isDuplicate && !warnings.some(w => w.includes("duplicado"))) {
        warnings.push("⚠️ Posible duplicado de una obligación existente");
      }

      return { ...obl, warnings };
    });

    return new Response(
      JSON.stringify({
        obligations: processedObligations,
        summary: result.summary
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("parse-obligations error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Error desconocido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
