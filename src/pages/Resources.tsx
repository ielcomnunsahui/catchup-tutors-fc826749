import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, BookMarked, CalendarDays, ChevronRight, Download,
  ExternalLink, GraduationCap, Layers3, Loader2, LockKeyhole, PlayCircle, Search, Sigma, Sparkles, Users, X,
} from "lucide-react";
import { SiteShell, PageHero, Seo } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { usePremium } from "@/hooks/use-premium";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fetchManagedQuestionCatalogue, type ManagedSubject } from "@/lib/past-papers";
import { SESSIONS, PAPER_NUMBERS, PAPER_GROUPS, variantsOf, type Session, fetchPastPapers, indexPapers, paperKey, paperFileName, usePaperYears, usePaperVariants, type PastPaper } from "@/lib/past-papers";
import { fetchTopicQuestions, groupByPaper, type TopicQuestion } from "@/lib/topic-questions";
import { drivePreview, driveDownload, driveOpen } from "@/lib/drive";
import { heroImages } from "@/assets/heroes";
import ExamSubjectCatalog from "@/components/exam-subject-catalog";
import NigerianExamsSection from "@/components/nigerian-exams-section";


// ---------- helpers ----------
type ViewerState =
  | { kind: "pdf"; url: string; title: string; downloadUrl?: string; sourceUrl?: string }
  | { kind: "video"; youtubeId: string; title: string }
  | null;

const ytId = (url: string) => url.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/)?.[1] ?? "";


// ---------- domain data (admin-managed programmes & subjects) ----------
type Program = { id: string; slug: string; name: string; tagline: string; badge: string };
type Subject = { id: string; key: string; slug: string; name: string; code: string; level: string; programId: string };

const SAMPLE_PDF = "https://www.africau.edu/images/default/sample.pdf";

const subjectCode = (s: ManagedSubject) =>
  s.name.match(/\b(\d{4})\b/)?.[1] ?? s.slug.match(/(\d{4})/)?.[1] ?? s.subject_key.match(/(\d{4})/)?.[1] ?? "";

function useManagedCatalogue() {
  const query = useQuery({ queryKey: ["managed-question-catalogue"], queryFn: fetchManagedQuestionCatalogue, staleTime: 5 * 60_000 });
  return useMemo(() => {
    const progs = (query.data?.programmes ?? []).filter((p) => p.is_published);
    const progIds = new Set(progs.map((p) => p.id));
    const subjects: Subject[] = (query.data?.subjects ?? [])
      .filter((s) => s.is_published && progIds.has(s.program_id))
      .map((s) => {
        const program = progs.find((p) => p.id === s.program_id)!;
        return { id: s.id, key: s.subject_key, slug: s.slug, name: s.name, code: subjectCode(s), level: program.name, programId: s.program_id };
      });
    const programs: Program[] = progs.map((p) => {
      const subs = subjects.filter((s) => s.programId === p.id);
      const codes = subs.map((s) => s.code).filter(Boolean);
      return {
        id: p.id, slug: p.slug, name: p.name,
        tagline: subs.length ? `${subs.length} subject${subs.length === 1 ? "" : "s"}: ${subs.map((s) => s.name).join(", ")}.` : "Subjects coming soon.",
        badge: codes.length ? codes.join(" · ") : `${subs.length} subject${subs.length === 1 ? "" : "s"}`,
      };
    });
    return { programs, subjects, isLoading: query.isLoading, isError: query.isError, refetch: query.refetch };
  }, [query.data, query.isLoading, query.isError, query.refetch]);
}

const matchProgram = (programs: Program[], v?: string) =>
  !v ? null : programs.find((p) => p.slug === v || p.id === v) ?? null;
const matchSubject = (subjects: Subject[], program: Program | null, v?: string) =>
  !v || !program ? null
  : subjects.find((s) => s.programId === program.id && (s.slug === v || s.id === v || s.key === v || s.key.endsWith(`/${v}`))) ?? null;

