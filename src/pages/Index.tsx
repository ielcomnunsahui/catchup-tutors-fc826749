import { Link } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { ArrowRight, ArrowUpRight, Quote, ChevronLeft, ChevronRight } from "lucide-react";
import { SiteShell, Seo } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import heroCampus from "@/assets/hero-campus.jpg";

type Testimonial = { quote: string; name: string; role: string; image?: string };

const TESTIMONIALS: Testimonial[] = [
  { quote: "I went from struggling with Paper 3 to a confident A. The topic packs and worked solutions made every concept click.", name: "Aisha O.", role: "Cambridge A-Level Mathematics" },
  { quote: "The video walkthroughs are the clearest I've ever seen. My tutor tailored every session to my weak areas.", name: "Daniel K.", role: "IGCSE Additional Mathematics" },
  { quote: "Past questions sorted by topic saved me hours. I knew exactly what to revise the week before the exam.", name: "Chiamaka E.", role: "Cambridge Further Mathematics" },
  { quote: "Finally a platform that treats Maths like a craft. Premium was worth every Naira.", name: "Yusuf A.", role: "IGCSE Mathematics" },
];

const PROGRAMMES = [
  { title: "IGCSE Mathematics", desc: "Structured tuition across the full 0580 and 0606 syllabus with graded practice sets.", to: "/programs" },
  { title: "Cambridge AS & A-Level", desc: "Deep coverage of 9709 Pure, Mechanics, Statistics and Further Mathematics.", to: "/programs" },
  { title: "Topic Mastery Packs", desc: "Focused walkthroughs on the topics students find hardest, from vectors to calculus.", to: "/resources" },
  { title: "Exam Sprint Coaching", desc: "Intensive 1:1 preparation with past-paper drills and marking scheme technique.", to: "/tutors" },
];

const NEWS = [
  { tag: "New resource", title: "Feb/March 2025 Cambridge 9709 papers with worked solutions", to: "/resources" },
  { tag: "Programme", title: "Circle geometry topic pack now live for IGCSE learners", to: "/resources" },
  { tag: "Announcement", title: "Weekend sprint classes open for June 2026 series", to: "/programs" },
];

const STATS: [string, string][] = [
  ["20+", "Expert tutors"],
  ["10K+", "Students helped"],
  ["98%", "Success rate"],
  ["2", "Global regions"],
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

function Reveal({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
}

function Testimonials() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setI((p) => (p + 1) % TESTIMONIALS.length), 7000);
    return () => clearInterval(t);
  }, [paused]);
  const prev = () => setI((p) => (p - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
  const next = () => setI((p) => (p + 1) % TESTIMONIALS.length);
  const t = TESTIMONIALS[i];
  const initials = t.name.split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase();
  return (
    <section
      className="border-t border-border py-20 sm:py-28"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Student testimonials"
    >
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">What students say</p>
        <div className="relative mt-10 min-h-[320px] sm:min-h-[280px]" aria-live="polite">
          <AnimatePresence mode="wait">
            <motion.figure
              key={i}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              <Avatar className="mx-auto h-16 w-16 border border-border">
                {t.image && <AvatarImage src={t.image} alt="" />}
                <AvatarFallback className="bg-brand-navy text-sm font-semibold text-hero-foreground">{initials}</AvatarFallback>
              </Avatar>
              <Quote className="mx-auto mt-6 h-6 w-6 text-muted-foreground/50" aria-hidden="true" />
              <blockquote className="mt-4 font-display text-xl leading-relaxed text-foreground sm:text-2xl md:text-[28px]">
                "{t.quote}"
              </blockquote>
              <figcaption className="mt-6">
                <p className="font-semibold text-foreground">{t.name}</p>
                <p className="text-sm text-muted-foreground">{t.role}</p>
              </figcaption>
            </motion.figure>
          </AnimatePresence>
        </div>
        <div className="mt-10 flex items-center justify-center gap-4">
          <button
            onClick={prev}
            aria-label="Previous testimonial"
            className="rounded-full border border-border p-2 text-brand-navy transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy focus-visible:ring-offset-2"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <div className="flex gap-2">
            {TESTIMONIALS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setI(idx)}
                aria-label={`Show testimonial ${idx + 1}`}
                aria-current={idx === i}
                className={`h-1.5 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy focus-visible:ring-offset-2 ${
                  idx === i ? "w-8 bg-brand-navy" : "w-1.5 bg-border hover:bg-muted-foreground/40"
                }`}
              />
            ))}
          </div>
          <button
            onClick={next}
            aria-label="Next testimonial"
            className="rounded-full border border-border p-2 text-brand-navy transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy focus-visible:ring-offset-2"
          >
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}

