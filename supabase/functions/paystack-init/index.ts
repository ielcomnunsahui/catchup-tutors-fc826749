import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";
import { admin, paystack, userFromRequest } from "../_shared/paystack.ts";

const Body = z.object({
  planId: z.string().uuid(),
  callbackUrl: z.string().url().max(500),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const user = await userFromRequest(req);
    if (!user) {
      return new Response(JSON.stringify({ error: "Sign in required" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = Body.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const db = admin();
    const { data: plan, error } = await db
      .from("subscription_plans")
      .select("id,name,slug,interval,price_ngn,is_active")
      .eq("id", parsed.data.planId)
      .maybeSingle();
    if (error || !plan || !plan.is_active) {
      return new Response(JSON.stringify({ error: "Plan not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const reference = `cut_${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`;

    const init = await paystack("/transaction/initialize", {
      method: "POST",
      body: JSON.stringify({
        email: user.email,
        amount: Math.round(Number(plan.price_ngn) * 100), // kobo
        currency: "NGN",
        reference,
        callback_url: parsed.data.callbackUrl,
        metadata: { user_id: user.id, plan_id: plan.id, plan_name: plan.name },
      }),
    });

    await db.from("payments").insert({
      user_id: user.id,
      provider: "paystack",
      provider_reference: reference,
      amount: plan.price_ngn,
      currency: "NGN",
      status: "pending",
      metadata: { plan_id: plan.id, plan_slug: plan.slug, plan_name: plan.name },
    });

    return new Response(JSON.stringify({ authorization_url: init.data.authorization_url, reference }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
