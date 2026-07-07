import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { ArrowRight, ArrowUpRight, Quote } from "lucide-react";
import { SiteShell, Seo } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type Testimonial = { quote: string; name: string; role: string; image?: string };

const TESTIMONIALS: Testimonial[] = [
  { quote: "I went from struggling with Paper 3 to a confident A. The topic packs and worked solutions made every concept click.", name: "Aisha O.", role: "Cambridge A-Level Mathematics" },
  { quote: "The video walkthroughs are the clearest I've ever seen. My tutor tailored every session to my weak areas.", name: "Daniel K.", role: "IGCSE Additional Mathematics" },
  { quote: "Past questions sorted by topic saved me hours. I knew exactly what to revise the week before the exam.", name: "Chiamaka E.", role: "Cambridge Further Mathematics" },
  { quote: "Finally a platform that treats Maths like a craft. Premium was worth every Naira.", name: "Yusuf A.", role: "IGCSE Mathematics" },
];

const PROGRAMMES = [
  { title: "IGCSE Mathematics", desc: "Structured tuition covering the full 0580 & 0606 syllabus with graded practice.", to: "/programs" },
  { title: "Cambridge AS & A-Level", desc: "Deep coverage of 9709 Pure, Mechanics, Statistics and Further Mathematics.", to: "/programs" },
  { title: "Topic Mastery Packs", desc: "Focused walkthroughs on the topics students find hardest, from vectors to calculus.", to: "/resources" },
  { title: "Exam Sprint Coaching", desc: "Intensive 1:1 preparation with past-paper drills and marking scheme technique.", to: "/tutors" },
];

const NEWS = [
  { tag: "New resource", title: "Feb/March 2025 Cambridge 9709 papers with worked solutions", to: "/resources" },
  { tag: "Programme", title: "Circle geometry topic pack now live for IGCSE learners", to: "/resources" },
  { tag: "Announcement", title: "Weekend sprint classes open for June 2026 series", to: "/programs" },
];

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
    <section className="border-t border-border py-24" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} aria-roledescription="carousel" aria-label="Student testimonials">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">What students say</p>
        <div className="relative mt-12 min-h-[280px]" aria-live="polite">
          <AnimatePresence mode="wait">
            <motion.figure key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.4 }}>
              <Avatar className="mx-auto h-16 w-16 border border-border">
                {t.image && <AvatarImage src={t.image} alt={t.name} />}
                <AvatarFallback className="bg-brand-navy text-sm font-semibold text-hero-foreground">{initials}</AvatarFallback>
              </Avatar>
              <Quote className="mx-auto mt-6 h-6 w-6 text-muted-foreground/40" />
              <blockquote className="mt-4 font-display text-2xl leading-relaxed text-foreground sm:text-[28px]">"{t.quote}"</blockquote>
              <figcaption className="mt-6"><p className="font-semibold text-foreground">{t.name}</p><p className="text-sm text-muted-foreground">{t.role}</p></figcaption>
            </motion.figure>
          </AnimatePresence>
        </div>
        <div className="mt-10 flex items-center justify-center gap-4">
          <button onClick={prev} aria-label="Previous testimonial" className="rounded-full border border-border p-2 hover:bg-muted">‹</button>
          <div className="flex gap-2">
            {TESTIMONIALS.map((_, idx) => (
              <button key={idx} onClick={() => setI(idx)} aria-label={`Show testimonial ${idx + 1}`} className={`h-1.5 rounded-full transition-all ${idx === i ? "w-8 bg-brand-navy" : "w-1.5 bg-border hover:bg-muted-foreground/40"}`} />
            ))}
          </div>
          <button onClick={next} aria-label="Next testimonial" className="rounded-full border border-border p-2 hover:bg-muted">›</button>
        </div>
      </div>
    </section>
  );
}

