import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Loader2, Plus, Trash2, Search, Eye, EyeOff, Crown, Upload, Download,
  Pencil, FileQuestion, CheckCircle2, Filter, X, ChevronDown, ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ListSkeleton } from "@/components/skeletons";
import { supabase } from "@/integrations/supabase/client";

type Row = {
  id: string;
  exam_type: string;
  subject_key: string;
  year: number | null;
  session: string | null;
  paper_number: string | null;
  topic: string | null;
  question_text: string;
  options: string[];
  correct_index: number;
  explanation: string | null;
  access_level: "free" | "premium";
  is_published: boolean;
};

const EXAM_TYPES = ["Cambridge A Level", "IGCSE", "Edexcel", "IB", "SAT", "TMUA"];
const SESSIONS = ["Feb / March", "May / June", "Oct / Nov"];
const ALL = "__all__";

type Draft = {
  id?: string;
  exam_type: string;
  subject_key: string;
  year: string;
  session: string;
  paper_number: string;
  topic: string;
  question_text: string;
  options: string[];
  correct_index: number;
  explanation: string;
  access_level: "free" | "premium";
  is_published: boolean;
};

const emptyDraft: Draft = {
  exam_type: EXAM_TYPES[0],
  subject_key: "",
  year: "",
  session: "",
  paper_number: "",
  topic: "",
  question_text: "",
  options: ["", "", "", ""],
  correct_index: 0,
  explanation: "",
  access_level: "free",
  is_published: true,
};

const CSV_TEMPLATE = [
  "exam_type,subject_key,year,session,paper_number,topic,question_text,option_a,option_b,option_c,option_d,correct_answer,explanation,access_level",
  'Cambridge A Level,Mathematics (9709),2024,May / June,12,Quadratics,"Solve x^2 - 5x + 6 = 0",x = 2 or 3,x = -2 or -3,x = 1 or 6,x = -1 or -6,A,"Factorise: (x-2)(x-3)=0",free',
  'IGCSE,Physics (0625),2023,Oct / Nov,2,Forces,"What is the SI unit of force?",Newton,Joule,Watt,Pascal,A,"Force is measured in newtons (N)",free',
].join("\n");

/** Minimal RFC4180 CSV parser (handles quoted fields, escaped quotes, newlines). */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  const src = text.replace(/\r\n?/g, "\n");
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"') {
        if (src[i + 1] === '"') { field += '"'; i++; } else quoted = false;
      } else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim().length > 0));
}

type ParsedQuestion = {
  exam_type: string;
  subject_key: string;
  year: number | null;
  session: string | null;
  paper_number: string | null;
  topic: string | null;
  question_text: string;
  options: string[];
  correct_index: number;
  explanation: string | null;
  access_level: "free" | "premium";
  is_published: boolean;
};

