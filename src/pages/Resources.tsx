import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, BookMarked, CalendarDays, ChevronRight, Download,
  ExternalLink, GraduationCap, Layers3, LockKeyhole, PlayCircle, Search, Sigma, Sparkles, Users, X,
} from "lucide-react";
import { SiteShell, PageHero, Seo } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { usePremium } from "@/hooks/use-premium";
import { SESSIONS, PAPER_NUMBERS, PAPER_GROUPS, variantsOf, type Session, fetchPastPapers, indexPapers, paperKey, paperFileName, type PastPaper } from "@/lib/past-papers";


// ---------- helpers ----------
type ViewerState =
  | { kind: "pdf"; url: string; title: string; downloadUrl?: string }
  | { kind: "video"; youtubeId: string; title: string }
  | null;

const ytId = (url: string) => url.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/)?.[1] ?? "";
const driveId = (url: string) => url.match(/\/file\/d\/([\w-]+)/)?.[1] ?? "";
const drivePreview = (url: string) => {
  const id = driveId(url);
  return id ? `https://drive.google.com/file/d/${id}/preview` : url;
};
const driveDownload = (url: string) => {
  const id = driveId(url);
  return id ? `https://drive.google.com/uc?export=download&id=${id}` : url;
};

// ---------- domain data ----------
type Program = { id: string; name: string; tagline: string; badge: string };
type Subject = { id: string; name: string; code: string; level: string; programId: string };

const PROGRAMS: Program[] = [
  { id: "cambridge", name: "Cambridge", tagline: "AS / A-Level pathway for university-bound students.", badge: "9709 · 9231" },
  { id: "igcse", name: "IGCSE", tagline: "International GCSE foundation for Years 10–11.", badge: "0580 · 0606" },
];

const SUBJECTS: Subject[] = [
  { id: "math-9709", name: "Mathematics", code: "9709", level: "A-Level", programId: "cambridge" },
  { id: "fmath-9231", name: "Further Mathematics", code: "9231", level: "A-Level", programId: "cambridge" },
  { id: "math-0580", name: "Mathematics", code: "0580", level: "IGCSE", programId: "igcse" },
  { id: "fmath-0606", name: "Additional Mathematics", code: "0606", level: "IGCSE", programId: "igcse" },
];

const subjectsByProgram = (pid: string) => SUBJECTS.filter((s) => s.programId === pid);

const YEARS = [2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018];


const TOPICS: Record<string, string[]> = {
  "math-9709": ["Quadratics", "Functions", "Coordinate Geometry", "Circular Measure", "Trigonometry", "Series", "Differentiation", "Integration", "Vectors", "Numerical Solutions", "Probability", "Statistics"],
  "fmath-9231": ["Roots of Polynomials", "Rational Functions", "Summation of Series", "Matrices", "Polar Coordinates", "Vectors", "Proof by Induction", "Differential Equations", "Complex Numbers", "Hyperbolic Functions"],
  "math-0580": ["Number", "Algebra", "Coordinate Geometry", "Geometry", "Mensuration", "Trigonometry", "Vectors & Transformations", "Statistics", "Probability"],
  "fmath-0606": ["Sets", "Functions", "Quadratic Functions", "Indices & Surds", "Factors of Polynomials", "Logarithmic & Exponential", "Straight Line Graphs", "Circular Measure", "Trigonometry", "Permutations & Combinations", "Series", "Vectors", "Differentiation", "Integration", "Kinematics"],
};

// ---------- real assets ----------
const SAMPLE_PDF = "https://www.africau.edu/images/default/sample.pdf";

type YearlyAssets = { paper?: string; scheme?: string };
const YEARLY_ASSETS: Record<string, Partial<Record<number, Partial<Record<Session, YearlyAssets>>>>> = {
  "math-9709": {
    2025: {
      "Feb / March": {
        paper: "https://drive.google.com/file/d/1YAX9kv5sT1Tm2NMemS1MZQAvZkxEObws/view?usp=drive_link",
        scheme: "https://drive.google.com/file/d/1LEa0w73pBlG2fnW5NrY5YW5Uab5HhiML/view?usp=drive_link",
      },
    },
  },
};

