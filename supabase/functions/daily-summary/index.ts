import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ObligationWithProfile {
  id: string;
  name: string;
  due_date: string;
  status: string;
  responsible_id: string;
  created_by: string;
  responsible_name?: string;
}

function getDaysUntilDue(dueDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function generateSummaryHtml(
  userName: string,
  overdue: ObligationWithProfile[],
  dueToday: ObligationWithProfile[],
  dueThisWeek: ObligationWithProfile[],
  upcoming: ObligationWithProfile[],
  appUrl: string
): string {
  const renderSection = (
    title: string,
    emoji: string,
    color: string,
    items: ObligationWithProfile[]
  ) => {
    if (items.length === 0) return "";
    const rows = items
      .map((o) => {
        const days = getDaysUntilDue(o.due_date);
        const dateStr = new Date(o.due_date).toLocaleDateString("es-ES", {
          day: "numeric",
          month: "short",
        });
        const daysLabel =
          days < 0
            ? `hace ${Math.abs(days)}d`
            : days === 0
            ? "HOY"
            : `en ${days}d`;
        return `
          <tr>
            <td style="padding: 10px 12px; border-bottom: 1px solid #f0f0f0; font-size: 14px;">
              <strong>${o.name}</strong>
              ${o.responsible_name ? `<br><span style="color: #9ca3af; font-size: 12px;">${o.responsible_name}</span>` : ""}
            </td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #f0f0f0; font-size: 13px; color: #6b7280; text-align: right; white-space: nowrap;">
              ${dateStr}
            </td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #f0f0f0; font-size: 12px; color: ${color}; font-weight: 600; text-align: right; white-space: nowrap;">
              ${daysLabel}
            </td>
          </tr>`;
      })
      .join("");

    return `
      <div style="margin-bottom: 24px;">
        <h2 style="font-size: 16px; color: ${color}; margin: 0 0 8px 0;">${emoji} ${title} (${items.length})</h2>
        <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
          ${rows}
        </table>
      </div>`;
  };

  const sections = [
    renderSection("Vencidas", "🔴", "#dc2626", overdue),
    renderSection("Vencen hoy", "🟡", "#f59e0b", dueToday),
    renderSection("Vencen esta semana", "🟠", "#ea580c", dueThisWeek),
    renderSection("Próximas", "🟢", "#10b981", upcoming),
  ].join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto;">
    <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 24px 30px; border-radius: 12px 12px 0 0; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 22px;">📋 Tu resumen diario</h1>
      <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px;">
        ${new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
      </p>
    </div>
    <div style="background: #fafafa; padding: 24px 30px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
      <p style="font-size: 15px; margin: 0 0 20px;">Hola <strong>${userName}</strong>, este es tu resumen de obligaciones:</p>
      ${sections}
      <div style="text-align: center; margin-top: 28px;">
        <a href="${appUrl}/dashboard" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
          Ver todo en IfsinRem →
        </a>
      </div>
    </div>
    <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 16px;">
      Email automático de IfsinRem · No responder
    </p>
  </div>
</body>
</html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") || "IfsinRem <onboarding@resend.dev>";

    if (!RESEND_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing required environment variables");
    }

    const resend = new Resend(RESEND_API_KEY);
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get all admin users (they own the obligations)
    const { data: adminRoles, error: rolesError } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    if (rolesError) throw new Error(`Error fetching admin roles: ${rolesError.message}`);

    const results = { sent: 0, skipped: 0, errors: [] as string[] };
    const APP_URL = "https://ifsin-rem.lovable.app";

    for (const adminRole of adminRoles || []) {
      const userId = adminRole.user_id;

      // Get user profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, email, name")
        .eq("id", userId)
        .single();

      if (!profile) continue;

      // Get obligations created by this user
      const { data: obligations } = await supabase
        .from("obligations")
        .select("id, name, due_date, status, responsible_id, created_by")
        .eq("created_by", userId)
        .order("due_date", { ascending: true });

      if (!obligations || obligations.length === 0) {
        results.skipped++;
        continue;
      }

      // Get responsible names
      const responsibleIds = [...new Set(obligations.map((o) => o.responsible_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name")
        .in("id", responsibleIds);
      const profileMap = new Map((profiles || []).map((p) => [p.id, p.name]));

      const enriched: ObligationWithProfile[] = obligations.map((o) => ({
        ...o,
        responsible_name: profileMap.get(o.responsible_id) || undefined,
      }));

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const overdue = enriched.filter((o) => getDaysUntilDue(o.due_date) < 0);
      const dueToday = enriched.filter((o) => getDaysUntilDue(o.due_date) === 0);
      const dueThisWeek = enriched.filter((o) => {
        const d = getDaysUntilDue(o.due_date);
        return d >= 1 && d <= 7;
      });
      const upcoming = enriched.filter((o) => {
        const d = getDaysUntilDue(o.due_date);
        return d > 7 && d <= 30;
      });

      // Only send if there's something relevant
      if (overdue.length === 0 && dueToday.length === 0 && dueThisWeek.length === 0 && upcoming.length === 0) {
        results.skipped++;
        continue;
      }

      const subject =
        overdue.length > 0
          ? `🔴 ${overdue.length} obligación${overdue.length > 1 ? "es" : ""} vencida${overdue.length > 1 ? "s" : ""} — Resumen diario`
          : dueToday.length > 0
          ? `🟡 ${dueToday.length} obligación${dueToday.length > 1 ? "es" : ""} vence${dueToday.length > 1 ? "n" : ""} hoy — Resumen diario`
          : `📋 Resumen diario de obligaciones`;

      const html = generateSummaryHtml(
        profile.name,
        overdue,
        dueToday,
        dueThisWeek,
        upcoming,
        APP_URL
      );

      try {
        const { error: sendError } = await resend.emails.send({
          from: FROM_EMAIL,
          to: [profile.email],
          subject,
          html,
        });

        if (sendError) {
          results.errors.push(`Failed to send to ${profile.email}: ${sendError.message}`);
        } else {
          results.sent++;
          console.log(`✅ Daily summary sent to ${profile.email}`);
        }
      } catch (err) {
        results.errors.push(`Exception sending to ${profile.email}: ${err instanceof Error ? err.message : "Unknown"}`);
      }
    }

    console.log("Daily summary results:", results);

    return new Response(
      JSON.stringify({ success: true, results }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error) {
    console.error("Error in daily-summary:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
