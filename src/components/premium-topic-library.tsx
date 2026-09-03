import { useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, FileText, LockKeyhole, PlayCircle, Unlock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CATALOG_SUBJECTS } from "@/lib/catalog";
import { cn } from "@/lib/utils";

/**
 * Subject → topic library. Each topic exposes premium notes and a video explanation,
 * shown locked until the learner has premium access.
 */
export default function PremiumTopicLibrary({ unlocked, ctaLabel }: { unlocked: boolean; ctaLabel: string }) {
  const [subjectId, setSubjectId] = useState(CATALOG_SUBJECTS[0].id);
  const subject = CATALOG_SUBJECTS.find((s) => s.id === subjectId)!;

  return (
    <section className="mt-14">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="font-display text-xl font-bold sm:text-2xl">Topic notes & video explanations</h2>
        <Badge variant="secondary">{CATALOG_SUBJECTS.length} subjects</Badge>
      </div>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Pick a subject, then open any topic for written explanations and a walkthrough video from a Catch-Up tutor.
      </p>

      <div className="-mx-4 mt-5 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex w-max min-w-full gap-2">
          {CATALOG_SUBJECTS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSubjectId(s.id)}
              className={cn(
                "shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition",
                s.id === subjectId ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted",
              )}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {subject.topics.map((topic) => (
          <article key={topic} className="flex flex-col rounded-2xl border bg-card p-5 transition hover:-translate-y-0.5 hover:shadow-soft">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <BookOpen className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wide text-primary">{subject.name}</p>
                <h3 className="break-words font-display text-base font-bold leading-snug">{topic}</h3>
              </div>
              <span className={cn("ml-auto shrink-0", unlocked ? "text-brand-green" : "text-muted-foreground")}>
                {unlocked ? <Unlock className="size-4" /> : <LockKeyhole className="size-4" />}
              </span>
            </div>

            <div className="mt-4 grid gap-2">
              <ItemRow icon={FileText} label="Premium notes" unlocked={unlocked} ctaLabel={ctaLabel} />
              <ItemRow icon={PlayCircle} label="Video explanation" unlocked={unlocked} ctaLabel={ctaLabel} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ItemRow({
  icon: Icon, label, unlocked, ctaLabel,
}: { icon: typeof FileText; label: string; unlocked: boolean; ctaLabel: string }) {
  if (!unlocked) {
    return (
      <Button asChild size="sm" variant="outline" className="h-auto w-full justify-start whitespace-normal py-2 text-left">
        <Link to="/pricing">
          <LockKeyhole className="size-4 shrink-0" />
          <span className="min-w-0">{label} · {ctaLabel}</span>
        </Link>
      </Button>
    );
  }
  return (
    <div className="flex items-center gap-2 rounded-xl border bg-muted/30 px-3 py-2 text-sm">
      <Icon className="size-4 shrink-0 text-primary" />
      <span className="min-w-0 break-words">{label}</span>
      <Badge variant="secondary" className="ml-auto shrink-0">Unlocked</Badge>
    </div>
  );
}
