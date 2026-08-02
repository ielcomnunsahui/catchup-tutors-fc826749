// Paystack server-to-server webhook. Completes subscriptions even when the
// buyer closes the browser before the callback page loads.
import { createHmac } from "node:crypto";
import { admin, paystackSecretKey } from "../_shared/paystack.ts";

const MONTHS: Record<string, number> = { month: 1, quarter: 3, year: 12, forever: 1200 };

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const raw = await req.text();
  const secret = await paystackSecretKey();
  if (!secret) return new Response("Not configured", { status: 500 });

  const signature = req.headers.get("x-paystack-signature") ?? "";
  const expected = createHmac("sha512", secret).update(raw).digest("hex");
  if (signature !== expected) return new Response("Invalid signature", { status: 401 });

  const event = JSON.parse(raw) as { event: string; data: { reference?: string; status?: string } };
  if (event.event !== "charge.success" || event.data?.status !== "success") {
    return new Response("ignored", { status: 200 });
  }

  const reference = event.data.reference!;
  const db = admin();
  const { data: payment } = await db.from("payments").select("*").eq("provider_reference", reference).maybeSingle();
  if (!payment || payment.status === "paid") return new Response("ok", { status: 200 });

  await db.from("payments").update({
    status: "paid",
    metadata: { ...(payment.metadata ?? {}), paystack: event.data },
  }).eq("id", payment.id);

  const planId = (payment.metadata as { plan_id?: string })?.plan_id;
  const { data: plan } = await db.from("subscription_plans").select("id,interval").eq("id", planId).maybeSingle();

  const { data: active } = await db
    .from("premium_subscriptions").select("id, ends_at")
    .eq("user_id", payment.user_id).eq("status", "active")
    .gte("ends_at", new Date().toISOString())
    .order("ends_at", { ascending: false }).limit(1).maybeSingle();

  const months = MONTHS[plan?.interval ?? "month"] ?? 1;
  const starts = active?.ends_at ? new Date(active.ends_at) : new Date();
  const ends = new Date(starts);
  ends.setMonth(ends.getMonth() + months);

  const { data: sub } = await db.from("premium_subscriptions").insert({
    user_id: payment.user_id,
    plan_id: plan?.id ?? planId,
    status: "active",
    starts_at: starts.toISOString(),
    ends_at: ends.toISOString(),
    provider: "paystack",
    provider_reference: reference,
  }).select("id").maybeSingle();

  if (sub?.id) await db.from("payments").update({ subscription_id: sub.id }).eq("id", payment.id);

  return new Response("ok", { status: 200 });
});
