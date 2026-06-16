import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  BookMarked,
  CalendarDays,
  ChevronRight,
  Download,
  GraduationCap,
  Layers3,
  LockKeyhole,
  PlayCircle,
  Sigma,
} from "lucide-react";
import { SiteShell, PageHero } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Program = { id: string; name: string; tagline: string; badge: string };
type Subject = { id: string; name: string; code: string; level: string };

const PROGRAMS: Program[] = [
  { id: "cambridge", name: "Cambridge", tagline: "AS / A-Level pathway for university-bound students.", badge: "9709 · 9231" },
  { id: "igcse", name: "IGCSE", tagline: "International GCSE foundation for Years 10–11.", badge: "0580 · 0606" },
];

const SUBJECTS: Record<string, Subject[]> = {
  cambridge: [
    { id: "math-9709", name: "Mathematics", code: "9709", level: "A-Level" },
    { id: "fmath-9231", name: "Further Mathematics", code: "9231", level: "A-Level" },
  ],
  igcse: [
    { id: "math-0580", name: "Mathematics", code: "0580", level: "IGCSE" },
    { id: "fmath-0606", name: "Additional Mathematics", code: "0606", level: "IGCSE" },
  ],
};

const YEARS = [2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018];

const TOPICS: Record<string, string[]> = {
  "math-9709": ["Quadratics","Functions","Coordinate Geometry","Circular Measure","Trigonometry","Series","Differentiation","Integration","Vectors","Numerical Solutions","Probability","Statistics"],
  "fmath-9231": ["Roots of Polynomials","Rational Functions","Summation of Series","Matrices","Polar Coordinates","Vectors","Proof by Induction","Differential Equations","Complex Numbers","Hyperbolic Functions"],
  "math-0580": ["Number","Algebra","Coordinate Geometry","Geometry","Mensuration","Trigonometry","Vectors & Transformations","Statistics","Probability"],
  "fmath-0606": ["Sets","Functions","Quadratic Functions","Indices & Surds","Factors of Polynomials","Logarithmic & Exponential","Straight Line Graphs","Circular Measure","Trigonometry","Permutations & Combinations","Series","Vectors","Differentiation","Integration","Kinematics"],
};

type ViewKind = "yearly" | "topics";
type Search = { program?: string; subject?: string; view?: ViewKind };

function findProgram(id?: string) { return PROGRAMS.find((p) => p.id === id) ?? null; }
function findSubject(programId?: string, subjectId?: string) {
  if (!programId || !subjectId) return null;
  return SUBJECTS[programId]?.find((s) => s.id === subjectId) ?? null;
}

function buildMeta(search: Search) {
  const program = findProgram(search.program);
  const subject = findSubject(search.program, search.subject);
  const base = "CatchUp Tutors";
  let title = `Resource Library | ${base}`;
  let description = "Cambridge and IGCSE Mathematics — yearly past questions, topic-based PQs, marking schemes, and video lessons.";
  const path = ["/resources"];
  if (search.program) path.push(`?program=${search.program}`);

  if (program && !subject) {
    title = `${program.name} Mathematics Resources | ${base}`;
    description = `${program.name} Mathematics & Further Mathematics — syllabus-aligned past questions, schemes and lessons (${program.badge}).`;
  }
  if (program && subject && !search.view) {
    title = `${program.name} ${subject.name} (${subject.code}) — Past Questions | ${base}`;
    description = `Pick yearly or topic-based past questions for ${program.name} ${subject.name} ${subject.code}.`;
  }
  if (program && subject && search.view === "yearly") {
    title = `${subject.name} ${subject.code} Yearly Past Papers (2018–2025) | ${base}`;
    description = `Download ${program.name} ${subject.name} ${subject.code} past papers and marking schemes from 2018 to 2025, May/June and Oct/Nov sessions.`;
  }
  if (program && subject && search.view === "topics") {
    title = `${subject.name} ${subject.code} Topic-Based Past Questions | ${base}`;
    description = `Topic-grouped past questions for ${program.name} ${subject.name} ${subject.code} with worked solutions and video lessons.`;
  }
  const url = `/resources${search.program ? `?program=${search.program}` : ""}${search.subject ? `&subject=${search.subject}` : ""}${search.view ? `&view=${search.view}` : ""}`;
  return { title, description, url, program, subject };
}

