import { Link } from "react-router-dom";
import { MapPin, CalendarDays, GraduationCap, HeartHandshake, ArrowRight, Sparkles, Trophy, Newspaper, Clock, CheckCircle2 } from "lucide-react";
import { SiteShell, PageHero, Seo } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const summerBanner = { url: "/summer-banner.jpeg" };
const summerGroup = { url: "/summer-group.jpeg" };
const summerPrize1 = { url: "/summer-prize-1.jpeg" };
const summerPrize2 = { url: "/summer-prize-2.jpeg" };

const VENUE = "Al-Bayan High School, Ilorin, Kwara State";

const UPCOMING = [
  { title: "Free Summer Academy 2026", when: "Aug 4 – Sep 5, 2026", where: VENUE, tag: "Summer Lessons", href: "/summerlessons" },
  { title: "Volunteer Tutor Orientation", when: "Jul 28, 2026", where: "Zoom + Ilorin", tag: "Tutors" },
  { title: "Parent & Student Open Day", when: "Aug 2, 2026", where: VENUE, tag: "Community" },
];

const PAST = [
  { title: "Summer Lesson 2025 Class Group Photo", when: "Sep 2025", img: summerGroup.url, note: "Our secondary-school scholars and volunteer tutors at Al-Bayan High School, Ilorin a full house of learners on closing day." },
  { title: "Scholarship Award Abdulrahman Ahmad", when: "Sep 2025", img: summerPrize1.url, note: "₦10,000 cash prize presented to Abdulrahman Ahmad for outstanding performance during the 2025 Summer Lesson." },
  { title: "NECO Sponsorship Abdulateef S. Arewa", when: "Sep 2025", img: summerPrize2.url, note: "Free NECO registration awarded to Abdulateef S. Arewa as best-performing student of the 2025 cohort." },
];

const NEWS = [
  { title: "Awards & Gift Presentations 2025", img: summerPrize2.url, blurb: "Cash prizes, free NECO/WAEC registration and gift items presented to the top-performing students of the 2025 Summer Lesson." },
  { title: "Free Summer Lesson Campaign Ilorin", img: summerBanner.url, blurb: "Community outreach for the free summer academy at Al-Bayan High School, Akerebiate, Ilorin." },
];

