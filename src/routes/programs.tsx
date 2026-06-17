import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, Sigma } from "lucide-react";
import { SiteShell, PageHero } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { PremiumCTA, TutorCTA } from "@/routes/resources";

export const Route = createFileRoute("/programs")({ head: () => ({ meta: [{ title: "Cambridge & IGCSE Programs | CatchUp Tutors" }, { name: "description", content: "Explore Cambridge and IGCSE Mathematics and Further Mathematics learning programs." }, { property: "og:title", content: "CatchUp Tutors Programs" }, { property: "og:description", content: "Structured Cambridge and IGCSE Mathematics learning pathways." }] }), component: ProgramsPage });

function ProgramsPage() {
  return (
    <SiteShell>
      <PageHero eyebrow="Learning pathways" title="Choose the program that moves you forward." description="Structured exam preparation, targeted practice, premium lessons, and tutor support—organized around your curriculum." />
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
              <div className="mt-6 flex flex-wrap gap-2">
                {program.subjects.map((s) => <span key={s} className="rounded-full bg-muted px-3 py-1.5 text-sm font-semibold">{s}</span>)}
              </div>
              <Button asChild className="mt-8"><Link to="/resources">Explore subjects <ArrowRight /></Link></Button>
            </div>
          </article>
        ))}
      </section>
      <section className="mx-auto grid max-w-7xl gap-5 px-4 pb-20 sm:px-6 lg:grid-cols-2 lg:px-8">
        <PremiumCTA />
        <TutorCTA />
      </section>
    </SiteShell>
  );
}
