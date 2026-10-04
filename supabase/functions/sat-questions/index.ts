import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";
import { createClient } from "npm:@supabase/supabase-js@2";

/**
 * Proxy for the public College Board SAT Suite Question Bank.
 * Admin-only: lists questions by section/domain/difficulty, hydrates the full
 * question (stem, choices, answer, official rationale) and imports them into
 * quiz_questions without duplicating anything already saved.
 */
const API = "https://qbank-api.collegeboard.org/msreportingquestionbank-prod/questionbank/digital";
const ASMT_EVENT_SAT = 99;

const SECTIONS = {
  math: { test: 2, label: "Math", domains: ["H", "P", "Q", "S"] },
  "reading-writing": { test: 1, label: "Reading and Writing", domains: ["INI", "CAS", "EOI", "SEC"] },
} as const;

const Question = z.object({
  external_id: z.string().min(1).max(80),
  question_text: z.string().min(3),
  options: z.array(z.string()).min(2).max(8),
  correct_index: z.number().int().min(0).max(7),
  explanation: z.string().nullable().optional(),
  topic: z.string().nullable().optional(),
  domain: z.string().max(120).nullable().optional(),
  difficulty: z.string().max(20).default("medium"),
});

const Body = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("fetch"),
    section: z.enum(["math", "reading-writing"]),
    domains: z.array(z.string().max(8)).max(8).default([]),
    difficulties: z.array(z.enum(["E", "M", "H"])).max(3).default([]),
    skill: z.string().max(120).optional(),
    limit: z.number().int().min(1).max(50).default(10),
    skip_existing: z.boolean().default(true),
  }),
  z.object({
    action: z.literal("import"),
    section: z.enum(["math", "reading-writing"]),
    access_level: z.enum(["free", "premium"]).default("free"),
    is_published: z.boolean().default(true),
    questions: z.array(Question).min(1).max(200),
  }),
]);

type Json = Record<string, unknown>;

const DIFFICULTY: Record<string, string> = { E: "easy", M: "medium", H: "hard" };

