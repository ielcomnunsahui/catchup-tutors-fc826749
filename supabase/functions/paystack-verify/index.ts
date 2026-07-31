import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";
import { admin, paystack, userFromRequest } from "../_shared/paystack.ts";

const Body = z.object({ reference: z.string().min(6).max(120) });

const MONTHS: Record<string, number> = { month: 1, quarter: 3, year: 12, forever: 1200 };

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
      return new Response(JSON.stringify({ error: "Invalid reference" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const reference = parsed.data.reference;
    const db = admin();

    const { data: payment } = await db
      .from("payments").select("*").eq("provider_reference", reference).maybeSingle();
    if (!payment || payment.user_id !== user.id) {
      return new Response(JSON.stringify({ error: "Payment not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (payment.status === "paid") {
      return new Response(JSON.stringify({ status: "paid", alreadyProcessed: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const verified = await paystack(`/transaction/verify/${encodeURIComponent(reference)}`);
    const ok = verified?.data?.status === "success";

    await db.from("payments").update({
      status: ok ? "paid" : "failed",
      metadata: { ...(payment.metadata ?? {}), paystack: verified.data },
    }).eq("id", payment.id);

    if (!ok) {
      return new Response(JSON.stringify({ status: "failed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const planId = (payment.metadata as { plan_id?: string })?.plan_id;
    const { data: plan } = await db
      .from("subscription_plans").select("id,interval").eq("id", planId).maybeSingle();

    const months = MONTHS[plan?.interval ?? "month"] ?? 1;
    const starts = new Date();
    const ends = new Date(starts);
    ends.setMonth(ends.getMonth() + months);

    const { data: sub } = await db.from("premium_subscriptions").insert({
      user_id: user.id,
      plan_id: plan?.id ?? planId,
      status: "active",
      starts_at: starts.toISOString(),
      ends_at: ends.toISOString(),
      provider: "paystack",
      provider_reference: reference,
    }).select("id").maybeSingle();

    if (sub?.id) await db.from("payments").update({ subscription_id: sub.id }).eq("id", payment.id);

    return new Response(JSON.stringify({ status: "paid", endsAt: ends.toISOString() }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
