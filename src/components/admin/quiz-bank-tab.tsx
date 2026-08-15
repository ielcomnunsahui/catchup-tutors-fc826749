import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Search, Eye, EyeOff, Crown, Upload, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
const emptyDraft = {
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
  access_level: "free" as "free" | "premium",
};

const CSV_TEMPLATE = [
  "exam_type,subject_key,year,session,paper_number,topic,question_text,option_a,option_b,option_c,option_d,correct_answer,explanation,access_level",
  'Cambridge A Level,Mathematics (9709),2024,May / June,12,Quadratics,"Solve x^2 - 5x + 6 = 0",x = 2 or 3,x = -2 or -3,x = 1 or 6,x = -1 or -6,A,"Factorise: (x-2)(x-3)=0",free',
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

function rowsToQuestions(text: string) {
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

export default function QuizBankTab() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [q, setQ] = useState("");
  const [draft, setDraft] = useState(emptyDraft);
  const [importing, setImporting] = useState(false);

  const downloadTemplate = () => {
    const url = URL.createObjectURL(new Blob([CSV_TEMPLATE], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "quiz-questions-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importCsv = async (file: File) => {
    setImporting(true);
    try {
      const questions = rowsToQuestions(await file.text());
      if (!questions.length) throw new Error("No question rows found");
      const { error } = await supabase.from("quiz_questions").insert(questions);
      if (error) throw new Error(error.message);
      toast.success(`Imported ${questions.length} question${questions.length === 1 ? "" : "s"}`);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Import failed");
    } finally {
      setImporting(false);
    }
  };

  const load = async () => {
    const { data, error } = await supabase.from("quiz_questions").select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows(((data ?? []) as unknown as Row[]).map((r) => ({ ...r, options: Array.isArray(r.options) ? r.options : [] })));
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) =>
      [r.question_text, r.subject_key, r.exam_type, r.topic ?? "", String(r.year ?? "")].join(" ").toLowerCase().includes(s));
  }, [rows, q]);

  const save = async () => {
    const options = draft.options.map((o) => o.trim()).filter(Boolean);
    if (!draft.question_text.trim()) return toast.error("Question text is required");
    if (!draft.subject_key.trim()) return toast.error("Course / subject is required");
    if (options.length < 2) return toast.error("Add at least two options");
    if (draft.correct_index >= options.length) return toast.error("Pick a valid correct answer");
    setSaving(true);
    const { error } = await supabase.from("quiz_questions").insert({
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
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Question added");
    setDraft({ ...emptyDraft, exam_type: draft.exam_type, subject_key: draft.subject_key, year: draft.year, session: draft.session, topic: draft.topic });
    load();
  };

  const toggle = async (row: Row, patch: Partial<Row>) => {
    const { error } = await supabase.from("quiz_questions").update(patch).eq("id", row.id);
    if (error) return toast.error(error.message);
    load();
  };

  const remove = async (row: Row) => {
    const { error } = await supabase.from("quiz_questions").delete().eq("id", row.id);
    if (error) return toast.error(error.message);
    toast.success("Question deleted");
    load();
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="space-y-4">
        <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold">Bulk import from CSV</p>
            <p className="text-xs text-muted-foreground">Columns: exam_type, subject_key, year, session, paper_number, topic, question_text, option_a…option_h, correct_answer (A–H or 1–8), explanation, access_level.</p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button size="sm" variant="outline" onClick={downloadTemplate}><Download className="size-4" /> Template</Button>
            <Button size="sm" disabled={importing} asChild={!importing}>
              {importing ? (<span><Loader2 className="size-4 animate-spin" /> Importing…</span>) : (
                <label className="cursor-pointer">
                  <Upload className="size-4" /> Import CSV
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    className="sr-only"
                    onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) importCsv(f); }}
                  />
                </label>
              )}
            </Button>
          </div>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search questions, subject, topic…" className="pl-9" />
        </div>
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <p className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">No questions yet — add your first one with the form.</p>
        ) : (
          filtered.map((r) => (
            <div key={r.id} className="rounded-xl border bg-card p-4">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <Badge variant="secondary">{r.exam_type}</Badge>
                <Badge variant="outline">{r.subject_key}</Badge>
                {r.year && <Badge variant="outline">{r.year}{r.session ? ` · ${r.session}` : ""}</Badge>}
                {r.topic && <Badge variant="outline">{r.topic}</Badge>}
                {r.access_level === "premium" && <Badge className="bg-brand-orange/10 text-brand-orange"><Crown className="mr-1 size-3" />Premium</Badge>}
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm">{r.question_text}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Answer: {String.fromCharCode(65 + r.correct_index)} — {r.options[r.correct_index]}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => toggle(r, { is_published: !r.is_published })}>
                  {r.is_published ? <><EyeOff className="size-4" /> Unpublish</> : <><Eye className="size-4" /> Publish</>}
                </Button>
                <Button size="sm" variant="outline" onClick={() => toggle(r, { access_level: r.access_level === "premium" ? "free" : "premium" })}>
                  <Crown className="size-4" /> {r.access_level === "premium" ? "Make free" : "Make premium"}
                </Button>
                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => remove(r)}><Trash2 className="size-4" /> Delete</Button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="h-fit space-y-4 rounded-2xl border bg-card p-5 lg:sticky lg:top-24">
        <h3 className="font-display text-lg font-bold">Add question</h3>
        <div className="space-y-2">
          <Label>Exam type</Label>
          <Select value={draft.exam_type} onValueChange={(v) => setDraft({ ...draft, exam_type: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent className="bg-popover">{EXAM_TYPES.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Course / subject</Label>
          <Input value={draft.subject_key} onChange={(e) => setDraft({ ...draft, subject_key: e.target.value })} placeholder="e.g. Mathematics (9709)" />
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
                className={`grid size-7 shrink-0 place-items-center rounded-full border text-xs font-bold ${draft.correct_index === i ? "border-primary bg-primary text-primary-foreground" : ""}`}
              >
                {String.fromCharCode(65 + i)}
              </button>
              <Input
                value={opt}
                onChange={(e) => setDraft({ ...draft, options: draft.options.map((o, j) => (j === i ? e.target.value : o)) })}
                placeholder={`Option ${String.fromCharCode(65 + i)}`}
              />
            </div>
          ))}
          <Button type="button" size="sm" variant="ghost" onClick={() => setDraft({ ...draft, options: [...draft.options, ""] })}>
            <Plus className="size-4" /> Add option
          </Button>
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
        <Button className="w-full" disabled={saving} onClick={save}>
          {saving ? <Loader2 className="animate-spin" /> : <Plus />} Add question
        </Button>
      </div>
    </div>
  );
}
