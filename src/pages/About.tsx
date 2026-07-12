import { Link } from "react-router-dom";
import {
  CheckCircle2, Compass, Sparkles, ArrowRight, HeartHandshake, ShieldCheck, Zap, TrendingUp,
  Trophy, GraduationCap, BookOpen, Globe2, Target, Rocket, Award, Users, Lightbulb, HandHeart,
  Quote, Star,
} from "lucide-react";
import { SiteShell, PageHero, Seo } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import founderPortrait from "@/assets/founder-ahmed.jpeg.asset.json";

const VALUES = [
  { icon: HandHeart, emoji: "💡", title: "Empathy without judgement", desc: "We meet students exactly where they are. No shame in falling behind — only a safe space to breathe, learn and grow.", accent: "from-rose-500/15 to-rose-500/0", ring: "ring-rose-500/30", text: "text-rose-500" },
  { icon: Zap, emoji: "⚙️", title: "No wasted time", desc: "We skip generic worksheets. We find the exact missing puzzle piece, fix it, and get your child moving forward.", accent: "from-amber-500/15 to-amber-500/0", ring: "ring-amber-500/30", text: "text-amber-500" },
  { icon: ShieldCheck, emoji: "🛡️", title: "Safe space to make mistakes", desc: "A calm online classroom with zero silly questions and zero judgment — only patient, expert support.", accent: "from-emerald-500/15 to-emerald-500/0", ring: "ring-emerald-500/30", text: "text-emerald-500" },
  { icon: TrendingUp, emoji: "📈", title: "Skills for life", desc: "We teach students how to study, organise their thinking and tackle hard problems so they can eventually thrive on their own.", accent: "from-sky-500/15 to-sky-500/0", ring: "ring-sky-500/30", text: "text-sky-500" },
  { icon: Trophy, emoji: "⚡", title: "Celebrating small wins", desc: "Every breakthrough matters. Stringing together tiny victories is exactly how we build unstoppable confidence.", accent: "from-[#FF6B12]/15 to-[#FF6B12]/0", ring: "ring-[#FF6B12]/30", text: "text-[#FF6B12]" },
];

const IMPACT_STATS = [
  { value: "2018", label: "Guiding students since" },
  { value: "800/800", label: "SAT Math scores achieved" },
  { value: "10+", label: "Years of expert teaching" },
  { value: "5+", label: "Countries of alumni placement" },
];

const EXAMS = ["IGCSE", "Cambridge A-Level", "Edexcel", "SAT", "GRE", "TMUA", "WAEC", "NECO", "JAMB"];
const UNIS = ["Harvard", "Oxford", "Cambridge", "Imperial", "UCL", "Toronto"];

const STORY_PILLARS = [
  { icon: Target, title: "Vision", body: "To foster an educational landscape where academic setbacks are viewed merely as setups for greater comebacks, cultivated through accessible digital guidance." },
  { icon: Rocket, title: "Mission", body: "To give every student a customised learning plan that finds their specific weak spots, fixes them, and equips them with the tools and confidence to skip past where they got stuck and thrive." },
  { icon: Award, title: "Motto", body: "Bridging Gaps, Building Excellence — the promise behind every lesson, every session, every scholar." },
];

const FOUNDER_CREDS = [
  { icon: GraduationCap, label: "MSc Mathematics · top-ranking, distinction" },
  { icon: BookOpen, label: "Published in Complex Analysis journals" },
  { icon: Award, label: "Certified Cambridge instructor" },
  { icon: Users, label: "Director, education & scholarships — GYEF" },
];

