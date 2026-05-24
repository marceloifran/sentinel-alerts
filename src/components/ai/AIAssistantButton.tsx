import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Mic, Send, Loader2, Sparkles, Zap, AudioLines, Volume2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const extractEmployeeFromText = (text: string) => {
  let name = "";
  let dni = "";
  let jobTitle = "General";

  const dniFormatted = text.match(/\b\d{2}-\d{8}-\d\b/);
  if (dniFormatted) {
    dni = dniFormatted[0];
  } else {
    const dniAfterLabel = text.match(/(?:dni|cuil|cuit)\s*:?\s*([\d][\d\s.-]{5,18}[\d])/i);
    if (dniAfterLabel) {
      dni = dniAfterLabel[1].replace(/[\s.]+/g, "");
    }
  }

  const namePatterns = [
    /(?:nuevo\s+)?(?:operario|trabajador)\s+llamado\s+([a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+?)(?=\s+(?:con\s+)?(?:dni|cuil|cuit)|\s+puesto|\s+cargo|$)/i,
    /(?:registrar|crear)\s+(?:operario|trabajador)\s+([a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+?)(?=\s+(?:con\s+)?(?:dni|cuil|cuit)|\s+puesto|\s+cargo|$)/i,
    /(?:nuevo\s+)?(?:operario|trabajador)\s+([a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+?)(?=\s+(?:con\s+)?(?:dni|cuil|cuit)|\s+puesto|\s+cargo|$)/i,
    /(?:dar\s+de\s+alta|alta)\s+(?:a\s+)?([a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+?)(?=\s+(?:con\s+)?(?:dni|cuil|cuit)|$)/i,
  ];

  for (const re of namePatterns) {
    const m = text.match(re);
    if (m?.[1]) {
      const candidate = m[1].trim().replace(/\b(de|la|el|un|una|llamado|llamada)\b/gi, "").trim();
      if (candidate.length >= 2) {
        name = candidate;
        break;
      }
    }
  }

  name = name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");

  const jobMatch = text.match(/(?:puesto|cargo|como)\s+([a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+?)(?=\s+(?:con\s+)?(?:dni|cuil)|$)/i);
  if (jobMatch?.[1]) {
    const cleanJob = jobMatch[1].trim();
    if (cleanJob.length > 0 && cleanJob.length < 40) {
      jobTitle = cleanJob.charAt(0).toUpperCase() + cleanJob.slice(1);
    }
  }

  return { name, dni, jobTitle };
};

const isEmployeeIntent = (normalized: string) =>
  normalized.includes("crear operario") ||
  normalized.includes("registrar operario") ||
  normalized.includes("dar de alta") ||
  normalized.includes("nuevo operario") ||
  normalized.includes("nuevo trabajador");

export function AIAssistantButton() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    type: string;
    args: any;
  } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Context lists for client-side fallback parsing
  const [employees, setEmployees] = useState<any[]>([]);
  const [eppItems, setEppItems] = useState<any[]>([]);

  // Web Speech API Recognition Reference
  const recognitionRef = useRef<any>(null);
  const shouldKeepListeningRef = useRef(false);
  const transcriptBaseRef = useRef("");

  const loadContextData = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return;

      const { data: userProfile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", currentUser.id)
        .single();

      if (!userProfile?.company_id) return;

      const [empRes, eppRes] = await Promise.all([
        supabase.from("employees").select("id, name, dni_cuil, job_title").eq("company_id", userProfile.company_id).eq("status", "activo"),
        supabase.from("epp_items").select("id, name, stock, category").eq("company_id", userProfile.company_id),
      ]);

      if (empRes.data) setEmployees(empRes.data);
      if (eppRes.data) setEppItems(eppRes.data);
    } catch (e) {
      console.error("Error loading voice assistant context:", e);
    }
  };

  useEffect(() => {
    if (open) {
      loadContextData();
    }
  }, [open]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "es-AR";

      rec.onstart = () => {
        setIsRecording(true);
        toast.info("Micrófono activo. Hablá todo lo que necesites y pulsá Finalizar dictado.");
      };

      rec.onresult = (event: any) => {
        let interim = "";
        let finalChunk = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const part = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalChunk += part;
          } else {
            interim += part;
          }
        }
        if (finalChunk) {
          transcriptBaseRef.current += finalChunk;
        }
        setInput(transcriptBaseRef.current + interim);
      };

      rec.onerror = (event: any) => {
        if (event.error === "aborted") {
          return;
        }
        console.error("Speech recognition error:", event.error);
        if (event.error === "no-speech" && shouldKeepListeningRef.current) {
          try {
            rec.start();
          } catch (e) {
            console.error(e);
          }
          return;
        }
        if (event.error === "not-allowed") {
          toast.error("Permiso de micrófono denegado.");
        } else if (shouldKeepListeningRef.current) {
          toast.error("Error de reconocimiento de voz.");
        }
        shouldKeepListeningRef.current = false;
        setIsRecording(false);
      };

      rec.onend = () => {
        if (shouldKeepListeningRef.current) {
          try {
            rec.start();
          } catch (e) {
            console.error(e);
          }
          return;
        }
        setIsRecording(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  useEffect(() => {
    if (!open && recognitionRef.current && shouldKeepListeningRef.current) {
      shouldKeepListeningRef.current = false;
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  }, [open]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const sendToAgent = async (allMessages: Message[]) => {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.access_token) {
      toast.error("Debes iniciar sesión");
      return null;
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.session.access_token}`,
        },
        body: JSON.stringify({
          messages: allMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Error al procesar dictado");
    }

    return response.json();
  };

  const parseCommandLocally = async (
    text: string,
    empList: any[],
    eppList: any[],
    companyId: string,
    supervisorId: string
  ): Promise<{ success: boolean; response: string; pendingAction?: any }> => {
    const normalized = text.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, ""); // remove accents

    // 1. ADD EMPLOYEE PATTERN
    if (isEmployeeIntent(normalized)) {
      const { name, dni, jobTitle } = extractEmployeeFromText(text);

      if (!name || !dni) {
        return {
          success: false,
          response: `⚠️ Detecté un alta de operario pero me faltan datos.\n\n**Nombre detectado:** ${name || "—"}\n**DNI detectado:** ${dni || "—"}\n\nEjemplo: *"Nuevo operario llamado Pedro Martínez DNI 26676602 puesto Soldador"*`
        };
      }

      return {
        success: true,
        response: `👤 **Confirmar alta de operario**\n\n¿Confirmás que querés crear el siguiente operario?\n\n* **Nombre:** ${name}\n* **DNI/CUIL:** ${dni}\n* **Puesto:** ${jobTitle}`,
        pendingAction: {
          type: "add_employee",
          args: { name, dni_cuil: dni, job_title: jobTitle }
        }
      };
    }

    // 3. CREATE EPP ITEM PATTERN
    const isCreateEpp = normalized.includes("crear epp") || 
                        normalized.includes("registrar epp") || 
                        normalized.includes("agregar epp") || 
                        normalized.includes("nuevo epp") ||
                        normalized.includes("crear elemento") ||
                        normalized.includes("registrar elemento") ||
                        normalized.includes("agregar elemento");

    if (isCreateEpp) {
      // Extract stock
      let stock = 10; // Default stock
      const stockMatch = text.match(/(?:stock|cantidad|unidades)(?:\s+de)?\s+(\d+)/i) || text.match(/\b(\d{1,4})\s*$/);
      if (stockMatch) {
        stock = parseInt(stockMatch[1] || stockMatch[0], 10);
      }

      // Extract category
      let category = "otro";
      const catKeywords: Record<string, string[]> = {
        cabeza: ["casco", "cabeza", "craneo", "gorra"],
        manos: ["guante", "mano", "nitrilo", "latex", "cuero"],
        pies: ["bota", "zapato", "pie", "calzado", "borcegu"],
        ocular: ["antiparra", "lente", "anteojo", "ojo", "visual", "goggles"],
        auditivo: ["protector auditivo", "tapon", "copa", "oido", "auricular", "sordera"],
        respiratorio: ["barbijo", "mascara", "semimascara", "respirador", "filtro"],
        altura: ["arnes", "cabo", "vida", "linea", "altura", "caida", "mosqueton"],
        cuerpo: ["ropa", "camisa", "pantalon", "chaleco", "mameluco", "faja"]
      };

      for (const [catName, words] of Object.entries(catKeywords)) {
        if (words.some(w => normalized.includes(w))) {
          category = catName;
          break;
        }
      }

      // Extract Brand
      let brand = "";
      const brandMatch = text.match(/(?:marca)\s+([a-z0-9]+)/i);
      if (brandMatch) {
        brand = brandMatch[1].trim().toUpperCase();
      }

      // Extract Model
      let typeModel = "";
      const modelMatch = text.match(/(?:modelo)\s+([a-z0-9\s]+?)(?:\s+stock|\s+cantidad|\s+marca|$)/i);
      if (modelMatch) {
        typeModel = modelMatch[1].trim();
      }

      // Extract Name
      let name = "";
      const nameRegex = /(?:epp|elemento|nuevo epp|agregar epp|crear epp)\s+([a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s]+?)(?:\s+(?:con\s+)?stock|\s+marca|\s+modelo|\s+cantidad|$)/i;
      const nameMatch = text.match(nameRegex);
      if (nameMatch && nameMatch[1]) {
        name = nameMatch[1].trim();
        name = name.charAt(0).toUpperCase() + name.slice(1);
      }

      if (!name) {
        return {
          success: false,
          response: `⚠️ Detecté un comando para catalogar un EPP, pero no logré identificar el Nombre del elemento. Por favor, decime algo como: "Crear EPP Casco de seguridad marca 3M con stock de 50"`
        };
      }

      const categoryLabel = {
        cabeza: "Protección Craneana (Cascos)",
        manos: "Protección de Manos (Guantes)",
        pies: "Protección de Pies (Calzado)",
        ocular: "Protección Ocular (Anteojos)",
        auditivo: "Protección Auditiva (Tapones/Copas)",
        respiratorio: "Protección Respiratoria (Semimáscaras)",
        altura: "Trabajo en Altura (Arneses)",
        cuerpo: "Ropa de Trabajo / Cuerpo",
        otro: "Otros Elementos / Herramientas"
      }[category] || "Otros";

      return {
        success: true,
        response: `📦 **Confirmar nuevo EPP en catálogo**\n\n¿Confirmás el registro de este elemento?\n\n* **Nombre:** ${name}\n* **Categoría:** ${categoryLabel}\n* **Stock Inicial:** ${stock} unidades\n* **Marca:** ${brand || "-"}\n* **Modelo:** ${typeModel || "-"}`,
        pendingAction: {
          type: "add_epp_item",
          args: { name, category, stock, brand, type_model: typeModel }
        }
      };
    }

    // 2. QUICK EPP DELIVERY PATTERN
    // Find employee candidate
    let foundEmployee: any = null;
    for (const emp of empList) {
      const empNameNorm = emp.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (normalized.includes(empNameNorm)) {
        foundEmployee = emp;
        break;
      }
    }

    // If not exact match, try matching single names
    if (!foundEmployee) {
      for (const emp of empList) {
        const firstName = emp.name.split(" ")[0].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        if (firstName.length > 2 && normalized.includes(firstName)) {
          foundEmployee = emp;
          break;
        }
      }
    }

    // Find EPP candidate
    let foundEpp: any = null;
    for (const item of eppList) {
      const itemNameNorm = item.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (normalized.includes(itemNameNorm)) {
        foundEpp = item;
        break;
      }
    }

    // If not exact match, check for keywords
    if (!foundEpp) {
      const keywords = ["casco", "guante", "bota", "antiparra", "lente", "arnes", "protector", "barbijo", "mascara", "chaleco", "camisa", "pantalon"];
      for (const kw of keywords) {
        if (normalized.includes(kw)) {
          foundEpp = eppList.find(item => 
            item.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(kw)
          );
          if (foundEpp) break;
        }
      }
    }

    // Extract Quantity
    let quantity = 1;
    const numMatch = normalized.match(/\b\d+\b/);
    if (numMatch) {
      quantity = parseInt(numMatch[0], 10);
    }

    if (foundEmployee && foundEpp) {
      return {
        success: true,
        response: `📋 **Confirmar entrega de EPP**\n\n¿Confirmás el registro de esta entrega?\n\n* **${quantity}x ${foundEpp.name}** para **${foundEmployee.name}**`,
        pendingAction: {
          type: "quick_epp_delivery",
          args: {
            employee_id: foundEmployee.id,
            epp_item_ids: [foundEpp.id],
            quantities: [quantity],
            notes: `Entregado por comando de voz/IA (Local)`
          }
        }
      };
    }

    if (foundEmployee && !foundEpp) {
      return {
        success: false,
        response: `🔍 Identifiqué al operario **${foundEmployee.name}**, pero no encontré qué elemento EPP del catálogo le querés entregar. Por favor decime algo como: "Entregar casco a ${foundEmployee.name}".`
      };
    }

    if (!foundEmployee && foundEpp) {
      return {
        success: false,
        response: `🔍 Identifiqué el elemento **${foundEpp.name}**, pero no encontré a qué operario se lo entregaste. Por favor decime algo como: "Entregar ${foundEpp.name} a [Nombre del Operario]".`
      };
    }

    return {
      success: false,
      response: `🎙️ **Asistente de EPP Activo**\n\nNo logré entender el comando. Podés dictar:\n- *"Entregar casco amarillo a Marcelo Ifran"* \n- *"Registrar operario Carlos Gómez DNI 20-30440550-9 puesto Soldador"* \n- *"Crear EPP Casco de seguridad marca 3M con stock de 50"*`
    };
  };

  const executePendingAction = async (actionToExecute?: { type: string; args: any }) => {
    const action = actionToExecute || pendingAction;
    if (!action) return;
    setIsLoading(true);
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error("No se pudo identificar la sesión activa.");

      const { data: userProfile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", currentUser.id)
        .single();

      if (!userProfile?.company_id) throw new Error("No se pudo identificar tu empresa.");
      const companyId = userProfile.company_id;

      if (action.type === "add_employee") {
        const { name, dni_cuil, job_title } = action.args;
        const { data: emp, error } = await supabase
          .from("employees")
          .insert({
            company_id: companyId,
            name,
            dni_cuil,
            job_title: job_title || "General",
            status: "activo"
          })
          .select("id, name")
          .single();

        if (error) throw new Error(`Error al crear el operario: ${error.message}`);

        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `👥 **Operario registrado con éxito**\n\nSe dio de alta a **${emp.name}** (DNI: ${dni_cuil}) con el puesto de **${job_title || "General"}**.`
          }
        ]);
      } else if (action.type === "add_epp_item") {
        const { name, category, stock, brand, type_model } = action.args;
        const { data: item, error } = await supabase
          .from("epp_items")
          .insert({
            company_id: companyId,
            name,
            description: `Creado automáticamente por asistente de voz IA`,
            category,
            stock: stock || 0,
            brand: brand || null,
            type_model: type_model || null,
            certified: "Si"
          })
          .select("id, name")
          .single();

        if (error) throw new Error(`Error al registrar el elemento EPP: ${error.message}`);

        const categoryLabel = {
          cabeza: "Protección Craneana (Cascos)",
          manos: "Protección de Manos (Guantes)",
          pies: "Protección de Pies (Calzado)",
          ocular: "Protección Ocular (Anteojos)",
          auditivo: "Protección Auditiva (Tapones/Copas)",
          respiratorio: "Protección Respiratoria (Semimáscaras)",
          altura: "Trabajo en Altura (Arneses)",
          cuerpo: "Ropa de Trabajo / Cuerpo",
          otro: "Otros Elementos / Herramientas"
        }[category] || "Otros";

        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `📦 **EPP Catalogado con Éxito**\n\nSe agregó **${item.name}** al catálogo de stock.\n\n* **Categoría**: ${categoryLabel}\n* **Stock Inicial**: ${stock || 0} unidades\n* **Marca**: ${brand || "-"}\n* **Modelo**: ${type_model || "-"}\n* **Certificación**: Aprobado por Normas de Seguridad.`
          }
        ]);
      } else if (action.type === "quick_epp_delivery") {
        const { employee_id, epp_item_ids, quantities = [], notes } = action.args;

        const results = [];
        for (let idx = 0; idx < epp_item_ids.length; idx++) {
          const eppId = epp_item_ids[idx];
          const qty = Number(quantities[idx]) || 1;

          const { data: epp } = await supabase
            .from("epp_items")
            .select("id, name, stock")
            .eq("id", eppId)
            .single();

          if (!epp) {
            results.push(`❌ EPP con ID ${eppId} no encontrado.`);
            continue;
          }

          const { error } = await supabase
            .from("epp_deliveries")
            .insert({
              company_id: companyId,
              employee_id,
              epp_item_id: eppId,
              quantity: qty,
              supervisor_id: currentUser.id,
              status: "pendiente",
              notes: notes || `Entregado por comando de voz/IA`
            });

          if (error) {
            results.push(`❌ Error al registrar entrega de ${epp.name}: ${error.message}`);
          } else {
            const newStock = Math.max(0, epp.stock - qty);
            await supabase
              .from("epp_items")
              .update({ stock: newStock })
              .eq("id", eppId);

            results.push(`✅ **${qty}x ${epp.name}** registrado con éxito (pendiente de firma).`);
          }
        }

        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `📋 **Resultado de la entrega:**\n\n${results.join("\n")}`
          }
        ]);
      }

      // Invalidate queries to refresh lists
      queryClient.invalidateQueries({ queryKey: ["epp-deliveries"] });
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["epp-items"] });
      window.dispatchEvent(new CustomEvent("epp-data-changed"));
      
      // Clear pending action
      setPendingAction(null);
    } catch (error) {
      console.error("Error executing pending action:", error);
      toast.error(error instanceof Error ? error.message : "Error al procesar la acción");
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `❌ Ocurrió un error al guardar los datos: ${error instanceof Error ? error.message : "Error desconocido"}` }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async (overrideInput?: string) => {
    const text = (overrideInput ?? input).trim();
    if (!text || isLoading) return;

    setInput("");
    const userMsg: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);

    if (pendingAction) {
      const normalized = text.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, ""); // remove accents

      const isConfirm = normalized === "si" || 
                         normalized === "sí" || 
                         normalized.includes("confirmar") || 
                         normalized.includes("dale") || 
                         normalized.includes("aceptar") || 
                         normalized.includes("guardar") || 
                         normalized.includes("ok") || 
                         normalized.includes("aprobar") ||
                         normalized.includes("correcto");
                         
      const isCancel = normalized === "no" || 
                        normalized.includes("cancelar") || 
                        normalized.includes("cancelá") || 
                        normalized.includes("rechazar") || 
                        normalized.includes("no quiero");

      if (isConfirm) {
        await executePendingAction();
      } else if (isCancel) {
        setPendingAction(null);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "❌ Operación cancelada. ¿En qué más te puedo ayudar?" }
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { 
            role: "assistant", 
            content: "⚠️ Tenés una acción pendiente de confirmación. Por favor, decime **sí** para confirmar o **no** para cancelar (o usá los botones)." 
          }
        ]);
      }
      return;
    }

    setIsLoading(true);

    try {
      const updatedMessages = [...messages, userMsg];
      let useLocalFallback = false;
      let aiUnavailable = false;
      let aiErrorMessage = "";
      let data = null;

      try {
        data = await sendToAgent(updatedMessages);
      } catch (err) {
        aiErrorMessage = err instanceof Error ? err.message : "Error desconocido";
        console.error("AI Assistant edge function failed, using local parser fallback:", err);
        aiUnavailable = true;
        useLocalFallback = true;
      }

      if (useLocalFallback) {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        const { data: userProfile } = await supabase
          .from("profiles")
          .select("company_id")
          .eq("id", currentUser?.id)
          .single();

        if (userProfile?.company_id && currentUser?.id) {
          const localResult = await parseCommandLocally(
            text,
            employees,
            eppItems,
            userProfile.company_id,
            currentUser.id
          );
          let responseText = localResult.response;
          if (aiUnavailable && !localResult.success && aiErrorMessage) {
            responseText += `\n\n_Detalle IA: ${aiErrorMessage}_`;
          }
          setMessages((prev) => [...prev, { role: "assistant", content: responseText }]);
          if (localResult.pendingAction) {
            setPendingAction(localResult.pendingAction);
          }
        } else {
          setMessages((prev) => [...prev, { role: "assistant", content: "No se pudo identificar tu empresa o sesión activa." }]);
        }
      } else if (data) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
        if (data.pendingAction) {
          setPendingAction(data.pendingAction);
        }
      }

      // Note: we don't invalidate queries here anymore, as database actions are deferred to confirmation stage.

    } catch (error) {
      console.error("AI Assistant error:", error);
      toast.error(error instanceof Error ? error.message : "Error al procesar con IA");
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Lo siento, ocurrió un error al registrar el EPP por voz." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleVoiceToggle = () => {
    if (!recognitionRef.current) {
      toast.error("Tu navegador no soporta reconocimiento de voz nativo. Simulando entrada...");
      handleSimulateVoice();
      return;
    }

    if (isRecording) {
      shouldKeepListeningRef.current = false;
      recognitionRef.current.stop();
      setIsRecording(false);
      if (transcriptBaseRef.current.trim()) {
        toast.success("Dictado finalizado");
      }
    } else {
      shouldKeepListeningRef.current = true;
      transcriptBaseRef.current = input;
      try {
        recognitionRef.current.start();
      } catch (e) {
        shouldKeepListeningRef.current = false;
        console.error(e);
      }
    }
  };

  const handleSimulateVoice = () => {
    setIsRecording(true);
    setTimeout(() => {
      setIsRecording(false);
      const simulatedPhrases = [
        "Entregar casco amarillo a Marcelo Ifran hoy",
        "Registrar botas de seguridad para Carlos Gómez por favor",
        "Dar de alta al operario Roberto Sánchez DNI 20-33445566-7 Oficial Soldador",
        "Asignar arnés de altura y cabo de vida a Sofía Rodríguez"
      ];
      const randomPhrase = simulatedPhrases[Math.floor(Math.random() * simulatedPhrases.length)];
      setInput(randomPhrase);
      toast.success("Voz simulada y transcripta con éxito");
    }, 2000);
  };

  const quickQuestions = [
    { label: "🎙️ Dictar: Casco para Marcelo", message: "Registrar entrega de Casco Amarillo para Marcelo Ifran hoy" },
    { label: "👥 Crear operario rápido", message: "Registrar operario Juan Pérez con DNI 20-87654321-9 y puesto Carpintero" },
    { label: "📋 Pendientes", message: "¿Qué operarios tienen firmas pendientes?" },
  ];

  const MarkdownComponents = {
    a: ({ href, children }: { href?: string; children?: React.ReactNode }) => {
      if (href?.startsWith("/operarios")) {
        return (
          <button
            onClick={() => {
              navigate("/operarios");
              setOpen(false);
            }}
            className="text-emerald-500 hover:underline font-bold"
          >
            {children}
          </button>
        );
      }
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" className="text-emerald-500 hover:underline font-bold">
          {children}
        </a>
      );
    },
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-xl z-50 bg-emerald-600 hover:bg-emerald-500 text-white border-0 shadow-emerald-600/20"
        size="icon"
      >
        <Mic className="w-6 h-6 animate-pulse" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md h-[550px] flex flex-col p-0 rounded-2xl overflow-hidden border-slate-800 bg-[#0a0d16]">
          <DialogHeader className="p-4 border-b border-slate-800 bg-[#080b11]">
            <DialogTitle className="flex items-center gap-2 text-white">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              Asistente de Voz ifsinrem
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full flex items-center gap-1 font-bold">
                <Zap className="w-3 h-3" /> IA + dictado
              </span>
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="space-y-6 py-6">
                <div className="text-center text-slate-400">
                  <div className="h-16 w-16 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Mic className="w-8 h-8 text-emerald-400" />
                  </div>
                  <p className="font-bold text-white text-base">¡Hola! Soy tu asistente de EPP.</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                    Dictame la entrega de EPP y la registraré automáticamente en el sistema.
                  </p>
                </div>

                {/* Speech recording controller box */}
                <div className="flex flex-col items-center justify-center p-4 border border-slate-800/80 bg-[#0d1222] rounded-2xl gap-3">
                  {isRecording ? (
                    <>
                      <AudioLines className="h-8 w-24 text-emerald-400 animate-pulse" />
                      <p className="text-[10px] text-slate-400 animate-pulse font-bold">ESCUCHANDO... PULSÁ FINALIZAR CUANDO TERMINES</p>
                    </>
                  ) : (
                    <>
                      <Volume2 className="h-6 w-6 text-slate-500" />
                      <p className="text-[10px] text-slate-500 font-bold">MICRÓFONO DESACTIVADO</p>
                    </>
                  )}
                  <Button
                    onClick={handleVoiceToggle}
                    className={`rounded-xl px-4 py-2 text-xs font-bold border-0 ${
                      isRecording 
                        ? "bg-rose-655 hover:bg-rose-500 text-white" 
                        : "bg-emerald-600 hover:bg-emerald-500 text-white"
                    }`}
                  >
                    {isRecording ? "Finalizar dictado" : "Iniciar dictado por voz"}
                  </Button>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-slate-500 text-center uppercase tracking-wider">Comandos rápidos</p>
                  <div className="flex flex-col gap-1.5">
                    {quickQuestions.map((q) => (
                      <button
                        key={q.label}
                        className="text-left text-xs bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl px-3 py-2.5 transition-colors"
                        onClick={() => handleSend(q.message)}
                      >
                        {q.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4 py-2">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                        msg.role === "user"
                          ? "bg-emerald-600 text-white font-medium"
                          : "bg-slate-900 border border-slate-800 text-slate-200 prose prose-sm dark:prose-invert max-w-none font-medium"
                      }`}
                    >
                      {msg.role === "assistant" ? (
                        <ReactMarkdown components={MarkdownComponents}>{msg.content}</ReactMarkdown>
                      ) : (
                        msg.content
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
                      <span className="text-xs text-slate-400 font-semibold">Procesando dictado...</span>
                    </div>
                  </div>
                )}
                {pendingAction && !isLoading && (
                  <div className="flex flex-col gap-2 p-3 bg-slate-900 border border-emerald-500/20 rounded-2xl animate-in fade-in slide-in-from-bottom duration-300">
                    <p className="text-xs text-slate-350 font-semibold text-center">
                      ¿Confirmás guardar esta información en el sistema?
                    </p>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => executePendingAction()}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 rounded-xl border-0 h-9"
                      >
                        Sí, confirmar
                      </Button>
                      <Button
                        onClick={() => {
                          setPendingAction(null);
                          setMessages((prev) => [
                            ...prev,
                            { role: "assistant", content: "❌ Operación cancelada. ¿En qué más te puedo ayudar?" }
                          ]);
                        }}
                        variant="outline"
                        className="flex-1 border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white font-bold text-xs py-2 rounded-xl h-9"
                      >
                        No, cancelar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          <div className="p-4 border-t border-slate-800 bg-[#080b11]">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Dictá o escribí: 'Casco para Carlos'..."
                disabled={isLoading}
                className="rounded-xl border-slate-850 bg-[#0f1425] text-white text-sm focus-visible:ring-emerald-500/25"
              />
              <Button 
                onClick={() => handleSend()} 
                disabled={isLoading || !input.trim()} 
                size="icon"
                className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl h-10 w-10 border-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
