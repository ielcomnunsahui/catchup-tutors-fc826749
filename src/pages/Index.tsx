import { Link } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { ArrowRight, ArrowUpRight, Quote, ChevronLeft, ChevronRight } from "lucide-react";
import { SiteShell, Seo } from "@/components/site-shell";
import { Button } from "@/components/ui/button";

import hero1600 from "@/assets/hero-campus-1600.jpg";
import hero1200 from "@/assets/hero-campus-1200.jpg";
import hero768 from "@/assets/hero-campus-768.jpg";
import studentPhoto from "@/assets/testimonial-student.jpg";

type Testimonial = { quote: string; name: string; role: string; image?: string };

const TESTIMONIALS: Testimonial[] = [
  { quote: "I went from struggling with Paper 3 to a confident A. Every concept finally clicked, and revision stopped feeling like punishment.", name: "Aisha O.", role: "Cambridge A-Level Mathematics", image: studentPhoto },
  { quote: "The walkthroughs are the clearest I've ever seen. My tutor tailored every single session to my weak areas no filler, no wasted time.", name: "Daniel K.", role: "IGCSE Additional Mathematics", image: studentPhoto },
  { quote: "Past questions sorted by topic saved me hours. I walked into the exam hall knowing exactly what to expect.", name: "Chiamaka E.", role: "Cambridge Further Mathematics", image: studentPhoto },
  { quote: "Finally a platform that treats Maths like a craft. Premium was worth every Naira I'd recommend it to any serious student.", name: "Yusuf A.", role: "IGCSE Mathematics", image: studentPhoto },
];

const VALUES = [
  { icon: "💡", title: "Empathy without judgement", desc: "We meet students exactly where they are no shame, only a safe space to learn." },
  { icon: "⚙️", title: "No wasted time", desc: "We pinpoint the missing foundation, fix it, and get your child moving forward." },
  { icon: "🛡️", title: "Room to make mistakes", desc: "A calm online classroom where there are zero silly questions and zero judgment." },
  { icon: "📈", title: "Skills for life", desc: "We teach students how to study and think, not just how to pass tonight's homework." },
  { icon: "⚡", title: "Celebrating small wins", desc: "Every breakthrough matters tiny victories build unstoppable confidence." },
];

const STATS: [string, string][] = [
  ["2018", "Founded"],
  ["800/800", "SAT Math scores"],
  ["10K+", "Students helped"],
  ["4", "Countries served"],
];

const EASE = [0.22, 1, 0.36, 1] as const;
const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } } };

