import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";
import { createClient } from "npm:@supabase/supabase-js@2";

const FileSchema = z.object({
  name: z.string().max(200),
  type: z.string().max(120),
  base64: z.string().max(9_000_000),
});

const Body = z.object({
  fullName: z.string().trim().min(2).max(150),
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(72).optional(),
  phone: z.string().trim().min(6).max(40),
  location: z.string().trim().min(2).max(160),
  occupation: z.string().trim().min(2).max(160),
  highestQualification: z.string().trim().min(2).max(160),
  fieldOfStudy: z.string().trim().min(2).max(160),
  experienceBand: z.string().trim().min(1).max(60),
  subjects: z.array(z.string().max(80)).min(1).max(40),
  curricula: z.array(z.string().max(120)).min(1).max(20),
  teachingPhilosophy: z.string().trim().min(20).max(4000),
  videoExperience: z.string().max(120),
  sampleVideoUrl: z.string().max(500).optional().or(z.literal("")),
  hasEquipment: z.boolean(),
  tools: z.array(z.string().max(120)).max(20),
  hoursPerWeek: z.string().max(40),
  availability: z.array(z.string().max(60)).max(10),
  introVideoUrl: z.string().max(500).optional().or(z.literal("")),
  cv: FileSchema.optional(),
  photo: FileSchema.optional(),
});

const YEARS: Record<string, number> = { "Less than 1 year": 0, "1–3 years": 2, "3–5 years": 4, "5+ years": 6 };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const json = (b: unknown, status = 200) =>
    new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const parsed = Body.safeParse(await req.json());
    if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400);
    const p = parsed.data;

    const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
      auth: { persistSession: false },
    });

    // Resolve the applicant: existing signed-in user, existing account, or a brand-new account.
    let userId: string | null = null;
    let createdAccount = false;

    const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
    if (token) {
      const { data } = await db.auth.getUser(token);
      if (data.user) userId = data.user.id;
    }

    if (!userId) {
      if (!p.password) return json({ error: "A password is required to create your account." }, 400);
      const { data: created, error: createErr } = await db.auth.admin.createUser({
        email: p.email,
        password: p.password,
        email_confirm: true,
        user_metadata: { full_name: p.fullName },
      });
      if (createErr) {
        const msg = createErr.message ?? "";
        if (/already/i.test(msg)) {
          return json({ error: "An account with this email already exists. Please sign in first, then apply." }, 409);
        }
        return json({ error: msg }, 400);
      }
      userId = created.user!.id;
      createdAccount = true;
    }

    // An applicant asked for changes may resubmit; a pending/approved one may not.
    const { data: existing } = await db
      .from("tutor_applications").select("id,status").eq("user_id", userId)
      .in("status", ["pending", "approved", "changes_requested"])
      .order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (existing && existing.status !== "changes_requested") {
      return json({ error: "You already have an application in progress." }, 409);
    }
    const resubmitId = existing?.status === "changes_requested" ? existing.id : null;

    // Uploads
    const upload = async (f: { name: string; type: string; base64: string } | undefined, kind: string) => {
      if (!f) return null;
      const bytes = Uint8Array.from(atob(f.base64.split(",").pop() ?? ""), (c) => c.charCodeAt(0));
      const ext = (f.name.split(".").pop() ?? "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
      const path = `${userId}/${kind}-${Date.now()}.${ext}`;
      const { error } = await db.storage.from("tutor-uploads").upload(path, bytes, {
        contentType: f.type || "application/octet-stream", upsert: true,
      });
      if (error) throw new Error(`Upload failed: ${error.message}`);
      return path;
    };

    const cvPath = await upload(p.cv, "cv");
    const photoPath = await upload(p.photo, "photo");

    const record = {
      user_id: userId,
      full_name: p.fullName,
      email: p.email,
      phone: p.phone,
      subjects: p.subjects,
      topics: [],
      qualifications: `${p.highestQualification} — ${p.fieldOfStudy}`,
      years_experience: YEARS[p.experienceBand] ?? 0,
      pricing: {},
      biography: p.teachingPhilosophy,
      location: p.location,
      occupation: p.occupation,
      highest_qualification: p.highestQualification,
      field_of_study: p.fieldOfStudy,
      experience_band: p.experienceBand,
      curricula: p.curricula,
      teaching_philosophy: p.teachingPhilosophy,
      video_experience: p.videoExperience,
      sample_video_url: p.sampleVideoUrl || null,
      has_equipment: p.hasEquipment,
      tools: p.tools,
      hours_per_week: p.hoursPerWeek,
      availability: p.availability,
      intro_video_url: p.introVideoUrl || null,
      cv_path: cvPath,
      photo_path: photoPath,
      status: "pending" as const,
      admin_feedback: null,
    };

    const { data: app, error } = resubmitId
      ? await db.from("tutor_applications").update(record).eq("id", resubmitId).select("id,ref_code").single()
      : await db.from("tutor_applications").insert(record).select("id,ref_code").single();
    if (error) return json({ error: error.message }, 400);

    // Acknowledgement + admin notification (non-blocking)
    try {
      await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-tutor-application`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify({
          fullName: p.fullName, email: p.email, phone: p.phone,
          applicationId: app.id, subjects: p.subjects, curricula: p.curricula,
        }),
      });
    } catch (_) { /* email failure must not block the application */ }

    return json({ ok: true, applicationId: app.id, createdAccount });
  } catch (e) {
    return json({ error: (e as Error).message }, 400);
  }
});
