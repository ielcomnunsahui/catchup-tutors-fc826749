import { createFileRoute, Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { ArrowRight, BookOpenCheck, CheckCircle2, PlayCircle, Quote, Users } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import heroStudents from "@/assets/hero-students.jpg.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CatchUp Tutors | Cambridge & IGCSE Mathematics" },
      { name: "description", content: "Premium Cambridge and IGCSE Mathematics tutoring, resources, past questions, and video learning." },
      { property: "og:title", content: "CatchUp Tutors — Catch Up. Stay Ahead." },
      { property: "og:description", content: "Personalized tutoring and premium Mathematics learning for Cambridge and IGCSE students." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const TESTIMONIALS = [
  { quote: "I went from struggling with Paper 3 to a confident A. The topic packs and worked solutions made every concept click.", name: "Aisha O.", role: "Cambridge A-Level Mathematics" },
  { quote: "The video walkthroughs are the clearest I've ever seen. My tutor was patient and tailored every session to my weak areas.", name: "Daniel K.", role: "IGCSE Additional Mathematics" },
  { quote: "Past questions sorted by topic saved me hours. I knew exactly what to revise the week before the exam.", name: "Chiamaka E.", role: "Cambridge Further Mathematics" },
  { quote: "Finally a platform that treats Maths like a craft. Premium was worth every Naira.", name: "Yusuf A.", role: "IGCSE Mathematics" },
];

function Testimonials() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((p) => (p + 1) % TESTIMONIALS.length), 30000);
    return () => clearInterval(t);
  }, []);
  const t = TESTIMONIALS[i];
  return (
    <section className="bg-card py-20">
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <p className="text-sm font-bold uppercase tracking-widest text-primary">What students say</p>
        <h2 className="mt-3 font-display text-4xl font-bold">Real progress. Real students.</h2>
        <div className="relative mt-12 min-h-[220px]">
          <AnimatePresence mode="wait">
            <motion.figure
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.5 }}
              className="mx-auto max-w-3xl"
            >
              <Quote className="mx-auto h-10 w-10 text-primary/40" />
              <blockquote className="mt-5 font-display text-2xl leading-relaxed text-foreground sm:text-3xl">
                "{t.quote}"
              </blockquote>
              <figcaption className="mt-7">
                <p className="font-semibold text-foreground">{t.name}</p>
                <p className="text-sm text-muted-foreground">{t.role}</p>
              </figcaption>
            </motion.figure>
          </AnimatePresence>
        </div>
        <div className="mt-10 flex justify-center gap-2" role="tablist" aria-label="Testimonials">
          {TESTIMONIALS.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setI(idx)}
              aria-label={`Show testimonial ${idx + 1}`}
              aria-selected={idx === i}
              className={`h-2 rounded-full transition-all ${idx === i ? "w-8 bg-primary" : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function Index() {
  return <SiteShell>
    <section className="relative overflow-hidden bg-background">
      <div className="absolute inset-0">
        <img
          src={heroStudents.url}
          alt="Students learning together"
          width={1920}
          height={1080}
          className="h-full w-full object-cover object-right"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/92 to-background/10 md:via-background/80 md:to-transparent" />
      </div>
      <div className="relative mx-auto grid min-h-[640px] max-w-7xl items-center px-4 py-24 sm:px-6 lg:min-h-[720px] lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: .55 }}
          className="max-w-2xl"
        >
          <p className="mb-6 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
            Cambridge · IGCSE · A-Level
          </p>
          <h1 className="font-display text-5xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-6xl lg:text-7xl">
            Catch Up.<br />
            <span className="text-primary">Stay Ahead.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
            Personalized tutoring and premium resources that help students master Mathematics with clarity and confidence.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Button asChild size="lg" variant="hero" className="shadow-lift">
              <Link to="/tutors">Find a Tutor <ArrowRight /></Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/resources">Explore Resources</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
    <section className="border-b bg-card"><div className="mx-auto grid max-w-7xl grid-cols-2 divide-x px-4 sm:grid-cols-4 sm:px-6 lg:px-8">{[["20+","Expert tutors"],["10K+","Students helped"],["98%","Success rate"],["2","Global regions"]].map(([n,l])=><div key={l} className="px-4 py-8 text-center"><p className="font-display text-3xl font-bold text-primary">{n}</p><p className="mt-1 text-sm text-muted-foreground">{l}</p></div>)}</div></section>
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8"><div className="max-w-2xl"><p className="text-sm font-bold uppercase tracking-widest text-primary">One connected learning journey</p><h2 className="mt-3 font-display text-4xl font-bold">From first question to exam confidence.</h2></div><div className="mt-10 grid gap-5 md:grid-cols-3">{[[BookOpenCheck,"Practice with purpose","Yearly papers, marking schemes, topic packs, and solutions organized around your curriculum."],[PlayCircle,"Learn without leaving","Watch free and premium explanations inline, then move directly into focused practice."],[Users,"Get expert support","Book approved tutors by subject, topic, availability, and transparent session pricing."]].map(([Icon,title,text],i)=><motion.article key={String(title)} whileHover={{y:-6}} className="rounded-3xl border bg-card p-7 shadow-soft"><div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${i===1?"bg-brand-orange/10 text-brand-orange":i===2?"bg-brand-green/15 text-brand-navy":"bg-primary/10 text-primary"}`}><Icon/></div><h3 className="mt-7 font-display text-xl font-bold">{String(title)}</h3><p className="mt-3 leading-7 text-muted-foreground">{String(text)}</p></motion.article>)}</div></section>
    <section className="bg-card py-20"><div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8"><p className="text-sm font-bold uppercase tracking-widest text-brand-orange">Premium learning</p><h2 className="mt-3 font-display text-4xl font-bold">Understand the "why," not just the answer.</h2><p className="mt-5 leading-7 text-muted-foreground">Unlock structured lessons that connect explanations, worked examples, exam technique, and tutor support.</p><div className="mt-7 grid gap-3 sm:grid-cols-2">{["Step-by-step video explanations","Worked exam-style examples","Premium topic resources","Priority learning support"].map(x=><div key={x} className="flex gap-3"><CheckCircle2 className="text-brand-green"/>{x}</div>)}</div><Button asChild className="mt-8" size="lg"><Link to="/pricing">Explore premium plans <ArrowRight/></Link></Button></div></section>
    <Testimonials />
  </SiteShell>;
}
