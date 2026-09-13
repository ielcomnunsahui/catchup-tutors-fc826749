import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";
import { createClient } from "npm:@supabase/supabase-js@2";

/**
 * Proxy for the myschool.ng API on Parse (parse.bot).
 * Keeps PARSE_API_KEY server-side and caches admission requirements so repeat
 * lookups do not spend credits.
 */
const SCRAPER = "https://api.parse.bot/scraper/024e7b9b-f175-4efa-9c90-874b24500823";

const Body = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("past_questions"),
    subject: z.string().min(1).max(80),
    exam_type: z.enum(["jamb", "waec", "neco"]),
    exam_year: z.string().max(8).optional(),
    topic: z.string().max(120).optional(),
    pages: z.number().int().min(1).max(20).default(1),
    start_page: z.number().int().min(1).max(500).default(1),
  }),
  z.object({
    action: z.literal("import_questions"),
    subject: z.string().min(1).max(80),
    subject_label: z.string().min(1).max(120),
    exam_type: z.enum(["jamb", "waec", "neco"]),
    access_level: z.enum(["free", "premium"]).default("free"),
    is_published: z.boolean().default(true),
    questions: z
      .array(
        z.object({
          question_text: z.string().min(3),
          options: z.array(z.string()).min(2).max(8),
          correct_index: z.number().int().min(0).max(7),
          explanation: z.string().nullable().optional(),
          exam_year: z.union([z.string(), z.number()]).nullable().optional(),
          topic: z.string().nullable().optional(),
        }),
      )
      .min(1)
      .max(200),
  }),
  z.object({
    action: z.literal("schools"),
    school_type: z.enum(["university", "polytechnic", "college of education"]),
  }),
  z.object({ action: z.literal("courses"), school: z.string().min(1).max(120) }),
  z.object({
    action: z.literal("requirements"),
    school: z.string().min(1).max(120),
    school_name: z.string().max(200).optional(),
    course: z.string().min(1).max(160),
    course_name: z.string().max(200).optional(),
    path: z.string().min(1).max(300),
  }),
]);

type Json = Record<string, unknown>;

const CACHE_DAYS = 30;

async function parseGet(endpoint: string, params: Record<string, string>) {
  const key = Deno.env.get("PARSE_API_KEY");
  if (!key) throw new Error("PARSE_API_KEY is not configured");
  const url = new URL(`${SCRAPER}/${endpoint}`);
  for (const [k, v] of Object.entries(params)) if (v) url.searchParams.set(k, v);
  const res = await fetch(url, { headers: { "X-API-Key": key } });
  const text = await res.text();
  let body: Json;
  try {
    body = JSON.parse(text);
  } catch {
    body = { raw: text };
  }
  if (!res.ok) {
    throw new Error(
      typeof body.error === "string" ? body.error : `myschool API error (${res.status})`,
    );
  }
  return (body.data ?? body) as Json;
}