export default function About() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "About CatchUp Tutors",
    about: {
      "@type": "EducationalOrganization",
      name: "CatchUp Tutors",
      founder: { "@type": "Person", name: "Ahmed Thaoban", jobTitle: "Founder" },
      address: { "@type": "PostalAddress", addressLocality: "Ilorin", addressRegion: "Kwara", addressCountry: "NG" },
      email: "Catchuptutors01@gmail.com",
      telephone: "+2348101804411",
    },
  };

  return (
    <SiteShell>
      <Seo
        title="About CatchUp Tutors | Bridging Gaps, Building Excellence"
        description="Meet founder Ahmed Thaoban and discover the mission, values and story behind CatchUp Tutors — from Ilorin to Harvard, Oxford and beyond."
        path="/about"
        jsonLd={jsonLd}
      />
      <PageHero
        eyebrow="Our story"
        title="Turning learning gaps into lasting confidence."
        description="Since 2018, CatchUp Tutors has helped brilliant students master IGCSE, Cambridge A-Level, SAT, GRE and university-entrance exams — and step onto the world stage."
      >
        <div className="flex flex-wrap gap-2 pt-2">
          {["Bridging Gaps", "Building Excellence"].map((t, i) => (
            <span key={t} className="animate-fade-in inline-flex items-center gap-1.5 rounded-full border border-hero-foreground/25 bg-hero-foreground/5 px-3 py-1 text-xs font-semibold text-hero-foreground" style={{ animationDelay: `${i * 120}ms` }}>
              <Sparkles className="h-3 w-3 text-[#FF6B12]" /> {t}
            </span>
          ))}
        </div>
      </PageHero>

      {/* Impact stats strip */}
      <section aria-label="Impact at a glance" className="border-b border-border bg-card">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px overflow-hidden bg-border sm:grid-cols-4">
          {IMPACT_STATS.map((s, i) => (
            <div key={s.label} className="group animate-fade-in bg-card p-6 text-center transition-colors hover:bg-muted/60 sm:p-8" style={{ animationDelay: `${i * 80}ms` }}>
              <p className="font-display text-3xl font-bold text-brand-navy transition-transform duration-300 group-hover:scale-105 sm:text-4xl">{s.value}</p>
              <p className="mt-2 text-xs uppercase tracking-wider text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Our Story */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-4">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#FF6B12]">Our story</p>
              <h2 className="mt-4 font-display text-4xl font-bold leading-tight text-brand-navy sm:text-5xl">A sanctuary from the quiet pressure of falling behind.</h2>
              <div className="mt-8 flex flex-wrap gap-2">
                {["Patience", "Practicality", "Progress"].map((t) => (
                  <Badge key={t} variant="secondary" className="rounded-full">{t}</Badge>
                ))}
              </div>
            </div>
            <div className="space-y-5 text-base leading-8 text-muted-foreground sm:text-lg lg:col-span-8">
              <p>
                We started CatchUp Tutors because we noticed a quiet, heavy burden that so many students carry in modern classrooms.
                Every single day, brilliant kids find themselves falling behind — not from a lack of effort, but because the fast-paced
                school system does not stop to let them catch their breath.
              </p>
              <p>
                When a student misses just one foundational concept, school transforms from a place of discovery into a source of daily
                anxiety. We watched confident children start to doubt their own intelligence, carrying the weight of feeling left behind.
                <span className="ml-1 font-semibold text-foreground">We knew there had to be a better way.</span>
              </p>
              <p>
                We built this platform to be a sanctuary from that pressure — a stress-free digital space where mistakes are welcomed
                as progress, gaps are filled with patience, and the anxiety of being behind is replaced with the joy of moving forward.
                We are not just here to fix grades. We are here to restore a child's belief in themselves.
              </p>
            </div>
          </div>

          {/* Vision / Mission / Motto cards */}
          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {STORY_PILLARS.map(({ icon: Icon, title, body }, i) => (
              <article
                key={title}
                className="group animate-fade-in relative overflow-hidden rounded-3xl border bg-card p-8 shadow-soft transition-all duration-500 hover:-translate-y-1 hover:shadow-lift"
                style={{ animationDelay: `${i * 120}ms` }}
              >
                <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-[#FF6B12]/10 to-transparent blur-2xl transition-opacity duration-500 group-hover:opacity-100" />
                <div className="relative">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-navy text-[#FF6B12] transition-transform duration-500 group-hover:rotate-6 group-hover:scale-110">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-6 font-display text-2xl font-bold text-brand-navy">{title}</h3>
                  <p className="mt-3 leading-7 text-muted-foreground">{body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Who we are */}
      <section className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#FF6B12]">Who we are</p>
              <h2 className="mt-4 font-display text-4xl font-bold leading-tight text-brand-navy sm:text-5xl">
                Academic strategists.<br />
                <span className="text-[#FF6B12]">Dedicated mentors.</span>
              </h2>
              <p className="mt-6 text-base leading-8 text-muted-foreground sm:text-lg">
                Since 2018, CatchUp Tutors has served as a premier tutorial platform dedicated to transforming academic challenges
                into global success stories. We are much more than a standard tutoring service — we are partners who believe that
                the current grade of a student never defines their ultimate destination.
              </p>
              <p className="mt-4 text-base leading-8 text-muted-foreground sm:text-lg">
                True mastery cannot be achieved through memorisation or cramming. Our approach — especially in STEM subjects like
                Mathematics, Physics, Chemistry, Further Mathematics and Biology — is built on deep practical understanding. We take
                complex formulas off the chalkboard and anchor them to real-world applications.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { icon: Lightbulb, title: "Deep understanding", body: "Concepts anchored to real-world use — not memorised formulas." },
                { icon: Target, title: "Personal diagnostics", body: "We find the exact gap that's holding a student back, then patch it." },
                { icon: BookOpen, title: "STEM specialism", body: "Maths, Physics, Chemistry, Further Maths and Biology at their core." },
                { icon: Globe2, title: "Global exam boards", body: "IGCSE, Cambridge, Edexcel, SAT, GRE, TMUA and beyond." },
              ].map(({ icon: Icon, title, body }, i) => (
                <div
                  key={title}
                  className="group animate-fade-in relative rounded-2xl border bg-card p-6 shadow-soft transition hover:-translate-y-0.5 hover:border-[#FF6B12]/40 hover:shadow-lift"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF6B12]/10 text-[#FF6B12] transition-transform duration-300 group-hover:scale-110">
                    <Icon className="h-4 w-4" />
                  </div>
                  <h3 className="mt-4 font-display text-base font-bold text-brand-navy">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* From gaps to global classrooms */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#FF6B12]/30 bg-[#FF6B12]/5 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#FF6B12]">
              <Globe2 className="h-3.5 w-3.5" /> From gaps to global classrooms
            </div>
            <h2 className="mt-6 font-display text-4xl font-bold leading-tight text-brand-navy sm:text-5xl">
              We teach students how to <em className="not-italic text-[#FF6B12]">think</em> — not just what to write.
            </h2>
            <p className="mt-6 text-base leading-8 text-muted-foreground sm:text-lg">
              We specialise in decoding and mastering the world's most demanding examinations, then giving students the competitive
              edge to secure admission into elite global institutions.
            </p>
          </div>

          <div className="mt-14 grid gap-8 md:grid-cols-2">
            <article className="animate-fade-in overflow-hidden rounded-3xl border bg-gradient-to-br from-brand-navy to-[#000E2E] p-8 text-hero-foreground shadow-soft">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#FF6B12]">Exams we master</p>
              <h3 className="mt-4 font-display text-2xl font-bold">Global exam boards, under one roof</h3>
              <div className="mt-6 flex flex-wrap gap-2">
                {EXAMS.map((e, i) => (
                  <span
                    key={e}
                    className="animate-fade-in rounded-full border border-hero-foreground/20 bg-hero-foreground/5 px-3 py-1.5 text-xs font-semibold transition hover:border-[#FF6B12] hover:text-[#FF6B12]"
                    style={{ animationDelay: `${i * 40}ms` }}
                  >
                    {e}
                  </span>
                ))}
              </div>
            </article>
            <article className="animate-fade-in overflow-hidden rounded-3xl border bg-card p-8 shadow-soft" style={{ animationDelay: "120ms" }}>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#FF6B12]">Where our scholars land</p>
              <h3 className="mt-4 font-display text-2xl font-bold text-brand-navy">Alumni at the world's best</h3>
              <div className="mt-6 flex flex-wrap gap-2">
                {UNIS.map((u, i) => (
                  <span key={u} className="animate-fade-in rounded-full border bg-muted px-3 py-1.5 text-xs font-semibold text-brand-navy transition hover:border-[#FF6B12] hover:text-[#FF6B12]" style={{ animationDelay: `${i * 50}ms` }}>
                    {u}
                  </span>
                ))}
              </div>
              <div className="mt-6 flex items-start gap-3 rounded-2xl bg-[#FF6B12]/10 p-4">
                <Trophy className="mt-0.5 h-5 w-5 shrink-0 text-[#FF6B12]" />
                <p className="text-sm leading-6 text-brand-navy">
                  Our classrooms have produced perfect <b>800/800 SAT Math</b> scores and Cambridge <b>High Achievement Award</b> winners.
                </p>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#FF6B12]">Core values</p>
              <h2 className="mt-4 font-display text-4xl font-bold text-brand-navy sm:text-5xl">What guides every lesson.</h2>
              <p className="mt-4 max-w-xl text-muted-foreground">Five commitments that shape how we teach, how we listen, and how we celebrate progress.</p>
            </div>
            <Compass className="hidden h-10 w-10 animate-[pulse_3s_ease-in-out_infinite] text-[#FF6B12] sm:block" />
          </div>

          <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {VALUES.map((v, i) => (
              <li
                key={v.title}
                className="group animate-fade-in relative overflow-hidden rounded-3xl border bg-card p-7 shadow-soft transition-all duration-500 hover:-translate-y-1.5 hover:shadow-lift"
                style={{ animationDelay: `${i * 90}ms` }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${v.accent} opacity-0 transition-opacity duration-500 group-hover:opacity-100`} />
                <div className="relative">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-background ring-1 ${v.ring} transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}>
                    <v.icon className={`h-5 w-5 ${v.text}`} />
                  </div>
                  <div className="mt-5 flex items-center gap-2">
                    <span className="text-lg" aria-hidden="true">{v.emoji}</span>
                    <h3 className="font-display text-lg font-bold text-brand-navy">{v.title}</h3>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">{v.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Founder */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-5">
              <div className="relative">
                <div className="absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-[#FF6B12]/40 via-brand-navy/20 to-transparent blur-2xl" aria-hidden="true" />
                <div className="relative overflow-hidden rounded-[2rem] border-4 border-background shadow-lift">
                  <img
                    src={founderPortrait.url}
                    alt="Mr. Ahmed Thaoban, Founder of CatchUp Tutors"
                    className="aspect-[4/5] w-full object-cover transition-transform duration-700 hover:scale-105"
                    loading="lazy"
                  />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-brand-navy/70 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-5 text-hero-foreground">
                    <p className="font-display text-xl font-bold">Mr. Ahmed Thaoban</p>
                    <p className="text-xs uppercase tracking-wider text-hero-foreground/80">Founder · CatchUp Tutors</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-2">
                {FOUNDER_CREDS.map(({ icon: Icon, label }, i) => (
                  <div key={label} className="animate-fade-in flex items-center gap-3 rounded-xl border bg-card px-4 py-3 text-sm shadow-soft" style={{ animationDelay: `${i * 80}ms` }}>
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FF6B12]/10 text-[#FF6B12]">
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-foreground">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-7">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#FF6B12]">Meet our founder</p>
              <h2 className="mt-4 font-display text-4xl font-bold leading-tight text-brand-navy sm:text-5xl">
                Mathematics as a language of opportunity.
              </h2>

              <div className="mt-8 space-y-5 text-base leading-8 text-muted-foreground sm:text-lg">
                <p>
                  At the heart of CatchUp Tutors is <b className="text-foreground">Mr. Ahmed Thaoban</b> — a visionary educator who
                  believes mathematics is not just a subject to be memorised, but a language of opportunity to be mastered.
                </p>
                <p>
                  He earned both his Bachelor's and Master's degrees in Mathematics, completing his postgraduate programme with distinction
                  as the top-ranking student in his class. He is an active researcher, publishing multiple papers in international journals
                  specialising in Complex Analysis.
                </p>
                <p>
                  With more than a decade of teaching experience, he has spent years perfecting methods that transform intricate mathematical
                  theories into clear, approachable, engaging lessons. Beyond the classroom, he directed the education and scholarship division
                  at the Global Youth Empowerment Forum and now hosts free annual summer boot camps for secondary students in his community —
                  awarding scholarships that cover tuition and external exam costs so financial constraints never hinder brilliant young minds.
                </p>
              </div>

              <figure className="mt-10 rounded-2xl border-l-4 border-[#FF6B12] bg-muted/50 p-6">
                <Quote className="h-5 w-5 text-[#FF6B12]" />
                <blockquote className="mt-3 font-display text-lg italic leading-8 text-brand-navy">
                  "The current grade of a student never defines their ultimate destination. Our job is to bridge the gap between where
                  they are and where they were always meant to be."
                </blockquote>
                <figcaption className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">— Mr. Ahmed Thaoban</figcaption>
              </figure>
            </div>
          </div>
        </div>
      </section>

      {/* Partnership CTA (link only) */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-navy via-brand-navy to-[#000E2E] p-10 text-hero-foreground shadow-lift sm:p-14">
            <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[#FF6B12]/25 blur-3xl transition-transform duration-700 group-hover:scale-110" aria-hidden="true" />
            <div className="absolute -bottom-16 -left-10 h-64 w-64 rounded-full bg-primary/20 blur-3xl transition-transform duration-700 group-hover:scale-110" aria-hidden="true" />
            <div className="relative grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-[#FF6B12]/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#FF6B12]">
                  <HeartHandshake className="h-3.5 w-3.5" /> Partnership & Sponsorship
                </div>
                <h2 className="mt-4 font-display text-3xl font-bold leading-tight sm:text-4xl">
                  Build the next generation of leaders with us.
                </h2>
                <p className="mt-4 max-w-2xl text-base text-hero-foreground/80">
                  Corporate sponsors, NGOs, community leaders and individuals — join us in expanding educational access across Nigeria and beyond.
                </p>
                <div className="mt-6 flex flex-wrap gap-2 text-xs">
                  {["Program sponsorship", "Facility support", "CSR partnerships", "Scholarships"].map((t) => (
                    <span key={t} className="inline-flex items-center gap-1.5 rounded-full border border-hero-foreground/20 bg-hero-foreground/5 px-2.5 py-1 font-medium">
                      <Star className="h-3 w-3 text-[#FF6B12]" /> {t}
                    </span>
                  ))}
                </div>
              </div>
              <Button asChild size="lg" className="bg-[#FF6B12] text-white shadow-lg transition-transform hover:scale-105 hover:bg-[#FF6B12]/90">
                <Link to="/partnership">Explore partnerships <ArrowRight /></Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Closing */}
      <section>
        <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 lg:px-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FF6B12]/10 text-[#FF6B12]">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h2 className="mt-6 font-display text-3xl font-bold text-brand-navy sm:text-4xl">
            We don't just prepare students for exams — we prepare them to own their future.
          </h2>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg"><Link to="/contact">Talk to our team <ArrowRight /></Link></Button>
            <Button asChild size="lg" variant="outline"><Link to="/programs">Explore our programs</Link></Button>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
