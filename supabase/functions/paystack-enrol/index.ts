import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";
import { admin, paystack } from "../_shared/paystack.ts";

const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("init"), enrolmentId: z.string().uuid(), callbackUrl: z.string().url().max(500) }),
  z.object({ action: z.literal("verify"), reference: z.string().regex(/^cute_[a-z0-9]{18}$/) }),
]);

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const SELECT = "id, ref_code, programme, monthly_fee, email, full_name, available_days, preferred_time, payment_status, payment_reference, amount_paid, paid_at";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const parsed = Body.safeParse(await req.json());
    if (!parsed.success) return json({ error: "Invalid request" }, 400);
    const db = admin();

    if (parsed.data.action === "init") {
      const { callbackUrl, enrolmentId } = parsed.data;
      const origin = new URL(callbackUrl);
      if (!/(^localhost$|lovable\.app$|lovableproject\.com$|catch-uptutors\.com$|vercel\.app$)/.test(origin.hostname)) {
        return json({ error: "Invalid return address" }, 400);
      }
      const { data: e } = await db.from("programme_enrolments").select(SELECT).eq("id", enrolmentId).maybeSingle();
      if (!e) return json({ error: "Enrolment not found" }, 404);
      if (e.payment_status === "paid") return json({ error: "This enrolment is already paid" }, 400);

      const reference = `cute_${crypto.randomUUID().replace(/-/g, "").slice(0, 18)}`;
      const init = await paystack("/transaction/initialize", {
        method: "POST",
        body: JSON.stringify({
          email: e.email,
          amount: Math.round(Number(e.monthly_fee) * 100),
          currency: "NGN",
          reference,
          callback_url: callbackUrl,
          metadata: { enrolment_id: e.id, enrolment_ref: e.ref_code, programme: e.programme },
        }),
      });
      await db.from("programme_enrolments").update({ payment_status: "pending", payment_reference: reference }).eq("id", e.id);
      return json({ authorizationUrl: init?.data?.authorization_url, reference });
    }

    const reference = parsed.data.reference;
    const { data: e } = await db.from("programme_enrolments").select(SELECT).eq("payment_reference", reference).maybeSingle();
    if (!e) return json({ error: "Payment not found" }, 404);
    if (e.payment_status !== "paid") {
      const verified = await paystack(`/transaction/verify/${encodeURIComponent(reference)}`);
      const ok = verified?.data?.status === "success" && Number(verified.data.amount) >= Number(e.monthly_fee) * 100;
      const patch = ok
        ? { payment_status: "paid", amount_paid: Math.round(Number(verified.data.amount) / 100), paid_at: new Date().toISOString() }
        : { payment_status: "failed" };
      await db.from("programme_enrolments").update(patch).eq("id", e.id);
      Object.assign(e, patch);
    }
    return json({ status: e.payment_status, enrolment: e });
  } catch (err) {
    return json({ error: (err as Error).message }, 400);
  }
});