function Reveal({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div className={className} variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }} transition={{ delay }}>
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
      className="border-t border-border bg-background py-20 sm:py-28"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Student testimonials"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-orange">Testimonials</p>
            <h2 className="mt-3 max-w-2xl font-display text-3xl font-bold leading-tight text-brand-navy sm:text-4xl md:text-5xl">
              What students say.
            </h2>
          </div>
          <p className="hidden text-sm text-muted-foreground sm:block">{i + 1} / {TESTIMONIALS.length}</p>
        </div>

        <div className="relative mt-12 grid gap-10 lg:grid-cols-12 lg:gap-14" aria-live="polite">
          <AnimatePresence mode="wait">
            <motion.figure
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.5, ease: EASE }}
              className="contents"
            >
              {/* Quote left */}
              <div className="order-2 flex flex-col justify-center lg:order-1 lg:col-span-7">
                <Quote className="h-10 w-10 text-brand-orange" aria-hidden="true" />
                <blockquote className="mt-6 font-display text-2xl leading-relaxed text-brand-navy sm:text-3xl md:text-[2rem]">
                  <span className="text-brand-navy/40">“</span>
                  {t.quote}
                  <span className="text-brand-navy/40">”</span>
                </blockquote>
                <figcaption className="mt-8 border-l-2 border-brand-orange pl-5">
                  <p className="font-display text-lg font-bold text-brand-navy">{t.name}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{t.role}</p>
                </figcaption>

                <div className="mt-10 flex items-center gap-4">
                  <button onClick={prev} aria-label="Previous testimonial" className="grid h-11 w-11 place-items-center rounded-full border border-border text-brand-navy transition-colors hover:border-brand-navy hover:bg-brand-navy hover:text-hero-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy focus-visible:ring-offset-2">
                    <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                  </button>
                  <div className="flex gap-2" role="tablist" aria-label="Testimonial slides">
                    {TESTIMONIALS.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setI(idx)}
                        role="tab"
                        aria-label={`Show testimonial ${idx + 1}`}
                        aria-selected={idx === i}
                        className={`h-1.5 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy focus-visible:ring-offset-2 ${idx === i ? "w-10 bg-brand-navy" : "w-1.5 bg-border hover:bg-muted-foreground/40"}`}
                      />
                    ))}
                  </div>
                  <button onClick={next} aria-label="Next testimonial" className="grid h-11 w-11 place-items-center rounded-full border border-border text-brand-navy transition-colors hover:border-brand-navy hover:bg-brand-navy hover:text-hero-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy focus-visible:ring-offset-2">
                    <ChevronRight className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>
              </div>

              {/* Photo right */}
              <div className="order-1 lg:order-2 lg:col-span-5">
                <div className="relative mx-auto aspect-[4/5] w-full max-w-sm overflow-hidden rounded-3xl bg-muted shadow-lift lg:max-w-none">
                  {t.image ? (
                    <img
                      src={t.image}
                      alt={`Portrait of ${t.name}`}
                      loading="lazy"
                      width={900}
                      height={1100}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-brand-navy text-4xl font-bold text-hero-foreground">{initials}</div>
                  )}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-brand-navy/70 via-brand-navy/10 to-transparent p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-hero-foreground/80">Verified student</p>
                    <p className="mt-1 font-display text-base font-semibold text-hero-foreground">{t.name}</p>
                  </div>
                  <div aria-hidden="true" className="absolute -left-3 -top-3 hidden h-24 w-24 rounded-full border-2 border-brand-orange lg:block" />
                </div>
              </div>
            </motion.figure>
          </AnimatePresence>
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
        title="Catch-Up Tutors | Bridging Gaps, Building Excellence"
        description="Since 2018, Catch-Up Tutors has helped students master IGCSE, Cambridge A-Level, SAT and more through empathetic, student-centered tutoring."
        path="/"
      />

      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-brand-navy text-hero-foreground">
        <motion.img
          src={hero1600}
          srcSet={`${hero768} 768w, ${hero1200} 1200w, ${hero1600} 1600w`}
          sizes="100vw"
          alt="Catch-Up Tutors tutor teaching Nigerian secondary school students Mathematics at a whiteboard"
          width={1600}
          height={1000}
          fetchPriority="high"
          decoding="async"
          loading="eager"
          className="absolute inset-0 h-full w-full object-cover"
          initial={reduce ? undefined : { scale: 1.06, opacity: 0 }}
          animate={reduce ? undefined : { scale: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: EASE }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-navy/90 via-brand-navy/70 to-brand-navy/30" aria-hidden="true" />
        <div className="relative mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8 lg:py-40">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE }}
            className="max-w-3xl"
          >
            <p className="mb-6 text-xs font-semibold uppercase tracking-[0.28em] text-hero-foreground/75">
              Bridging Gaps · Building Excellence
            </p>
            <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              Where falling behind becomes the setup for a comeback.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-hero-foreground/85 sm:mt-8 sm:text-lg">
              Since 2018, we've guided students through IGCSE, Cambridge A-Level, SAT and beyond turning quiet struggle into confident mastery.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 sm:mt-10">
              <Button asChild size="lg" className="bg-hero-foreground text-brand-navy hover:bg-hero-foreground/90 focus-visible:ring-2 focus-visible:ring-hero-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-brand-navy">
                <Link to="/tutors">Find a Tutor <ArrowRight aria-hidden="true" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-hero-foreground/50 bg-transparent text-hero-foreground hover:bg-hero-foreground hover:text-brand-navy focus-visible:ring-2 focus-visible:ring-hero-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-brand-navy">
                <Link to="/programs">Explore Programmes</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
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

      {/* Our Story */}
      <section className="border-b border-border">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 sm:py-24 lg:grid-cols-12 lg:gap-16 lg:px-8">
          <Reveal className="lg:col-span-5">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">Our story</p>
            <h2 className="mt-4 font-display text-3xl font-bold leading-tight text-brand-navy sm:text-4xl md:text-5xl">
              A sanctuary from the quiet pressure of falling behind.
            </h2>
          </Reveal>
          <Reveal delay={0.1} className="lg:col-span-7 lg:pt-4">
            <div className="space-y-6 text-base leading-8 text-muted-foreground sm:text-lg">
              <p>
                We started Catch-Up Tutors because we watched brilliant students carry a heavy, invisible burden falling behind not for lack of effort, but because the classroom never paused to let them breathe.
              </p>
              <p>
                Miss one foundational concept, and school stops being a place of discovery. We built this platform to reverse that a space where mistakes are welcomed, gaps are filled with patience, and children rediscover just how capable they've always been.
              </p>
            </div>
            <dl className="mt-10 grid gap-8 border-t border-border pt-10 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">Vision</dt>
                <dd className="mt-3 text-foreground">To make academic setbacks the setup for greater comebacks, cultivated through accessible digital guidance.</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">Mission</dt>
                <dd className="mt-3 text-foreground">To give every student a plan that finds their weak spots, fixes them, and unlocks the confidence to thrive.</dd>
              </div>
            </dl>
            <div className="mt-10">
              <Link to="/about" className="inline-flex items-center gap-2 border-b border-brand-navy pb-1 text-sm font-semibold text-brand-navy transition-all hover:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy focus-visible:ring-offset-2">
                Read the full story <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Who we are */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">Who we are</p>
            <h2 className="mt-4 max-w-3xl font-display text-3xl font-bold leading-tight text-brand-navy sm:text-4xl">
              Academic strategists, not just tutors.
            </h2>
            <p className="mt-6 max-w-3xl text-base leading-8 text-muted-foreground sm:text-lg">
              Mastery isn't built on cramming. In Mathematics, Physics, Chemistry, Further Mathematics and Biology, we anchor every concept to real-world application so anxiety fades and confidence takes its place. Our students have earned perfect 800/800 SAT Math scores, the Cambridge High Achievement Award, and places at Harvard, Oxford and beyond.
            </p>
          </Reveal>
          <div className="mt-14 grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["IGCSE", "Cambridge & Edexcel"],
              ["A-Level", "Cambridge & Edexcel"],
              ["SAT", "Math & Verbal"],
              ["TMUA & GRE", "Admissions maths"],
              ["WAEC / NECO", "Local excellence"],
              ["1:1 Coaching", "Exam sprint & long-term"],
            ].map(([k, v], i) => (
              <Reveal key={k} delay={i * 0.05}>
                <div className="flex h-full items-baseline justify-between bg-background p-6 sm:p-8">
                  <span className="font-display text-xl font-bold text-brand-navy">{k}</span>
                  <span className="text-sm text-muted-foreground">{v}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">Core values</p>
            <h2 className="mt-4 font-display text-3xl font-bold text-brand-navy sm:text-4xl">What guides every lesson.</h2>
          </Reveal>
          <ul className="mt-12 grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
            {VALUES.map((v, i) => (
              <Reveal key={v.title} delay={i * 0.05}>
                <li className="flex h-full flex-col bg-background p-8">
                  <span className="text-2xl" aria-hidden="true">{v.icon}</span>
                  <h3 className="mt-6 font-display text-lg font-bold text-brand-navy">{v.title}</h3>
                  <p className="mt-3 leading-7 text-muted-foreground">{v.desc}</p>
                </li>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* Founder */}
      <section className="border-b border-border">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 sm:py-24 lg:grid-cols-12 lg:gap-16 lg:px-8">
          <Reveal className="lg:col-span-5">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">Meet our founder</p>
            <h2 className="mt-4 font-display text-3xl font-bold leading-tight text-brand-navy sm:text-4xl">
              Mr. Ahmed Thaoban
            </h2>
            <p className="mt-3 text-sm uppercase tracking-wider text-muted-foreground">MSc Mathematics · Cambridge-certified tutor</p>
          </Reveal>
          <Reveal delay={0.1} className="space-y-6 text-base leading-8 text-muted-foreground sm:text-lg lg:col-span-7">
            <p>
              A visionary educator who believes mathematics is a language of opportunity to be mastered not memorised. He earned both his BSc and MSc in Mathematics, graduating top of his class with distinction.
            </p>
            <p>
              With over a decade of experience across international exam boards, he now leads Catch-Up Tutors while running free summer lessons for secondary students in his community awarding scholarships that cover external exam fees and school tuition.
            </p>
            <Link to="/about" className="inline-flex items-center gap-2 border-b border-brand-navy pb-1 text-sm font-semibold text-brand-navy transition-all hover:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy focus-visible:ring-offset-2">
              More about the founder <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* Pricing preview */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
          <Reveal className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">Simple pricing</p>
              <h2 className="mt-4 font-display text-3xl font-bold text-brand-navy sm:text-4xl">Choose how you want to learn.</h2>
            </div>
            <Link to="/pricing" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-navy transition-all hover:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy focus-visible:ring-offset-2">
              See all plans <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Reveal>
          <div className="mt-12 grid gap-px border border-border bg-border sm:grid-cols-2">
            <Reveal>
              <div className="flex h-full flex-col bg-background p-8 sm:p-10">
                <p className="text-xs font-mono text-muted-foreground">01</p>
                <h3 className="mt-6 font-display text-xl font-bold text-brand-navy sm:text-2xl">Hourly Tutoring</h3>
                <p className="mt-4 leading-7 text-muted-foreground">Personalised 1-on-1 support at your pace.</p>
                <p className="mt-8 font-display text-2xl font-bold text-brand-navy">$17 <span className="text-base font-normal text-muted-foreground">/ ₦25,000 per hour</span></p>
              </div>
            </Reveal>
            <Reveal delay={0.08}>
              <div className="flex h-full flex-col bg-background p-8 sm:p-10">
                <p className="text-xs font-mono text-muted-foreground">02</p>
                <h3 className="mt-6 font-display text-xl font-bold text-brand-navy sm:text-2xl">Premium Resources</h3>
                <p className="mt-4 leading-7 text-muted-foreground">Unlimited study materials, practice exams and platform resources.</p>
                <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
                  <li>Monthly $20 / ₦30,000</li>
                  <li>Quarterly $70 / ₦100,000</li>
                  <li>Annual $200 / ₦300,000 <span className="text-brand-navy">(best value)</span></li>
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <Testimonials />

      {/* CTA */}
      <section className="bg-brand-navy text-hero-foreground">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-20 sm:px-6 sm:py-24 lg:flex-row lg:items-end lg:justify-between lg:px-8">
          <Reveal className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-hero-foreground/70">Get started</p>
            <h2 className="mt-4 font-display text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">
              Ready to turn setbacks into comebacks?
            </h2>
            <p className="mt-6 text-base text-hero-foreground/85 sm:text-lg">
              Book a free 15-minute consultation and we'll map out a personalised plan for your exam.
            </p>
          </Reveal>
          <Reveal delay={0.1} className="flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-hero-foreground text-brand-navy hover:bg-hero-foreground/90 focus-visible:ring-2 focus-visible:ring-hero-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-brand-navy">
              <Link to="/contact">Book Consultation <ArrowRight aria-hidden="true" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-hero-foreground/50 bg-transparent text-hero-foreground hover:bg-hero-foreground hover:text-brand-navy focus-visible:ring-2 focus-visible:ring-hero-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-brand-navy">
              <Link to="/tutors">Meet Tutors</Link>
            </Button>
          </Reveal>
        </div>
      </section>
    </SiteShell>
  );
}
