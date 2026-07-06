import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { ArrowRight, BookOpenCheck, PlayCircle, Users, GraduationCap, Trophy, Globe2, Sparkles, Quote, ChevronRight } from "lucide-react";
import { SiteShell, Seo } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import heroStudents from "@/assets/hero-students.jpg";
import aboutClassroom from "@/assets/about-classroom.jpg";
import gallery1 from "@/assets/gallery-1.jpg";
import gallery2 from "@/assets/gallery-2.jpg";
import gallery3 from "@/assets/gallery-3.jpg";

type Testimonial = { quote: string; name: string; role: string; image?: string };

const TESTIMONIALS: Testimonial[] = [
  { quote: "I went from struggling with Paper 3 to a confident A. The topic packs and worked solutions made every concept click.", name: "Aisha O.", role: "Cambridge A-Level Mathematics" },
  { quote: "The video walkthroughs are the clearest I've ever seen. My tutor was patient and tailored every session to my weak areas.", name: "Daniel K.", role: "IGCSE Additional Mathematics" },
  { quote: "Past questions sorted by topic saved me hours. I knew exactly what to revise the week before the exam.", name: "Chiamaka E.", role: "Cambridge Further Mathematics" },
  { quote: "Finally a platform that treats Maths like a craft. Premium was worth every Naira.", name: "Yusuf A.", role: "IGCSE Mathematics" },
];

const PROGRAMMES = [
  { icon: GraduationCap, title: "IGCSE Mathematics", desc: "Structured tuition covering the full 0580 & 0606 syllabus with graded practice.", to: "/programs" },
  { icon: BookOpenCheck, title: "Cambridge AS & A-Level", desc: "Deep coverage of 9709 Pure, Mechanics, Statistics and Further Mathematics.", to: "/programs" },
  { icon: Sparkles, title: "Topic Mastery Packs", desc: "Focused walkthroughs on the topics students find hardest, from vectors to calculus.", to: "/resources" },
  { icon: Trophy, title: "Exam Sprint Coaching", desc: "Intensive 1:1 preparation with past-paper drills and marking scheme technique.", to: "/tutors" },
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
    <section className="bg-card py-24" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)} aria-roledescription="carousel" aria-label="Student testimonials">
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <p className="text-sm font-bold uppercase tracking-widest text-primary">What students say</p>
        <h2 className="mt-3 font-display text-4xl font-bold">Real progress. Real students.</h2>
        <div className="relative mt-14 min-h-[320px]" aria-live="polite">
          <AnimatePresence mode="wait">
            <motion.figure key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.45 }} className="mx-auto max-w-3xl">
              <Avatar className="mx-auto h-20 w-20 ring-4 ring-primary/15">
                {t.image && <AvatarImage src={t.image} alt={t.name} />}
                <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">{initials}</AvatarFallback>
              </Avatar>
              <Quote className="mx-auto mt-6 h-8 w-8 text-primary/40" />
              <blockquote className="mt-4 font-display text-2xl leading-relaxed text-foreground sm:text-3xl">"{t.quote}"</blockquote>
              <figcaption className="mt-6"><p className="font-semibold text-foreground">{t.name}</p><p className="text-sm text-muted-foreground">{t.role}</p></figcaption>
            </motion.figure>
          </AnimatePresence>
        </div>
        <div className="mt-8 flex items-center justify-center gap-4">
          <button onClick={prev} aria-label="Previous testimonial" className="rounded-full border p-2 hover:bg-muted">‹</button>
          <div className="flex gap-2" role="tablist" aria-label="Testimonials">
            {TESTIMONIALS.map((_, idx) => (
              <button key={idx} role="tab" onClick={() => setI(idx)} aria-label={`Show testimonial ${idx + 1}`} aria-selected={idx === i} className={`h-2 rounded-full transition-all ${idx === i ? "w-8 bg-primary" : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"}`} />
            ))}
          </div>
          <button onClick={next} aria-label="Next testimonial" className="rounded-full border p-2 hover:bg-muted">›</button>
        </div>
      </div>
    </section>
  );
}

