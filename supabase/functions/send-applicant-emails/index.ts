import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3";
import { resendRequest } from "../_shared/resend-gateway.ts";

const Body = z.object({
  applicationIds: z.array(z.string().uuid()).min(1).max(100),
  subject: z.string().trim().min(1).max(200).refine((value) => !/[\r\n]/.test(value)),
  message: z.string().trim().min(1).max(12000),
  requestId: z.string().uuid(),
}).strict();

Deno.serve(async (req) => {
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "This action requires a send request." }, 405);
  try {
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) return json({ error: "Applicant email service is not configured." }, 503);
    const db = createClient(url, key, { auth: { persistSession: false } });
    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    if (!token) return json({ error: "Sign in as an admin to send applicant emails." }, 401);
    const { data: auth, error: authError } = await db.auth.getUser(token);
    if (authError || !auth.user) return json({ error: "Your session has expired. Sign in again before sending." }, 401);
    const { data: allowed, error: roleError } = await db.rpc("has_role", { _user_id: auth.user.id, _role: "admin" });
    if (roleError || !allowed) return json({ error: "Only admins can email tutor applicants." }, 403);
    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return json({ error: "Choose 1–100 applicants and provide a subject and message." }, 400);
    const { applicationIds, subject, message, requestId } = parsed.data;
    const ids = [...new Set(applicationIds)].sort();
    const { data: applicants, error } = await db.from("tutor_applications")
      .select("id,full_name,email,ref_code").in("id", ids).order("id");
    if (error) return json({ error: "Could not read the selected applicants. Please try again." }, 503);
    if (!applicants || applicants.length !== ids.length) return json({ error: "Some selected applications no longer exist. Refresh the applicant list." }, 409);
    const addresses = new Set<string>();
    const emails = [];
    for (const applicant of applicants) {
      const email = applicant.email.trim().toLowerCase();
      if (!z.string().email().safeParse(email).success) return json({ error: "A selected applicant has an invalid email address. Correct it or remove them before sending." }, 400);
      if (addresses.has(email)) continue;
      addresses.add(email);
      emails.push({
        from: "Catch-Up Tutors <admissions@catch-uptutors.com>",
        to: [email], reply_to: "Catchuptutors01@gmail.com", subject,
        text: `Dear ${applicant.full_name},\n\n${message}\n\n${applicant.ref_code ? `Application reference: ${applicant.ref_code}\n\n` : ""}The Recruitment Team\nCatch-Up Tutors`,
      });
    }
    const response = await resendRequest("emails/batch", emails, `applicant-${auth.user.id}-${requestId}`);
    const details = await response.text();
    if (!response.ok) {
      console.error(`Resend applicant batch failed [${response.status}]: ${details}`);
      return json({ error: response.status === 429 ? "Resend is busy. Wait a minute, then retry the same batch."
        : response.status === 403 ? "Resend could not send from admissions@catch-uptutors.com. Check that this sender domain is verified and allowed by your Resend key."
        : "Resend did not accept the batch. Check the service details before retrying.", status: response.status, details }, response.status);
    }
    const result = JSON.parse(details);
    if (!Array.isArray(result.data) || result.data.length !== emails.length) return json({ error: "Resend returned an unexpected receipt. Retry the same batch; do not start a new message.", details }, 502);
    return json({ accepted: emails.length, applicationIds: ids, duplicateAddresses: ids.length - emails.length });
  } catch (error) {
    console.error("Applicant email request failed", error);
    return json({ error: "Sending could not be confirmed. Retry the same batch to avoid duplicate emails." }, 503);
  }
});