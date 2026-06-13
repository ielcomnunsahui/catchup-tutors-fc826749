import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Award, BarChart3, BookOpenCheck, CheckCircle2, GraduationCap, PlayCircle, TrendingUp, Users } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import logo from "@/assets/catchup-logo.png.asset.json";

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

function Index() {
  return <SiteShell>
    <section className="relative overflow-hidden bg-hero text-hero-foreground">
      <div className="hero-grid absolute inset-0 opacity-70" />
      <div className="relative mx-auto grid min-h-[720px] max-w-7xl items-center gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[1.15fr_.85fr] lg:px-8">
        <motion.div initial={{opacity:0,y:18}} animate={{opacity:1,y:0}} transition={{duration:.55}}>
          <div className="mb-7 flex w-fit items-center gap-2 rounded-full border border-hero-foreground/15 bg-hero-foreground/5 px-4 py-2 text-sm"><Award className="h-4 w-4 text-brand-green"/> Cambridge & IGCSE learning ecosystem</div>
          <h1 className="font-display text-5xl font-bold leading-[1.02] tracking-tight sm:text-7xl lg:text-8xl">Catch Up.<br/><span className="text-brand-orange">Stay Ahead.</span></h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-hero-foreground/72">Personalized tutoring, premium resources, and expert academic mentorship designed to help students excel in Mathematics and Further Mathematics.</p>
          <div className="mt-9 flex flex-wrap gap-3"><Button asChild variant="hero" size="lg"><Link to="/tutors">Find a Tutor <ArrowRight/></Link></Button><Button asChild variant="heroOutline" size="lg"><Link to="/resources">Explore Resources</Link></Button><Button asChild variant="success" size="lg"><Link to="/pricing">Go Premium</Link></Button></div>
          <div className="mt-9 flex flex-wrap gap-2">{["Cambridge Mathematics","Further Mathematics","IGCSE Mathematics"].map(x=><span key={x} className="rounded-full border border-hero-foreground/15 px-3 py-1.5 text-xs font-semibold text-hero-foreground/70">{x}</span>)}</div>
        </motion.div>
        <motion.div initial={{opacity:0,scale:.95}} animate={{opacity:1,scale:1}} transition={{duration:.65,delay:.1}} className="relative hidden lg:block">
          <div className="absolute -left-8 top-12 h-28 w-28 rounded-full bg-brand-orange/20 blur-3xl"/><div className="absolute -right-4 bottom-8 h-36 w-36 rounded-full bg-brand-green/20 blur-3xl"/>
          <div className="relative rounded-[2rem] border border-hero-foreground/15 bg-hero-foreground/7 p-7 shadow-lift backdrop-blur"><img src={logo.url} alt="CatchUp Tutors growth logo" className="mx-auto w-full max-w-md"/><div className="mt-5 grid grid-cols-2 gap-4"><div className="rounded-2xl bg-hero-foreground/8 p-5"><TrendingUp className="text-brand-green"/><p className="mt-3 text-3xl font-bold">98%</p><p className="text-sm text-hero-foreground/60">Success rate</p></div><div className="rounded-2xl bg-hero-foreground/8 p-5"><BarChart3 className="text-brand-orange"/><p className="mt-3 text-3xl font-bold">10K+</p><p className="text-sm text-hero-foreground/60">Students helped</p></div></div></div>
        </motion.div>
      </div>
    </section>
    <section className="border-b bg-card"><div className="mx-auto grid max-w-7xl grid-cols-2 divide-x px-4 sm:grid-cols-4 sm:px-6 lg:px-8">{[["20+","Expert tutors"],["10K+","Students helped"],["98%","Success rate"],["2","Global regions"]].map(([n,l])=><div key={l} className="px-4 py-8 text-center"><p className="font-display text-3xl font-bold text-primary">{n}</p><p className="mt-1 text-sm text-muted-foreground">{l}</p></div>)}</div></section>
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8"><div className="max-w-2xl"><p className="text-sm font-bold uppercase tracking-widest text-primary">One connected learning journey</p><h2 className="mt-3 font-display text-4xl font-bold">From first question to exam confidence.</h2></div><div className="mt-10 grid gap-5 md:grid-cols-3">{[[BookOpenCheck,"Practice with purpose","Yearly papers, marking schemes, topic packs, and solutions organized around your curriculum."],[PlayCircle,"Learn without leaving","Watch free and premium explanations inline, then move directly into focused practice."],[Users,"Get expert support","Book approved tutors by subject, topic, availability, and transparent session pricing."]].map(([Icon,title,text],i)=><motion.article key={String(title)} whileHover={{y:-6}} className="rounded-3xl border bg-card p-7 shadow-soft"><div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${i===1?"bg-brand-orange/10 text-brand-orange":i===2?"bg-brand-green/15 text-brand-navy":"bg-primary/10 text-primary"}`}><Icon/></div><h3 className="mt-7 font-display text-xl font-bold">{String(title)}</h3><p className="mt-3 leading-7 text-muted-foreground">{String(text)}</p></motion.article>)}</div></section>
    <section className="bg-card py-20"><div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8"><div><p className="text-sm font-bold uppercase tracking-widest text-brand-orange">Premium learning</p><h2 className="mt-3 font-display text-4xl font-bold">Understand the “why,” not just the answer.</h2><p className="mt-5 leading-7 text-muted-foreground">Unlock structured lessons that connect explanations, worked examples, exam technique, and tutor support.</p><div className="mt-7 grid gap-3">{["Step-by-step video explanations","Worked exam-style examples","Premium topic resources","Priority learning support"].map(x=><div key={x} className="flex gap-3"><CheckCircle2 className="text-brand-green"/>{x}</div>)}</div><Button asChild className="mt-8" size="lg"><Link to="/pricing">Explore premium plans <ArrowRight/></Link></Button></div><div className="rounded-3xl bg-brand-navy p-7 text-hero-foreground shadow-lift"><GraduationCap className="h-11 w-11 text-brand-orange"/><h3 className="mt-12 font-display text-3xl font-bold">Your learning control center</h3><p className="mt-4 text-hero-foreground/65">Track bookings, premium access, saved resources, attendance, and recent topics from one focused dashboard.</p><div className="mt-8 h-2 overflow-hidden rounded-full bg-hero-foreground/10"><motion.div initial={{width:0}} whileInView={{width:"78%"}} viewport={{once:true}} transition={{duration:1}} className="h-full rounded-full bg-brand-green"/></div><p className="mt-3 text-sm text-hero-foreground/55">Weekly learning goal · 78%</p></div></div></section>
  </SiteShell>;
}
