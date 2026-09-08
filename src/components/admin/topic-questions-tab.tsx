import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, ExternalLink, Eye, EyeOff, Loader2, Plus, Save, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ListSkeleton } from "@/components/skeletons";
import { supabase } from "@/integrations/supabase/client";
import { SUBJECT_OPTIONS } from "@/lib/past-papers";
import { fetchTopicQuestions, groupByPaper, type TopicQuestion } from "@/lib/topic-questions";
import { normalizeDriveUrl } from "@/lib/drive";

type Draft = Partial<Pick<TopicQuestion, "questions_url" | "ms_url" | "video_url" | "access_level" | "topic">>;

const PAPER_CHOICES = ["1", "2", "3", "4", "5", "6"];
const NEW_PAPER = "__new__";

export default function TopicQuestionsTab() {
  const [subject, setSubject] = useState(SUBJECT_OPTIONS[0].id);
  const [rows, setRows] = useState<TopicQuestion[]>([]);
  const [paper, setPaper] = useState<string>("");
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [q, setQ] = useState("");
  const [adding, setAdding] = useState(false);
  const [newTopics, setNewTopics] = useState("");
  const [newPaper, setNewPaper] = useState("1");
  const [customKey, setCustomKey] = useState("");
  const [customLabel, setCustomLabel] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<TopicQuestion | null>(null);

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

  const visibleRows = useMemo(() => {
    const s = q.trim().toLowerCase();
    const list = active?.rows ?? [];
    return s ? list.filter((r) => r.topic.toLowerCase().includes(s)) : list;
  }, [active, q]);

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
        topic: patch.topic !== undefined ? (patch.topic ?? "").trim() : undefined,
      };
      Object.keys(clean).forEach((k) => (clean as any)[k] === undefined && delete (clean as any)[k]);
      const { error } = await (supabase as any).from("topic_questions").update(clean).eq("id", id);
      if (error) { toast.error(error.message); failed = true; }
    }
    setSaving(false);
    if (!failed) toast.success(`Saved ${dirtyKeys.length} topic${dirtyKeys.length === 1 ? "" : "s"}`);
    reload();
  };

  /* ---- CRUD ---- */

  const addTopics = async () => {
    const names = newTopics.split("\n").map((t) => t.trim()).filter(Boolean);
    if (!names.length) { toast.error("Type at least one topic name"); return; }
    const existing = rows.filter((r) => r.paper_key === newPaper);
    const start = existing.reduce((m, r) => Math.max(m, r.sort_order), 0);
    const payload = names.map((topic, i) => ({
      subject_key: subject,
      paper_key: newPaper,
      paper_label: existing[0]?.paper_label ?? `Paper ${newPaper}`,
      topic,
      sort_order: start + i + 1,
      access_level: "free",
      is_published: true,
    }));
    const { error } = await (supabase as any).from("topic_questions").insert(payload);
    if (error) return toast.error(error.message);
    toast.success(`Added ${names.length} topic${names.length === 1 ? "" : "s"}`);
    setAdding(false); setNewTopics("");
    setPaper(newPaper);
    reload();
  };

  const removeTopic = async (row: TopicQuestion) => {
    setRows((r) => r.filter((x) => x.id !== row.id)); // optimistic
    const { error } = await (supabase as any).from("topic_questions").delete().eq("id", row.id);
    if (error) { toast.error(error.message); reload(); return; }
    toast.success("Topic removed");
  };

  const togglePublish = async (row: TopicQuestion) => {
    const next = !row.is_published;
    setRows((r) => r.map((x) => (x.id === row.id ? { ...x, is_published: next } : x)));
    const { error } = await (supabase as any).from("topic_questions").update({ is_published: next }).eq("id", row.id);
    if (error) { toast.error(error.message); setRows((r) => r.map((x) => (x.id === row.id ? { ...x, is_published: !next } : x))); }
  };

  const move = async (row: TopicQuestion, dir: -1 | 1) => {
    const list = active?.rows ?? [];
    const i = list.findIndex((x) => x.id === row.id);
    const other = list[i + dir];
    if (!other) return;
    setRows((r) => r.map((x) =>
      x.id === row.id ? { ...x, sort_order: other.sort_order }
      : x.id === other.id ? { ...x, sort_order: row.sort_order } : x));
    const [a, b] = await Promise.all([
      (supabase as any).from("topic_questions").update({ sort_order: other.sort_order }).eq("id", row.id),
      (supabase as any).from("topic_questions").update({ sort_order: row.sort_order }).eq("id", other.id),
    ]);
    if (a.error || b.error) { toast.error("Could not reorder"); reload(); }
  };

  const complete = (r: TopicQuestion) => !!r.questions_url && !!r.ms_url;
  const filledCount = (active?.rows ?? []).filter(complete).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-4 rounded-2xl border bg-card p-5 shadow-soft">
        <div className="grid gap-1.5">
          <Label className="text-xs">Subject</Label>
          <Select value={subject} onValueChange={setSubject}>
            <SelectTrigger className="w-[240px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {SUBJECT_OPTIONS.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label className="text-xs">Paper</Label>
          <Select value={active?.paper ?? ""} onValueChange={setPaper}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="No papers yet" /></SelectTrigger>
            <SelectContent>
              {papers.map((p) => <SelectItem key={p.paper} value={p.paper}>{p.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label className="text-xs">Find a topic</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search topics…" className="w-[220px] pl-9" />
          </div>
        </div>
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{active?.rows.length ?? 0} topics</Badge>
          <Badge className="bg-brand-green/15 text-brand-green hover:bg-brand-green/15">{filledCount} complete</Badge>
        </div>
        <div className="ml-auto mb-1 flex gap-2">
          <Button variant="outline" onClick={() => { setNewPaper(active?.paper ?? "1"); setAdding(true); }}>
            <Plus /> Add topics
          </Button>
          <Button onClick={saveAll} disabled={!dirtyKeys.length || saving} className="transition-transform active:scale-95">
            {saving ? <Loader2 className="animate-spin" /> : <Save />} Save {dirtyKeys.length || ""} change{dirtyKeys.length === 1 ? "" : "s"}
          </Button>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Paste the question paper link, marking scheme (MS) link and video URL for each topic. Empty fields show as “coming soon” to students.
      </p>

      {loading ? (
        <ListSkeleton rows={6} />
      ) : !active ? (
        <div className="rounded-2xl border border-dashed p-10 text-center">
          <p className="text-muted-foreground">No topics for this subject yet.</p>
          <Button className="mt-4" onClick={() => setAdding(true)}><Plus /> Add the first topics</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleRows.length === 0 && (
            <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">No topic matches “{q}”.</p>
          )}
          {visibleRows.map((r, i) => {
            const d = drafts[r.id] ?? {};
            const val = (k: keyof Draft) => (d[k] !== undefined ? (d[k] as any) : ((r as any)[k] ?? ""));
            const dirty = !!drafts[r.id];
            return (
              <div key={r.id} className={`group grid gap-3 rounded-2xl border bg-card p-4 shadow-soft transition-all duration-200 hover:shadow-lift ${dirty ? "border-primary" : ""}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-bold">{i + 1}</span>
                  <Input
                    value={val("topic")}
                    onChange={(e) => setDraft(r.id, { topic: e.target.value })}
                    className="h-9 max-w-md font-semibold"
                  />
                  {complete(r) ? <Badge className="bg-brand-green/15 text-brand-green hover:bg-brand-green/15">Complete</Badge> : <Badge variant="secondary">Incomplete</Badge>}
                  {!r.is_published && <Badge variant="outline">Hidden</Badge>}
                  <div className="ml-auto flex items-center gap-1 opacity-70 transition-opacity group-hover:opacity-100">
                    <Tooltip><TooltipTrigger asChild>
                      <Button size="icon" variant="ghost" className="size-8" onClick={() => move(r, -1)} disabled={i === 0}><ArrowUp className="size-4" /></Button>
                    </TooltipTrigger><TooltipContent>Move up</TooltipContent></Tooltip>
                    <Tooltip><TooltipTrigger asChild>
                      <Button size="icon" variant="ghost" className="size-8" onClick={() => move(r, 1)} disabled={i === visibleRows.length - 1}><ArrowDown className="size-4" /></Button>
                    </TooltipTrigger><TooltipContent>Move down</TooltipContent></Tooltip>
                    <Tooltip><TooltipTrigger asChild>
                      <Button size="icon" variant="ghost" className="size-8" onClick={() => togglePublish(r)}>{r.is_published ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</Button>
                    </TooltipTrigger><TooltipContent>{r.is_published ? "Hide from students" : "Show to students"}</TooltipContent></Tooltip>
                    {r.questions_url && (
                      <Tooltip><TooltipTrigger asChild>
                        <Button asChild size="icon" variant="ghost" className="size-8"><a href={r.questions_url} target="_blank" rel="noopener"><ExternalLink className="size-4" /></a></Button>
                      </TooltipTrigger><TooltipContent>Open questions</TooltipContent></Tooltip>
                    )}
                    <Tooltip><TooltipTrigger asChild>
                      <Button size="icon" variant="ghost" className="size-8 text-destructive" onClick={() => setConfirmDelete(r)}><Trash2 className="size-4" /></Button>
                    </TooltipTrigger><TooltipContent>Delete topic</TooltipContent></Tooltip>
                  </div>
                </div>
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

      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add topics</DialogTitle>
            <DialogDescription>One topic per line. They are added to the end of the chosen paper.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label className="text-xs">Paper</Label>
              <Select value={newPaper} onValueChange={setNewPaper}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAPER_CHOICES.map((p) => <SelectItem key={p} value={p}>Paper {p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">Topics</Label>
              <textarea
                rows={6}
                value={newTopics}
                onChange={(e) => setNewTopics(e.target.value)}
                placeholder={"Quadratics\nFunctions\nCoordinate geometry"}
                className="w-full rounded-xl border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAdding(false)}>Cancel</Button>
            <Button onClick={addTopics}><Plus /> Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{confirmDelete?.topic}”?</AlertDialogTitle>
            <AlertDialogDescription>Students will no longer see this topic or its links.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (confirmDelete) removeTopic(confirmDelete); setConfirmDelete(null); }}
            >
              <Trash2 /> Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
