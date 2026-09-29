import { Link } from "react-router-dom";
import { ArrowRight, CalendarDays, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PROGRAMME_PLANS, naira } from "@/lib/programme-plans";
import { useProgrammePlans } from "@/hooks/use-programme-plans";

export default function ProgrammePrices() {
  const { data: plans = PROGRAMME_PLANS } = useProgrammePlans();
  return (
    <section id="programmes" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-14 sm:px-6 lg:px-8">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Exam preparation programmes</p>
      <h2 className="mt-2 font-display text-2xl font-semibold sm:text-3xl">One fixed monthly fee per programme</h2>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Choose your study days and schedule one or more lessons on each day. Your monthly fee stays fixed.
      </p>
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {plans.map((p) => (
          <article key={p.key} className="group flex flex-col rounded-lg border bg-card p-5 transition-colors duration-200 hover:border-primary/35">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl font-semibold">{p.name}</h3>
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                <CalendarDays className="size-3.5" /> {p.days} days/week
              </span>
            </div>
            <p className="mt-4 font-display text-2xl font-semibold">{naira(p.fee)}<span className="text-sm font-normal text-muted-foreground"> / month</span></p>
            {p.note && <p className="mt-2 flex items-center gap-1.5 text-sm font-medium"><Check className="size-4 text-brand-green" /> {p.note}</p>}
            <p className="mt-2 flex-1 text-sm text-muted-foreground">{p.blurb}</p>
            <Button asChild variant="outline" className="mt-6 w-full">
              <Link to={`/enrol/${p.key.toLowerCase()}`}>Enrol Now <ArrowRight /></Link>
            </Button>
          </article>
        ))}
      </div>
    </section>
  );
}
