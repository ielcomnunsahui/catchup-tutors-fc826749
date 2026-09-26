import { Link } from "react-router-dom";
import { ArrowRight, CalendarDays, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PROGRAMME_PLANS, naira } from "@/lib/programme-plans";

export default function ProgrammePrices() {
  return (
    <section id="programmes" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-14 sm:px-6 lg:px-8">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Exam preparation programmes</p>
      <h2 className="mt-2 font-display text-2xl font-bold sm:text-3xl">One fixed monthly fee per programme</h2>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Live classes with our tutors every week. Choose your programme, pick your days and class time, and enrol.
      </p>
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {PROGRAMME_PLANS.map((p) => (
          <article key={p.key} className="group flex flex-col rounded-3xl border bg-card p-6 shadow-soft transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lift">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-2xl font-bold">{p.name}</h3>
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary">
                <CalendarDays className="size-3.5" /> {p.days} days/week
              </span>
            </div>
            <p className="mt-4 font-display text-3xl font-bold">{naira(p.fee)}<span className="text-sm font-medium text-muted-foreground"> / month</span></p>
            {p.note && <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold"><Check className="size-4 text-brand-green" /> {p.note}</p>}
            <p className="mt-2 flex-1 text-sm text-muted-foreground">{p.blurb}</p>
            <Button asChild className="mt-6 w-full">
              <Link to={`/enrol/${p.key.toLowerCase()}`}>Enrol Now <ArrowRight /></Link>
            </Button>
          </article>
        ))}
      </div>
    </section>
  );
}
