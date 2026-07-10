import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const ADMIN_EMAIL = "Catchuptutors01@gmail.com";
const FROM = "CatchUp Tutors <onboarding@resend.dev>";

type Kind = "student" | "tutor";
type Payload = {
  kind: Kind;
  fullName: string;
  email: string;
  phone?: string;
  admissionId: string;
  meta?: Record<string, unknown>;
  attachmentBase64?: string;
  attachmentFilename?: string;
};

function studentHtml(p: Payload) {
  return `<div style="font-family:Inter,Arial,sans-serif;color:#0f172a;max-width:640px">
    <div style="background:#000E2E;color:#fff;padding:28px">
      <h1 style="margin:0;font-family:Poppins,Arial;font-size:22px">CatchUp Tutors — Admission Letter</h1>
      <p style="margin:6px 0 0;opacity:.8;font-size:13px">Free Summer Lessons · Al-Bayan High School, Ilorin</p>
    </div>
    <div style="padding:28px;background:#fff;border:1px solid #e5e7eb;border-top:0">
      <p>Dear <b>${p.fullName}</b>,</p>
      <p>Congratulations! You have been officially admitted to the <b>CatchUp Tutors Free Summer Academy 2026</b>.
      Your seat is reserved at Al-Bayan High School, Ilorin, Kwara State.</p>
      <p style="background:#FFF4EC;border-left:3px solid #FF6B12;padding:12px 14px;margin:16px 0">
        <b>Admission ID:</b> ${p.admissionId}<br/>
        <b>Venue:</b> Al-Bayan High School, behind Karuma secondary school, Akerebiate, Ilorin, Kwara State<br/>
        <b>Mode:</b> Physical / In-person only
      </p>
      <p>Please arrive on the announced start date with a notebook, pen and your school ID.
      Our team will reach you via WhatsApp with the class timetable.</p>
      <p style="margin-top:24px">With warm regards,<br/><b>Mr. Ahmed Thaoban</b><br/>Founder, CatchUp Tutors</p>
    </div>
  </div>`;
}

function tutorHtml(p: Payload) {
  return `<div style="font-family:Inter,Arial,sans-serif;color:#0f172a;max-width:640px">
    <div style="background:#000E2E;color:#fff;padding:28px">
      <h1 style="margin:0;font-family:Poppins,Arial;font-size:22px">CatchUp Tutors — Volunteer Acceptance</h1>
      <p style="margin:6px 0 0;opacity:.8;font-size:13px">Free Summer Lessons · Al-Bayan High School, Ilorin</p>
    </div>
    <div style="padding:28px;background:#fff;border:1px solid #e5e7eb;border-top:0">
      <p>Dear <b>${p.fullName}</b>,</p>
      <p>Thank you for stepping forward to teach. Your volunteer application to the <b>CatchUp Tutors Free Summer Academy 2026</b>
      has been received and provisionally accepted, subject to a short interview.</p>
      <p style="background:#FFF4EC;border-left:3px solid #FF6B12;padding:12px 14px;margin:16px 0">
        <b>Reference ID:</b> ${p.admissionId}<br/>
        <b>Venue:</b> Al-Bayan High School, Ilorin<br/>
        <b>Perks:</b> Meals and local transport within Ilorin are covered.
      </p>
      <p>Our coordinator will contact you on the phone number you provided to confirm the subjects,
      timetable and orientation date.</p>
      <p style="margin-top:24px">With appreciation,<br/><b>Mr. Ahmed Thaoban</b><br/>Founder, CatchUp Tutors</p>
    </div>
  </div>`;
}

async function send(to: string, subject: string, html: string, attachment?: { content: string; filename: string }) {
  const body: Record<string, unknown> = { from: FROM, to: [to], subject, html };
  if (attachment?.content && attachment.filename) {
    body.attachments = [{ filename: attachment.filename, content: attachment.content }];
  }
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
    body: JSON.stringify(body),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`Resend ${r.status}: ${JSON.stringify(data)}`);
  return data;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    if (!RESEND_API_KEY) return new Response(JSON.stringify({ ok: false, skipped: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const p = (await req.json()) as Payload;
    if (!p?.fullName || !p?.email || !p?.kind || !p?.admissionId)
      return new Response(JSON.stringify({ error: "missing fields" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const html = p.kind === "student" ? studentHtml(p) : tutorHtml(p);
    const subject = p.kind === "student"
      ? "Your CatchUp Tutors Admission Letter"
      : "Your CatchUp Tutors Volunteer Acceptance";
    const attachment = p.attachmentBase64 && p.attachmentFilename
      ? { content: p.attachmentBase64, filename: p.attachmentFilename }
      : undefined;
    const userRes = await send(p.email, subject, html, attachment).catch((e) => ({ error: String(e) }));
    const adminRes = await send(ADMIN_EMAIL, `New ${p.kind} registration · ${p.fullName}`, html, attachment).catch((e) => ({ error: String(e) }));
    return new Response(JSON.stringify({ ok: true, userRes, adminRes }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
