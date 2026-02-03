import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const MERCADOPAGO_API_URL = "https://api.mercadopago.com";
const MERCADOPAGO_PUBLIC_KEY = "APP_USR-765fe699-0855-4fba-bcfb-b376d93d49a8";

// Plan prices in ARS (stored as integer - no cents for MercadoPago)
const PLAN_PRICES: Record<string, { price: number; name: string; description: string }> = {
  professional: {
    price: 30000,
    name: "Plan Professional",
    description: "Obligaciones ilimitadas, hasta 10 usuarios, soporte prioritario",
  },
  enterprise: {
    price: 55000,
    name: "Plan Enterprise",
    description: "Todo ilimitado, soporte 24/7, consultoría incluida",
  },
};

interface SubscriptionRequest {
  action: string;
  plan?: string;
  userId?: string;
  email?: string;
  preapprovalId?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const MERCADOPAGO_ACCESS_TOKEN = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!MERCADOPAGO_ACCESS_TOKEN) {
      throw new Error("MERCADOPAGO_ACCESS_TOKEN not configured");
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    const body: SubscriptionRequest = await req.json();
    const { action } = body;

    // For webhook, use service role. For user actions, validate JWT
    let userId: string | null = null;

    if (action !== "webhook") {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: authHeader } },
      });

      const token = authHeader.replace("Bearer ", "");
      const { data: claims, error: claimsError } = await supabaseClient.auth.getUser(token);
      
      if (claimsError || !claims.user) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      userId = claims.user.id;
    }

    // Service role client for DB operations
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    switch (action) {
      case "get-plans": {
        return new Response(
          JSON.stringify({
            success: true,
            plans: PLAN_PRICES,
            publicKey: MERCADOPAGO_PUBLIC_KEY,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "create-subscription": {
        const { plan, email } = body;

        if (!plan || !PLAN_PRICES[plan]) {
          return new Response(
            JSON.stringify({ error: "Invalid plan" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const planDetails = PLAN_PRICES[plan];
        const backUrl = `${req.headers.get("origin") || "https://ifsin-rem.lovable.app"}/configuracion?subscription=`;

        // Create a preapproval (subscription) in Mercado Pago
        const preapprovalResponse = await fetch(`${MERCADOPAGO_API_URL}/preapproval`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
          },
          body: JSON.stringify({
            reason: planDetails.name,
            auto_recurring: {
              frequency: 1,
              frequency_type: "months",
              transaction_amount: planDetails.price,
              currency_id: "ARS",
            },
            back_url: `${backUrl}success`,
            payer_email: email,
            external_reference: `${userId}|${plan}`,
            status: "pending",
          }),
        });

        if (!preapprovalResponse.ok) {
          const errorData = await preapprovalResponse.text();
          console.error("Mercado Pago error:", errorData);
          throw new Error(`Mercado Pago error: ${preapprovalResponse.status}`);
        }

        const preapproval = await preapprovalResponse.json();

        // Save pending subscription to DB
        const { error: dbError } = await supabase.from("subscriptions").upsert({
          user_id: userId,
          mercadopago_preapproval_id: preapproval.id,
          plan: plan as "starter" | "professional" | "enterprise",
          status: "pending",
          price_monthly: planDetails.price,
        }, { onConflict: "user_id" });

        if (dbError) {
          console.error("DB error:", dbError);
        }

        return new Response(
          JSON.stringify({
            success: true,
            init_point: preapproval.init_point,
            preapproval_id: preapproval.id,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "get-subscription": {
        const { data: subscription, error } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();

        if (error) {
          console.error("Error fetching subscription:", error);
        }

        return new Response(
          JSON.stringify({
            success: true,
            subscription,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "cancel-subscription": {
        const { data: subscription } = await supabase
          .from("subscriptions")
          .select("mercadopago_preapproval_id")
          .eq("user_id", userId)
          .single();

        if (subscription?.mercadopago_preapproval_id) {
          // Cancel in Mercado Pago
          const cancelResponse = await fetch(
            `${MERCADOPAGO_API_URL}/preapproval/${subscription.mercadopago_preapproval_id}`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
              },
              body: JSON.stringify({ status: "cancelled" }),
            }
          );

          if (!cancelResponse.ok) {
            const errorText = await cancelResponse.text();
            console.error("Cancel error:", errorText);
          }
        }

        // Update local DB
        const { error: updateError } = await supabase
          .from("subscriptions")
          .update({
            status: "cancelled",
            cancelled_at: new Date().toISOString(),
          })
          .eq("user_id", userId);

        if (updateError) {
          console.error("Update error:", updateError);
        }

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "webhook": {
        // Mercado Pago sends notification about subscription status change
        const { data } = await req.json().catch(() => ({ data: body }));
        
        if (data?.type === "subscription_preapproval") {
          const preapprovalId = data.data?.id;
          
          if (preapprovalId) {
            // Fetch preapproval details from Mercado Pago
            const detailsResponse = await fetch(
              `${MERCADOPAGO_API_URL}/preapproval/${preapprovalId}`,
              {
                headers: {
                  Authorization: `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
                },
              }
            );

            if (detailsResponse.ok) {
              const details = await detailsResponse.json();
              const externalReference = details.external_reference;
              const [refUserId, refPlan] = (externalReference || "").split("|");

              if (refUserId) {
                // Update subscription status
                await supabase
                  .from("subscriptions")
                  .update({
                    status: details.status,
                    current_period_start: details.date_created,
                    current_period_end: details.next_payment_date,
                  })
                  .eq("user_id", refUserId);
              }
            }
          }
        }

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "sync-status": {
        // Sync subscription status from Mercado Pago
        const { data: subscription } = await supabase
          .from("subscriptions")
          .select("mercadopago_preapproval_id")
          .eq("user_id", userId)
          .single();

        if (subscription?.mercadopago_preapproval_id) {
          const detailsResponse = await fetch(
            `${MERCADOPAGO_API_URL}/preapproval/${subscription.mercadopago_preapproval_id}`,
            {
              headers: {
                Authorization: `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
              },
            }
          );

          if (detailsResponse.ok) {
            const details = await detailsResponse.json();

            await supabase
              .from("subscriptions")
              .update({
                status: details.status,
                current_period_start: details.date_created,
                current_period_end: details.next_payment_date,
              })
              .eq("user_id", userId);

            return new Response(
              JSON.stringify({
                success: true,
                status: details.status,
              }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        }

        return new Response(
          JSON.stringify({ success: true, status: null }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