export default function Index() {
  return (
    <SiteShell>
      <Seo title="CatchUp Tutors | Cambridge & IGCSE Mathematics" description="Premium Cambridge and IGCSE Mathematics tutoring, resources, past questions, and video learning." path="/" jsonLd={[{ "@context": "https://schema.org", "@type": "EducationalOrganization", name: "CatchUp Tutors", url: "/", description: "Cambridge and IGCSE Mathematics tutoring and resources.", areaServed: ["Nigeria", "United Kingdom"], sameAs: ["https://www.instagram.com/tutors.catchup", "https://www.facebook.com/share/1BTRMp9BPw/", "https://youtube.com/@catch-uptutors2691"] }, { "@context": "https://schema.org", "@type": "WebSite", name: "CatchUp Tutors", url: "/" }]} />

      {/* Hero — full-bleed overlay */}
      <section className="relative isolate min-h-[85vh] overflow-hidden">
        <img src={heroStudents} alt="Students collaborating on mathematics" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-brand-navy/90 via-brand-navy/70 to-brand-navy/40" />
        <div className="absolute inset-0 hero-grid opacity-30" />
        <div className="relative mx-auto flex min-h-[85vh] max-w-7xl flex-col justify-center px-4 py-24 text-hero-foreground sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-3xl">
            <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-hero-foreground/25 bg-hero-foreground/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-brand-green backdrop-blur">
              <Globe2 className="h-3.5 w-3.5" /> Cambridge · IGCSE · A-Level
            </p>
            <h1 className="font-display text-5xl font-bold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
              Building brilliant<br />mathematicians for a<br /><span className="text-brand-orange">changing world.</span>
            </h1>
            <p className="mt-8 max-w-xl text-lg leading-8 text-hero-foreground/85">Personalized Cambridge and IGCSE Mathematics tutoring, premium resources, and worked-solution video lessons — trusted by families across Nigeria and the United Kingdom.</p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Button asChild size="lg" variant="hero" className="shadow-lift"><Link to="/tutors">Find a Tutor <ArrowRight /></Link></Button>
              <Button asChild size="lg" variant="outline" className="border-hero-foreground/40 bg-transparent text-hero-foreground hover:bg-hero-foreground/10 hover:text-hero-foreground"><Link to="/programs">Explore Programmes</Link></Button>
            </div>
          </motion.div>
        </div>
        <div className="absolute inset-x-0 bottom-0 border-t border-hero-foreground/10 bg-brand-navy/60 backdrop-blur">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-5 text-hero-foreground sm:grid-cols-4 sm:px-6 lg:px-8">
            {[["20+", "Expert tutors"], ["10K+", "Students helped"], ["98%", "Success rate"], ["2", "Global regions"]].map(([n, l]) => (
              <div key={l} className="text-center sm:text-left"><p className="font-display text-2xl font-bold text-brand-orange">{n}</p><p className="text-xs uppercase tracking-wider text-hero-foreground/70">{l}</p></div>
            ))}
          </div>
        </div>
      </section>

      {/* Welcome / About */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="relative">
            <div className="absolute -left-4 -top-4 h-full w-full rounded-3xl border-2 border-brand-orange/60" />
            <img src={aboutClassroom} alt="Student learning at CatchUp Tutors" width={1024} height={1024} loading="lazy" className="relative rounded-3xl object-cover shadow-lift" />
          </motion.div>
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">Welcome to CatchUp Tutors</p>
            <h2 className="mt-3 font-display text-4xl font-bold leading-tight sm:text-5xl">A place where every learner can catch up, keep up, and stay ahead.</h2>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">We combine one-to-one tutoring with a growing library of curriculum-aligned resources — past papers, mark schemes, topic packs, and video walkthroughs — so students never revise alone.</p>
            <ul className="mt-8 space-y-3 text-muted-foreground">
              {["Cambridge-trained tutors with proven track records", "Worked solutions and video lessons for every topic", "Flexible online sessions across Nigeria and the UK"].map((line) => (
                <li key={line} className="flex items-start gap-3"><ChevronRight className="mt-1 h-5 w-5 shrink-0 text-brand-orange" /><span>{line}</span></li>
              ))}
            </ul>
            <div className="mt-10 flex flex-wrap gap-3">
              <Button asChild size="lg"><Link to="/about">Our Story <ArrowRight /></Link></Button>
              <Button asChild size="lg" variant="outline"><Link to="/pricing">See Pricing</Link></Button>
            </div>
          </div>
        </div>
      </section>

      {/* Programmes */}
      <section className="bg-muted/40 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-widest text-primary">Our programmes</p>
              <h2 className="mt-3 font-display text-4xl font-bold">Learning pathways designed around your exam.</h2>
            </div>
            <Button asChild variant="ghost" className="text-primary"><Link to="/programs">View all programmes <ArrowRight /></Link></Button>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PROGRAMMES.map(({ icon: Icon, title, desc, to }, i) => (
              <motion.article key={title} whileHover={{ y: -6 }} className="group relative flex h-full flex-col overflow-hidden rounded-3xl border bg-card p-7 shadow-soft transition-shadow hover:shadow-lift">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${i % 3 === 0 ? "bg-primary/10 text-primary" : i % 3 === 1 ? "bg-brand-orange/10 text-brand-orange" : "bg-brand-green/15 text-brand-navy"}`}><Icon /></div>
                <h3 className="mt-6 font-display text-xl font-bold">{title}</h3>
                <p className="mt-3 flex-1 leading-7 text-muted-foreground">{desc}</p>
                <Link to={to} className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-primary transition-transform group-hover:translate-x-1">Learn more <ChevronRight className="h-4 w-4" /></Link>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* News / Updates */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-primary">Latest updates</p>
            <h2 className="mt-3 font-display text-4xl font-bold">What's new at CatchUp.</h2>
          </div>
          <Button asChild variant="ghost" className="text-primary"><Link to="/resources">All resources <ArrowRight /></Link></Button>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {NEWS.map((n) => (
            <Link key={n.title} to={n.to} className="group rounded-3xl border bg-card p-7 shadow-soft transition-all hover:-translate-y-1 hover:shadow-lift">
              <span className="inline-block rounded-full bg-brand-orange/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-brand-orange">{n.tag}</span>
              <h3 className="mt-5 font-display text-xl font-bold leading-snug">{n.title}</h3>
              <p className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-primary">Read more <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></p>
            </Link>
          ))}
        </div>
      </section>

      {/* Gallery */}
      <section className="bg-brand-navy py-24 text-hero-foreground">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-widest text-brand-green">Life at CatchUp</p>
            <h2 className="mt-3 font-display text-4xl font-bold">Inside our learning community.</h2>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            <img src={gallery1} alt="Students studying together" width={1280} height={800} loading="lazy" className="h-72 w-full rounded-3xl object-cover md:col-span-2 md:h-96" />
            <img src={gallery2} alt="Tutor explaining mathematics" width={1000} height={800} loading="lazy" className="h-72 w-full rounded-3xl object-cover md:h-96" />
            <img src={gallery3} alt="Mathematics practice desk" width={1000} height={800} loading="lazy" className="h-72 w-full rounded-3xl object-cover md:h-96" />
            <img src={aboutClassroom} alt="Confident student" width={1024} height={1024} loading="lazy" className="h-72 w-full rounded-3xl object-cover md:col-span-2 md:h-96" />
          </div>
        </div>
      </section>

      <Testimonials />

      {/* CTA banner */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary via-primary to-brand-navy px-8 py-16 text-hero-foreground shadow-lift sm:px-14">
          <div className="absolute inset-0 hero-grid opacity-25" />
          <div className="relative flex flex-col items-start gap-8 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <h2 className="font-display text-3xl font-bold leading-tight sm:text-4xl">Ready to raise your Mathematics grade?</h2>
              <p className="mt-4 text-lg text-hero-foreground/85">Book a free 15-minute consultation and we'll map out a personalized plan for your exam.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" variant="hero"><Link to="/contact">Book Consultation <ArrowRight /></Link></Button>
              <Button asChild size="lg" variant="outline" className="border-hero-foreground/40 bg-transparent text-hero-foreground hover:bg-hero-foreground/10 hover:text-hero-foreground"><Link to="/tutors"><Users className="mr-1 h-4 w-4" /> Meet Tutors</Link></Button>
            </div>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
