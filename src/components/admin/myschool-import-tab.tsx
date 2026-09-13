import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Download, Loader2, Save, Sparkles, Coins, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ListSkeleton } from "@/components/skeletons";
import { NG_EXAMS, NG_SUBJECTS, callMyschool, type MyschoolQuestion, type NgExamId } from "@/lib/nigerian-exams";

const PAGE_SIZE = 5; // the API returns 5 questions per credit
const BATCHES = [1, 2, 4, 8, 12, 20];

export default function MyschoolImportTab() {
  const [exam, setExam] = useState<NgExamId>("jamb");
  const [subject, setSubject] = useState<string>(NG_SUBJECTS[0].slug);
  const [year, setYear] = useState("");
  const [topic, setTopic] = useState("");
  const [pages, setPages] = useState(4);
  const [accessLevel, setAccessLevel] = useState<"free" | "premium">("free");
  const [publish, setPublish] = useState(true);

  const [fetching, setFetching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<MyschoolQuestion[] | null>(null);
  const [meta, setMeta] = useState<{ total_questions: number; total_pages: number; credits: number } | null>(null);
  const [result, setResult] = useState<{ saved: number; skipped: number } | null>(null);

  const subjectLabel = useMemo(
    () => NG_SUBJECTS.find((s) => s.slug === subject)?.label ?? subject,
    [subject],
  );

  const load = async () => {
    setFetching(true);
    setResult(null);
    try {
      const data = await callMyschool<{
        questions: MyschoolQuestion[]; total_questions: number; total_pages: number; credits: number;
      }>({
        action: "past_questions",
        subject,
        exam_type: exam,
        exam_year: year.trim() || undefined,
        topic: topic.trim() || undefined,
        pages,
      });
      setPreview(data.questions);
      setMeta({ total_questions: data.total_questions, total_pages: data.total_pages, credits: data.credits });
      if (!data.questions.length) toast.message("No questions found for those filters.");
      else toast.success(`Fetched ${data.questions.length} questions (${data.credits} credits used).`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setFetching(false);
    }
  };

  const save = async () => {
    if (!preview?.length) return;
    setSaving(true);
    try {
      const data = await callMyschool<{ saved: number; skipped: number }>({
        action: "import_questions",
        subject,
        subject_label: subjectLabel,
        exam_type: exam,
        access_level: accessLevel,
        is_published: publish,
        questions: preview,
      });
      setResult(data);
      toast.success(`Saved ${data.saved} questions${data.skipped ? `, skipped ${data.skipped} duplicates` : ""}.`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold">Nigerian past questions</h2>
          <p className="text-sm text-muted-foreground">
            Pull JAMB, WAEC and NECO questions with answers and explanations, preview them, then add them to your quiz bank.
          </p>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="secondary" className="gap-1.5">
              <Coins className="size-3.5" /> {pages} credit{pages === 1 ? "" : "s"} per fetch
            </Badge>
          </TooltipTrigger>
          <TooltipContent>Each credit returns {PAGE_SIZE} questions. Saving to your own bank is free.</TooltipContent>
        </Tooltip>
      </div>

      <div className="grid gap-4 rounded-2xl border bg-card p-5 shadow-soft sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-1.5">
          <Label>Exam</Label>
          <Select value={exam} onValueChange={(v) => setExam(v as NgExamId)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {NG_EXAMS.map((e) => <SelectItem key={e.id} value={e.id}>{e.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Subject</Label>
          <Select value={subject} onValueChange={setSubject}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {NG_SUBJECTS.map((s) => <SelectItem key={s.slug} value={s.slug}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Year (optional)</Label>
          <Input value={year} onChange={(e) => setYear(e.target.value)} placeholder="e.g. 2022" maxLength={4} />
        </div>

        <div className="space-y-1.5">
          <Label>Topic (optional)</Label>
          <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Algebra" maxLength={120} />
        </div>

        <div className="space-y-1.5">
          <Label>How many to fetch</Label>
          <Select value={String(pages)} onValueChange={(v) => setPages(Number(v))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {BATCHES.map((b) => (
                <SelectItem key={b} value={String(b)}>{b * PAGE_SIZE} questions · {b} credit{b === 1 ? "" : "s"}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Access</Label>
          <Select value={accessLevel} onValueChange={(v) => setAccessLevel(v as "free" | "premium")}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="free">Free for everyone</SelectItem>
              <SelectItem value="premium">Premium only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-3">
          <Switch checked={publish} onCheckedChange={setPublish} id="ms-publish" />
          <Label htmlFor="ms-publish" className="cursor-pointer">Publish immediately after saving</Label>
          <Button onClick={load} disabled={fetching} className="ml-auto transition-transform active:scale-95">
            {fetching ? <Loader2 className="animate-spin" /> : <Download />} Fetch questions
          </Button>
        </div>
      </div>

      {fetching && <ListSkeleton rows={4} />}

      {!fetching && preview && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border bg-card p-4 shadow-soft">
            <Sparkles className="size-4 text-primary" />
            <p className="text-sm">
              <strong>{preview.length}</strong> questions ready for <strong>{exam.toUpperCase()} · {subjectLabel}</strong>
              {meta?.total_questions ? <> — {meta.total_questions} exist in total for these filters</> : null}
            </p>
            <Button onClick={save} disabled={saving || !preview.length} className="ml-auto transition-transform active:scale-95">
              {saving ? <Loader2 className="animate-spin" /> : <Save />} Save to quiz bank
            </Button>
          </div>

          {result && (
            <div className="flex items-center gap-2 rounded-2xl border border-brand-green/40 bg-brand-green/5 p-4 text-sm">
              <CheckCircle2 className="size-4 text-brand-green" />
              Saved {result.saved} new questions{result.skipped ? `, ${result.skipped} were already in the bank` : ""}.
            </div>
          )}

          {!preview.length && (
            <div className="flex items-center gap-2 rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
              <AlertTriangle className="size-4" /> Nothing came back — try another subject, year or topic.
            </div>
          )}

          <ol className="space-y-3">
            {preview.map((q, i) => (
              <li key={`${i}-${q.question_text.slice(0, 24)}`} className="rounded-2xl border bg-card p-4 shadow-soft">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline">{exam.toUpperCase()}</Badge>
                  {q.exam_year && <Badge variant="secondary">{q.exam_year}</Badge>}
                  {q.topic && <Badge variant="secondary">{q.topic}</Badge>}
                </div>
                <p className="mt-2 text-sm font-medium">{i + 1}. {q.question_text}</p>
                <ul className="mt-2 grid gap-1 sm:grid-cols-2">
                  {q.options.map((o, oi) => (
                    <li
                      key={oi}
                      className={`rounded-lg px-3 py-1.5 text-sm ${oi === q.correct_index ? "bg-brand-green/10 font-semibold text-brand-green" : "bg-muted/50"}`}
                    >
                      {String.fromCharCode(65 + oi)}. {o}
                    </li>
                  ))}
                </ul>
                {q.explanation && <p className="mt-2 text-xs text-muted-foreground">{q.explanation}</p>}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