function rowsToQuestions(text: string): ParsedQuestion[] {
  const rows = parseCsv(text);
  if (rows.length < 2) throw new Error("CSV needs a header row and at least one question");
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const idx = (name: string) => header.indexOf(name);
  const need = ["exam_type", "subject_key", "question_text", "option_a", "option_b", "correct_answer"];
  const missing = need.filter((n) => idx(n) === -1);
  if (missing.length) throw new Error(`Missing column(s): ${missing.join(", ")}`);
  const optionCols = header
    .map((h, i) => ({ h, i }))
    .filter(({ h }) => /^option_[a-h]$/.test(h))
    .sort((a, b) => a.h.localeCompare(b.h));

  const errors: string[] = [];
  const out = rows.slice(1).map((r, n) => {
    const get = (name: string) => (idx(name) === -1 ? "" : (r[idx(name)] ?? "").trim());
    const options = optionCols.map(({ i }) => (r[i] ?? "").trim()).filter(Boolean);
    const raw = get("correct_answer").toUpperCase();
    let correct = /^[A-H]$/.test(raw) ? raw.charCodeAt(0) - 65 : Number(raw) - 1;
    if (!Number.isInteger(correct)) correct = -1;
    const line = n + 2;
    if (!get("question_text")) errors.push(`Row ${line}: question_text is empty`);
    if (options.length < 2) errors.push(`Row ${line}: needs at least 2 options`);
    if (correct < 0 || correct >= options.length) errors.push(`Row ${line}: correct_answer "${raw}" is invalid`);
    const yearRaw = get("year");
    const access = get("access_level").toLowerCase() === "premium" ? "premium" : "free";
    return {
      exam_type: get("exam_type") || EXAM_TYPES[0],
      subject_key: get("subject_key"),
      year: yearRaw ? Number(yearRaw) : null,
      session: get("session") || null,
      paper_number: get("paper_number") || null,
      topic: get("topic") || null,
      question_text: get("question_text"),
      options,
      correct_index: Math.max(0, correct),
      explanation: get("explanation") || null,
      access_level: access as "free" | "premium",
      is_published: true,
    };
  });
  if (errors.length) throw new Error(errors.slice(0, 5).join(" · ") + (errors.length > 5 ? ` · +${errors.length - 5} more` : ""));
  return out;
}

