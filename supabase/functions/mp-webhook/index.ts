import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts";

// ── Plan mapping: MP preapproval_plan_id → internal plan name ──────────────
const PLAN_MAP: Record<string, string> = {
  "d0a0ad0a9e964920b60ccadb08cb1aaf": "starter",
  "48b0c8f4c0f94dff9c13789c88dd6721": "professional", // Pro
  "5680a06a5fb945d28a53399cf1cfd90f": "enterprise",   // Estudio
};

const PLAN_LIMITS: Record<string, { max_obligations: number; max_users: number }> = {
  starter:      { max_obligations: 3,   max_users: 1  },
  professional: { max_obligations: 10,  max_users: 5  },
  enterprise:   { max_obligations: -1,  max_users: -1 },
};

// ── Validate MP webhook signature ───────────────────────────────────────────
// Docs: https://www.mercadopago.com.ar/developers/es/docs/your-integrations/notifications/webhooks
function validateSignature(req: Request, rawBody: string): boolean {
  const secret = Deno.env.get("MP_WEBHOOK_SECRET");
  if (!secret) {
    console.warn("MP_WEBHOOK_SECRET not set — skipping signature validation");
    return true; // allow in development
  }

  const xSignature = req.headers.get("x-signature") ?? "";
  const xRequestId = req.headers.get("x-request-id") ?? "";

  // Parse ts and v1 from header: "ts=12345,v1=abc..."
  const parts = Object.fromEntries(
    xSignature.split(",").map((p) => p.split("=") as [string, string])
  );
  const ts = parts["ts"];
  const v1 = parts["v1"];
  if (!ts || !v1) return false;

  // MP signs: "id:{data.id};request-id:{x-request-id};ts:{ts}"
  // We need the data.id from body — parse it
  let dataId = "";
  try {
    const body = JSON.parse(rawBody);
    dataId = body?.data?.id ?? body?.id ?? "";
  } catch { /* ignore */ }

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts}`;
  const expected = createHmac("sha256", secret).update(manifest).digest("hex");

  return expected === v1;
}

// ── Supabase admin client ────────────────────────────────────────────────────
function getAdminClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// ── Fetch subscription from MP API ──────────────────────────────────────────
async function getMpSubscription(subscriptionId: string) {
  const token = Deno.env.get("MP_ACCESS_TOKEN")!;
  const res = await fetch(
    `https://api.mercadopago.com/preapproval/${subscriptionId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error(`MP API ${res.status}: ${await res.text()}`);
  return res.json();
}

// ── Fetch payment from MP API ────────────────────────────────────────────────
async function getMpPayment(paymentId: string) {
  const token = Deno.env.get("MP_ACCESS_TOKEN")!;
  const res = await fetch(
    `https://api.mercadopago.com/v1/payments/${paymentId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error(`MP API ${res.status}: ${await res.text()}`);
  return res.json();
}

// ── Activate / deactivate plan in Supabase ──────────────────────────────────
async function syncSubscription(subscriptionId: string, supabase: any) {
  const sub = await getMpSubscription(subscriptionId);
  console.log("MP sub:", JSON.stringify(sub));

  const { payer_email, preapproval_plan_id, status, next_payment_date } = sub;
  if (!payer_email) return { ok: false, reason: "no payer_email" };

  const isActive = status === "authorized";
  const planName = PLAN_MAP[preapproval_plan_id] ?? "professional";
  const limits = isActive ? (PLAN_LIMITS[planName] ?? PLAN_LIMITS.professional) : { max_obligations: 25, max_users: 10 };

  const { error } = await supabase
    .from("profiles")
    .update({
      plan: isActive ? planName : "professional",
      mp_subscription_id: subscriptionId,
      mp_preapproval_plan_id: preapproval_plan_id ?? null,
      plan_activated_at: isActive ? new Date().toISOString() : null,
      plan_expires_at: next_payment_date ?? null,
      max_obligations: limits.max_obligations,
      max_users: limits.max_users,
    })
    .eq("email", payer_email);

  if (error) {
    console.error("Supabase error:", error);
    return { ok: false, reason: error.message };
  }

  console.log(`✅ ${payer_email} → plan "${isActive ? planName : "reverted"}" (MP status: ${status})`);
  return { ok: true, email: payer_email, plan: planName, status };
}

// ── Main ─────────────────────────────────────────────────────────────────────
serve(async (req: Request) => {
  // Health check
  if (req.method === "GET") {
    return new Response(JSON.stringify({ ok: true, service: "mp-webhook" }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  let rawBody = "";
  try {
    rawBody = await req.text();
    const body = JSON.parse(rawBody);

    // Validate signature
    if (!validateSignature(req, rawBody)) {
      console.warn("Invalid MP signature — rejected");
      return new Response(JSON.stringify({ ok: false, reason: "invalid signature" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("Webhook body:", rawBody);
    const supabase = getAdminClient();
    const { type, topic, data } = body;

    let result: any = { ok: true, reason: "event ignored" };

    if (type === "subscription_preapproval" || topic === "preapproval") {
      const sid = data?.id ?? body.id;
      if (sid) result = await syncSubscription(sid, supabase);

    } else if (type === "payment" || topic === "payment") {
      const pid = data?.id ?? body.id;
      if (pid) {
        const payment = await getMpPayment(pid);
        const sid = payment.preapproval_id ?? payment.subscription_id;
        if (sid) result = await syncSubscription(sid, supabase);
        else result = { ok: false, reason: "no subscription linked to payment" };
      }
    }

    // Always return 200 to avoid MP retries
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("Unhandled error:", err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 200, // intentional — MP must not retry
      headers: { "Content-Type": "application/json" },
    });
  }
});
