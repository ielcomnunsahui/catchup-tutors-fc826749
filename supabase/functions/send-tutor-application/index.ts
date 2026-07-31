import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const ADMIN_EMAIL = "Catchuptutors01@gmail.com";
const FROM = "Catch-Up Tutors <admissions@catch-uptutors.com>";

const Body = z.object({
  fullName: z.string().min(1).max(150),
  email: z.string().email().max(255),
  phone: z.string().max(50).optional(),
  applicationId: z.string().max(80),
  subjects: z.array(z.string().max(80)).max(40).optional(),
  curricula: z.array(z.string().max(80)).max(20).optional(),
});

const wrap = (title: string, inner: string) => `<div style="font-family:Inter,Arial,sans-serif;color:#0f172a;max-width:640px">
  <div style="background:#000E2E;color:#fff;padding:28px">
    <h1 style="margin:0;font-family:Poppins,Arial;font-size:22px">Catch-Up Tutors</h1>
    <p style="margin:6px 0 0;opacity:.8;font-size:13px">Bridging Gaps, Building Excellence</p>
  </div>
  <div style="padding:28px;background:#fff;border:1px solid #e5e7eb;border-top:0">
    <h2 style="margin:0 0 16px;font-size:18px">${title}</h2>${inner}
  </div>
</div>`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const p = parsed.data;

  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const applicantHtml = wrap("Thank you for your application to Catch-Up Tutors", `
    <p>Dear <b>${p.fullName}</b>,</p>
    <p>Thank you for your interest in joining the Catch-Up Tutors family. We have successfully received
    your application for our professional tutoring role.</p>
    <p>At Catch-Up Tutors, we maintain exceptional standards of academic excellence and student-centered
    engagement. Because our students rely on us to bridge critical learning gaps, we review every
    application with rigorous attention to detail and capability.</p>
    <p style="background:#FFF4EC;border-left:3px solid #FF6B12;padding:12px 14px;margin:16px 0">
      <b>Application reference:</b> ${p.applicationId}
    </p>
    <p><b>What Happens Next?</b></p>
    <p>Our management team is currently reviewing your academic qualifications, teaching experience,
    and subject expertise. We will revert back to you in due time to update you on the status of your
    application and the next steps for evaluation.</p>
    <p>Thank you once again for your interest in partnering with us to deliver top-tier education.</p>
    <p style="margin-top:24px">Warm regards,<br/><b>The Recruitment Team</b><br/>Catch-Up Tutors.</p>`);

  const adminHtml = wrap("New tutor application received", `
    <p><b>${p.fullName}</b> has applied to tutor.</p>
    <ul style="line-height:1.8">
      <li><b>Email:</b> ${p.email}</li>
      <li><b>Phone:</b> ${p.phone ?? "—"}</li>
      <li><b>Subjects:</b> ${(p.subjects ?? []).join(", ") || "—"}</li>
      <li><b>Curricula:</b> ${(p.curricula ?? []).join(", ") || "—"}</li>
      <li><b>Reference:</b> ${p.applicationId}</li>
    </ul>
    <p>Review it in the admin console under <b>Tutor applications</b>.</p>`);

  const send = (to: string, subject: string, html: string) =>
    fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, to: [to], reply_to: ADMIN_EMAIL, subject, html }),
    }).then((r) => r.json());

  const results = await Promise.allSettled([
    send(p.email, "Thank you for your application to Catch-Up Tutors", applicantHtml),
    send(ADMIN_EMAIL, `New tutor application — ${p.fullName}`, adminHtml),
  ]);

  return new Response(JSON.stringify({ ok: true, results: results.map((r) => r.status) }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
