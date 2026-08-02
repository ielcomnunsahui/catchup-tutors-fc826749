import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";
import { createClient } from "npm:@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const ADMIN_EMAIL = "Catchuptutors01@gmail.com";
const FROM = "Catch-Up Tutors <admissions@catch-uptutors.com>";

const Body = z.object({
  applicationId: z.string().uuid(),
  decision: z.enum(["approved", "rejected", "changes_requested"]),
  message: z.string().max(4000).optional(),
});

const wrap = (inner: string) => `<div style="font-family:Inter,Arial,sans-serif;color:#0f172a;max-width:640px">
  <div style="background:#000E2E;color:#fff;padding:28px">
    <h1 style="margin:0;font-family:Poppins,Arial;font-size:22px">Catch-Up Tutors</h1>
    <p style="margin:6px 0 0;opacity:.8;font-size:13px">Bridging Gaps, Building Excellence</p>
  </div>
  <div style="padding:28px;background:#fff;border:1px solid #e5e7eb;border-top:0">${inner}</div>
</div>`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const json = (b: unknown, status = 200) =>
    new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
      auth: { persistSession: false },
    });

    const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
    if (!token) return json({ error: "Sign in required" }, 401);
    const { data: authData } = await db.auth.getUser(token);
    const caller = authData.user;
    if (!caller) return json({ error: "Sign in required" }, 401);

    const { data: isAdmin } = await db.rpc("has_role", { _user_id: caller.id, _role: "admin" });
    if (!isAdmin) return json({ error: "Admin only" }, 403);

    const parsed = Body.safeParse(await req.json());
    if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400);
    const { applicationId, decision, message } = parsed.data;

    const { data: app } = await db
      .from("tutor_applications")
      .select("id, user_id, full_name, email, phone, subjects, topics, qualifications, highest_qualification, years_experience, biography, teaching_philosophy, pricing, photo_path")
      .eq("id", applicationId)
      .maybeSingle();
    if (!app) return json({ error: "Application not found" }, 404);

    await db.from("tutor_applications")
      .update({ status: decision, admin_feedback: message ?? null })
      .eq("id", applicationId);

    // Approval provisions the tutor: profile + tutor role. Access is granted only here.
    if (decision === "approved" && app.user_id) {
      const { data: existing } = await db
        .from("tutor_profiles").select("id").eq("user_id", app.user_id).maybeSingle();

      let photoUrl: string | null = null;
      if (app.photo_path) {
        const { data: signed } = await db.storage
          .from("tutor-uploads").createSignedUrl(app.photo_path, 60 * 60 * 24 * 365);
        photoUrl = signed?.signedUrl ?? null;
      }

      const payload = {
        user_id: app.user_id,
        application_id: app.id,
        display_name: app.full_name,
        photo_url: photoUrl,
        bio: app.biography ?? app.teaching_philosophy ?? "",
        subjects: app.subjects ?? [],
        topics: app.topics ?? [],
        qualifications: app.highest_qualification ? [app.highest_qualification] : (app.qualifications ?? []),
        years_experience: app.years_experience ?? 0,
        pricing: app.pricing ?? {},
        is_approved: true,
        is_visible: true,
      };

      if (existing?.id) await db.from("tutor_profiles").update(payload).eq("id", existing.id);
      else await db.from("tutor_profiles").insert(payload);

      await db.from("user_roles").upsert(
        { user_id: app.user_id, role: "tutor" },
        { onConflict: "user_id,role", ignoreDuplicates: true },
      );
    }

    // Rejection / changes requested removes any previously granted tutor access.
    if (decision !== "approved" && app.user_id) {
      await db.from("tutor_profiles").update({ is_approved: false, is_visible: false }).eq("user_id", app.user_id);
      await db.from("user_roles").delete().eq("user_id", app.user_id).eq("role", "tutor");
    }


    let subject: string;
    let inner: string;
    if (decision === "approved") {
      subject = "Congratulations — your Catch-Up Tutors application is approved";
      inner = `<p>Dear <b>${app.full_name}</b>,</p>
        <p>We are delighted to inform you that your application to join <b>Catch-Up Tutors</b> has been
        <b style="color:#0F8A3C">approved</b>. Your profile has been reviewed and meets our standards of
        academic excellence and student-centered engagement.</p>
        ${message ? `<p style="background:#FFF4EC;border-left:3px solid #FF6B12;padding:12px 14px">${message}</p>` : ""}
        <p>Sign in to your account to complete your tutor profile, set your subjects, availability and
        session pricing so students can start booking you.</p>
        <p style="margin-top:24px">Warm regards,<br/><b>The Recruitment Team</b><br/>Catch-Up Tutors.</p>`;
    } else if (decision === "changes_requested") {
      subject = "Action needed on your Catch-Up Tutors application";
      inner = `<p>Dear <b>${app.full_name}</b>,</p>
        <p>Thank you for your application. Before we can proceed, our team needs a few updates from you:</p>
        <p style="background:#FFF4EC;border-left:3px solid #FF6B12;padding:12px 14px">${message ?? "Please review and resubmit your application details."}</p>
        <p>Sign in to your account to update and resubmit your application.</p>
        <p style="margin-top:24px">Warm regards,<br/><b>The Recruitment Team</b><br/>Catch-Up Tutors.</p>`;
    } else {
      subject = "Update on your Catch-Up Tutors application";
      inner = `<p>Dear <b>${app.full_name}</b>,</p>
        <p>Thank you for the time you invested in applying to Catch-Up Tutors. After careful review, we are
        unable to move forward with your application at this time.</p>
        ${message ? `<p style="background:#F1F5F9;border-left:3px solid #94a3b8;padding:12px 14px">${message}</p>` : ""}
        <p>We genuinely appreciate your interest and encourage you to apply again in the future.</p>
        <p style="margin-top:24px">Warm regards,<br/><b>The Recruitment Team</b><br/>Catch-Up Tutors.</p>`;
    }

    if (RESEND_API_KEY) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: FROM, to: [app.email], reply_to: ADMIN_EMAIL, subject, html: wrap(inner) }),
      });
    }

    return json({ ok: true, emailed: !!RESEND_API_KEY });
  } catch (e) {
    return json({ error: (e as Error).message }, 400);
  }
});