type TopicAssets = { questions?: string; solutions?: string; videoUrl?: string; isFree?: boolean };
const TOPIC_ASSETS: Record<string, Record<string, TopicAssets>> = {
  "math-9709": {
    "Series": {
      questions: "https://drive.google.com/file/d/1vehvlz7C3_NhkjOBHhfIMWUi1cTKIa8Z/view?usp=drive_link",
      solutions: "https://drive.google.com/file/d/1x-rtoTc3P7GT1dsYvgQpEKNdCkEA2cFR/view?usp=drive_link",
      videoUrl: "https://youtu.be/AsrUcvWocqg?si=IxOXn3zNtMggq00J",
      isFree: true,
    },
    "Coordinate Geometry": {
      questions: "https://drive.google.com/file/d/1STr6AtCTJYf2kGZ0GM-AOZrGCYVmJL7i/view?usp=drive_link",
      solutions: "https://drive.google.com/file/d/1BtCTIdoFMxudqt8IkYDbbLPlkpLd1wjF/view?usp=drive_link",
      videoUrl: "https://youtu.be/6WV3RwPSET8?si=NlPxpaVmAz8i6Rt4",
      isFree: true,
    },
  },
};

const getTopicAssets = (subjectId: string, topic: string): TopicAssets =>
  TOPIC_ASSETS[subjectId]?.[topic] ?? {};

const getYearlyAssets = (subjectId: string, year: number, session: Session): YearlyAssets =>
  YEARLY_ASSETS[subjectId]?.[year]?.[session] ?? {};

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
              <Button asChild size="sm" variant="outline">
                <a href={state.downloadUrl ?? state.url} target="_blank" rel="noopener"><Download /> Download</a>
              </Button>
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
  hasPaper: boolean;
  hasScheme: boolean;
  hasQuestions: boolean;
  hasSolutions: boolean;
  hasVideo: boolean;
  isFree: boolean;
  assets: { paper?: string; scheme?: string; questions?: string; solutions?: string; videoUrl?: string };
};

function buildIndex(): SearchItem[] {
  const items: SearchItem[] = [];
  for (const subject of SUBJECTS) {
    const program = PROGRAMS.find((p) => p.id === subject.programId)!;
    for (const year of YEARS) {
      for (const session of SESSIONS) {
        const a = getYearlyAssets(subject.id, year, session);
        items.push({
          id: `y:${subject.id}:${year}:${session}`,
          kind: "yearly",
          program, subject, year, session,
          title: `${subject.code} ${year} ${session}`,
          subtitle: `${program.name} · ${subject.name} · Yearly past questions`,
          hasPaper: true, hasScheme: true,
          hasQuestions: false, hasSolutions: false, hasVideo: false,
          isFree: true,
          assets: { paper: a.paper ?? SAMPLE_PDF, scheme: a.scheme ?? SAMPLE_PDF },
        });
      }
    }
    for (const topic of TOPICS[subject.id] ?? []) {
      const a = getTopicAssets(subject.id, topic);
      const hasReal = !!(a.questions || a.solutions || a.videoUrl);
      items.push({
        id: `t:${subject.id}:${topic}`,
        kind: "topic",
        program, subject, topic,
        title: topic,
        subtitle: `${program.name} · ${subject.name} · Topic past questions`,
        hasPaper: false, hasScheme: false,
        hasQuestions: true, hasSolutions: true, hasVideo: true,
        isFree: !!a.isFree || !hasReal ? !!a.isFree : false,
        assets: {
          questions: a.questions, solutions: a.solutions, videoUrl: a.videoUrl,
        },
      });
    }
  }
  return items;
}