function Stat({ icon: Icon, label, value, tint }: { icon: typeof FileQuestion; label: string; value: number | string; tint: string }) {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className={`grid size-9 place-items-center rounded-xl ${tint}`}><Icon className="size-4" /></div>
      <p className="mt-3 font-display text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

export default function QuizBankTab() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [q, setQ] = useState("");
  const [examFilter, setExamFilter] = useState(ALL);
  const [subjectFilter, setSubjectFilter] = useState(ALL);
  const [statusFilter, setStatusFilter] = useState(ALL);
  const [accessFilter, setAccessFilter] = useState(ALL);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [importing, setImporting] = useState(false);
  const [pendingImport, setPendingImport] = useState<ParsedQuestion[] | null>(null);
  const [deleting, setDeleting] = useState<Row | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [visible, setVisible] = useState(20);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const { data, error } = await supabase.from("quiz_questions").select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows(((data ?? []) as unknown as Row[]).map((r) => ({ ...r, options: Array.isArray(r.options) ? r.options : [] })));
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const subjects = useMemo(
    () => Array.from(new Set(rows.map((r) => r.subject_key).filter(Boolean))).sort(),
    [rows],
  );

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (examFilter !== ALL && r.exam_type !== examFilter) return false;
      if (subjectFilter !== ALL && r.subject_key !== subjectFilter) return false;
      if (statusFilter === "published" && !r.is_published) return false;
      if (statusFilter === "hidden" && r.is_published) return false;
      if (accessFilter !== ALL && r.access_level !== accessFilter) return false;
      if (!s) return true;
      return [r.question_text, r.subject_key, r.exam_type, r.topic ?? "", String(r.year ?? ""), ...r.options]
        .join(" ").toLowerCase().includes(s);
    });
  }, [rows, q, examFilter, subjectFilter, statusFilter, accessFilter]);

  useEffect(() => { setVisible(20); }, [q, examFilter, subjectFilter, statusFilter, accessFilter]);

  const activeFilters = [examFilter, subjectFilter, statusFilter, accessFilter].filter((f) => f !== ALL).length + (q ? 1 : 0);
  const clearFilters = () => { setQ(""); setExamFilter(ALL); setSubjectFilter(ALL); setStatusFilter(ALL); setAccessFilter(ALL); };

  const downloadTemplate = () => {
    const url = URL.createObjectURL(new Blob([CSV_TEMPLATE], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "quiz-questions-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCsv = () => {
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const maxOpts = Math.max(4, ...filtered.map((r) => r.options.length));
    const header = ["exam_type", "subject_key", "year", "session", "paper_number", "topic", "question_text",
      ...Array.from({ length: maxOpts }, (_, i) => `option_${String.fromCharCode(97 + i)}`),
      "correct_answer", "explanation", "access_level"];
    const body = filtered.map((r) => [
      r.exam_type, r.subject_key, r.year ?? "", r.session ?? "", r.paper_number ?? "", r.topic ?? "", r.question_text,
      ...Array.from({ length: maxOpts }, (_, i) => r.options[i] ?? ""),
      String.fromCharCode(65 + r.correct_index), r.explanation ?? "", r.access_level,
    ].map(esc).join(","));
    const url = URL.createObjectURL(new Blob([[header.join(","), ...body].join("\n")], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "quiz-questions.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const readFile = async (file: File) => {
    try {
      const questions = rowsToQuestions(await file.text());
      if (!questions.length) throw new Error("No question rows found");
      setPendingImport(questions);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not read that file");
    }
  };

  const confirmImport = async () => {
    if (!pendingImport) return;
    setImporting(true);
    const { error } = await supabase.from("quiz_questions").insert(pendingImport);
    setImporting(false);
    setPendingImport(null);
    if (error) return toast.error(error.message);
    toast.success(`Imported ${pendingImport.length} question${pendingImport.length === 1 ? "" : "s"}`);
    load();
  };

  const openNew = () => setDraft({ ...emptyDraft });
  const openEdit = (r: Row) => setDraft({
    id: r.id,
    exam_type: r.exam_type,
    subject_key: r.subject_key,
    year: r.year ? String(r.year) : "",
    session: r.session ?? "",
    paper_number: r.paper_number ?? "",
    topic: r.topic ?? "",
    question_text: r.question_text,
    options: r.options.length ? [...r.options] : ["", ""],
    correct_index: r.correct_index,
    explanation: r.explanation ?? "",
    access_level: r.access_level,
    is_published: r.is_published,
  });

  const save = async () => {
    if (!draft) return;
    const options = draft.options.map((o) => o.trim()).filter(Boolean);
    if (!draft.question_text.trim()) return toast.error("Question text is required");
    if (!draft.subject_key.trim()) return toast.error("Course / subject is required");
    if (options.length < 2) return toast.error("Add at least two options");
    if (draft.correct_index >= options.length) return toast.error("Pick a valid correct answer");
    setSaving(true);
    const payload = {
      exam_type: draft.exam_type,
      subject_key: draft.subject_key.trim(),
      year: draft.year ? Number(draft.year) : null,
      session: draft.session || null,
      paper_number: draft.paper_number.trim() || null,
      topic: draft.topic.trim() || null,
      question_text: draft.question_text.trim(),
      options,
      correct_index: draft.correct_index,
      explanation: draft.explanation.trim() || null,
      access_level: draft.access_level,
      is_published: draft.is_published,
    };
    const { error } = draft.id
      ? await supabase.from("quiz_questions").update(payload).eq("id", draft.id)
      : await supabase.from("quiz_questions").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(draft.id ? "Question updated" : "Question added");
    setDraft(draft.id ? null : {
      ...emptyDraft,
      exam_type: draft.exam_type,
      subject_key: draft.subject_key,
      year: draft.year,
      session: draft.session,
      topic: draft.topic,
    });
    load();
  };

  const toggle = async (row: Row, patch: Partial<Row>) => {
    setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, ...patch } : r)));
    const { error } = await supabase.from("quiz_questions").update(patch).eq("id", row.id);
    if (error) {
      setRows((prev) => prev.map((r) => (r.id === row.id ? row : r)));
      toast.error(error.message);
    }
  };

  const remove = async () => {
    if (!deleting) return;
    const row = deleting;
    setDeleting(null);
    setRows((prev) => prev.filter((r) => r.id !== row.id));
    const { error } = await supabase.from("quiz_questions").delete().eq("id", row.id);
    if (error) { toast.error(error.message); load(); return; }
    toast.success("Question deleted");
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={FileQuestion} label="Questions in bank" value={rows.length} tint="bg-primary/10 text-primary" />
        <Stat icon={CheckCircle2} label="Live for students" value={rows.filter((r) => r.is_published).length} tint="bg-emerald-500/10 text-emerald-600" />
        <Stat icon={Crown} label="Premium only" value={rows.filter((r) => r.access_level === "premium").length} tint="bg-brand-orange/10 text-brand-orange" />
        <Stat icon={Filter} label="Courses covered" value={subjects.length} tint="bg-sky-500/10 text-sky-600" />
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold">Bulk import from a spreadsheet</p>
          <p className="text-xs text-muted-foreground">
            Download the template, fill one question per row, then upload it back. You’ll see a preview before anything is saved.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={downloadTemplate}><Download className="size-4" /> Template</Button>
          <Button size="sm" variant="outline" onClick={exportCsv} disabled={!filtered.length}><Download className="size-4" /> Export</Button>
          <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()} disabled={importing}>
            {importing ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />} Import CSV
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) readFile(f); }}
          />
          <Button size="sm" onClick={openNew}><Plus className="size-4" /> New question</Button>
        </div>
      </div>

      <div className="sticky top-16 z-10 space-y-3 rounded-2xl border bg-card/95 p-4 backdrop-blur">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search question, option, course or topic…" className="pl-9" />
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <Select value={examFilter} onValueChange={setExamFilter}>
            <SelectTrigger><SelectValue placeholder="Exam type" /></SelectTrigger>
            <SelectContent className="bg-popover">
              <SelectItem value={ALL}>All exam types</SelectItem>
              {Array.from(new Set([...EXAM_TYPES, ...rows.map((r) => r.exam_type)])).map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={subjectFilter} onValueChange={setSubjectFilter}>
            <SelectTrigger><SelectValue placeholder="Course" /></SelectTrigger>
            <SelectContent className="bg-popover">
              <SelectItem value={ALL}>All courses</SelectItem>
              {subjects.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent className="bg-popover">
              <SelectItem value={ALL}>Published & hidden</SelectItem>
              <SelectItem value="published">Published only</SelectItem>
              <SelectItem value="hidden">Hidden only</SelectItem>
            </SelectContent>
          </Select>
          <Select value={accessFilter} onValueChange={setAccessFilter}>
            <SelectTrigger><SelectValue placeholder="Access" /></SelectTrigger>
            <SelectContent className="bg-popover">
              <SelectItem value={ALL}>Free & premium</SelectItem>
              <SelectItem value="free">Free</SelectItem>
              <SelectItem value="premium">Premium</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Showing {Math.min(visible, filtered.length)} of {filtered.length} question{filtered.length === 1 ? "" : "s"}</span>
          {activeFilters > 0 && (
            <Button size="sm" variant="ghost" onClick={clearFilters}><X className="size-3.5" /> Clear filters</Button>
          )}
        </div>
      </div>

      {loading ? (
        <ListSkeleton rows={5} />
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-10 text-center">
          <FileQuestion className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 text-sm font-medium">{rows.length ? "No questions match these filters" : "Your quiz bank is empty"}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {rows.length ? "Try clearing the filters." : "Add one question, or import a filled-in template."}
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {rows.length ? <Button size="sm" variant="outline" onClick={clearFilters}>Clear filters</Button> : null}
            <Button size="sm" onClick={openNew}><Plus className="size-4" /> New question</Button>
            <Button size="sm" variant="outline" onClick={downloadTemplate}><Download className="size-4" /> Template</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.slice(0, visible).map((r) => (
            <div key={r.id} className="rounded-2xl border bg-card p-4 transition-shadow hover:shadow-md">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <Badge variant="secondary">{r.exam_type}</Badge>
                <Badge variant="outline">{r.subject_key}</Badge>
                {r.year && <Badge variant="outline">{r.year}{r.session ? ` · ${r.session}` : ""}</Badge>}
                {r.paper_number && <Badge variant="outline">Paper {r.paper_number}</Badge>}
                {r.topic && <Badge variant="outline">{r.topic}</Badge>}
                {r.access_level === "premium" && <Badge className="bg-brand-orange/10 text-brand-orange"><Crown className="mr-1 size-3" />Premium</Badge>}
                {!r.is_published && <Badge variant="outline" className="text-muted-foreground">Hidden</Badge>}
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm">{r.question_text}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Answer: {String.fromCharCode(65 + r.correct_index)} — {r.options[r.correct_index]}
              </p>

              {expanded === r.id && (
                <div className="mt-3 space-y-1.5 rounded-xl bg-muted/40 p-3 text-sm">
                  {r.options.map((o, i) => (
                    <p key={i} className={i === r.correct_index ? "font-medium text-emerald-600" : "text-muted-foreground"}>
                      {String.fromCharCode(65 + i)}. {o}
                    </p>
                  ))}
                  {r.explanation && <p className="pt-2 text-xs text-muted-foreground">Explanation: {r.explanation}</p>}
                </div>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant="ghost" onClick={() => setExpanded(expanded === r.id ? null : r.id)}>
                  {expanded === r.id ? <><ChevronUp className="size-4" /> Hide options</> : <><ChevronDown className="size-4" /> Show options</>}
                </Button>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="sm" variant="outline" onClick={() => openEdit(r)}><Pencil className="size-4" /> Edit</Button>
                  </TooltipTrigger>
                  <TooltipContent>Change the wording, options or answer</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="sm" variant="outline" onClick={() => toggle(r, { is_published: !r.is_published })}>
                      {r.is_published ? <><EyeOff className="size-4" /> Unpublish</> : <><Eye className="size-4" /> Publish</>}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{r.is_published ? "Hide from students" : "Show to students"}</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="sm" variant="outline" onClick={() => toggle(r, { access_level: r.access_level === "premium" ? "free" : "premium" })}>
                      <Crown className="size-4" /> {r.access_level === "premium" ? "Make free" : "Make premium"}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{r.access_level === "premium" ? "Open to every student" : "Only paying students"}</TooltipContent>
                </Tooltip>
                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setDeleting(r)}>
                  <Trash2 className="size-4" /> Delete
                </Button>
              </div>
            </div>
          ))}
          {visible < filtered.length && (
            <Button variant="outline" className="w-full" onClick={() => setVisible((v) => v + 20)}>
              Load 20 more
            </Button>
          )}
        </div>
      )}

      <Sheet open={!!draft} onOpenChange={(o) => !o && setDraft(null)}>
        <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{draft?.id ? "Edit question" : "Add question"}</SheetTitle>
            <SheetDescription>Tick the circle next to the correct option.</SheetDescription>
          </SheetHeader>
          {draft && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Exam type</Label>
                <Select value={draft.exam_type} onValueChange={(v) => setDraft({ ...draft, exam_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-popover">{Array.from(new Set([...EXAM_TYPES, draft.exam_type])).map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Course / subject</Label>
                <Input value={draft.subject_key} onChange={(e) => setDraft({ ...draft, subject_key: e.target.value })} placeholder="e.g. Mathematics (9709)" list="quiz-subjects" />
                <datalist id="quiz-subjects">{subjects.map((s) => <option key={s} value={s} />)}</datalist>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Year</Label>
                  <Input inputMode="numeric" value={draft.year} onChange={(e) => setDraft({ ...draft, year: e.target.value })} placeholder="2025" />
                </div>
                <div className="space-y-2">
                  <Label>Paper</Label>
                  <Input value={draft.paper_number} onChange={(e) => setDraft({ ...draft, paper_number: e.target.value })} placeholder="12" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Session</Label>
                <Select value={draft.session || "none"} onValueChange={(v) => setDraft({ ...draft, session: v === "none" ? "" : v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="none">Not set</SelectItem>
                    {SESSIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Topic</Label>
                <Input value={draft.topic} onChange={(e) => setDraft({ ...draft, topic: e.target.value })} placeholder="Quadratics" />
              </div>
              <div className="space-y-2">
                <Label>Question</Label>
                <Textarea rows={4} value={draft.question_text} onChange={(e) => setDraft({ ...draft, question_text: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Options (tick the correct one)</Label>
                {draft.options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <button
                      type="button"
                      aria-label={`Mark option ${String.fromCharCode(65 + i)} correct`}
                      onClick={() => setDraft({ ...draft, correct_index: i })}
                      className={`grid size-7 shrink-0 place-items-center rounded-full border text-xs font-bold transition-colors ${draft.correct_index === i ? "border-primary bg-primary text-primary-foreground" : "hover:border-primary"}`}
                    >
                      {String.fromCharCode(65 + i)}
                    </button>
                    <Input
                      value={opt}
                      onChange={(e) => setDraft({ ...draft, options: draft.options.map((o, j) => (j === i ? e.target.value : o)) })}
                      placeholder={`Option ${String.fromCharCode(65 + i)}`}
                    />
                    {draft.options.length > 2 && (
                      <Button
                        type="button" size="icon" variant="ghost" className="shrink-0 text-muted-foreground"
                        aria-label={`Remove option ${String.fromCharCode(65 + i)}`}
                        onClick={() => setDraft({
                          ...draft,
                          options: draft.options.filter((_, j) => j !== i),
                          correct_index: Math.max(0, draft.correct_index > i ? draft.correct_index - 1 : draft.correct_index === i ? 0 : draft.correct_index),
                        })}
                      >
                        <X className="size-4" />
                      </Button>
                    )}
                  </div>
                ))}
                {draft.options.length < 8 && (
                  <Button type="button" size="sm" variant="ghost" onClick={() => setDraft({ ...draft, options: [...draft.options, ""] })}>
                    <Plus className="size-4" /> Add option
                  </Button>
                )}
              </div>
              <div className="space-y-2">
                <Label>Explanation (shown after submit)</Label>
                <Textarea rows={3} value={draft.explanation} onChange={(e) => setDraft({ ...draft, explanation: e.target.value })} />
              </div>
              <div className="flex items-center justify-between rounded-xl border p-3">
                <div>
                  <p className="text-sm font-medium">Premium only</p>
                  <p className="text-xs text-muted-foreground">Locked for free accounts</p>
                </div>
                <Switch checked={draft.access_level === "premium"} onCheckedChange={(v) => setDraft({ ...draft, access_level: v ? "premium" : "free" })} />
              </div>
              <div className="flex items-center justify-between rounded-xl border p-3">
                <div>
                  <p className="text-sm font-medium">Published</p>
                  <p className="text-xs text-muted-foreground">Visible in student quizzes</p>
                </div>
                <Switch checked={draft.is_published} onCheckedChange={(v) => setDraft({ ...draft, is_published: v })} />
              </div>
            </div>
          )}
          <SheetFooter className="sticky bottom-0 gap-2 border-t bg-background py-3">
            <Button variant="outline" onClick={() => setDraft(null)}>Cancel</Button>
            <Button disabled={saving} onClick={save}>
              {saving ? <Loader2 className="animate-spin" /> : <Plus />} {draft?.id ? "Save changes" : "Add question"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!pendingImport} onOpenChange={(o) => !o && setPendingImport(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Import {pendingImport?.length} question{pendingImport?.length === 1 ? "" : "s"}?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm">
                <p>Everything checked out. First few rows:</p>
                <ul className="space-y-1 rounded-xl bg-muted/50 p-3 text-xs">
                  {pendingImport?.slice(0, 3).map((p, i) => (
                    <li key={i} className="line-clamp-2">{p.subject_key} — {p.question_text}</li>
                  ))}
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmImport} disabled={importing}>
              {importing ? "Importing…" : "Import"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this question?</AlertDialogTitle>
            <AlertDialogDescription>
              It will be removed from the bank and from future quizzes. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={remove}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