// ---------- viewer ----------
function ResourceViewer({ state, onClose }: { state: ViewerState; onClose: () => void }) {
  if (!state) return null;
  return (
    <Dialog open={!!state} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-5xl p-0 overflow-hidden">
        <DialogHeader className="flex flex-row items-center justify-between gap-4 border-b px-5 py-3">
          <DialogTitle className="truncate text-base">{state.title}</DialogTitle>
          <div className="flex items-center gap-2">
            {state.kind === "pdf" ? (
              <>
                {state.sourceUrl && (
                  <Button asChild size="sm" variant="ghost">
                    <a href={state.sourceUrl} target="_blank" rel="noopener"><ExternalLink /> Open in Drive</a>
                  </Button>
                )}
                <Button asChild size="sm" variant="outline">
                  <a href={state.downloadUrl ?? state.url} target="_blank" rel="noopener"><Download /> Download</a>
                </Button>
              </>
            ) : (
              <Button asChild size="sm" variant="outline">
                <a href={`https://www.youtube.com/watch?v=${state.youtubeId}`} target="_blank" rel="noopener"><ExternalLink /> YouTube</a>
              </Button>
            )}
            <Button size="icon" variant="ghost" onClick={onClose}><X /></Button>
          </div>
        </DialogHeader>
        <div className="bg-muted">
          {state.kind === "pdf" ? (
            <iframe
              src={state.url}
              title={state.title}
              loading="lazy"
              referrerPolicy="no-referrer"
              className="h-[78vh] w-full bg-white"
              allow="autoplay"
            />
          ) : (
            <div className="relative aspect-video w-full">
              <iframe
                src={`https://www.youtube.com/embed/${state.youtubeId}?rel=0&modestbranding=1&autoplay=1`}
                title={state.title}
                loading="lazy"
                className="absolute inset-0 h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------- search index ----------
type SearchItem = {
  id: string;
  kind: "yearly" | "topic";
  program: Program;
  subject: Subject;
  title: string;
  subtitle: string;
  year?: number;
  session?: Session;
  topic?: string;
  isFree: boolean;
  assets: { paper?: string; scheme?: string; questions?: string; solutions?: string; videoUrl?: string };
};

async function fetchPublishedResources() {
  const [papers, topics] = await Promise.all([
    supabase.from("past_papers").select("subject_id,subject_key,year,session,paper_number,doc_type,file_url,access_level").eq("is_published", true),
    (supabase as any).from("topic_questions").select("id,subject_id,subject_key,paper_label,topic,questions_url,ms_url,video_url,access_level").eq("is_published", true),
  ]);
  return { papers: (papers.data ?? []) as Partial<PastPaper>[], topics: (topics.data ?? []) as Partial<TopicQuestion>[] };
}

function buildIndex(programs: Program[], subjects: Subject[], data?: Awaited<ReturnType<typeof fetchPublishedResources>>): SearchItem[] {
  if (!data) return [];
  const findSub = (id?: string | null, key?: string) => subjects.find((s) => (id && s.id === id) || (!id && key && s.key === key));
  const items = new Map<string, SearchItem>();
  for (const r of data.papers) {
    const subject = findSub(r.subject_id, r.subject_key);
    const program = subject && programs.find((p) => p.id === subject.programId);
    if (!subject || !program || !r.year || !r.session) continue;
    const id = `y:${subject.id}:${r.year}:${r.session}`;
    const it = items.get(id) ?? {
      id, kind: "yearly" as const, program, subject, year: r.year, session: r.session as Session,
      title: `${subject.code || subject.name} ${r.year} ${r.session}`,
      subtitle: `${program.name} · ${subject.name} · Yearly past questions`,
      isFree: false, assets: {},
    };
    if (r.access_level === "free") it.isFree = true;
    if (r.doc_type === "question_paper" && !it.assets.paper) it.assets.paper = r.file_url;
    if (r.doc_type === "mark_scheme" && !it.assets.scheme) it.assets.scheme = r.file_url;
    items.set(id, it);
  }
  for (const r of data.topics) {
    const subject = findSub(r.subject_id, r.subject_key);
    const program = subject && programs.find((p) => p.id === subject.programId);
    if (!subject || !program || !r.topic) continue;
    items.set(`t:${r.id}`, {
      id: `t:${r.id}`, kind: "topic", program, subject, topic: r.topic, title: r.topic,
      subtitle: `${program.name} · ${subject.name} · ${r.paper_label ?? "Topic past questions"}`,
      isFree: r.access_level === "free",
      assets: { questions: r.questions_url ?? undefined, solutions: r.ms_url ?? undefined, videoUrl: r.video_url ?? undefined },
    });
  }
  return [...items.values()];
}

// ---------- SEO ----------
type Search = { program?: string; subject?: string; view?: "yearly" | "topics" };

function buildMeta(s: Search, program: Program | null, subject: Subject | null) {
  const base = "CatchUp Tutors";
  let title = `Resource Library | ${base}`;
  let description = "Search past questions, mark schemes, topic PQs and video solutions — filter by programme, subject, topic or year.";
  const label = subject ? `${subject.name}${subject.code ? ` ${subject.code}` : ""}` : "";
  if (program && subject && s.view === "yearly") {
    title = `${label} Yearly Past Papers | ${base}`;
    description = `Download ${program.name} ${label} past papers and marking schemes by session.`;
  } else if (program && subject && s.view === "topics") {
    title = `${label} Topic Past Questions | ${base}`;
    description = `Topic-grouped past questions for ${program.name} ${label} with solutions and video lessons.`;
  } else if (program && subject) {
    title = `${program.name} ${label} | ${base}`;
  } else if (program) {
    title = `${program.name} Resources | ${base}`;
  }
  return { title, description, program, subject };
}

// ---------- page ----------
export default function Resources() {
  const [params, setParams] = useSearchParams();
  const search: Search = {
    program: params.get("program") || undefined,
    subject: params.get("subject") || undefined,
    view: (params.get("view") === "yearly" || params.get("view") === "topics") ? (params.get("view") as Search["view"]) : undefined,
  };
  const catalogue = useManagedCatalogue();
  const { programs: PROGRAMS, subjects: SUBJECTS } = catalogue;
  const subjectsByProgram = (pid: string) => SUBJECTS.filter((s) => s.programId === pid);
  const program = matchProgram(PROGRAMS, search.program);
  const subject = matchSubject(SUBJECTS, program, search.subject);

  const [viewer, setViewer] = useState<ViewerState>(null);
  const premium = usePremium();

  // search/filter state
  const [q, setQ] = useState("");
  const [fProgram, setFProgram] = useState<string>("all");
  const [fSubject, setFSubject] = useState<string>("all");
  const [fYear, setFYear] = useState<string>("all");
  const [fSession, setFSession] = useState<string>("all");
  const [fType, setFType] = useState<string>("all");
  const [fAccess, setFAccess] = useState<string>("all");

  const { years: YEARS } = usePaperYears();
  const resourcesQuery = useQuery({ queryKey: ["published-resources-index"], queryFn: fetchPublishedResources, staleTime: 5 * 60_000 });
  const index = useMemo(() => buildIndex(PROGRAMS, SUBJECTS, resourcesQuery.data), [PROGRAMS, SUBJECTS, resourcesQuery.data]);
  const hasFilters = q.trim().length > 0 || fProgram !== "all" || fSubject !== "all" || fYear !== "all" || fSession !== "all" || fType !== "all" || fAccess !== "all";

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return index.filter((it) => {
      if (fProgram !== "all" && it.program.id !== fProgram) return false;
      if (fSubject !== "all" && it.subject.id !== fSubject) return false;
      if (fType !== "all" && it.kind !== fType) return false;
      if (fYear !== "all" && String(it.year) !== fYear) return false;
      if (fSession !== "all" && it.session !== fSession) return false;
      if (fAccess === "free" && !it.isFree) return false;
      if (fAccess === "premium" && it.isFree) return false;
      if (!needle) return true;
      return [it.title, it.subtitle, it.topic, it.subject.code, it.subject.name, it.session, String(it.year ?? "")]
        .filter(Boolean).some((x) => x!.toString().toLowerCase().includes(needle));
    });
  }, [index, q, fProgram, fSubject, fYear, fSession, fType, fAccess]);

  // when program filter changes, reset subject if no longer matches
  useEffect(() => {
    if (fSubject !== "all" && fProgram !== "all") {
      const sub = SUBJECTS.find((s) => s.id === fSubject);
      if (sub && sub.programId !== fProgram) setFSubject("all");
    }
  }, [fProgram, fSubject, SUBJECTS]);

  const go = (next: Partial<Search>) => {
    const merged = { ...search, ...next };
    const p = new URLSearchParams();
    const prog = matchProgram(PROGRAMS, merged.program);
    const sub = matchSubject(SUBJECTS, prog, merged.subject);
    if (merged.program) p.set("program", prog?.slug ?? merged.program);
    if (merged.subject) p.set("subject", sub?.slug ?? merged.subject);
    if (merged.view) p.set("view", merged.view);
    setParams(p);
  };
  const reset = () => setParams(new URLSearchParams());
  const clearFilters = () => {
    setQ(""); setFProgram("all"); setFSubject("all"); setFYear("all"); setFSession("all"); setFType("all"); setFAccess("all");
  };

  const step: "program" | "subject" | "type" | "yearly" | "topics" =
    search.view === "yearly" ? "yearly"
    : search.view === "topics" ? "topics"
    : subject ? "type" : program ? "subject" : "program";

  const meta = buildMeta(search, program, subject);
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": meta.program && meta.subject ? "LearningResource" : "CollectionPage",
    name: meta.title, description: meta.description,
    isPartOf: { "@type": "WebSite", name: "CatchUp Tutors" },
  };
  if (meta.program && meta.subject) {
    jsonLd.educationalLevel = meta.subject.level;
    jsonLd.learningResourceType = search.view === "topics" ? "Topic questions" : "Past examination papers";
    jsonLd.about = `${meta.program.name} ${meta.subject.name} (${meta.subject.code})`;
  }

  const openPdf = (url: string, title: string, locked: boolean) => {
    if (locked && !premium.isPremium) return setViewer({ kind: "pdf", url: SAMPLE_PDF, title: `${title} (Preview)` });
    setViewer({ kind: "pdf", url: drivePreview(url), downloadUrl: driveDownload(url), sourceUrl: driveOpen(url), title });
  };
  const openVideo = (url: string, title: string, locked: boolean) => {
    if (locked && !premium.isPremium) return; // gate handled in UI
    setViewer({ kind: "video", youtubeId: ytId(url), title });
  };

  return (
    <SiteShell>
      <Seo title={meta.title} description={meta.description} path="/resources" jsonLd={jsonLd} />
      <PageHero
        image={heroImages.resources}
        eyebrow="Resource library"
        title="Search past questions, schemes & video solutions."
        description="Filter by program, subject, topic or exam year — open PDFs in-browser, download for offline, or watch the worked-solution video."
      />
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* ============ Quick start strip ============ */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: CalendarDays, title: "Yearly past papers", note: YEARS.length ? `${YEARS[YEARS.length - 1]} – ${YEARS[0]} · all sessions` : "All sessions", accent: "bg-primary/10 text-primary", onClick: () => { clearFilters(); setFType("yearly"); } },
            { icon: Layers3, title: "Topical questions", note: "Practice by syllabus topic", accent: "bg-brand-orange/10 text-brand-orange", onClick: () => { clearFilters(); setFType("topic"); } },
            { icon: PlayCircle, title: "Video solutions", note: "Worked walkthroughs", accent: "bg-brand-green/10 text-brand-green", to: "/premium" as const },
            { icon: Sparkles, title: "Premium notes", note: "Unlock every subject", accent: "bg-brand-navy/10 text-brand-navy", to: "/pricing" as const },
          ].map((t) => {
            const inner = (
              <>
                <span className={cn("flex size-11 items-center justify-center rounded-xl transition group-hover:scale-105", t.accent)}>
                  <t.icon className="size-5" />
                </span>
                <span className="min-w-0">
                  <span className="block font-display text-sm font-bold">{t.title}</span>
                  <span className="block text-xs text-muted-foreground">{t.note}</span>
                </span>
                <ChevronRight className="ml-auto size-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
              </>
            );
            const cls = "group flex w-full items-center gap-3 rounded-2xl border bg-card p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-soft";
            return t.to
              ? <Link key={t.title} to={t.to} className={cls}>{inner}</Link>
              : <button key={t.title} type="button" onClick={t.onClick} className={cls}>{inner}</button>;
          })}
        </div>

        {/* ============ Advanced search ============ */}
        <div className="mt-6 rounded-3xl border bg-card p-4 shadow-soft sm:p-5">
          <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-foreground">
            <Search className="size-4 text-primary" /> Advanced search
            {hasFilters && (
              <>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">{results.length} match{results.length === 1 ? "" : "es"}</span>
                <button onClick={clearFilters} className="ml-auto inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold text-muted-foreground transition hover:border-primary/40 hover:text-primary">
                  <X className="size-3.5" /> Clear filters
                </button>
              </>
            )}
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="lg:col-span-2">
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search topic, year, subject code, May/June…"
                aria-label="Search resources"
              />
            </div>
            <FilterSelect value={fProgram} onChange={setFProgram} placeholder="Program"
              options={[{ v: "all", l: "All programs" }, ...PROGRAMS.map((p) => ({ v: p.id, l: p.name }))]} />
            <FilterSelect value={fSubject} onChange={setFSubject} placeholder="Subject"
              options={[{ v: "all", l: "All subjects" }, ...(fProgram === "all" ? SUBJECTS : subjectsByProgram(fProgram)).map((s) => ({ v: s.id, l: s.code ? `${s.name} (${s.code})` : s.name }))]} />
            <FilterSelect value={fType} onChange={setFType} placeholder="Type"
              options={[{ v: "all", l: "All resources" }, { v: "yearly", l: "Yearly past papers" }, { v: "topic", l: "Topic past questions" }]} />
            <FilterSelect value={fYear} onChange={setFYear} placeholder="Year"
              options={[{ v: "all", l: "Any year" }, ...YEARS.map((y) => ({ v: String(y), l: String(y) }))]} />
            <FilterSelect value={fSession} onChange={setFSession} placeholder="Session"
              options={[{ v: "all", l: "Any session" }, ...SESSIONS.map((s) => ({ v: s, l: s }))]} />
            <FilterSelect value={fAccess} onChange={setFAccess} placeholder="Access"
              options={[{ v: "all", l: "Free & Premium" }, { v: "free", l: "Free only" }, { v: "premium", l: "Premium only" }]} />
          </div>
        </div>

        {/* ============ Results or wizard ============ */}
        {hasFilters ? (
          <SearchResults results={results} premium={premium} onOpenPdf={openPdf} onOpenVideo={openVideo} />
        ) : (
          <div className="mt-8">
            <Breadcrumbs step={step} program={program} subject={subject} onJump={(s) => {
              if (s === "program") reset();
              if (s === "subject") go({ subject: undefined, view: undefined });
              if (s === "type") go({ view: undefined });
            }} />
            <div className="mt-8">
              {catalogue.isLoading ? (
                <div className="flex items-center justify-center gap-2 rounded-2xl border bg-card py-16 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Loading programmes…</div>
              ) : catalogue.isError ? (
                <div className="rounded-2xl border bg-card p-10 text-center">
                  <p className="font-semibold">We couldn't load the programmes right now.</p>
                  <Button className="mt-4" variant="outline" onClick={() => catalogue.refetch()}>Try again</Button>
                </div>
              ) : (search.program && !program) || (search.subject && !subject) ? (
                <div className="rounded-2xl border bg-card p-10 text-center">
                  <p className="font-semibold">That {search.subject && program ? "subject" : "programme"} isn't available.</p>
                  <p className="mt-1 text-sm text-muted-foreground">It may have been renamed or unpublished.</p>
                  <Button className="mt-4" variant="outline" onClick={reset}>Browse all programmes</Button>
                </div>
              ) : (<>
              {step === "program" && (PROGRAMS.length === 0 ? (
                <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">No programmes have been published yet.</div>
              ) : (
                <StepShell eyebrow="Step 1 of 3" title="Choose your program" description="Start with the examination board you're preparing for.">
                  <div className="grid gap-5 md:grid-cols-2">
                    {PROGRAMS.map((p) => <ChoiceCard key={p.id} icon={<GraduationCap className="size-6" />} badge={p.badge} title={p.name} description={p.tagline} onClick={() => go({ program: p.slug, subject: undefined, view: undefined })} />)}
                  </div>
                </StepShell>
              ))}
              {step === "subject" && program && (
                <StepShell eyebrow="Step 2 of 3" title={`${program.name} subjects`} description="Select the subject you want to revise.">
                  {subjectsByProgram(program.id).length === 0 ? (
                    <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">No subjects have been published for {program.name} yet.</div>
                  ) : (
                  <div className="grid gap-5 md:grid-cols-2">
                    {subjectsByProgram(program.id).map((s) => <ChoiceCard key={s.id} icon={<Sigma className="size-6" />} badge={s.code ? `${s.level} · ${s.code}` : s.level} title={s.name} description={`Full ${s.level} ${s.name} syllabus — papers, schemes & lessons.`} onClick={() => go({ subject: s.slug, view: undefined })} />)}
                  </div>
                  )}
                </StepShell>
              )}
              {step === "type" && program && subject && (
                <StepShell eyebrow="Step 3 of 3" title={subject.code ? `${subject.name} (${subject.code})` : subject.name} description="How would you like to practice today?">
                  <div className="grid gap-5 md:grid-cols-2">
                    <ChoiceCard icon={<CalendarDays className="size-6" />} badge="By exam session" title="Yearly past questions" description="Full question papers and marking schemes by year — Feb/March, May/June & Oct/Nov." onClick={() => go({ view: "yearly" })} />
                    <ChoiceCard icon={<Layers3 className="size-6" />} badge="By syllabus topic" title="Topic-based past questions" description="Targeted question sets per syllabus topic — with worked solutions and video lessons." onClick={() => go({ view: "topics" })} />
                  </div>
                </StepShell>
              )}
              {step === "yearly" && subject && program && (
                <YearlyView years={YEARS} program={program} subject={subject} premium={premium} onBack={() => go({ view: undefined })} onOpenPdf={openPdf} />
              )}
              {step === "topics" && subject && program && (
                <TopicsView program={program} subject={subject} premium={premium} onBack={() => go({ view: undefined })} onOpenPdf={openPdf} onOpenVideo={openVideo} />
              )}
              </>)}
            </div>
          </div>
        )}

        <div className="mt-12"><SatPracticeCard /></div>

        <div className="mt-16 border-t pt-12">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Local examinations</p>
          <h2 className="mt-2 font-display text-2xl font-bold sm:text-3xl">JAMB, WAEC &amp; NECO past questions</h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Objective past questions with the correct answer and an explanation for every question — practise by subject or year.
          </p>
          <div className="mt-8"><NigerianExamsSection /></div>
        </div>

        <div className="mt-16 border-t pt-12">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Full coverage</p>
          <h2 className="mt-2 font-display text-2xl font-bold sm:text-3xl">All examinations &amp; subjects</h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Resources, tutoring and premium topic lessons are available across every board and subject below.
          </p>
          <div className="mt-8"><ExamSubjectCatalog /></div>
        </div>


        <div className="mt-16 grid gap-5 lg:grid-cols-2"><PremiumCTA /><TutorCTA /></div>
      </section>

      <ResourceViewer state={viewer} onClose={() => setViewer(null)} />
    </SiteShell>
  );
}

