import { supabase } from "@/integrations/supabase/client";

export const SESSIONS = ["Feb / March", "May / June", "Oct / Nov"] as const;
export type Session = (typeof SESSIONS)[number];

export const PAPER_NUMBERS = ["12", "22", "32", "42", "52", "62"] as const;
export type PaperNumber = (typeof PAPER_NUMBERS)[number];

export const DOC_TYPES = ["question_paper", "mark_scheme"] as const;
export type DocType = (typeof DOC_TYPES)[number];

export const docTypeLabel = (t: DocType) => (t === "question_paper" ? "Question Paper" : "Mark Scheme");

export type PastPaper = {
  id: string;
  subject_key: string;
  year: number;
  session: string;
  paper_number: string;
  doc_type: string;
  title: string | null;
  file_url: string;
  access_level: "free" | "premium";
  is_published: boolean;
};

/** key: `${subject_key}|${year}|${session}|${paper_number}|${doc_type}` */
export const paperKey = (subjectKey: string, year: number, session: string, paper: string, doc: string) =>
  `${subjectKey}|${year}|${session}|${paper}|${doc}`;

export async function fetchPastPapers(subjectKey?: string) {
  let query = supabase.from("past_papers").select("*").order("year", { ascending: false });
  if (subjectKey) query = query.eq("subject_key", subjectKey);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as PastPaper[];
}

export function indexPapers(rows: PastPaper[]) {
  const map = new Map<string, PastPaper>();
  for (const r of rows) map.set(paperKey(r.subject_key, r.year, r.session, r.paper_number, r.doc_type), r);
  return map;
}