export default function Index() {
  return (
    <SiteShell>
      <Seo title="CatchUp Tutors | Cambridge & IGCSE Mathematics" description="Premium Cambridge and IGCSE Mathematics tutoring, resources, past questions, and video learning." path="/" />

      {/* Hero — clean 2-color */}
      <section className="border-b border-border bg-background">
        <div className="mx-auto max-w-6xl px-4 py-28 sm:px-6 sm:py-36 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-3xl">
            <p className="mb-6 text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">Cambridge · IGCSE · A-Level</p>
            <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-tight text-brand-navy sm:text-6xl lg:text-7xl">
              Building brilliant mathematicians for a changing world.
            </h1>
            <p className="mt-8 max-w-xl text-lg leading-8 text-muted-foreground">Personalized Cambridge and IGCSE Mathematics tutoring, premium resources, and worked-solution video lessons — trusted by families across Nigeria and the United Kingdom.</p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-brand-navy text-hero-foreground hover:bg-brand-navy/90"><Link to="/tutors">Find a Tutor <ArrowRight /></Link></Button>
              <Button asChild size="lg" variant="outline" className="border-brand-navy text-brand-navy hover:bg-brand-navy hover:text-hero-foreground"><Link to="/programs">Explore Programmes</Link></Button>
            </div>
          </motion.div>
          <div className="mt-20 grid grid-cols-2 gap-8 border-t border-border pt-10 sm:grid-cols-4">
            {[["20+", "Expert tutors"], ["10K+", "Students helped"], ["98%", "Success rate"], ["2", "Global regions"]].map(([n, l]) => (
              <div key={l}><p className="font-display text-3xl font-bold text-brand-navy">{n}</p><p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{l}</p></div>
            ))}
          </div>
        </div>
      </section>

      {/* Welcome / About */}
      <section className="border-b border-border">
        <div className="mx-auto grid max-w-6xl gap-16 px-4 py-24 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">Welcome</p>
            <h2 className="mt-4 font-display text-4xl font-bold leading-tight text-brand-navy sm:text-5xl">A place where every learner can catch up, keep up, and stay ahead.</h2>
          </div>
          <div className="lg:pt-12">
            <p className="text-lg leading-8 text-muted-foreground">We combine one-to-one tutoring with a growing library of curriculum-aligned resources — past papers, mark schemes, topic packs, and video walkthroughs — so students never revise alone.</p>
            <ul className="mt-8 space-y-4 border-t border-border pt-8 text-foreground">
              {["Cambridge-trained tutors with proven track records", "Worked solutions and video lessons for every topic", "Flexible online sessions across Nigeria and the UK"].map((line) => (
                <li key={line} className="flex items-start gap-4"><span className="mt-2 h-px w-6 shrink-0 bg-brand-navy" /><span>{line}</span></li>
              ))}
            </ul>
            <div className="mt-10">
              <Link to="/about" className="inline-flex items-center gap-2 border-b border-brand-navy pb-1 text-sm font-semibold text-brand-navy hover:gap-3 transition-all">Read our story <ArrowUpRight className="h-4 w-4" /></Link>
            </div>
          </div>
        </div>
      </section>

      {/* Programmes */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">Our programmes</p>
              <h2 className="mt-4 font-display text-4xl font-bold text-brand-navy">Learning pathways designed around your exam.</h2>
            </div>
            <Link to="/programs" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-navy hover:gap-3 transition-all">View all <ArrowUpRight className="h-4 w-4" /></Link>
          </div>
          <div className="mt-16 grid gap-px border border-border bg-border sm:grid-cols-2">
            {PROGRAMMES.map(({ title, desc, to }, i) => (
              <Link key={title} to={to} className="group flex flex-col justify-between bg-background p-10 transition-colors hover:bg-muted/60">
                <div>
                  <p className="text-xs font-mono text-muted-foreground">0{i + 1}</p>
                  <h3 className="mt-6 font-display text-2xl font-bold text-brand-navy">{title}</h3>
                  <p className="mt-4 leading-7 text-muted-foreground">{desc}</p>
                </div>
                <ArrowUpRight className="mt-10 h-5 w-5 text-brand-navy transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* News */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">Latest updates</p>
              <h2 className="mt-4 font-display text-4xl font-bold text-brand-navy">What's new at CatchUp.</h2>
            </div>
            <Link to="/resources" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-navy hover:gap-3 transition-all">All resources <ArrowUpRight className="h-4 w-4" /></Link>
          </div>
          <div className="mt-12 divide-y divide-border border-y border-border">
            {NEWS.map((n) => (
              <Link key={n.title} to={n.to} className="group flex flex-col gap-3 py-8 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between sm:gap-10 sm:px-2">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground sm:w-40 sm:shrink-0">{n.tag}</p>
                <h3 className="flex-1 font-display text-xl font-semibold leading-snug text-brand-navy sm:text-2xl">{n.title}</h3>
                <ArrowUpRight className="h-5 w-5 text-brand-navy transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Testimonials />

      {/* CTA */}
      <section className="bg-brand-navy text-hero-foreground">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-24 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-hero-foreground/60">Get started</p>
            <h2 className="mt-4 font-display text-4xl font-bold leading-tight sm:text-5xl">Ready to raise your Mathematics grade?</h2>
            <p className="mt-6 text-lg text-hero-foreground/75">Book a free 15-minute consultation and we'll map out a personalized plan for your exam.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-hero-foreground text-brand-navy hover:bg-hero-foreground/90"><Link to="/contact">Book Consultation <ArrowRight /></Link></Button>
            <Button asChild size="lg" variant="outline" className="border-hero-foreground/40 bg-transparent text-hero-foreground hover:bg-hero-foreground hover:text-brand-navy"><Link to="/tutors">Meet Tutors</Link></Button>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
