/** JAMB / WAEC / NECO question bank helpers (sourced from the myschool.ng API). */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const NG_EXAMS = [
  { id: "jamb", label: "JAMB", blurb: "UTME objective questions with worked explanations." },
  { id: "waec", label: "WAEC", blurb: "West African Senior School Certificate past questions." },
  { id: "neco", label: "NECO", blurb: "National Examinations Council SSCE past questions." },
] as const;

export type NgExamId = (typeof NG_EXAMS)[number]["id"];

/** myschool.ng subject slugs paired with the label we store in the question bank. */
export const NG_SUBJECTS = [
  { slug: "mathematics", label: "Mathematics" },
  { slug: "further-mathematics", label: "Further Mathematics" },
  { slug: "physics", label: "Physics" },
  { slug: "chemistry", label: "Chemistry" },
  { slug: "biology", label: "Biology" },
  { slug: "english-language", label: "English Language" },
  { slug: "economics", label: "Economics" },
  { slug: "accounts-principles-of-accounts", label: "Accounting" },
  { slug: "commerce", label: "Commerce" },
  { slug: "government", label: "Government" },
  { slug: "literature-in-english", label: "Literature in English" },
  { slug: "geography", label: "Geography" },
  { slug: "agricultural-science", label: "Agricultural Science" },
  { slug: "computer-studies", label: "Computer Science" },
  { slug: "civic-education", label: "Civic Education" },
] as const;

export const NG_EXAM_KEYS = NG_EXAMS.map((e) => e.label);

export type MyschoolQuestion = {
  question_text: string;
  options: string[];
  correct_index: number;
  explanation: string | null;
  exam_year: string | null;
  topic: string | null;
};

/** Calls the `myschool` edge function (which holds the API key). */
export async function callMyschool<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke("myschool", { body });
  if (error) {
    let message = error.message;
    const res = (error as { context?: Response }).context;
    if (res && typeof res.text === "function") {
      try {
        const parsed = JSON.parse(await res.clone().text());
        if (parsed?.error) message = typeof parsed.error === "string" ? parsed.error : JSON.stringify(parsed.error);
      } catch { /* keep original message */ }
    }
    throw new Error(message);
  }
  if ((data as { error?: unknown })?.error) {
    const e = (data as { error: unknown }).error;
    throw new Error(typeof e === "string" ? e : JSON.stringify(e));
  }
  return data as T;
}

export type NgCount = { exam: string; subject: string; year: number | null; count: number };

/** Question counts per Nigerian exam + subject + year, from our own bank. */
export async function fetchNgCounts(): Promise<NgCount[]> {
  const { data, error } = await supabase
    .from("quiz_questions")
    .select("exam_type, subject_key, year")
    .in("exam_type", NG_EXAM_KEYS)
    .eq("is_published", true)
    .limit(5000);
  if (error) throw error;

  const map = new Map<string, NgCount>();
  for (const row of data ?? []) {
    const key = `${row.exam_type}|${row.subject_key}|${row.year ?? ""}`;
    const existing = map.get(key);
    if (existing) existing.count++;
    else map.set(key, { exam: row.exam_type, subject: row.subject_key, year: row.year, count: 1 });
  }
  return [...map.values()];
}

export function useNgCounts() {
  return useQuery({ queryKey: ["ng-question-counts"], queryFn: fetchNgCounts, staleTime: 5 * 60_000 });
}

/** Deep link into the practice page with filters pre-applied. */
export function quizLink(exam: string, subject?: string, year?: number | null, topic?: string | null) {
  const params = new URLSearchParams({ exam });
  if (subject) params.set("subject", subject);
  if (year) params.set("year", String(year));
  if (topic) params.set("topic", topic);
  return `/quiz?${params.toString()}`;
}
