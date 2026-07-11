import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const ADMIN_EMAIL = "thecatchuptutors@gmail.com";
const FROM = "CatchUp Tutors <bookings@catch-uptutors.com>";

type Payload = {
  bookingId: string;
  studentName: string;
  studentEmail: string;
  tutorName: string;
  subjectName: string;
  preferredStart: string;
  durationMinutes: number;
  sessionType: string;
  priceAmount: number;
  currency: string;
  notes?: string;
};

function html(b: Payload) {
  return `
  <div style="font-family:Inter,Arial,sans-serif;color:#0f172a">
    <h2 style="color:#2563eb;margin-bottom:4px">New tutor booking request</h2>
    <p style="color:#475569;margin-top:0">A student just requested a session via CatchUp Tutors.</p>
    <table style="border-collapse:collapse;margin-top:16px">
      <tr><td style="padding:6px 12px 6px 0;color:#64748b">Student</td><td><b>${b.studentName}</b> (${b.studentEmail})</td></tr>
      <tr><td style="padding:6px 12px 6px 0;color:#64748b">Tutor</td><td>${b.tutorName}</td></tr>
      <tr><td style="padding:6px 12px 6px 0;color:#64748b">Subject</td><td>${b.subjectName}</td></tr>
      <tr><td style="padding:6px 12px 6px 0;color:#64748b">Start</td><td>${new Date(b.preferredStart).toUTCString()}</td></tr>
      <tr><td style="padding:6px 12px 6px 0;color:#64748b">Duration</td><td>${b.durationMinutes} min</td></tr>
      <tr><td style="padding:6px 12px 6px 0;color:#64748b">Session</td><td>${b.sessionType}</td></tr>
      <tr><td style="padding:6px 12px 6px 0;color:#64748b">Price</td><td>${b.currency} ${b.priceAmount}</td></tr>
      ${b.notes ? `<tr><td style="padding:6px 12px 6px 0;color:#64748b">Notes</td><td>${b.notes}</td></tr>` : ""}
      <tr><td style="padding:6px 12px 6px 0;color:#64748b">Booking ID</td><td><code>${b.bookingId}</code></td></tr>
    </table>
    <p style="margin-top:24px;color:#64748b;font-size:12px">Follow up with the student on WhatsApp to confirm.</p>
  </div>`;
}

async function send(to: string, subject: string, body: string) {
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
    body: JSON.stringify({ from: FROM, to: [to], subject, html: body }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`Resend ${r.status}: ${JSON.stringify(data)}`);
  return data;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ ok: false, skipped: true, reason: "RESEND_API_KEY not set" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const b = (await req.json()) as Payload;
    if (!b?.bookingId || !b?.studentEmail || !b?.tutorName) {
      return new Response(JSON.stringify({ error: "missing fields" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const body = html(b);
    const adminRes = await send(ADMIN_EMAIL, `New booking · ${b.tutorName} · ${b.studentName}`, body);
    let studentRes: unknown = null;
    try { studentRes = await send(b.studentEmail, `We received your booking with ${b.tutorName}`, body); } catch (e) { studentRes = { error: String(e) }; }
    return new Response(JSON.stringify({ ok: true, adminRes, studentRes }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
