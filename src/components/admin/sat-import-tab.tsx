import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Download, Loader2, Save, Sparkles, CheckCircle2, AlertTriangle, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ListSkeleton } from "@/components/skeletons";
import { MathText } from "@/components/math-text";
import { SAT_SECTIONS, SAT_DIFFICULTIES, callSat, type SatQuestion, type SatSectionId } from "@/lib/sat-questions";

const BATCHES = [5, 10, 20, 40];

export default function SatImportTab() {
  const [sectionId, setSectionId] = useState<SatSectionId>("math");
  const [domains, setDomains] = useState<string[]>([]);
  const [difficulties, setDifficulties] = useState<string[]>([]);
  const [limit, setLimit] = useState(10);
  const [accessLevel, setAccessLevel] = useState<"free" | "premium">("free");
  const [publish, setPublish] = useState(true);

  const [fetching, setFetching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<SatQuestion[] | null>(null);
  const [chosen, setChosen] = useState<Set<string>>(new Set());
  const [meta, setMeta] = useState<{ available: number; remaining: number; skipped_grid_ins: number } | null>(null);
  const [result, setResult] = useState<{ saved: number; skipped: number } | null>(null);

  const conf = useMemo(() => SAT_SECTIONS.find((s) => s.id === sectionId)!, [sectionId]);

  const toggle = (list: string[], value: string, set: (v: string[]) => void) =>
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  const load = async () => {
    setFetching(true);
    setResult(null);
    try {
      const data = await callSat<{
        questions: SatQuestion[]; available: number; remaining: number; skipped_grid_ins: number;
      }>({
        action: "fetch",
        section: sectionId,
        domains,
        difficulties,
        limit,
      });
      setPreview(data.questions);
      setChosen(new Set(data.questions.map((q) => q.external_id)));
      setMeta({ available: data.available, remaining: data.remaining, skipped_grid_ins: data.skipped_grid_ins });
      if (!data.questions.length) toast.message("Nothing new came back — try other domains or difficulties.");
      else toast.success(`Fetched ${data.questions.length} SAT questions.`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setFetching(false);
    }
  };

  const save = async () => {
    const questions = (preview ?? []).filter((q) => chosen.has(q.external_id));
    if (!questions.length) return;
    setSaving(true);
    try {
      const data = await callSat<{ saved: number; skipped: number }>({
        action: "import",
        section: sectionId,
        access_level: accessLevel,
        is_published: publish,
        questions,
      });
      setResult(data);
      toast.success(`Saved ${data.saved} questions${data.skipped ? `, skipped ${data.skipped} already saved` : ""}.`);
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
          <h2 className="font-display text-xl font-bold">SAT question bank</h2>
          <p className="text-sm text-muted-foreground">
            Pull real SAT questions with official answer explanations from the College Board question bank, preview them, then add them to your quiz bank.
          </p>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="secondary" className="gap-1.5"><GraduationCap className="size-3.5" /> Free source</Badge>
          </TooltipTrigger>
          <TooltipContent>No API key or credits needed. Questions already imported are skipped automatically.</TooltipContent>
        </Tooltip>
      </div>

      <div className="grid gap-4 rounded-2xl border bg-card p-5 shadow-soft sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-1.5">
          <Label>Section</Label>
          <Select value={sectionId} onValueChange={(v) => { setSectionId(v as SatSectionId); setDomains([]); }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {SAT_SECTIONS.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>How many to fetch</Label>
          <Select value={String(limit)} onValueChange={(v) => setLimit(Number(v))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {BATCHES.map((b) => <SelectItem key={b} value={String(b)}>{b} questions</SelectItem>)}
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

        <div className="space-y-2 sm:col-span-2 lg:col-span-2">
          <Label>Domains <span className="text-xs font-normal text-muted-foreground">(all when none picked)</span></Label>
          <div className="flex flex-wrap gap-2">
            {conf.domains.map((d) => (
              <Button
                key={d.code}
                type="button"
                size="sm"
                variant={domains.includes(d.code) ? "default" : "outline"}
                onClick={() => toggle(domains, d.code, setDomains)}
              >
                {d.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Difficulty</Label>
          <div className="flex flex-wrap gap-2">
            {SAT_DIFFICULTIES.map((d) => (
              <Button
                key={d.code}
                type="button"
                size="sm"
                variant={difficulties.includes(d.code) ? "default" : "outline"}
                onClick={() => toggle(difficulties, d.code, setDifficulties)}
              >
                {d.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 sm:col-span-2 lg:col-span-3">
          <Switch checked={publish} onCheckedChange={setPublish} id="sat-publish" />
          <Label htmlFor="sat-publish" className="cursor-pointer">Publish immediately after saving</Label>
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
              <strong>{chosen.size}</strong> of {preview.length} selected for <strong>SAT · {conf.label}</strong>
              {meta ? <> — {meta.remaining} more available with these filters</> : null}
              {meta?.skipped_grid_ins ? <> · {meta.skipped_grid_ins} grid-in questions skipped</> : null}
            </p>
            <Button onClick={save} disabled={saving || !chosen.size} className="ml-auto transition-transform active:scale-95">
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
              <AlertTriangle className="size-4" /> Nothing came back — widen the domains or difficulty.
            </div>
          )}

          <ol className="space-y-3">
            {preview.map((q, i) => (
              <li key={q.external_id} className="rounded-2xl border bg-card p-4 shadow-soft">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Checkbox
                    checked={chosen.has(q.external_id)}
                    onCheckedChange={(v) =>
                      setChosen((prev) => {
                        const next = new Set(prev);
                        if (v) next.add(q.external_id); else next.delete(q.external_id);
                        return next;
                      })
                    }
                    aria-label="Include this question"
                  />
                  <Badge variant="outline">SAT</Badge>
                  {q.domain && <Badge variant="secondary">{q.domain}</Badge>}
                  {q.topic && <Badge variant="secondary">{q.topic}</Badge>}
                  <Badge variant="outline" className="capitalize">{q.difficulty}</Badge>
                </div>
                <div className="mt-2 flex gap-1 text-sm font-medium">
                  <span>{i + 1}.</span><MathText block className="min-w-0">{q.question_text}</MathText>
                </div>
                <ul className="mt-2 grid gap-1">
                  {q.options.map((o, oi) => (
                    <li
                      key={oi}
                      className={`rounded-lg px-3 py-1.5 text-sm ${oi === q.correct_index ? "bg-brand-green/10 font-semibold text-brand-green" : "bg-muted/50"}`}
                    >
                      {String.fromCharCode(65 + oi)}. <MathText>{o}</MathText>
                    </li>
                  ))}
                </ul>
                {q.explanation && (
                  <details className="mt-2 text-xs text-muted-foreground">
                    <summary className="cursor-pointer font-semibold">Explanation</summary>
                    <MathText block className="mt-1">{q.explanation}</MathText>
                  </details>
                )}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