// ---------- SEO ----------
type Search = { program?: string; subject?: string; view?: "yearly" | "topics" };
const findProgram = (id?: string) => PROGRAMS.find((p) => p.id === id) ?? null;
const findSubject = (programId?: string, subjectId?: string) =>
  !programId || !subjectId ? null : SUBJECTS.find((s) => s.id === subjectId && s.programId === programId) ?? null;

function buildMeta(s: Search) {
  const program = findProgram(s.program);
  const subject = findSubject(s.program, s.subject);
  const base = "CatchUp Tutors";
  let title = `Resource Library | ${base}`;
  let description = "Search Cambridge & IGCSE past questions, mark schemes, topic PQs and video solutions — filter by program, subject, topic or year.";
  if (program && subject && s.view === "yearly") {
    title = `${subject.name} ${subject.code} Yearly Past Papers (2018–2025) | ${base}`;
    description = `Download ${program.name} ${subject.name} ${subject.code} past papers and marking schemes by session.`;
  } else if (program && subject && s.view === "topics") {
    title = `${subject.name} ${subject.code} Topic Past Questions | ${base}`;
    description = `Topic-grouped past questions for ${program.name} ${subject.name} ${subject.code} with solutions and video lessons.`;
  } else if (program && subject) {
    title = `${program.name} ${subject.name} (${subject.code}) | ${base}`;
  } else if (program) {
    title = `${program.name} Mathematics Resources | ${base}`;
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
  const program = findProgram(search.program);
  const subject = findSubject(search.program, search.subject);

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

  const index = useMemo(() => buildIndex(), []);
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
      return [it.title, it.subtitle, it.topic, it.subject.code, it.subject.name, String(it.year ?? "")]
        .filter(Boolean).some((x) => x!.toString().toLowerCase().includes(needle));
    });
  }, [index, q, fProgram, fSubject, fYear, fSession, fType, fAccess]);

  // when program filter changes, reset subject if no longer matches
  useEffect(() => {
    if (fSubject !== "all" && fProgram !== "all") {
      const sub = SUBJECTS.find((s) => s.id === fSubject);
      if (sub && sub.programId !== fProgram) setFSubject("all");
    }
  }, [fProgram, fSubject]);

  const go = (next: Partial<Search>) => {
    const merged = { ...search, ...next };
    const p = new URLSearchParams();
    if (merged.program) p.set("program", merged.program);
    if (merged.subject) p.set("subject", merged.subject);
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

  const meta = buildMeta(search);
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
    setViewer({ kind: "pdf", url: drivePreview(url), downloadUrl: driveDownload(url), title });
  };
  const openVideo = (url: string, title: string, locked: boolean) => {
    if (locked && !premium.isPremium) return; // gate handled in UI
    setViewer({ kind: "video", youtubeId: ytId(url), title });
  };

  return (
    <SiteShell>
      <Seo title={meta.title} description={meta.description} path="/resources" jsonLd={jsonLd} />
      <PageHero
        eyebrow="Resource library"
        title="Search past questions, schemes & video solutions."
        description="Filter by program, subject, topic or exam year — open PDFs in-browser, download for offline, or watch the worked-solution video."
      />
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* ============ Advanced search ============ */}
        <div className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Search className="size-4 text-primary" /> Advanced search
            {hasFilters && (
              <button onClick={clearFilters} className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-primary">
                <X className="size-3.5" /> Clear filters
              </button>
            )}
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="lg:col-span-2">
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search topic, year, 9709, Series, May/June…"
                aria-label="Search resources"
              />
            </div>
            <FilterSelect value={fProgram} onChange={setFProgram} placeholder="Program"
              options={[{ v: "all", l: "All programs" }, ...PROGRAMS.map((p) => ({ v: p.id, l: p.name }))]} />
            <FilterSelect value={fSubject} onChange={setFSubject} placeholder="Subject"
              options={[{ v: "all", l: "All subjects" }, ...(fProgram === "all" ? SUBJECTS : subjectsByProgram(fProgram)).map((s) => ({ v: s.id, l: `${s.name} (${s.code})` }))]} />
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
              {step === "program" && (
                <StepShell eyebrow="Step 1 of 3" title="Choose your program" description="Start with the examination board you're preparing for.">
                  <div className="grid gap-5 md:grid-cols-2">
                    {PROGRAMS.map((p) => <ChoiceCard key={p.id} icon={<GraduationCap className="size-6" />} badge={p.badge} title={p.name} description={p.tagline} onClick={() => go({ program: p.id, subject: undefined, view: undefined })} />)}
                  </div>
                </StepShell>
              )}
              {step === "subject" && program && (
                <StepShell eyebrow="Step 2 of 3" title={`${program.name} subjects`} description="Select the subject you want to revise.">
                  <div className="grid gap-5 md:grid-cols-2">
                    {subjectsByProgram(program.id).map((s) => <ChoiceCard key={s.id} icon={<Sigma className="size-6" />} badge={`${s.level} · ${s.code}`} title={s.name} description={`Full ${s.level} ${s.name} syllabus — papers, schemes & lessons.`} onClick={() => go({ subject: s.id, view: undefined })} />)}
                  </div>
                </StepShell>
              )}
              {step === "type" && program && subject && (
                <StepShell eyebrow="Step 3 of 3" title={`${subject.name} (${subject.code})`} description="How would you like to practice today?">
                  <div className="grid gap-5 md:grid-cols-2">
                    <ChoiceCard icon={<CalendarDays className="size-6" />} badge="By exam session" title="Yearly past questions" description="Full question papers and marking schemes from 2018 – 2025, Feb/March, May/June & Oct/Nov." onClick={() => go({ view: "yearly" })} />
                    <ChoiceCard icon={<Layers3 className="size-6" />} badge="By syllabus topic" title="Topic-based past questions" description="Targeted question sets per syllabus topic — with worked solutions and video lessons." onClick={() => go({ view: "topics" })} />
                  </div>
                </StepShell>
              )}
              {step === "yearly" && subject && program && (
                <YearlyView program={program} subject={subject} premium={premium} onBack={() => go({ view: undefined })} onOpenPdf={openPdf} />
              )}
              {step === "topics" && subject && program && (
                <TopicsView program={program} subject={subject} premium={premium} onBack={() => go({ view: undefined })} onOpenPdf={openPdf} onOpenVideo={openVideo} />
              )}
            </div>
          </div>
        )}

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
                <span className="text-xs font-bold uppercase tracking-wide text-primary">{it.subject.code} · {it.kind === "yearly" ? `${it.year}` : "Topic"}</span>
                {it.isFree ? <FreeBadge /> : <PremiumBadge />}
              </div>
              <h3 className="font-display text-lg font-bold">{it.title}</h3>
              <p className="text-xs text-muted-foreground">{it.subtitle}</p>
              <div className="mt-auto grid gap-2">
                {it.kind === "yearly" && (
                  <>
                    <Button size="sm" variant="outline" className="justify-start" onClick={() => onOpenPdf(it.assets.paper!, `${it.title} — Paper`, false)}>
                      <BookMarked /> View paper
                    </Button>
                    <Button size="sm" variant="outline" className="justify-start" onClick={() => onOpenPdf(it.assets.scheme!, `${it.title} — Mark scheme`, false)}>
                      <BookMarked /> View mark scheme
                    </Button>
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

function YearlyView({ program, subject, premium, onBack, onOpenPdf }: { program: Program; subject: Subject; premium: ReturnType<typeof usePremium>; onBack: () => void; onOpenPdf: OpenPdf }) {
  const [papers, setPapers] = useState<Map<string, PastPaper>>(new Map());
  const [loading, setLoading] = useState(true);
  const [openYear, setOpenYear] = useState<number | null>(YEARS[0]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchPastPapers(subject.id)
      .then((rows) => { if (active) setPapers(indexPapers(rows)); })
      .catch(() => { if (active) setPapers(new Map()); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [subject.id]);

  return (
    <div>
      <BackBar onBack={onBack} label="Back to practice options" />
      <div className="mt-6 flex items-center gap-3">
        <CalendarDays className="text-primary" />
        <div>
          <h2 className="font-display text-3xl font-bold">Yearly past questions</h2>
          <p className="text-sm text-muted-foreground">{program.name} · {subject.name} ({subject.code})</p>
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
                  {SESSIONS.map((session) => (
                    <SessionCard
                      key={session}
                      session={session}
                      year={y}
                      subject={subject}
                      papers={papers}
                      premium={premium}
                      onOpenPdf={onOpenPdf}
                    />
                  ))}
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

  const groupCount = (g: string) => variantsOf(g).reduce((n, v) =>
    n + (papers.has(paperKey(subject.id, year, session, v, "question_paper")) ? 1 : 0)
      + (papers.has(paperKey(subject.id, year, session, v, "mark_scheme")) ? 1 : 0), 0);

  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="font-display text-sm font-bold">{session}</p>
      <p className="mt-1 text-[11px] text-muted-foreground">Select a paper to see its variants</p>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {PAPER_GROUPS.map((g) => {
          const active = group === g;
          const count = groupCount(g);
          return (
            <button
              key={g}
              onClick={() => setGroup(active ? null : g)}
              aria-pressed={active}
              className={cn(
                "rounded-lg border px-2 py-2 text-center transition hover:border-primary/50",
                active ? "border-primary bg-primary/10" : "bg-muted/30",
              )}
            >
              <span className="block text-xs font-bold">Paper {g}</span>
              <span className="block text-[10px] text-muted-foreground">{count} file{count === 1 ? "" : "s"}</span>
            </button>
          );
        })}
      </div>

      {group && (
        <div className="mt-4 space-y-3">
          {variantsOf(group).map((num) => (
            <div key={num} className="rounded-lg border bg-muted/20 p-2">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Paper {num}</p>
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
      )}
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

function TopicsView({ program, subject, premium, onBack, onOpenPdf, onOpenVideo }: { program: Program; subject: Subject; premium: ReturnType<typeof usePremium>; onBack: () => void; onOpenPdf: OpenPdf; onOpenVideo: OpenVideo }) {
  const topics = TOPICS[subject.id] ?? [];
  return (
    <div>
      <BackBar onBack={onBack} label="Back to practice options" />
      <div className="mt-6 flex items-center gap-3">
        <Layers3 className="text-brand-orange" />
        <div><h2 className="font-display text-3xl font-bold">Topic-based past questions</h2><p className="text-sm text-muted-foreground">{program.name} · {subject.name} ({subject.code})</p></div>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {topics.map((topic, i) => {
          const a = getTopicAssets(subject.id, topic);
          const hasReal = !!(a.questions || a.solutions || a.videoUrl);
          const isFree = !!a.isFree;
          const lockedNonFree = hasReal && !isFree && !premium.isPremium;
          return (
            <article key={topic} className="group flex flex-col rounded-2xl border bg-card p-5 transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-soft">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Topic {String(i + 1).padStart(2, "0")}</span>
                {hasReal ? (isFree ? <FreeBadge /> : <PremiumBadge />) : <span className="text-[10px] font-semibold uppercase text-muted-foreground/70">Coming soon</span>}
              </div>
              <h3 className="mt-2 font-display text-lg font-bold">{topic}</h3>
              <p className="mt-2 text-sm text-muted-foreground">Past questions · Worked solutions · Video lesson</p>
              <div className="mt-4 grid gap-2">
                <Button size="sm" variant="outline" className="justify-start" disabled={!a.questions && !hasReal}
                  onClick={() => onOpenPdf(a.questions ?? SAMPLE_PDF, `${topic} — Past Questions`, false)}>
                  <BookMarked /> View past questions
                </Button>
                <LockableButton locked={lockedNonFree} onClick={() => onOpenPdf(a.solutions ?? SAMPLE_PDF, `${topic} — Worked Solutions`, !isFree && hasReal)}>
                  <BookMarked /> {lockedNonFree ? "Solutions (Premium)" : "View solutions"}
                </LockableButton>
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
