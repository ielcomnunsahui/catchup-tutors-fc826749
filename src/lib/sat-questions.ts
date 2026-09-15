/** College Board SAT Suite Question Bank helpers (public, no key required). */
import { supabase } from "@/integrations/supabase/client";

export const SAT_EXAM_KEY = "SAT";

export const SAT_SECTIONS = [
  {
    id: "math",
    label: "Math",
    subjectKey: "Math",
    domains: [
      { code: "H", label: "Algebra" },
      { code: "P", label: "Advanced Math" },
      { code: "Q", label: "Problem-Solving and Data Analysis" },
      { code: "S", label: "Geometry and Trigonometry" },
    ],
  },
  {
    id: "reading-writing",
    label: "Reading and Writing",
    subjectKey: "Reading and Writing",
    domains: [
      { code: "INI", label: "Information and Ideas" },
      { code: "CAS", label: "Craft and Structure" },
      { code: "EOI", label: "Expression of Ideas" },
      { code: "SEC", label: "Standard English Conventions" },
    ],
  },
] as const;

export type SatSectionId = (typeof SAT_SECTIONS)[number]["id"];

export const SAT_DIFFICULTIES = [
  { code: "E", label: "Easy" },
  { code: "M", label: "Medium" },
  { code: "H", label: "Hard" },
] as const;

export type SatQuestion = {
  external_id: string;
  question_text: string;
  options: string[];
  correct_index: number;
  explanation: string | null;
  topic: string | null;
  domain: string | null;
  difficulty: string;
};

/** Calls the admin-only `sat-questions` edge function. */
export async function callSat<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke("sat-questions", { body });
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
