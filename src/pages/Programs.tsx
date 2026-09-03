import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Sigma } from "lucide-react";
import { SiteShell, PageHero, Seo } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { PremiumCTA, TutorCTA } from "./Resources";
import { heroImages } from "@/assets/heroes";

const PROGRAM_LIST = [
  { name: "Cambridge Mathematics", description: "Cambridge IGCSE/AS/A-Level Mathematics program with deep conceptual learning." },
  { name: "Cambridge Further Mathematics", description: "Advanced Cambridge Further Mathematics with rigorous exam preparation." },
  { name: "IGCSE Mathematics", description: "Focused IGCSE Mathematics exam preparation with topic-based practice." },
];

export default function Programs() {
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
  return (
    <SiteShell>
      <Seo title="Cambridge & IGCSE Programs | CatchUp Tutors" description="Explore Cambridge and IGCSE Mathematics and Further Mathematics learning programs." path="/programs" jsonLd={jsonLd} />
      <PageHero image={heroImages.programs} eyebrow="Learning pathways" title="Choose the program that moves you forward." description="Structured exam preparation, targeted practice, premium lessons, and tutor support—organized around your curriculum." />
      <section className="mx-auto grid max-w-7xl gap-7 px-4 py-16 sm:px-6 md:grid-cols-2 lg:px-8">
        {[
          { name: "Cambridge", icon: Sigma, accent: "bg-primary", subjects: ["Mathematics", "Further Mathematics"], text: "Deep conceptual learning for confident problem-solving across Cambridge pathways." },
          { name: "IGCSE", icon: BookOpen, accent: "bg-brand-orange", subjects: ["Mathematics"], text: "Focused exam preparation with clear topic pathways and deliberate past-paper practice." },
        ].map((program) => (
          <article key={program.name} className="group overflow-hidden rounded-3xl border bg-card shadow-soft transition hover:-translate-y-1 hover:shadow-lift">
            <div className={`${program.accent} p-8 text-primary-foreground`}>
              <program.icon className="h-10 w-10" />
              <h2 className="mt-8 font-display text-4xl font-bold">{program.name}</h2>
            </div>
            <div className="p-8">
              <p className="leading-7 text-muted-foreground">{program.text}</p>
              <div className="mt-6 flex flex-wrap gap-2">{program.subjects.map((s) => <span key={s} className="rounded-full bg-muted px-3 py-1.5 text-sm font-semibold">{s}</span>)}</div>
              <Button asChild className="mt-8"><Link to="/resources">Explore subjects <ArrowRight /></Link></Button>
            </div>
          </article>
        ))}
      </section>
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <h2 className="font-display text-2xl font-bold sm:text-3xl">Examinations & subjects we cover</h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          One-on-one tutoring, resources and premium topic lessons across international and local examinations.
        </p>
        <div className="mt-8"><ExamSubjectCatalog /></div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-5 px-4 pb-20 sm:px-6 lg:grid-cols-2 lg:px-8">
        <PremiumCTA />
        <TutorCTA />
      </section>
    </SiteShell>
  );
}
