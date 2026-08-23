import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { SUBJECT_OPTIONS } from "@/lib/past-papers";
import { fetchTopicQuestions, groupByPaper, type TopicQuestion } from "@/lib/topic-questions";
import { normalizeDriveUrl } from "@/lib/drive";

type Draft = Partial<Pick<TopicQuestion, "questions_url" | "ms_url" | "video_url" | "access_level">>;

export default function TopicQuestionsTab() {
  const [subject, setSubject] = useState(SUBJECT_OPTIONS[0].id);
  const [rows, setRows] = useState<TopicQuestion[]>([]);
  const [paper, setPaper] = useState<string>("");
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const reload = async () => {
    setLoading(true);
    try {
      const data = await fetchTopicQuestions(subject);
      setRows(data);
      setDrafts({});
      setPaper((p) => (data.some((r) => r.paper_key === p) ? p : (data[0]?.paper_key ?? "")));
    } catch (e: any) {
      toast.error(e.message ?? "Failed to load topics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { reload(); /* eslint-disable-next-line */ }, [subject]);

  const papers = useMemo(() => groupByPaper(rows), [rows]);
  const active = papers.find((p) => p.paper === paper) ?? papers[0] ?? null;

  const dirtyKeys = Object.keys(drafts);

  const setDraft = (id: string, patch: Draft) =>
    setDrafts((d) => ({ ...d, [id]: { ...(d[id] ?? {}), ...patch } }));

  const saveAll = async () => {
    if (!dirtyKeys.length) return;
    setSaving(true);
    let failed = false;
    for (const id of dirtyKeys) {
      const patch = drafts[id];
      const clean: Draft = {
        ...patch,
        questions_url: patch.questions_url !== undefined ? normalizeDriveUrl(patch.questions_url) : undefined,
        ms_url: patch.ms_url !== undefined ? normalizeDriveUrl(patch.ms_url) : undefined,
        video_url: patch.video_url !== undefined ? ((patch.video_url ?? "").trim() || null) : undefined,
      };
      Object.keys(clean).forEach((k) => (clean as any)[k] === undefined && delete (clean as any)[k]);
      const { error } = await (supabase as any).from("topic_questions").update(clean).eq("id", id);
      if (error) { toast.error(error.message); failed = true; }
    }
    setSaving(false);
    if (!failed) toast.success(`Saved ${dirtyKeys.length} topic(s)`);
    reload();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-4 rounded-2xl border bg-card p-5">
        <div className="grid gap-1.5">
          <Label className="text-xs">Subject</Label>
          <Select value={subject} onValueChange={setSubject}>
            <SelectTrigger className="w-[280px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {SUBJECT_OPTIONS.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label className="text-xs">Paper</Label>
          <Select value={active?.paper ?? ""} onValueChange={setPaper}>
            <SelectTrigger className="w-[280px]"><SelectValue placeholder="No papers" /></SelectTrigger>
            <SelectContent>
              {papers.map((p) => <SelectItem key={p.paper} value={p.paper}>{p.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Badge variant="secondary" className="mb-1">{active?.rows.length ?? 0} topics</Badge>
        <Button className="ml-auto" onClick={saveAll} disabled={!dirtyKeys.length || saving}>
          {saving ? <Loader2 className="animate-spin" /> : <Save />} Save {dirtyKeys.length || ""} change{dirtyKeys.length === 1 ? "" : "s"}
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        Paste the question paper link, marking scheme (MS) link and video URL for each topic. Empty fields show as “coming soon” to students.
      </p>

      {loading ? (
        <div className="flex h-40 items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>
      ) : !active ? (
        <p className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">No topics seeded for this subject yet.</p>
      ) : (
        <div className="space-y-3">
          {active.rows.map((r) => {
            const d = drafts[r.id] ?? {};
            const val = (k: keyof Draft) => (d[k] !== undefined ? (d[k] as any) : ((r as any)[k] ?? ""));
            const dirty = !!drafts[r.id];
            return (
              <div key={r.id} className={`grid gap-2 rounded-2xl border bg-card p-4 ${dirty ? "border-primary" : ""}`}>
                <p className="font-display text-sm font-bold">{r.sort_order}. {r.topic}</p>
                <div className="grid gap-2 lg:grid-cols-4">
                  <Input value={val("questions_url")} placeholder="Questions URL"
                    onChange={(e) => setDraft(r.id, { questions_url: e.target.value })} />
                  <Input value={val("ms_url")} placeholder="Marking scheme (MS) URL"
                    onChange={(e) => setDraft(r.id, { ms_url: e.target.value })} />
                  <Input value={val("video_url")} placeholder="Video URL (YouTube)"
                    onChange={(e) => setDraft(r.id, { video_url: e.target.value })} />
                  <Select value={val("access_level") || "free"} onValueChange={(v) => setDraft(r.id, { access_level: v as any })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