/** Turn a Parse question record into our quiz_questions shape. */
function normalise(q: Json) {
  const rawOptions = Array.isArray(q.options)
    ? (q.options as unknown[])
    : Object.values((q.options ?? {}) as Json);
  const options = rawOptions.map((o) =>
    typeof o === "string" ? o : String((o as Json)?.text ?? (o as Json)?.value ?? ""),
  ).filter((o) => o.trim().length > 0);

  const answer = String(q.correct_answer ?? q.answer ?? "").trim();
  let correct_index = options.findIndex((o) => o.trim().toLowerCase() === answer.toLowerCase());
  if (correct_index < 0 && /^[a-h]$/i.test(answer)) {
    correct_index = answer.toUpperCase().charCodeAt(0) - 65;
  }
  if (correct_index < 0 || correct_index >= options.length) correct_index = 0;

  const yearRaw = String(q.exam_year ?? q.year ?? "").match(/\d{4}/)?.[0];

  return {
    question_text: String(q.question ?? q.question_text ?? q.text ?? "").trim(),
    options,
    correct_index,
    explanation: q.explanation ? String(q.explanation) : null,
    exam_year: yearRaw ?? null,
    topic: q.topic ? String(q.topic) : null,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const json = (b: unknown, status = 200) =>
    new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400);
    const input = parsed.data;

    const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
      auth: { persistSession: false },
    });

    // Credit-spending question actions are admin-only.
    if (input.action === "past_questions" || input.action === "import_questions") {
      const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
      if (!token) return json({ error: "Sign in required" }, 401);
      const { data: authData } = await db.auth.getUser(token);
      const caller = authData.user;
      if (!caller) return json({ error: "Sign in required" }, 401);
      const { data: isAdmin } = await db.rpc("has_role", { _user_id: caller.id, _role: "admin" });
      if (!isAdmin) return json({ error: "Admin only" }, 403);
    }

    if (input.action === "past_questions") {
      const collected: ReturnType<typeof normalise>[] = [];
      let total_questions = 0;
      let total_pages = 1;
      let credits = 0;

      for (let i = 0; i < input.pages; i++) {
        const page = input.start_page + i;
        if (page > total_pages && i > 0) break;
        const data = await parseGet("get_past_questions", {
          subject: input.subject,
          exam_type: input.exam_type,
          exam_year: input.exam_year ?? "",
          topic: input.topic ?? "",
          page: String(page),
        });
        credits += 1;
        total_questions = Number(data.total_questions ?? total_questions) || total_questions;
        total_pages = Number(data.total_pages ?? total_pages) || total_pages;
        const list = (Array.isArray(data.questions) ? data.questions : []) as Json[];
        if (!list.length) break;
        collected.push(...list.map(normalise).filter((q) => q.question_text && q.options.length >= 2));
      }

      return json({ questions: collected, total_questions, total_pages, credits });
    }

    if (input.action === "import_questions") {
      const rows = input.questions.map((q) => ({
        exam_type: input.exam_type.toUpperCase(),
        subject_key: input.subject_label,
        year: q.exam_year ? Number(String(q.exam_year).match(/\d{4}/)?.[0]) || null : null,
        topic: q.topic ?? null,
        question_text: q.question_text,
        options: q.options,
        correct_index: q.correct_index,
        explanation: q.explanation ?? null,
        difficulty: "medium",
        access_level: input.access_level,
        is_published: input.is_published,
        source: "myschool.ng",
      }));

      const { data, error } = await db
        .from("quiz_questions")
        .upsert(rows, { onConflict: "exam_type,subject_key,md5(question_text)", ignoreDuplicates: true })
        .select("id");

      if (error) {
        // Fall back to inserting one by one when the index-based conflict target is rejected.
        let saved = 0;
        for (const row of rows) {
          const { error: e } = await db.from("quiz_questions").insert(row);
          if (!e) saved++;
        }
        return json({ saved, skipped: rows.length - saved });
      }

      const saved = data?.length ?? 0;
      return json({ saved, skipped: rows.length - saved });
    }

    if (input.action === "schools") {
      const data = await parseGet("list_schools_by_type", { school_type: input.school_type });
      return json({ schools: data.schools ?? data.results ?? [] });
    }

    if (input.action === "courses") {
      const data = await parseGet("get_school_courses", { school: input.school });
      return json({ courses: data.courses ?? data.results ?? [] });
    }

    // requirements — cache first
    const { data: cached } = await db
      .from("admission_requirements_cache")
      .select("payload, fetched_at")
      .eq("school_slug", input.school)
      .eq("course_slug", input.course)
      .maybeSingle();

    const fresh =
      cached && Date.now() - new Date(cached.fetched_at as string).getTime() < CACHE_DAYS * 864e5;
    if (fresh) return json({ requirements: cached!.payload, cached: true });

    const data = await parseGet("get_course_requirements", { path: input.path });
    await db.from("admission_requirements_cache").upsert(
      {
        school_slug: input.school,
        school_name: input.school_name ?? null,
        course_slug: input.course,
        course_name: input.course_name ?? null,
        requirements_path: input.path,
        payload: data,
        fetched_at: new Date().toISOString(),
      },
      { onConflict: "school_slug,course_slug" },
    );
    return json({ requirements: data, cached: false });
  } catch (e) {
    return json({ error: (e as Error).message }, 400);
  }
});
