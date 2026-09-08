import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ExternalLink, Filter, Loader2, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ListSkeleton } from "@/components/skeletons";
import { supabase } from "@/integrations/supabase/client";
import {
  PAPER_GROUPS, variantsOf, PAPER_YEARS, SESSIONS, SUBJECT_OPTIONS,
  fetchPastPapers, indexPapers, paperKey, type PastPaper,
} from "@/lib/past-papers";

type Draft = { url: string; access: "free" | "premium" };

export default function PastPapersTab() {
  const [subject, setSubject] = useState(SUBJECT_OPTIONS[0].id);
  const [year, setYear] = useState(String(PAPER_YEARS[0]));
  const [rows, setRows] = useState<PastPaper[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [onlyMissing, setOnlyMissing] = useState(false);

  const reload = async () => {
    setLoading(true);
    try {
      const data = await fetchPastPapers(subject);
      setRows(data);
      setDrafts({});
    } catch (e: any) {
      toast.error(e.message ?? "Failed to load past papers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { reload(); /* eslint-disable-next-line */ }, [subject]);

  const index = useMemo(() => indexPapers(rows), [rows]);
  const yearNum = Number(year);

  const cellFor = (session: string, num: string, doc: string) => {
    const k = paperKey(subject, yearNum, session, num, doc);
    const existing = index.get(k);
    const draft = drafts[k];
    return {
      k,
      existing,
      url: draft?.url ?? existing?.file_url ?? "",
      access: draft?.access ?? existing?.access_level ?? "free",
      dirty: !!draft,
    };
  };

  const setDraft = (k: string, patch: Partial<Draft>, base: Draft) =>
    setDrafts((d) => ({ ...d, [k]: { ...base, ...(d[k] ?? {}), ...patch } }));

  const dirtyKeys = Object.keys(drafts);

  const saveAll = async () => {
    if (!dirtyKeys.length) return;
    setSaving(true);
    const upserts: any[] = [];
    const deletes: string[] = [];
    for (const k of dirtyKeys) {
      const [, , session, num, doc] = k.split("|");
      const d = drafts[k];
      const existing = index.get(k);
      const url = d.url.trim();
      if (!url) { if (existing) deletes.push(existing.id); continue; }
      upserts.push({
        subject_key: subject,
        year: yearNum,
        session,
        paper_number: num,
        doc_type: doc,
        file_url: url,
        access_level: d.access,
        title: `${SUBJECT_OPTIONS.find((s) => s.id === subject)?.label ?? subject} ${yearNum} ${session} — ${doc === "question_paper" ? "Question Paper" : "Mark Scheme"} ${num}`,
        is_published: true,
      });
    }
    let failed = false;
    if (upserts.length) {
      const { error } = await (supabase as any)
        .from("past_papers")
        .upsert(upserts, { onConflict: "subject_key,year,session,paper_number,doc_type" });
      if (error) { toast.error(error.message); failed = true; }
    }
    if (deletes.length) {
      const { error } = await (supabase as any).from("past_papers").delete().in("id", deletes);
      if (error) { toast.error(error.message); failed = true; }
    }
    setSaving(false);
    if (!failed) toast.success(`Saved ${upserts.length + deletes.length} change(s)`);
    reload();
  };

  const uploadedCount = rows.filter((r) => r.year === yearNum).length;
  const totalSlots = SESSIONS.length * 2 * PAPER_GROUPS.reduce((n, g) => n + variantsOf(g).length, 0);
  const coverage = totalSlots ? Math.round((uploadedCount / totalSlots) * 100) : 0;

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
          <Label className="text-xs">Year</Label>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {PAPER_YEARS.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Badge variant="secondary" className="mb-1">{uploadedCount} of {totalSlots} filled in {yearNum}</Badge>
        <Button variant={onlyMissing ? "default" : "outline"} className="mb-0.5" onClick={() => setOnlyMissing((v) => !v)}>
          <Filter /> Only missing
        </Button>
        <Button className="ml-auto" onClick={saveAll} disabled={!dirtyKeys.length || saving}>
          {saving ? <Loader2 className="animate-spin" /> : <Save />} Save {dirtyKeys.length || ""} change{dirtyKeys.length === 1 ? "" : "s"}
        </Button>
      </div>

      <div className="rounded-2xl border bg-card p-4 shadow-soft">
        <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
          <span>{yearNum} coverage</span><span>{coverage}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${coverage}%` }} />
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Paste a Google Drive share link (or any PDF URL) for each paper. Leave a field empty to remove that paper.
      </p>

      {loading ? (
        <ListSkeleton rows={6} />
      ) : (
        <div className="grid gap-5 xl:grid-cols-3">
          {SESSIONS.map((session) => (
            <section key={session} className="rounded-2xl border bg-card p-5">
              <h3 className="font-display text-lg font-bold">{session}</h3>
              {(["question_paper", "mark_scheme"] as const).map((doc) => (
                <div key={doc} className="mt-5">
                  <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    {doc === "question_paper" ? "Question Papers" : "Mark Schemes"}
                  </p>
                  {PAPER_GROUPS.map((g) => (
                    <div key={g} className="mt-3">
                      <p className="text-[11px] font-semibold text-muted-foreground">Paper {g}</p>
                      <div className="mt-2 space-y-2">
                        {variantsOf(g).map((num) => {
                          const c = cellFor(session, num, doc);
                          if (onlyMissing && c.url) return null;
                          return (
                            <div key={num} className="flex items-center gap-2">
                              <span className="w-8 shrink-0 text-xs font-bold text-primary">{num}</span>
                              <Input
                                value={c.url}
                                placeholder="https://drive.google.com/file/d/…"
                                onChange={(e) => setDraft(c.k, { url: e.target.value }, { url: c.url, access: c.access as Draft["access"] })}
                                className={c.dirty ? "border-primary" : ""}
                              />
                              <Select
                                value={c.access}
                                onValueChange={(v) => setDraft(c.k, { access: v as Draft["access"] }, { url: c.url, access: c.access as Draft["access"] })}
                              >
                                <SelectTrigger className="w-[104px] shrink-0"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="free">Free</SelectItem>
                                  <SelectItem value="premium">Premium</SelectItem>
                                </SelectContent>
                              </Select>
                              {c.existing && (
                                <>
                                  <Button asChild size="icon" variant="ghost" className="shrink-0" title="Open link">
                                    <a href={c.existing.file_url} target="_blank" rel="noopener"><ExternalLink className="h-4 w-4" /></a>
                                  </Button>
                                  <Button
                                    size="icon" variant="ghost" className="shrink-0 text-destructive" title="Remove"
                                    onClick={() => setDraft(c.k, { url: "" }, { url: "", access: c.access as Draft["access"] })}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
