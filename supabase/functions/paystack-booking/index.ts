import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";
import { admin, paystack, userFromRequest } from "../_shared/paystack.ts";

const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("init"), bookingId: z.string().uuid(), callbackUrl: z.string().url().max(500) }),
  z.object({ action: z.literal("verify"), reference: z.string().min(6).max(120) }),
]);

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const user = await userFromRequest(req);
    if (!user) return json({ error: "Sign in required" }, 401);

    const parsed = Body.safeParse(await req.json());
    if (!parsed.success) return json({ error: "Invalid request" }, 400);
    const db = admin();

    if (parsed.data.action === "init") {
      const { data: booking } = await db
        .from("bookings")
        .select("id, ref_code, student_id, price_amount, currency, duration_minutes, preferred_start, tutor_id")
        .eq("id", parsed.data.bookingId)
        .maybeSingle();
      if (!booking || booking.student_id !== user.id) return json({ error: "Booking not found" }, 404);

      const amount = Number(booking.price_amount ?? 0);
      if (!(amount > 0)) return json({ error: "This tutor has not set a session price yet. Our team will contact you." }, 400);

      const reference = `cutb_${crypto.randomUUID().replace(/-/g, "").slice(0, 18)}`;
      const init = await paystack("/transaction/initialize", {
        method: "POST",
        body: JSON.stringify({
          email: user.email,
          amount: Math.round(amount * 100),
          currency: "NGN",
          reference,
          callback_url: parsed.data.callbackUrl,
          metadata: { user_id: user.id, booking_id: booking.id, booking_ref: booking.ref_code },
        }),
      });

      await db.from("payments").insert({
        user_id: user.id,
        booking_id: booking.id,
        provider: "paystack",
        provider_reference: reference,
        amount,
        currency: "NGN",
        status: "pending",
        metadata: { booking_id: booking.id, booking_ref: booking.ref_code },
      });

      return json({ authorizationUrl: init?.data?.authorization_url, reference });
    }

    // verify
    const reference = parsed.data.reference;
    const { data: payment } = await db.from("payments").select("*").eq("provider_reference", reference).maybeSingle();
    if (!payment || payment.user_id !== user.id) return json({ error: "Payment not found" }, 404);

    const bookingId = payment.booking_id ?? (payment.metadata as { booking_id?: string })?.booking_id;
    if (!bookingId) return json({ error: "This reference is not a session payment" }, 400);

    let ok = payment.status === "paid";
    if (!ok) {
      const verified = await paystack(`/transaction/verify/${encodeURIComponent(reference)}`);
      ok = verified?.data?.status === "success";
      await db.from("payments").update({
        status: ok ? "paid" : "failed",
        metadata: { ...(payment.metadata ?? {}), paystack: verified?.data },
      }).eq("id", payment.id);
    }

    if (!ok) return json({ status: "failed" });

    await db.from("bookings").update({ status: "confirmed" }).eq("id", bookingId);

    const { data: booking } = await db
      .from("bookings")
      .select("id, ref_code, preferred_start, duration_minutes, session_type, price_amount, currency, programme, student_name, student_email, bio_completed, tutor_id")
      .eq("id", bookingId)
      .maybeSingle();
    const { data: tutor } = await db
      .from("tutor_profiles").select("display_name, ref_code").eq("id", booking?.tutor_id).maybeSingle();

    return json({
      status: "paid",
      reference,
      paidAt: new Date().toISOString(),
      booking,
      tutorName: tutor?.display_name ?? null,
      tutorRef: tutor?.ref_code ?? null,
    });
  } catch (e) {
    return json({ error: (e as Error).message }, 400);
  }
});
