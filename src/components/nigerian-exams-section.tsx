import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Flag, Loader2, ListChecks } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NG_EXAMS, useNgCounts, quizLink } from "@/lib/nigerian-exams";
import { cn } from "@/lib/utils";

/** JAMB / WAEC / NECO objective questions that students can practise online. */
export default function NigerianExamsSection() {
  const { data, isLoading, isError } = useNgCounts();
  const [active, setActive] = useState<string>(NG_EXAMS[0].label);

  const byExam = useMemo(() => {
    const map = new Map<string, { subject: string; years: number[]; count: number }[]>();
    for (const exam of NG_EXAMS) map.set(exam.label, []);
    for (const row of data ?? []) {
      const list = map.get(row.exam) ?? [];
      const existing = list.find((s) => s.subject === row.subject);
      if (existing) {
        existing.count += row.count;
        if (row.year && !existing.years.includes(row.year)) existing.years.push(row.year);
      } else {
        list.push({ subject: row.subject, years: row.year ? [row.year] : [], count: row.count });
      }
      map.set(row.exam, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => b.count - a.count);
      list.forEach((s) => s.years.sort((a, b) => b - a));
    }
    return map;
  }, [data]);

  const total = (label: string) => (byExam.get(label) ?? []).reduce((n, s) => n + s.count, 0);
  const subjects = byExam.get(active) ?? [];

  return (
    <section className="rounded-3xl border bg-card p-6 shadow-soft sm:p-8">
      <div className="flex flex-wrap items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-xl bg-brand-green/10 text-brand-green">
          <Flag className="size-5" />
        </span>
        <div className="min-w-0">
          <h3 className="font-display text-xl font-bold sm:text-2xl">Nigerian examinations</h3>
          <p className="text-sm text-muted-foreground">
            JAMB, WAEC and NECO objective past questions with answers and explanations — practise them online.
          </p>
        </div>
        <Button asChild variant="ghost" size="sm" className="sm:ml-auto">
          <Link to="/quiz">Open practice <ArrowRight className="size-4" /></Link>
        </Button>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {NG_EXAMS.map((exam) => (
          <button
            key={exam.id}
            type="button"
            onClick={() => setActive(exam.label)}
            className={cn(
              "rounded-xl border px-4 py-2.5 text-left transition hover:-translate-y-0.5 hover:shadow-soft",
              active === exam.label ? "border-primary bg-primary/5" : "bg-muted/30",
            )}
          >
            <p className="font-display text-sm font-bold">{exam.label}</p>
            <p className="text-[11px] text-muted-foreground">
              {isLoading ? "Loading…" : `${total(exam.label)} questions`}
            </p>
          </button>
        ))}
      </div>

      <p className="mt-4 text-sm text-muted-foreground">{NG_EXAMS.find((e) => e.label === active)?.blurb}</p>

      <div className="mt-4">
        {isLoading ? (
          <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Loading question counts…
          </div>
        ) : isError ? (
          <p className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
            Couldn't load the question counts. Please refresh the page.
          </p>
        ) : subjects.length === 0 ? (
          <p className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
            {active} questions are being added — check back shortly.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {subjects.map((s) => (
              <article key={s.subject} className="rounded-2xl border bg-muted/20 p-4 transition hover:-translate-y-0.5 hover:shadow-soft">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-display text-sm font-bold">{s.subject}</h4>
                  <Badge variant="secondary">{s.count}</Badge>
                </div>
                {s.years.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {s.years.slice(0, 6).map((y) => (
                      <Link
                        key={y}
                        to={quizLink(active, s.subject, y)}
                        className="rounded-full bg-background px-2.5 py-1 text-[11px] font-medium hover:bg-primary/10 hover:text-primary"
                      >
                        {y}
                      </Link>
                    ))}
                  </div>
                )}
                <Button asChild size="sm" variant="outline" className="mt-3 w-full">
                  <Link to={quizLink(active, s.subject)}>
                    <ListChecks className="size-4" /> Practise {s.subject}
                  </Link>
                </Button>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
