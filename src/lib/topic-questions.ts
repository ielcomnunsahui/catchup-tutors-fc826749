import { supabase } from "@/integrations/supabase/client";

export type TopicQuestion = {
  id: string;
  subject_key: string;
  paper_key: string;
  paper_label: string;
  topic: string;
  sort_order: number;
  questions_url: string | null;
  ms_url: string | null;
  video_url: string | null;
  access_level: "free" | "premium";
  is_published: boolean;
};

export type TopicPaperGroup = {
  paper: string;
  label: string;
  rows: TopicQuestion[];
};

export async function fetchTopicQuestions(subjectKey?: string) {
  let query = (supabase as any)
    .from("topic_questions")
    .select("*")
    .order("paper_key", { ascending: true })
    .order("sort_order", { ascending: true });
  if (subjectKey) query = query.eq("subject_key", subjectKey);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as TopicQuestion[];
}

export function groupByPaper(rows: TopicQuestion[]): TopicPaperGroup[] {
  const map = new Map<string, TopicPaperGroup>();
  for (const r of rows) {
    if (!map.has(r.paper_key)) map.set(r.paper_key, { paper: r.paper_key, label: r.paper_label, rows: [] });
    map.get(r.paper_key)!.rows.push(r);
  }
  return [...map.values()];
}
