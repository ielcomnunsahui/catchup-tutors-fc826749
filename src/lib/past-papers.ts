import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const SESSIONS = ["Feb / March", "May / June", "Oct / Nov"] as const;
export type Session = (typeof SESSIONS)[number];

/** Paper components 1–6 shown per session. */
export const PAPER_GROUPS = ["1", "2", "3", "4", "5", "6"] as const;
export type PaperGroup = (typeof PAPER_GROUPS)[number];

/** Default variants within each component: paper 1 -> 11, 12, 13. */
export const PAPER_VARIANTS = ["1", "2", "3"] as const;

export const variantsOf = (group: string, variants: readonly string[] = PAPER_VARIANTS) =>
  variants.map((v) => `${group}${v}`);

/** All default paper codes (11,12,13,21,…,63). */
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

/** Fallback list used before the admin-managed list loads. */
export const PAPER_YEARS = [2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018];

export const PAPER_YEARS_SETTING_KEY = "past_paper_years";

const normaliseYears = (input: unknown): number[] => {
  const arr = Array.isArray(input) ? input : [];
  const nums = arr.map((v) => Number(v)).filter((n) => Number.isInteger(n) && n >= 1990 && n <= 2100);
  return Array.from(new Set(nums)).sort((a, b) => b - a);
};

/** Admin-managed list of exam years (falls back to PAPER_YEARS). */
export async function fetchPaperYears(): Promise<number[]> {
  const { data } = await supabase
    .from("settings")
    .select("value")
    .eq("key", PAPER_YEARS_SETTING_KEY)
    .maybeSingle();
  const value = data?.value as { years?: unknown } | null;
  const years = normaliseYears(value?.years);
  return years.length ? years : [...PAPER_YEARS];
}

export async function savePaperYears(years: number[]): Promise<number[]> {
  const clean = normaliseYears(years);
  const { error } = await supabase
    .from("settings")
    .upsert({ key: PAPER_YEARS_SETTING_KEY, value: { years: clean }, is_public: true }, { onConflict: "key" });
  if (error) throw error;
  return clean;
}

/** React Query hook for the exam-year list. */
export function usePaperYears() {
  const query = useQuery({ queryKey: ["paper-years"], queryFn: fetchPaperYears });
  return { years: query.data ?? PAPER_YEARS, isLoading: query.isLoading, refetch: query.refetch };
}

export const PAPER_VARIANTS_SETTING_KEY = "past_paper_variants";

const normaliseVariants = (input: unknown): string[] => {
  const arr = Array.isArray(input) ? input : [];
  const vals = arr
    .map((v) => String(v).trim())
    .filter((v) => /^[1-9]$/.test(v));
  return Array.from(new Set(vals)).sort();
};

/** Admin-managed variant digits (falls back to 1, 2, 3). */
export async function fetchPaperVariants(): Promise<string[]> {
  const { data } = await supabase
    .from("settings")
    .select("value")
    .eq("key", PAPER_VARIANTS_SETTING_KEY)
    .maybeSingle();
  const value = data?.value as { variants?: unknown } | null;
  const variants = normaliseVariants(value?.variants);
  return variants.length ? variants : [...PAPER_VARIANTS];
}

export async function savePaperVariants(variants: string[]): Promise<string[]> {
  const clean = normaliseVariants(variants);
  const { error } = await supabase
    .from("settings")
    .upsert({ key: PAPER_VARIANTS_SETTING_KEY, value: { variants: clean }, is_public: true }, { onConflict: "key" });
  if (error) throw error;
  return clean;
}

/** React Query hook for the variant list. */
export function usePaperVariants() {
  const query = useQuery({ queryKey: ["paper-variants"], queryFn: fetchPaperVariants });
  return {
    variants: query.data ?? [...PAPER_VARIANTS],
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}