export const Route = createFileRoute("/resources")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    program: typeof s.program === "string" ? s.program : undefined,
    subject: typeof s.subject === "string" ? s.subject : undefined,
    view: s.view === "yearly" || s.view === "topics" ? s.view : undefined,
  }),
  head: ({ search }) => {
    const m = buildMeta(search as Search);
    const ld: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: m.title,
      description: m.description,
      url: m.url,
      isPartOf: { "@type": "WebSite", name: "CatchUp Tutors" },
    };
    if (m.program && m.subject) {
      ld["@type"] = "LearningResource";
      ld["educationalLevel"] = m.subject.level;
      ld["learningResourceType"] = (search as Search).view === "topics" ? "Topic questions" : "Past examination papers";
      ld["about"] = `${m.program.name} ${m.subject.name} (${m.subject.code})`;
    }
    return {
      meta: [
        { title: m.title },
        { name: "description", content: m.description },
        { property: "og:title", content: m.title },
        { property: "og:description", content: m.description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: m.url },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: m.title },
        { name: "twitter:description", content: m.description },
      ],
      links: [{ rel: "canonical", href: m.url }],
      scripts: [{ type: "application/ld+json", children: JSON.stringify(ld) }],
    };
  },
  component: ResourcesPage,
});

function ResourcesPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/resources" });
  const program = findProgram(search.program);
  const subject = findSubject(search.program, search.subject);

  const go = (next: Partial<Search>) => navigate({ search: { ...search, ...next } });
  const reset = () => navigate({ search: {} });

  const step: "program" | "subject" | "type" | "yearly" | "topics" =
    search.view === "yearly" ? "yearly"
    : search.view === "topics" ? "topics"
    : subject ? "type"
    : program ? "subject"
    : "program";

  return (
    <SiteShell>
      <PageHero
        eyebrow="Resource library"
        title="Practice with purpose. Built around the syllabus."
        description="Pick your program, choose a subject, then dive into yearly past questions or topic-based practice — with marking schemes and video walkthroughs."
      />

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <Breadcrumbs
          step={step}
          program={program}
          subject={subject}
          onJump={(s) => {
            if (s === "program") reset();
            if (s === "subject") go({ subject: undefined, view: undefined });
            if (s === "type") go({ view: undefined });
          }}
        />

        <div className="mt-8">
          {step === "program" && (
            <StepShell eyebrow="Step 1 of 3" title="Choose your program" description="Start with the examination board you're preparing for.">
              <div className="grid gap-5 md:grid-cols-2">
                {PROGRAMS.map((p) => (
                  <ChoiceCard key={p.id} icon={<GraduationCap className="size-6" />} badge={p.badge} title={p.name} description={p.tagline} onClick={() => go({ program: p.id, subject: undefined, view: undefined })} />
                ))}
              </div>
            </StepShell>
          )}

          {step === "subject" && program && (
            <StepShell eyebrow="Step 2 of 3" title={`${program.name} subjects`} description="Select the subject you want to revise.">
              <div className="grid gap-5 md:grid-cols-2">
                {SUBJECTS[program.id].map((s) => (
                  <ChoiceCard key={s.id} icon={<Sigma className="size-6" />} badge={`${s.level} · ${s.code}`} title={s.name} description={`Full ${s.level} ${s.name} syllabus — papers, schemes & lessons.`} onClick={() => go({ subject: s.id, view: undefined })} />
                ))}
              </div>
            </StepShell>
          )}

          {step === "type" && program && subject && (
            <StepShell eyebrow="Step 3 of 3" title={`${subject.name} (${subject.code})`} description="How would you like to practice today?">
              <div className="grid gap-5 md:grid-cols-2">
                <ChoiceCard icon={<CalendarDays className="size-6" />} badge="By exam session" title="Yearly past questions" description="Full question papers and marking schemes from 2018 – 2025, summer & winter sessions." onClick={() => go({ view: "yearly" })} />
                <ChoiceCard icon={<Layers3 className="size-6" />} badge="By syllabus topic" title="Topic-based past questions" description="Targeted question sets per syllabus topic — with worked solutions and video lessons." onClick={() => go({ view: "topics" })} />
              </div>
            </StepShell>
          )}

          {step === "yearly" && subject && program && (
            <YearlyView program={program} subject={subject} onBack={() => go({ view: undefined })} />
          )}

          {step === "topics" && subject && program && (
            <TopicsView program={program} subject={subject} onBack={() => go({ view: undefined })} />
          )}
        </div>
      </section>
    </SiteShell>
  );
}