export default function Index() {
  const reduce = useReducedMotion();
  return (
    <SiteShell>
      <Seo
        title="CatchUp Tutors | Cambridge & IGCSE Mathematics"
        description="Premium Cambridge and IGCSE Mathematics tutoring, resources, past questions, and video learning."
        path="/"
      />

      {/* Hero — full-bleed image with overlay, Brookhouse-style */}
      <section className="relative isolate overflow-hidden bg-brand-navy text-hero-foreground">
        <motion.img
          src={heroCampus}
          alt=""
          width={1920}
          height={1200}
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
          initial={reduce ? undefined : { scale: 1.08, opacity: 0 }}
          animate={reduce ? undefined : { scale: 1, opacity: 1 }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        />
        <div
          className="absolute inset-0 bg-gradient-to-r from-brand-navy/85 via-brand-navy/60 to-brand-navy/20"
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8 lg:py-40">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-3xl"
          >
            <p className="mb-6 text-xs font-semibold uppercase tracking-[0.28em] text-hero-foreground/75">
              Cambridge · IGCSE · A-Level
            </p>
            <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              Building brilliant mathematicians for a changing world.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-hero-foreground/85 sm:mt-8 sm:text-lg">
              Personalized Cambridge and IGCSE Mathematics tutoring, premium resources, and worked-solution video lessons — trusted by families across Nigeria and the United Kingdom.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 sm:mt-10">
              <Button
                asChild
                size="lg"
                className="bg-hero-foreground text-brand-navy hover:bg-hero-foreground/90 focus-visible:ring-2 focus-visible:ring-hero-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-brand-navy"
              >
                <Link to="/tutors" aria-label="Find a tutor">
                  Find a Tutor <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-hero-foreground/50 bg-transparent text-hero-foreground hover:bg-hero-foreground hover:text-brand-navy focus-visible:ring-2 focus-visible:ring-hero-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-brand-navy"
              >
                <Link to="/programs">Explore Programmes</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats strip */}
      <section aria-label="At a glance" className="border-b border-border">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-12 sm:grid-cols-4 sm:gap-8 sm:px-6 lg:px-8">
          {STATS.map(([n, l], idx) => (
            <Reveal key={l} delay={idx * 0.08}>
              <p className="font-display text-3xl font-bold text-brand-navy sm:text-4xl">{n}</p>
              <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{l}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Welcome / About */}
      <section className="border-b border-border">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 sm:py-24 lg:grid-cols-2 lg:gap-16 lg:px-8">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">Welcome</p>
            <h2 className="mt-4 font-display text-3xl font-bold leading-tight text-brand-navy sm:text-4xl md:text-5xl">
              A place where every learner can catch up, keep up, and stay ahead.
            </h2>
          </Reveal>
          <Reveal delay={0.1} className="lg:pt-12">
            <p className="text-base leading-8 text-muted-foreground sm:text-lg">
              We combine one-to-one tutoring with a growing library of curriculum-aligned resources — past papers, mark schemes, topic packs, and video walkthroughs — so students never revise alone.
            </p>
            <ul className="mt-8 space-y-4 border-t border-border pt-8 text-foreground">
              {[
                "Cambridge-trained tutors with proven track records",
                "Worked solutions and video lessons for every topic",
                "Flexible online sessions across Nigeria and the UK",
              ].map((line) => (
                <li key={line} className="flex items-start gap-4">
                  <span className="mt-3 h-px w-6 shrink-0 bg-brand-navy" aria-hidden="true" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
            <div className="mt-10">
              <Link
                to="/about"
                className="inline-flex items-center gap-2 border-b border-brand-navy pb-1 text-sm font-semibold text-brand-navy transition-all hover:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy focus-visible:ring-offset-2"
              >
                Read our story <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Programmes */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
          <Reveal className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">Our programmes</p>
              <h2 className="mt-4 font-display text-3xl font-bold text-brand-navy sm:text-4xl">
                Learning pathways designed around your exam.
              </h2>
            </div>
            <Link
              to="/programs"
              className="inline-flex items-center gap-2 text-sm font-semibold text-brand-navy transition-all hover:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy focus-visible:ring-offset-2"
            >
              View all <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Reveal>
          <div className="mt-12 grid gap-px border border-border bg-border sm:mt-16 sm:grid-cols-2">
            {PROGRAMMES.map(({ title, desc, to }, i) => (
              <Reveal key={title} delay={i * 0.06}>
                <Link
                  to={to}
                  className="group flex h-full flex-col justify-between bg-background p-8 transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy focus-visible:ring-inset sm:p-10"
                >
                  <div>
                    <p className="text-xs font-mono text-muted-foreground">0{i + 1}</p>
                    <h3 className="mt-6 font-display text-xl font-bold text-brand-navy sm:text-2xl">{title}</h3>
                    <p className="mt-4 leading-7 text-muted-foreground">{desc}</p>
                  </div>
                  <ArrowUpRight
                    className="mt-10 h-5 w-5 text-brand-navy transition-transform group-hover:-translate-y-1 group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* News */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
          <Reveal className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">Latest updates</p>
              <h2 className="mt-4 font-display text-3xl font-bold text-brand-navy sm:text-4xl">What's new at CatchUp.</h2>
            </div>
            <Link
              to="/resources"
              className="inline-flex items-center gap-2 text-sm font-semibold text-brand-navy transition-all hover:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy focus-visible:ring-offset-2"
            >
              All resources <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Reveal>
          <ul className="mt-10 divide-y divide-border border-y border-border sm:mt-12">
            {NEWS.map((n, i) => (
              <Reveal key={n.title} delay={i * 0.06}>
                <li>
                  <Link
                    to={n.to}
                    className="group flex flex-col gap-3 py-6 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy focus-visible:ring-inset sm:flex-row sm:items-center sm:justify-between sm:gap-10 sm:px-2 sm:py-8"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground sm:w-40 sm:shrink-0">
                      {n.tag}
                    </p>
                    <h3 className="flex-1 font-display text-lg font-semibold leading-snug text-brand-navy sm:text-xl md:text-2xl">
                      {n.title}
                    </h3>
                    <ArrowUpRight
                      className="h-5 w-5 text-brand-navy transition-transform group-hover:-translate-y-1 group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </Link>
                </li>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <Testimonials />

      {/* CTA */}
      <section className="bg-brand-navy text-hero-foreground">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-20 sm:px-6 sm:py-24 lg:flex-row lg:items-end lg:justify-between lg:px-8">
          <Reveal className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-hero-foreground/70">Get started</p>
            <h2 className="mt-4 font-display text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">
              Ready to raise your Mathematics grade?
            </h2>
            <p className="mt-6 text-base text-hero-foreground/85 sm:text-lg">
              Book a free 15-minute consultation and we'll map out a personalized plan for your exam.
            </p>
          </Reveal>
          <Reveal delay={0.1} className="flex flex-wrap gap-3">
            <Button
              asChild
              size="lg"
              className="bg-hero-foreground text-brand-navy hover:bg-hero-foreground/90 focus-visible:ring-2 focus-visible:ring-hero-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-brand-navy"
            >
              <Link to="/contact">
                Book Consultation <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-hero-foreground/50 bg-transparent text-hero-foreground hover:bg-hero-foreground hover:text-brand-navy focus-visible:ring-2 focus-visible:ring-hero-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-brand-navy"
            >
              <Link to="/tutors">Meet Tutors</Link>
            </Button>
          </Reveal>
        </div>
      </section>
    </SiteShell>
  );
}
