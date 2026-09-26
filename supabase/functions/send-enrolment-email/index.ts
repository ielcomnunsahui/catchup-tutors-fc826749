import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const ADMIN_EMAIL = "Catchuptutors01@gmail.com";
const FROM = "CatchUp Tutors <admissions@catch-uptutors.com>";

const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { id } = await req.json();
    if (typeof id !== "string") throw new Error("id required");
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: r } = await admin.from("programme_enrolments").select("*")
      .eq("id", id).gt("created_at", new Date(Date.now() - 10 * 60_000).toISOString()).maybeSingle();
    if (!r) return new Response(JSON.stringify({ ok: false }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const fee = `₦${Number(r.monthly_fee).toLocaleString("en-NG")}`;
    const summary = `<p style="background:#FFF4EC;border-left:3px solid #FF6B12;padding:12px 14px">
      <b>Reference:</b> ${esc(r.ref_code)}<br/><b>Programme:</b> ${esc(r.programme)} — ${fee}/month<br/>
      <b>Days:</b> ${esc((r.available_days ?? []).join(", "))}<br/><b>Class time:</b> ${esc(r.preferred_time)}</p>`;
    const send = (to: string, subject: string, html: string) => fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, to: [to], reply_to: ADMIN_EMAIL, subject, html }),
    });
    await Promise.all([
      send(r.email, `Your ${r.programme} enrolment — ${r.ref_code}`,
        `<div style="font-family:Arial,sans-serif;max-width:600px"><p>Dear <b>${esc(r.full_name)}</b>,</p>
        <p>Thank you for enrolling with CatchUp Tutors. We have received your details.</p>${summary}
        <p>Our team will contact you on ${esc(r.phone)} to confirm your timetable and payment.</p><p>— CatchUp Tutors</p></div>`),
      send(ADMIN_EMAIL, `New ${r.programme} enrolment: ${r.full_name} (${r.ref_code})`,
        `<div style="font-family:Arial,sans-serif">${summary}<p>${esc(r.full_name)} · ${esc(r.phone)} · ${esc(r.email)}<br/>
        Level: ${esc(r.current_level)} · School: ${esc(r.school)}</p></div>`),
    ]);
    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
