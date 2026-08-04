import { supabase } from "@/integrations/supabase/client";

export const SESSIONS = ["Feb / March", "May / June", "Oct / Nov"] as const;
export type Session = (typeof SESSIONS)[number];

/** Paper components 1–6 shown per session. */
export const PAPER_GROUPS = ["1", "2", "3", "4", "5", "6"] as const;
export type PaperGroup = (typeof PAPER_GROUPS)[number];

/** Variants within each component: paper 1 -> 11, 12, 13. */
export const PAPER_VARIANTS = ["1", "2", "3"] as const;

export const variantsOf = (group: string) => PAPER_VARIANTS.map((v) => `${group}${v}`);

/** All 18 paper codes (11,12,13,21,…,63). */
export const PAPER_NUMBERS = PAPER_GROUPS.flatMap((g) => variantsOf(g));
export type PaperNumber = string;

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
  file_name?: string | null;
  file_size_kb?: number | null;
  created_at?: string;
  updated_at?: string;
};

/** Best-effort readable file name for a stored paper. */
export function paperFileName(p: PastPaper) {
  if (p.file_name?.trim()) return p.file_name.trim();
  try {
    const last = decodeURIComponent(new URL(p.file_url).pathname.split("/").filter(Boolean).pop() ?? "");
    if (last && /\.[a-z0-9]{2,5}$/i.test(last)) return last;
  } catch { /* not a parseable URL */ }
  const doc = p.doc_type === "question_paper" ? "qp" : "ms";
  const session = p.session.replace(/[^a-z]/gi, "").slice(0, 3).toLowerCase();
  return `${p.subject_key}_${session}${String(p.year).slice(2)}_${doc}_${p.paper_number}.pdf`;
}

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

export const SUBJECT_OPTIONS = [
  { id: "math-9709", label: "Cambridge · Mathematics (9709)" },
  { id: "fmath-9231", label: "Cambridge · Further Mathematics (9231)" },
  { id: "math-0580", label: "IGCSE · Mathematics (0580)" },
  { id: "fmath-0606", label: "IGCSE · Additional Mathematics (0606)" },
];

export const PAPER_YEARS = [2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018];
