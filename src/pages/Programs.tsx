import { Link } from "react-router-dom";
import {
  ArrowRight, BookOpen, CalendarDays, CheckCircle2, Flag, GraduationCap, Layers3,
  PlayCircle, Sigma, Sparkles, Target, Users,
} from "lucide-react";
import { SiteShell, PageHero, Seo } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { PremiumCTA, TutorCTA, SatPracticeCard } from "./Resources";
import { useQuery } from "@tanstack/react-query";
import { fetchManagedQuestionCatalogue } from "@/lib/past-papers";
import ExamSubjectCatalog from "@/components/exam-subject-catalog";
import AdmissionRequirements from "@/components/admission-requirements";
import { quizLink } from "@/lib/nigerian-exams";
import { EXAMS, CATALOG_SUBJECTS } from "@/lib/catalog";
import { heroImages } from "@/assets/heroes";
import ProgrammePrices from "@/components/programme-prices";

const LOCAL_PATHWAYS = [
  {
    name: "JAMB",
    text: "UTME preparation across four subjects, with timed objective practice and explanations for every answer.",
    subjects: ["Mathematics", "English Language", "Physics", "Chemistry", "Biology", "Economics"],
  },
  {
    name: "WAEC",
    text: "WASSCE coverage with topic-by-topic revision and past objective questions by year.",
    subjects: ["Mathematics", "English Language", "Further Mathematics", "Biology", "Accounting", "Government"],
  },
  {
    name: "NECO",
    text: "SSCE preparation mirroring the NECO syllabus, with worked explanations after every attempt.",
    subjects: ["Mathematics", "English Language", "Physics", "Chemistry", "Agricultural Science", "Commerce"],
  },
];


const PROGRAM_LIST = [
  { name: "Cambridge Mathematics", description: "Cambridge IGCSE/AS/A-Level Mathematics program with deep conceptual learning." },
  { name: "Cambridge Further Mathematics", description: "Advanced Cambridge Further Mathematics with rigorous exam preparation." },
  { name: "IGCSE Mathematics", description: "Focused IGCSE Mathematics exam preparation with topic-based practice." },
];

const STEPS = [
  { icon: Target, title: "Pick your exam", text: "Choose the board and subjects you're sitting — international or local." },
  { icon: Layers3, title: "Follow the topics", text: "Work through syllabus topics with notes and targeted question sets." },
  { icon: CalendarDays, title: "Drill past papers", text: "Practise real papers by year, session and variant with mark schemes." },
  { icon: Users, title: "Get tutor support", text: "Book one-on-one contacts for the topics that still feel shaky." },
];