async function post(path: string, body: Json) {
  const res = await fetch(`${API}/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`College Board question bank error (${res.status}): ${text.slice(0, 200)}`);
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("Unexpected response from the College Board question bank");
  }
}

const strip = (html: string) =>
  html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();

/** Turn one hydrated College Board question into our quiz_questions shape. */
function normalise(meta: Json, detail: Json) {
  if (detail.type !== "mcq") return null;
  const options = (Array.isArray(detail.answerOptions) ? detail.answerOptions : []) as Json[];
  if (options.length < 2) return null;

  const keys = (Array.isArray(detail.keys) ? detail.keys : []) as string[];
  const correctFromKey = options.findIndex((o) => keys.includes(String(o.id)));
  const letters = (Array.isArray(detail.correct_answer) ? detail.correct_answer : []) as string[];
  const correctFromLetter = /^[A-H]$/i.test(String(letters[0] ?? ""))
    ? String(letters[0]).toUpperCase().charCodeAt(0) - 65
    : -1;
  const correct_index = correctFromKey >= 0 ? correctFromKey : correctFromLetter;
  if (correct_index < 0 || correct_index >= options.length) return null;

  const stimulus = typeof detail.stimulus === "string" ? detail.stimulus : "";
  const stem = typeof detail.stem === "string" ? detail.stem : "";
  const question_text = `${stimulus}${stimulus && stem ? "\n" : ""}${stem}`.trim();
  if (!strip(question_text)) return null;

  return {
    external_id: String(meta.external_id ?? detail.externalid ?? ""),
    question_text,
    options: options.map((o) => String(o.content ?? "")),
    correct_index,
    explanation: typeof detail.rationale === "string" && detail.rationale.trim() ? detail.rationale : null,
    topic: meta.skill_desc ? String(meta.skill_desc) : null,
    domain: meta.primary_class_cd_desc ? String(meta.primary_class_cd_desc) : null,
    difficulty: DIFFICULTY[String(meta.difficulty ?? "M")] ?? "medium",
  };
}

const shuffle = <T,>(arr: T[]) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

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

    // Admin only.
    const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
    if (!token) return json({ error: "Sign in required" }, 401);
    const { data: authData } = await db.auth.getUser(token);
    const caller = authData.user;
    if (!caller) return json({ error: "Sign in required" }, 401);
    const { data: isAdmin } = await db.rpc("has_role", { _user_id: caller.id, _role: "admin" });
    if (!isAdmin) return json({ error: "Admin only" }, 403);

    const conf = SECTIONS[input.section];

    if (input.action === "fetch") {
      const domains = input.domains.length ? input.domains : [...conf.domains];
      const list = (await post("get-questions", {
        asmtEventId: ASMT_EVENT_SAT,
        test: conf.test,
        domain: domains.join(","),
      })) as Json[];

      let pool = Array.isArray(list) ? list : [];
      if (input.difficulties.length) {
        pool = pool.filter((q) => input.difficulties.includes(String(q.difficulty) as "E" | "M" | "H"));
      }
      if (input.skill) pool = pool.filter((q) => String(q.skill_desc ?? "") === input.skill);
      const available = pool.length;
      const skillCounts: Record<string, number> = {};
      for (const q of Array.isArray(list) ? list : []) {
        const k = String(q.skill_desc ?? "");
        if (k) skillCounts[k] = (skillCounts[k] ?? 0) + 1;
      }

      // Skip anything already imported so admins keep getting fresh questions.
      if (input.skip_existing && pool.length) {
        const { data: existing } = await db
          .from("quiz_questions")
          .select("source")
          .like("source", "collegeboard:%")
          .limit(5000);
        const seen = new Set((existing ?? []).map((r) => String(r.source).replace("collegeboard:", "")));
        pool = pool.filter((q) => !seen.has(String(q.external_id)));
      }

      const picked = shuffle(pool).slice(0, input.limit * 2); // extra to cover grid-ins we drop
      const questions: NonNullable<ReturnType<typeof normalise>>[] = [];
      let skipped_grid_ins = 0;

      for (let i = 0; i < picked.length && questions.length < input.limit; i += 5) {
        const batch = picked.slice(i, i + 5);
        const details = await Promise.all(
          batch.map((m) =>
            post("get-question", { external_id: String(m.external_id) })
              .then((d) => normalise(m, d as Json))
              .catch(() => null),
          ),
        );
        for (const d of details) {
          if (!d) { skipped_grid_ins++; continue; }
          if (questions.length < input.limit) questions.push(d);
        }
      }

      return json({ questions, available, remaining: pool.length, skipped_grid_ins, skills: skillCounts });
    }

    // import
    const sources = input.questions.map((q) => `collegeboard:${q.external_id}`);
    const { data: existing } = await db
      .from("quiz_questions")
      .select("source")
      .in("source", sources);
    const seen = new Set((existing ?? []).map((r) => String(r.source)));

    const rows = input.questions
      .filter((q) => !seen.has(`collegeboard:${q.external_id}`))
      .map((q) => ({
        exam_type: "SAT",
        subject_key: conf.label,
        year: null,
        topic: q.topic ?? null,
        domain: q.domain ?? null,
        question_text: q.question_text,
        options: q.options,
        correct_index: q.correct_index,
        explanation: q.explanation ?? null,
        difficulty: q.difficulty ?? "medium",
        access_level: input.access_level,
        is_published: input.is_published,
        source: `collegeboard:${q.external_id}`,
      }));

    let saved = 0;
    if (rows.length) {
      const { data, error } = await db.from("quiz_questions").insert(rows).select("id");
      if (error) {
        for (const row of rows) {
          const { error: e } = await db.from("quiz_questions").insert(row);
          if (!e) saved++;
        }
      } else {
        saved = data?.length ?? 0;
      }
    }

    return json({ saved, skipped: input.questions.length - saved });
  } catch (e) {
    return json({ error: (e as Error).message }, 400);
  }
});