export default function Events() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: UPCOMING.map((e, i) => ({ "@type": "ListItem", position: i + 1, name: e.title })),
  };
  return (
    <SiteShell>
      <Seo
        title="Events & Community | CatchUp Tutors"
        description="Upcoming and past CatchUp Tutors events including the free Summer Lessons programme at Al-Bayan High School, Ilorin."
        path="/events"
        jsonLd={jsonLd}
      />
      <PageHero
        eyebrow="Events & Community"
        title="Where CatchUp Tutors meets in real life"
        description="Summer academies, olympiads, orientation days and community programmes all in one place."
      >
        <div className="flex flex-wrap gap-4 text-sm text-hero-foreground/80">
          <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4" /> Ilorin, Kwara State</span>
          <span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4" /> Physical & online</span>
        </div>
      </PageHero>

      {/* Featured: Summer Lessons banner + CTAs */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#FF6B12]">Featured event</p>
            <h2 className="mt-2 font-display text-3xl font-bold text-brand-navy sm:text-4xl">Free Summer Lessons Ilorin</h2>
          </div>
          <Link to="/summerlessons" className="hidden text-sm font-semibold text-primary hover:underline sm:inline-flex">
            View full page <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>

        <div className="overflow-hidden rounded-3xl border bg-card shadow-soft">
          <div className="relative aspect-[16/7] w-full overflow-hidden bg-brand-navy">
            <img src={summerBanner.url} alt="Catch-Up Tutors Free Summer Lesson banner" className="h-full w-full object-cover opacity-80" />
            <div className="absolute inset-0 bg-gradient-to-r from-brand-navy/90 via-brand-navy/40 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-end p-6 text-white sm:p-10">
              <Badge className="w-fit bg-[#FF6B12] text-white hover:bg-[#FF6B12]">Registration open</Badge>
              <h3 className="mt-3 font-display text-2xl font-bold sm:text-4xl">Summer Academy 2026</h3>
              <p className="mt-2 max-w-xl text-sm text-white/85 sm:text-base">Fully sponsored coaching for secondary students at {VENUE}. Small classes, patient teaching, official admission letter.</p>
            </div>
          </div>
          <div className="grid gap-4 border-t bg-muted/40 p-6 sm:grid-cols-2 sm:p-8">
            <Button asChild size="lg" className="w-full">
              <Link to="/summerlessons/student"><GraduationCap className="mr-1" /> Register as student <ArrowRight /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full border-[#FF6B12] text-[#FF6B12] hover:bg-[#FF6B12] hover:text-white">
              <Link to="/summerlessons/tutor"><HeartHandshake className="mr-1" /> Apply as volunteer tutor <ArrowRight /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Upcoming */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-[#FF6B12]" />
          <h2 className="font-display text-2xl font-bold text-brand-navy sm:text-3xl">Upcoming activities</h2>
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {UPCOMING.map((e) => (
            <article key={e.title} className="flex flex-col rounded-2xl border bg-card p-6 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift">
              <Badge variant="secondary" className="w-fit">{e.tag}</Badge>
              <h3 className="mt-3 font-display text-lg font-bold text-brand-navy">{e.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground"><CalendarDays className="mr-1 inline h-4 w-4" />{e.when}</p>
              <p className="text-sm text-muted-foreground"><MapPin className="mr-1 inline h-4 w-4" />{e.where}</p>
              {e.href && (
                <Button asChild variant="link" className="mt-3 w-fit px-0">
                  <Link to={e.href}>Learn more <ArrowRight className="ml-1 h-3 w-3" /></Link>
                </Button>
              )}
            </article>
          ))}
        </div>
      </section>

      {/* Past */}
      <section className="bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-brand-green" />
            <h2 className="font-display text-2xl font-bold text-brand-navy sm:text-3xl">Already done</h2>
          </div>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">A look back at the events we've delivered with our students, tutors and community partners.</p>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {PAST.map((e) => (
              <article key={e.title} className="overflow-hidden rounded-2xl border bg-card shadow-soft">
                <div className="aspect-[4/3] w-full overflow-hidden">
                  <img src={e.img} alt={e.title} className="h-full w-full object-cover transition duration-500 hover:scale-105" loading="lazy" />
                </div>
                <div className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#FF6B12]">{e.when}</p>
                  <h3 className="mt-1 font-display text-lg font-bold text-brand-navy">{e.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{e.note}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* News highlights */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <Newspaper className="h-5 w-5 text-primary" />
          <h2 className="font-display text-2xl font-bold text-brand-navy sm:text-3xl">News highlights</h2>
        </div>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Pictures and stories from last year's Summer Lessons, plus awards and gift presentations.</p>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {NEWS.map((n) => (
            <article key={n.title} className="group grid grid-cols-[140px_1fr] gap-5 overflow-hidden rounded-2xl border bg-card p-4 shadow-soft sm:grid-cols-[180px_1fr]">
              <div className="aspect-square overflow-hidden rounded-xl">
                <img src={n.img} alt={n.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" />
              </div>
              <div className="flex flex-col justify-center">
                <div className="flex items-center gap-2 text-[#FF6B12]"><Trophy className="h-4 w-4" /><span className="text-xs font-bold uppercase tracking-wider">Highlight</span></div>
                <h3 className="mt-1 font-display text-lg font-bold text-brand-navy">{n.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{n.blurb}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-14 rounded-3xl border bg-muted/40 p-8 text-center">
          <Sparkles className="mx-auto h-6 w-6 text-[#FF6B12]" />
          <h3 className="mt-4 font-display text-xl font-bold text-brand-navy">Want to sponsor or partner with an event?</h3>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Reach us on WhatsApp <a href="https://wa.me/2348101804411" className="font-semibold text-primary hover:underline">+234 810 180 4411</a> or email{" "}
            <a href="mailto:Catchuptutors01@gmail.com" className="font-semibold text-primary hover:underline">Catchuptutors01@gmail.com</a>.
          </p>
        </div>
      </section>
    </SiteShell>
  );
}