export default function Programs() {
  const { data: catalogue, isLoading: catalogueLoading } = useQuery({ queryKey: ["managed-question-catalogue"], queryFn: fetchManagedQuestionCatalogue, staleTime: 5 * 60_000 });
  const managedProgrammes = (catalogue?.programmes ?? []).filter((p) => p.is_published);
  const managedSubjects = (catalogue?.subjects ?? []).filter((s) => s.is_published && managedProgrammes.some((p) => p.id === s.program_id));
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: PROGRAM_LIST.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Course",
        name: p.name,
        description: p.description,
        provider: { "@type": "EducationalOrganization", name: "CatchUp Tutors" },
      },
    })),
  };

  const stats = [
    { icon: GraduationCap, value: catalogueLoading ? "…" : `${managedProgrammes.length || EXAMS.length}`, label: "Programmes" },
    { icon: BookOpen, value: catalogueLoading ? "…" : `${managedSubjects.length || CATALOG_SUBJECTS.length}`, label: "Subjects with resources" },
    { icon: Layers3, value: `${CATALOG_SUBJECTS.reduce((n, s) => n + s.topics.length, 0)}+`, label: "Syllabus topics" },
    { icon: PlayCircle, value: "1-on-1", label: "Live tutor contacts" },
  ];

  return (
    <SiteShell>
      <Seo title="Cambridge & IGCSE Programs | CatchUp Tutors" description="Explore Cambridge and IGCSE Mathematics and Further Mathematics learning programs." path="/programs" jsonLd={jsonLd} />
      <PageHero image={heroImages.programs} eyebrow="Learning pathways" title="Choose the program that moves you forward." description="Structured exam preparation, targeted practice, premium lessons, and tutor support—organized around your curriculum." className="pb-12" />

      {/* Stats strip */}
      <section className="mx-auto mt-0 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-3 rounded-3xl border bg-card p-4 shadow-lift sm:grid-cols-2 lg:grid-cols-4 lg:p-5">
          {stats.map((s) => (
            <div key={s.label} className="flex items-center gap-3 rounded-2xl p-3 transition hover:bg-muted/50">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <s.icon className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="font-display text-xl font-bold leading-none">{s.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <ProgrammePrices />

      {/* Pathways */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Core pathways</p>
        <h2 className="mt-2 font-display text-2xl font-bold sm:text-3xl">Structured programs, built around the syllabus</h2>
        {catalogueLoading ? (
          <p className="mt-8 text-sm text-muted-foreground">Loading programmes…</p>
        ) : managedProgrammes.length === 0 ? (
          <p className="mt-8 rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">Programmes will appear here once published.</p>
        ) : (
        <div className="mt-8 grid gap-7 md:grid-cols-2">
          {managedProgrammes.map((program, i) => {
            const subs = managedSubjects.filter((s) => s.program_id === program.id);
            const accent = ["bg-primary", "bg-brand-orange", "bg-brand-green", "bg-brand-navy"][i % 4];
            return (
            <article key={program.id} className="group flex flex-col overflow-hidden rounded-3xl border bg-card shadow-soft transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lift">
              <div className={`${accent} p-8 text-primary-foreground`}>
                <div className="flex items-start justify-between">
                  <Sigma className="h-10 w-10" />
                  <span className="rounded-full bg-primary-foreground/15 px-3 py-1 text-xs font-bold tracking-wide">{subs.length} subject{subs.length === 1 ? "" : "s"}</span>
                </div>
                <h3 className="mt-8 font-display text-4xl font-bold">{program.name}</h3>
              </div>
              <div className="flex flex-1 flex-col p-8">
                {subs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Subjects coming soon.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {subs.map((s) => (
                      <Link key={s.id} to={`/resources?program=${program.slug}&subject=${s.slug}`} className="rounded-full bg-muted px-3 py-1.5 text-sm font-semibold transition hover:bg-primary/10 hover:text-primary">{s.name}</Link>
                    ))}
                  </div>
                )}
                <ul className="mt-6 space-y-2">
                  {["Yearly past papers by session", "Topic questions with mark schemes", "Video lessons and tutor support"].map((t) => (
                    <li key={t} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand-green" /> {t}
                    </li>
                  ))}
                </ul>
                <div className="mt-8 flex flex-wrap gap-2">
                  <Button asChild><Link to={`/resources?program=${program.slug}`}>Explore resources <ArrowRight /></Link></Button>
                  <Button asChild variant="outline"><Link to="/tutors">Book a tutor</Link></Button>
                </div>
              </div>
            </article>
            );
          })}
        </div>
        )}
        <div className="mt-8"><SatPracticeCard /></div>
      </section>

      {/* How it works */}
      <section className="border-y bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">How it works</p>
          <h2 className="mt-2 font-display text-2xl font-bold sm:text-3xl">Four steps from lost to exam-ready</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <div key={s.title} className="relative rounded-2xl border bg-card p-6 transition hover:-translate-y-0.5 hover:shadow-soft">
                <span className="absolute right-5 top-5 font-display text-3xl font-bold text-muted-foreground/20">{i + 1}</span>
                <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><s.icon className="size-5" /></span>
                <h3 className="mt-4 font-display text-base font-bold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Nigerian examinations */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Nigerian examinations</p>
        <h2 className="mt-2 font-display text-2xl font-bold sm:text-3xl">JAMB, WAEC &amp; NECO pathways</h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Practise real objective past questions with explanations, and check what each university course expects of you.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {LOCAL_PATHWAYS.map((p) => (
            <article key={p.name} className="flex flex-col rounded-3xl border bg-card p-6 shadow-soft transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-lift">
              <div className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-xl bg-brand-green/10 text-brand-green"><Flag className="size-5" /></span>
                <h3 className="font-display text-xl font-bold">{p.name}</h3>
              </div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{p.text}</p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {p.subjects.map((s) => (
                  <span key={s} className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium">{s}</span>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                <Button asChild size="sm"><Link to={quizLink(p.name)}>Practise questions <ArrowRight className="size-4" /></Link></Button>
                <Button asChild size="sm" variant="outline"><Link to="/tutors">Book a tutor</Link></Button>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-8"><AdmissionRequirements /></div>
      </section>

      {/* Catalogue */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Full coverage</p>
        <h2 className="mt-2 font-display text-2xl font-bold sm:text-3xl">Examinations &amp; subjects we cover</h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          One-on-one tutoring, resources and premium topic lessons across international and local examinations.
        </p>
        <div className="mt-8"><ExamSubjectCatalog /></div>
      </section>

      {/* Premium banner */}
      <section className="mx-auto max-w-7xl px-4 pb-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start gap-4 rounded-3xl border border-brand-orange/30 bg-brand-orange/5 p-6 sm:flex-row sm:items-center">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-brand-orange/15 text-brand-orange"><Sparkles className="size-6" /></span>
          <div className="min-w-0">
            <h3 className="font-display text-lg font-bold">Not sure which program fits you?</h3>
            <p className="text-sm text-muted-foreground">Tell us your exam date and target grade — we'll map a study plan for you.</p>
          </div>
          <Button asChild className="sm:ml-auto"><Link to="/contact">Talk to us <ArrowRight /></Link></Button>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:px-8">
        <PremiumCTA />
        <TutorCTA />
      </section>
    </SiteShell>
  );
}