type Step = "program" | "subject" | "type" | "yearly" | "topics";

function Breadcrumbs({ step, program, subject, onJump }: { step: Step; program: Program | null; subject: Subject | null; onJump: (s: Step) => void }) {
  const crumbs: { label: string; target?: Step; active?: boolean }[] = [{ label: "Program", target: "program", active: step === "program" }];
  if (program) crumbs.push({ label: program.name, target: "subject", active: step === "subject" });
  if (subject) crumbs.push({ label: subject.name, target: "type", active: step === "type" });
  if (step === "yearly") crumbs.push({ label: "Yearly past questions", active: true });
  if (step === "topics") crumbs.push({ label: "Topic past questions", active: true });
  return (
    <nav className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground" aria-label="Breadcrumb">
      {crumbs.map((c, i) => (
        <span key={i} className="flex items-center gap-2">
          {i > 0 && <ChevronRight className="size-3.5" />}
          {c.target && !c.active ? (
            <button onClick={() => onJump(c.target!)} className="font-medium text-foreground/70 hover:text-primary">{c.label}</button>
          ) : (
            <span className={cn(c.active && "font-semibold text-foreground")}>{c.label}</span>
          )}
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

function YearlyView({ program, subject, onBack }: { program: Program; subject: Subject; onBack: () => void }) {
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
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {YEARS.map((y) => (
          <article key={y} className="rounded-2xl border bg-card p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-primary">{subject.code} · {y}</p>
            <h3 className="mt-2 font-display text-2xl font-bold">{y} Papers</h3>
            <div className="mt-5 grid gap-2">
              {["May / June", "Oct / Nov"].map((session) => (
                <div key={session} className="rounded-xl border p-3">
                  <p className="mb-2 text-sm font-semibold">{session}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button size="sm" variant="outline" disabled><Download /> Paper</Button>
                    <Button size="sm" variant="outline" disabled><BookMarked /> Scheme</Button>
                  </div>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
      <PremiumCTA />
    </div>
  );
}

function TopicsView({ program, subject, onBack }: { program: Program; subject: Subject; onBack: () => void }) {
  const topics = TOPICS[subject.id] ?? [];
  return (
    <div>
      <BackBar onBack={onBack} label="Back to practice options" />
      <div className="mt-6 flex items-center gap-3">
        <Layers3 className="text-brand-orange" />
        <div>
          <h2 className="font-display text-3xl font-bold">Topic-based past questions</h2>
          <p className="text-sm text-muted-foreground">{program.name} · {subject.name} ({subject.code})</p>
        </div>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {topics.map((topic, i) => (
          <article key={topic} className="group rounded-2xl border bg-card p-5 transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-soft">
            <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Topic {String(i + 1).padStart(2, "0")}</span>
            <h3 className="mt-2 font-display text-lg font-bold">{topic}</h3>
            <p className="mt-2 text-sm text-muted-foreground">Questions · Solutions · Video</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button size="sm" variant="outline" disabled><Download /> Pack</Button>
              <Button size="sm" variant="outline" disabled><PlayCircle /> Lesson</Button>
            </div>
          </article>
        ))}
      </div>
      <PremiumCTA />
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

function PremiumCTA() {
  return (
    <aside className="mt-12 flex flex-col items-start gap-5 rounded-3xl bg-brand-navy p-7 text-hero-foreground md:flex-row md:items-center md:justify-between">
      <div className="flex items-start gap-4">
        <LockKeyhole className="mt-1 size-8 text-brand-green" />
        <div>
          <h3 className="font-display text-2xl font-bold">Go deeper with Premium</h3>
          <p className="mt-1 max-w-xl text-hero-foreground/70">Step-by-step video walkthroughs, worked solutions, and priority learning support.</p>
        </div>
      </div>
      <Button asChild variant="hero"><Link to="/pricing">View plans</Link></Button>
    </aside>
  );
}