// ---------- subcomponents ----------
function FilterSelect({ value, onChange, placeholder, options }: { value: string; onChange: (v: string) => void; placeholder: string; options: { v: string; l: string }[] }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent>
        {options.map((o) => <SelectItem key={o.v} value={o.v}>{o.l}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

type OpenPdf = (url: string, title: string, locked: boolean) => void;
type OpenVideo = (url: string, title: string, locked: boolean) => void;

function SearchResults({ results, premium, onOpenPdf, onOpenVideo }: { results: SearchItem[]; premium: ReturnType<typeof usePremium>; onOpenPdf: OpenPdf; onOpenVideo: OpenVideo }) {
  return (
    <div className="mt-8">
      <div className="mb-4 flex items-end justify-between">
        <h2 className="font-display text-2xl font-bold">Search results</h2>
        <p className="text-sm text-muted-foreground">{results.length} matches</p>
      </div>
      {results.length === 0 ? (
        <div className="rounded-2xl border bg-card p-10 text-center">
          <p className="font-semibold">No resources match those filters.</p>
          <p className="mt-1 text-sm text-muted-foreground">Try widening your search — remove a year or switch the type filter.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((it) => (
            <article key={it.id} className="flex flex-col gap-3 rounded-2xl border bg-card p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wide text-primary">{it.subject.code || it.subject.name} · {it.kind === "yearly" ? `${it.year}` : "Topic"}</span>
                {it.isFree ? <FreeBadge /> : <PremiumBadge />}
              </div>
              <h3 className="font-display text-lg font-bold">{it.title}</h3>
              <p className="text-xs text-muted-foreground">{it.subtitle}</p>
              <div className="mt-auto grid gap-2">
                {it.kind === "yearly" && (
                  <>
                    {it.assets.paper && (
                      <LockableButton locked={!it.isFree && !premium.isPremium} onClick={() => onOpenPdf(it.assets.paper!, `${it.title} — Paper`, !it.isFree)}>
                        <BookMarked /> View paper
                      </LockableButton>
                    )}
                    {it.assets.scheme && (
                      <LockableButton locked={!it.isFree && !premium.isPremium} onClick={() => onOpenPdf(it.assets.scheme!, `${it.title} — Mark scheme`, !it.isFree)}>
                        <BookMarked /> View mark scheme
                      </LockableButton>
                    )}
                  </>
                )}
                {it.kind === "topic" && (
                  <>
                    {it.assets.questions ? (
                      <Button size="sm" variant="outline" className="justify-start" onClick={() => onOpenPdf(it.assets.questions!, `${it.topic} — Past questions`, false)}>
                        <BookMarked /> View past questions
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" className="justify-start" disabled><BookMarked /> Coming soon</Button>
                    )}
                    {it.assets.solutions && (
                      <LockableButton locked={!it.isFree && !premium.isPremium} onClick={() => onOpenPdf(it.assets.solutions!, `${it.topic} — Worked solutions`, !it.isFree)}>
                        <BookMarked /> {!it.isFree && !premium.isPremium ? "Solutions (Premium)" : "View solutions"}
                      </LockableButton>
                    )}
                    {it.assets.videoUrl && (
                      <LockableButton locked={!it.isFree && !premium.isPremium} onClick={() => onOpenVideo(it.assets.videoUrl!, `${it.topic} — Video solution`, !it.isFree)}>
                        <PlayCircle /> {!it.isFree && !premium.isPremium ? "Video (Premium)" : "Watch video"}
                      </LockableButton>
                    )}
                  </>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function LockableButton({ locked, onClick, children }: { locked: boolean; onClick: () => void; children: React.ReactNode }) {
  if (locked) {
    return (
      <Button asChild size="sm" variant="outline" className="justify-start border-dashed text-muted-foreground">
        <Link to="/pricing"><LockKeyhole /> {children}</Link>
      </Button>
    );
  }
  return <Button size="sm" variant="outline" className="justify-start" onClick={onClick}>{children}</Button>;
}

function FreeBadge() {
  return <span className="rounded-full bg-brand-green/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-green">Free</span>;
}
function PremiumBadge() {
  return <span className="inline-flex items-center gap-1 rounded-full bg-brand-orange/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-orange"><Sparkles className="size-3" /> Premium</span>;
}

function Breadcrumbs({ step, program, subject, onJump }: { step: string; program: Program | null; subject: Subject | null; onJump: (s: "program" | "subject" | "type") => void }) {
  const crumbs: { label: string; target?: "program" | "subject" | "type"; active?: boolean }[] = [{ label: "Program", target: "program", active: step === "program" }];
  if (program) crumbs.push({ label: program.name, target: "subject", active: step === "subject" });
  if (subject) crumbs.push({ label: subject.name, target: "type", active: step === "type" });
  if (step === "yearly") crumbs.push({ label: "Yearly past questions", active: true });
  if (step === "topics") crumbs.push({ label: "Topic past questions", active: true });
  return (
    <nav className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground" aria-label="Breadcrumb">
      {crumbs.map((c, i) => (
        <span key={i} className="flex items-center gap-2">
          {i > 0 && <ChevronRight className="size-3.5" />}
          {c.target && !c.active ? <button onClick={() => onJump(c.target!)} className="font-medium text-foreground/70 hover:text-primary">{c.label}</button> : <span className={cn(c.active && "font-semibold text-foreground")}>{c.label}</span>}
        </span>
      ))}
    </nav>
  );
}

function StepShell({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
      <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">{title}</h2>
      <p className="mt-2 max-w-2xl text-muted-foreground">{description}</p>
      <div className="mt-8">{children}</div>
    </div>
  );
}

function ChoiceCard({ icon, badge, title, description, onClick }: { icon: React.ReactNode; badge: string; title: string; description: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="group relative flex flex-col items-start gap-4 rounded-2xl border bg-card p-6 text-left transition hover:-translate-y-1 hover:border-primary/50 hover:shadow-soft">
      <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">{icon}</div>
      <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{badge}</span>
      <h3 className="font-display text-2xl font-bold">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
      <span className="mt-auto flex items-center gap-1 text-sm font-semibold text-primary transition group-hover:gap-2">Continue <ChevronRight className="size-4" /></span>
    </button>
  );
}

function YearlyView({ years: YEARS, program, subject, premium, onBack, onOpenPdf }: { years: number[]; program: Program; subject: Subject; premium: ReturnType<typeof usePremium>; onBack: () => void; onOpenPdf: OpenPdf }) {
  const [papers, setPapers] = useState<Map<string, PastPaper>>(new Map());
  const [loading, setLoading] = useState(true);
  const [openYear, setOpenYear] = useState<number | null>(YEARS[0] ?? null);
  useEffect(() => { setOpenYear((cur) => (cur && YEARS.includes(cur) ? cur : YEARS[0] ?? null)); }, [YEARS]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchPastPapers(subject.key, subject.id)
      .then((rows) => { if (active) setPapers(indexPapers(rows.filter((r) => r.is_published).map((r) => ({ ...r, subject_key: subject.id })))); })
      .catch(() => { if (active) setPapers(new Map()); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [subject.id, subject.key]);

  return (
    <div>
      <BackBar onBack={onBack} label="Back to practice options" />
      <div className="mt-6 flex items-center gap-3">
        <CalendarDays className="text-primary" />
        <div>
          <h2 className="font-display text-3xl font-bold">Yearly past questions</h2>
          <p className="text-sm text-muted-foreground">{program.name} · {subject.name}{subject.code ? ` (${subject.code})` : ""}</p>
        </div>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">
        Every year is split into Feb/March, May/June and Oct/Nov. Pick a paper (1–6) to see its variants — e.g. Paper 11, 12, 13 — each shown with its matching mark scheme.
      </p>

      <div className="mt-8 space-y-4">
        {YEARS.map((y) => {
          const open = openYear === y;
          const yearCount = SESSIONS.reduce((n, s) => n + PAPER_NUMBERS.reduce((m, p) =>
            m + (papers.has(paperKey(subject.id, y, s, p, "question_paper")) ? 1 : 0)
              + (papers.has(paperKey(subject.id, y, s, p, "mark_scheme")) ? 1 : 0), 0), 0);
          return (
            <article key={y} className="overflow-hidden rounded-2xl border bg-card">
              <button
                onClick={() => setOpenYear(open ? null : y)}
                aria-expanded={open}
                className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-muted/40"
              >
                <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><CalendarDays className="size-5" /></div>
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wide text-primary">{subject.code} · {y}</p>
                  <h3 className="font-display text-xl font-bold">{y} Papers</h3>
                </div>
                <span className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
                  {loading ? "Loading…" : `${yearCount} file${yearCount === 1 ? "" : "s"} available`}
                  <ChevronRight className={cn("size-4 transition", open && "rotate-90")} />
                </span>
              </button>

              {open && (
                <div className="grid gap-4 border-t bg-muted/20 p-4 lg:grid-cols-3">
                  {yearCount === 0 ? (
                    <p className="col-span-full py-6 text-center text-sm text-muted-foreground">
                      No papers uploaded for {y} yet.
                    </p>
                  ) : (
                    SESSIONS.map((session) => (
                      <SessionCard
                        key={session}
                        session={session}
                        year={y}
                        subject={subject}
                        papers={papers}
                        premium={premium}
                        onOpenPdf={onOpenPdf}
                      />
                    ))
                  )}
                </div>
              )}

            </article>
          );
        })}
      </div>
    </div>
  );
}

function SessionCard({ session, year, subject, papers, premium, onOpenPdf }: {
  session: Session; year: number; subject: Subject; papers: Map<string, PastPaper>;
  premium: ReturnType<typeof usePremium>; onOpenPdf: OpenPdf;
}) {
  const [group, setGroup] = useState<string | null>(null);

  const { variants } = usePaperVariants();
  const groupCount = (g: string) => variantsOf(g, variants).reduce((n, v) =>
    n + (papers.has(paperKey(subject.id, year, session, v, "question_paper")) ? 1 : 0)
      + (papers.has(paperKey(subject.id, year, session, v, "mark_scheme")) ? 1 : 0), 0);

  const sessionCount = PAPER_GROUPS.reduce((n, g) => n + groupCount(g), 0);
  if (sessionCount === 0) return null;

  const visibleGroups = PAPER_GROUPS.filter((g) => groupCount(g) > 0);

  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="font-display text-sm font-bold">{session}</p>
      <p className="mt-1 text-[11px] text-muted-foreground">Tap a paper to choose its variant</p>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {visibleGroups.map((g) => {
          const count = groupCount(g);
          return (
            <button
              key={g}
              onClick={() => setGroup(g)}
              className="rounded-lg border bg-muted/30 px-2 py-2 text-center transition hover:-translate-y-0.5 hover:border-primary/50 hover:bg-primary/5"
            >
              <span className="block text-xs font-bold">Paper {g}</span>
              <span className="block text-[10px] text-muted-foreground">{count} file{count === 1 ? "" : "s"}</span>
            </button>
          );
        })}
      </div>

      <Dialog open={!!group} onOpenChange={(o) => !o && setGroup(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-display">
              {subject.code} · {year} · {session} — Paper {group}
            </DialogTitle>
          </DialogHeader>
          <p className="-mt-2 text-xs text-muted-foreground">
            Choose a variant. Each question paper is shown with its matching mark scheme.
          </p>
          <div className="mt-2 space-y-3">
            {group && variantsOf(group, variants)
              .filter((num) =>
                papers.has(paperKey(subject.id, year, session, num, "question_paper")) ||
                papers.has(paperKey(subject.id, year, session, num, "mark_scheme"))
              )
              .map((num) => (
              <div key={num} className="rounded-xl border bg-muted/20 p-3">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Variant · Paper {num}</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {(["question_paper", "mark_scheme"] as const).map((doc) => (
                    <PaperPreview
                      key={doc}
                      rec={papers.get(paperKey(subject.id, year, session, num, doc))}
                      num={num}
                      doc={doc}
                      label={`${subject.code} ${year} ${session} — ${doc === "question_paper" ? "Question Paper" : "Mark Scheme"} ${num}`}
                      premium={premium}
                      onOpenPdf={onOpenPdf}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


function PaperPreview({ rec, num, doc, label, premium, onOpenPdf }: {
  rec?: PastPaper; num: string; doc: "question_paper" | "mark_scheme"; label: string;
  premium: ReturnType<typeof usePremium>; onOpenPdf: OpenPdf;
}) {
  if (!rec) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-dashed px-3 py-2 opacity-60">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-[11px] font-bold">{num}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold">{doc === "question_paper" ? "Question Paper" : "Mark Scheme"} {num}</p>
          <p className="text-[11px] text-muted-foreground">Not uploaded yet</p>
        </div>
      </div>
    );
  }

  const locked = rec.access_level === "premium" && !premium.isPremium;
  const fileName = paperFileName(rec);
  const uploaded = rec.created_at ? new Date(rec.created_at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : null;

  return (
    <div className="rounded-lg border bg-card px-3 py-2.5 transition hover:border-primary/40 hover:shadow-soft">
      <div className="flex items-start gap-3">
        <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-md text-[11px] font-bold",
          doc === "question_paper" ? "bg-primary/10 text-primary" : "bg-brand-orange/10 text-brand-orange")}>{num}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold" title={fileName}>{fileName}</p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-muted-foreground">
            {uploaded && <span className="inline-flex items-center gap-1"><CalendarDays className="size-3" /> {uploaded}</span>}
            {rec.file_size_kb ? <span>{rec.file_size_kb} KB</span> : null}
            {locked ? <span className="font-semibold text-brand-orange">Premium</span> : <span className="font-semibold text-brand-green">Free</span>}
          </p>
        </div>
      </div>
      <div className="mt-2 flex gap-2">
        {locked ? (
          <Button asChild size="sm" variant="outline" className="h-7 flex-1 text-[11px]">
            <Link to="/pricing"><LockKeyhole className="size-3" /> Unlock with Premium</Link>
          </Button>
        ) : (
          <>
            <Button size="sm" variant="outline" className="h-7 flex-1 text-[11px]"
              onClick={() => onOpenPdf(rec.file_url, rec.title || label, false)}>
              <ExternalLink className="size-3" /> Open in viewer
            </Button>
            <Button asChild size="sm" variant="ghost" className="h-7 px-2 text-[11px]">
              <a href={driveDownload(rec.file_url)} target="_blank" rel="noopener" download={fileName} title={`Download ${fileName}`}>
                <Download className="size-3" /> Download
              </a>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

type TopicEntry = { topic: string; questions?: string; solutions?: string; videoUrl?: string; isFree: boolean };
type PaperEntry = { paper: string; label: string; topics: TopicEntry[] };

function TopicsView({ program, subject, premium, onBack, onOpenPdf, onOpenVideo }: { program: Program; subject: Subject; premium: ReturnType<typeof usePremium>; onBack: () => void; onOpenPdf: OpenPdf; onOpenVideo: OpenVideo }) {
  const [dbRows, setDbRows] = useState<TopicQuestion[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setDbRows(null);
    setSelected(null);
    fetchTopicQuestions(subject.key, subject.id)
      .then((rows) => { if (!cancelled) setDbRows(rows.filter((r) => r.is_published)); })
      .catch(() => { if (!cancelled) setDbRows([]); });
    return () => { cancelled = true; };
  }, [subject.id, subject.key]);

  const papers: PaperEntry[] = useMemo(() => {
    return groupByPaper(dbRows ?? []).map((g) => ({
        paper: g.paper,
        label: g.label,
        topics: g.rows.map((r) => ({
          topic: r.topic,
          questions: r.questions_url ?? undefined,
          solutions: r.ms_url ?? undefined,
          videoUrl: r.video_url ?? undefined,
          isFree: r.access_level === "free",
        })),
      }));
  }, [dbRows]);

  const active = papers.find((p) => p.paper === selected) ?? null;

  return (
    <div>
      <BackBar onBack={active ? () => setSelected(null) : onBack} label={active ? "Back to papers" : "Back to practice options"} />
      <div className="mt-6 flex items-center gap-3">
        <Layers3 className="shrink-0 text-brand-orange" />
        <div>
          <h2 className="font-display text-2xl font-bold sm:text-3xl">
            {active ? active.label : "Topic-based past questions"}
          </h2>
          <p className="text-sm text-muted-foreground">{program.name} · {subject.name}{subject.code ? ` (${subject.code})` : ""}</p>
        </div>
      </div>

      {dbRows === null ? (
        <div className="mt-10 flex justify-center py-16 text-muted-foreground"><Loader2 className="animate-spin" /></div>
      ) : papers.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">No topic questions have been published for {subject.name} yet.</div>
      ) : !active ? (
        <>
          <p className="mt-6 max-w-2xl text-sm text-muted-foreground">Choose a paper component — you'll then see its topics in syllabus order.</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {papers.map((p) => (
              <button
                key={p.paper}
                onClick={() => setSelected(p.paper)}
                className="group flex items-start gap-4 rounded-2xl border bg-card p-5 text-left transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-soft"
              >
                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 font-display text-sm font-bold text-primary">{p.paper}</span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-lg font-bold">{p.label}</span>
                  <span className="mt-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground/80">{p.topics.length} topics</span>
                </span>
                <ChevronRight className="mt-1 size-5 shrink-0 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" />
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {active.topics.map((a, i) => {
            const topic = a.topic;
            const hasReal = !!(a.questions || a.solutions || a.videoUrl);
            const isFree = a.isFree;
            const lockedNonFree = hasReal && !isFree && !premium.isPremium;
            return (
              <article key={topic} className="group flex flex-col rounded-2xl border bg-card p-5 transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-soft">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Topic {String(i + 1).padStart(2, "0")}</span>
                  {hasReal ? (isFree ? <FreeBadge /> : <PremiumBadge />) : <span className="text-[10px] font-semibold uppercase text-muted-foreground/70">Coming soon</span>}
                </div>
                <h3 className="mt-2 break-words font-display text-lg font-bold leading-snug">{topic}</h3>
                <p className="mt-2 text-sm text-muted-foreground">Past questions · Marking scheme · Video lesson</p>
                <div className="mt-4 grid gap-2">
                  <Button size="sm" variant="outline" className="justify-start" disabled={!a.questions}
                    onClick={() => a.questions && onOpenPdf(a.questions, `${topic} — Past Questions`, false)}>
                    <BookMarked /> {a.questions ? "View past questions" : "Questions coming soon"}
                  </Button>
                  {a.solutions ? (
                    <LockableButton locked={lockedNonFree} onClick={() => onOpenPdf(a.solutions!, `${topic} — Marking Scheme`, !isFree)}>
                      <BookMarked /> {lockedNonFree ? "Marking scheme (Premium)" : "View marking scheme"}
                    </LockableButton>
                  ) : (
                    <Button size="sm" variant="outline" className="justify-start" disabled><BookMarked /> Marking scheme coming soon</Button>
                  )}
                  {a.videoUrl ? (
                    <LockableButton locked={lockedNonFree} onClick={() => onOpenVideo(a.videoUrl!, `${topic} — Video Solution`, !isFree)}>
                      <PlayCircle /> {lockedNonFree ? "Video (Premium)" : "Watch video"}
                    </LockableButton>
                  ) : (
                    <Button size="sm" variant="outline" className="justify-start" disabled><PlayCircle /> Video coming soon</Button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}


function BackBar({ onBack, label }: { onBack: () => void; label: string }) {
  return (
    <button onClick={onBack} className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary">
      <ArrowLeft className="size-4" /> {label}
    </button>
  );
}

export function SatPracticeCard() {
  return (
    <aside className="flex flex-col gap-4 rounded-3xl border bg-card p-6 shadow-soft sm:flex-row sm:items-center">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"><GraduationCap className="size-6" /></span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Digital SAT</p>
        <h3 className="mt-1 font-display text-xl font-bold">SAT practice question bank</h3>
        <p className="mt-1 text-sm text-muted-foreground">Official-style Math and Reading &amp; Writing questions — pick a section, domain, skill and difficulty, with explanations after you submit.</p>
      </div>
      <Button asChild className="shrink-0"><Link to="/quiz?exam=SAT">Practise SAT <ArrowRight /></Link></Button>
    </aside>
  );
}

export function PremiumCTA() {
  return (
    <aside className="flex h-full flex-col items-start gap-5 rounded-3xl bg-brand-navy p-7 text-hero-foreground">
      <LockKeyhole className="size-8 text-brand-green" />
      <div><h3 className="font-display text-2xl font-bold">Go deeper with Premium</h3><p className="mt-2 text-hero-foreground/70">Step-by-step video walkthroughs, worked solutions, and priority learning support.</p></div>
      <Button asChild variant="hero" className="mt-auto"><Link to="/pricing">View plans <ArrowRight /></Link></Button>
    </aside>
  );
}

export function TutorCTA() {
  return (
    <aside className="flex h-full flex-col items-start gap-5 rounded-3xl border bg-card p-7">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Users className="size-6" /></div>
      <div><h3 className="font-display text-2xl font-bold">Need a tutor by your side?</h3><p className="mt-2 text-muted-foreground">Book an approved Mathematics tutor — pick by subject, topic, and availability with transparent pricing.</p></div>
      <Button asChild className="mt-auto" size="lg"><Link to="/tutors">Find a Tutor <ArrowRight /></Link></Button>
    </aside>
  );
}

