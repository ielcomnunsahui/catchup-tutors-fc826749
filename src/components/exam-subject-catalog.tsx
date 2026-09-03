import { Link } from "react-router-dom";
import { Globe2, MapPin, BookOpen, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CATALOG_SUBJECTS, examsByScope } from "@/lib/catalog";

/** Exam boards + subject catalogue shared by /programs and /resources. */
export default function ExamSubjectCatalog({ compact = false }: { compact?: boolean }) {
  return (
    <div className="space-y-10">
      <div className="grid gap-5 lg:grid-cols-2">
        <ExamGroup
          icon={Globe2}
          title="International examinations"
          accent="bg-primary/10 text-primary"
          exams={examsByScope("international")}
        />
        <ExamGroup
          icon={MapPin}
          title="Local examinations"
          accent="bg-brand-orange/10 text-brand-orange"
          exams={examsByScope("local")}
        />
      </div>

      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="font-display text-xl font-bold sm:text-2xl">Subjects we teach</h3>
          <Badge variant="secondary">{CATALOG_SUBJECTS.length}</Badge>
          {!compact && (
            <Button asChild variant="ghost" size="sm" className="sm:ml-auto">
              <Link to="/premium">Topic notes & videos <ArrowRight className="size-4" /></Link>
            </Button>
          )}
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CATALOG_SUBJECTS.map((s) => (
            <article key={s.id} className="rounded-2xl border bg-card p-5 transition hover:-translate-y-0.5 hover:shadow-soft">
              <div className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <BookOpen className="size-5" />
                </span>
                <h4 className="font-display text-base font-bold">{s.name}</h4>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                {s.topics.length} topics · notes & video explanations
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {s.topics.slice(0, 3).map((t) => (
                  <span key={t} className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium">{t}</span>
                ))}
                {s.topics.length > 3 && (
                  <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium">+{s.topics.length - 3}</span>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

function ExamGroup({
  icon: Icon, title, accent, exams,
}: { icon: typeof Globe2; title: string; accent: string; exams: { id: string; name: string; blurb: string }[] }) {
  return (
    <section className="rounded-3xl border bg-card p-6 shadow-soft">
      <div className="flex items-center gap-3">
        <span className={`flex size-11 items-center justify-center rounded-xl ${accent}`}><Icon className="size-5" /></span>
        <h3 className="font-display text-lg font-bold sm:text-xl">{title}</h3>
        <Badge variant="secondary" className="ml-auto">{exams.length}</Badge>
      </div>
      <ul className="mt-5 grid gap-2 sm:grid-cols-2">
        {exams.map((e) => (
          <li key={e.id} className="rounded-xl border bg-muted/30 p-3">
            <p className="font-display text-sm font-bold">{e.name}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{e.blurb}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
