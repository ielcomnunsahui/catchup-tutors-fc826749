import { Link } from "react-router-dom";
import { CheckCircle2, Mail, MapPin, MessageCircle, Handshake, Building2, HeartHandshake, GraduationCap, Compass, Sparkles, ArrowRight, Phone } from "lucide-react";
import { SiteShell, PageHero, Seo } from "@/components/site-shell";
import { Button } from "@/components/ui/button";

const VALUES = [
  { icon: "💡", title: "Empathy without judgement", desc: "We meet every student where they are — no shame, only a safe space to learn and grow." },
  { icon: "⚙️", title: "No wasted time", desc: "We pinpoint the missing foundation, patch it, and get your child moving forward." },
  { icon: "🛡️", title: "Room to make mistakes", desc: "A calm classroom where there are zero silly questions and zero judgment." },
  { icon: "📈", title: "Skills for life", desc: "We teach students how to study and how to think — not just how to pass tonight's homework." },
  { icon: "⚡", title: "Celebrating small wins", desc: "Every breakthrough matters. Tiny victories build unstoppable confidence." },
];

const PARTNERSHIP_TRACKS = [
  {
    icon: HeartHandshake,
    title: "Program sponsorship",
    body: "Sponsor learning materials, textbooks, or exam registration fees (WAEC, JAMB, IGCSE, SAT) for brilliant but underserved students.",
  },
  {
    icon: Building2,
    title: "Center & facility support",
    body: "Partner with us to provide or upgrade physical learning hubs, electricity/solar power solutions, and teaching aids.",
  },
  {
    icon: Handshake,
    title: "Corporate social responsibility",
    body: "Align your organisation's community development goals with our free educational interventions across Nigeria.",
  },
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
        description="Meet founder Ahmed Thaoban and discover the mission, values and partnership opportunities behind CatchUp Tutors."
        path="/about"
        jsonLd={jsonLd}
      />
      <PageHero
        eyebrow="Our story"
        title="Turning learning gaps into lasting confidence."
        description="Since 2018, CatchUp Tutors has helped students across Nigeria, the UK and beyond master IGCSE, Cambridge A-Level, SAT and university entrance exams."
      />

      {/* Founder */}
      <section className="border-b border-border">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-12 lg:gap-16 lg:px-8">
          <div className="lg:col-span-5">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">Meet our founder</p>
            <h2 className="mt-4 font-display text-3xl font-bold leading-tight text-brand-navy sm:text-4xl">Mr. Ahmed Thaoban</h2>
            <p className="mt-3 text-sm uppercase tracking-wider text-muted-foreground">MSc Mathematics · Cambridge-certified tutor</p>
            <div className="mt-8 aspect-[4/5] w-full max-w-sm rounded-3xl bg-gradient-to-br from-[#000E2E] to-brand-navy p-1 shadow-lift">
              <div className="flex h-full w-full items-center justify-center rounded-[calc(1.5rem-0.25rem)] bg-brand-navy/95 text-hero-foreground">
                <div className="text-center">
                  <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-[#FF6B12] font-display text-3xl font-bold">AT</div>
                  <p className="mt-4 font-display text-lg">Founder portrait</p>
                  <p className="mt-1 text-xs text-hero-foreground/60">Upload from Admin Dashboard</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 lg:pt-4">
            <div className="space-y-6 text-base leading-8 text-muted-foreground sm:text-lg">
              <p>
                Ahmed is a visionary educator who believes mathematics is a language of opportunity to be mastered — not memorised.
                He earned both his BSc and MSc in Mathematics, graduating top of his class with distinction.
              </p>
              <p>
                With over a decade of experience across international exam boards, he now leads CatchUp Tutors while running free
                summer lessons for secondary students in his community — awarding scholarships that cover external exam fees and
                school tuition for students of exceptional promise.
              </p>
              <p>
                His students have earned perfect 800/800 SAT Math scores, the Cambridge High Achievement Award, and places at
                Harvard, Oxford and top universities in the UK, US and beyond.
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
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">Why we exist</p>
          <h2 className="mt-4 font-display text-3xl font-bold leading-tight text-brand-navy sm:text-4xl">
            A sanctuary from the quiet pressure of falling behind.
          </h2>
          <div className="mt-8 space-y-6 text-base leading-8 text-muted-foreground sm:text-lg">
            <p>
              We started CatchUp Tutors because we watched brilliant students carry a heavy, invisible burden — falling behind
              not for lack of effort, but because the classroom never paused to let them breathe.
            </p>
            <p>
              Miss one foundational concept, and school stops being a place of discovery. We built this platform to reverse that
              — a space where mistakes are welcomed, gaps are filled with patience, and children rediscover just how capable
              they've always been.
            </p>
          </div>
          <div className="mt-10 flex flex-wrap gap-3">
            {["Make complex ideas feel clear", "Connect practice to exam performance", "Build confidence through measurable progress"].map((x) => (
              <span key={x} className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-brand-green" /> {x}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">Core values</p>
              <h2 className="mt-4 font-display text-3xl font-bold text-brand-navy sm:text-4xl">What guides every lesson.</h2>
            </div>
            <Compass className="hidden h-8 w-8 text-[#FF6B12] sm:block" />
          </div>
          <ul className="mt-12 grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
            {VALUES.map((v) => (
              <li key={v.title} className="flex h-full flex-col bg-background p-8">
                <span className="text-2xl" aria-hidden="true">{v.icon}</span>
                <h3 className="mt-6 font-display text-lg font-bold text-brand-navy">{v.title}</h3>
                <p className="mt-3 leading-7 text-muted-foreground">{v.desc}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Partnership */}
      <section id="partnership" className="border-b border-border bg-brand-navy text-hero-foreground">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#FF6B12]/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#FF6B12]">
              <Handshake className="h-3.5 w-3.5" /> Partnership · Collaboration · Sponsorship
            </div>
            <h2 className="mt-6 font-display text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">
              Build the next generation of leaders with us.
            </h2>
            <p className="mt-6 text-base leading-8 text-hero-foreground/80 sm:text-lg">
              At CatchUp Tutors, we are dedicated to providing high-quality, impactful education and mentorship to secondary school
              students across Nigeria. We welcome partnerships with corporate organisations, NGOs, community leaders, and
              individuals who share our vision of educational equity, youth development, and academic excellence.
            </p>
          </div>

          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {PARTNERSHIP_TRACKS.map(({ icon: Icon, title, body }) => (
              <article key={title} className="rounded-2xl border border-hero-foreground/15 bg-hero-foreground/[0.04] p-6 backdrop-blur">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FF6B12]/15 text-[#FF6B12]">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 font-display text-lg font-bold">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-hero-foreground/75">{body}</p>
              </article>
            ))}
          </div>

          <div className="mt-14 rounded-3xl border border-hero-foreground/15 bg-hero-foreground/[0.04] p-8 backdrop-blur">
            <h3 className="font-display text-xl font-bold">Reach our management team</h3>
            <p className="mt-2 text-sm text-hero-foreground/75">
              To discuss collaboration opportunities, sponsorships, or to book a meeting with our leadership, please contact us
              directly through the channels below.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <ContactChip icon={Phone} title="Phone / WhatsApp" text="+234 810 180 4411" href="https://wa.me/2348101804411" />
              <ContactChip icon={Mail} title="Email" text="Catchuptutors01@gmail.com" href="mailto:Catchuptutors01@gmail.com" />
              <ContactChip icon={MapPin} title="Office" text="Al-Bayan High School, behind Karuma Secondary School, Akerebiate, Ilorin, Kwara State." />
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-[#FF6B12] text-white hover:bg-[#FF6B12]/90">
                <Link to="/contact">Start a conversation <ArrowRight /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-hero-foreground/40 bg-transparent text-hero-foreground hover:bg-hero-foreground hover:text-brand-navy">
                <a href="https://wa.me/2348101804411" target="_blank" rel="noopener"><MessageCircle /> WhatsApp our team</a>
              </Button>
            </div>
            <p className="mt-6 text-xs italic text-hero-foreground/70">
              Let's build the next generation of leaders together — with wisdom and intentionality.
            </p>
          </div>
        </div>
      </section>

      {/* Community CTA */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <Sparkles className="mx-auto h-8 w-8 text-[#FF6B12]" />
          <h2 className="mt-4 font-display text-3xl font-bold text-brand-navy sm:text-4xl">Free Summer Academy · Ilorin</h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Our fully-funded summer programme brings together the country's brightest students and volunteer tutors — hosted at
            Al-Bayan High School, Ilorin. Zero fees. Real mentorship. Life-changing outcomes.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg"><Link to="/summerlessons"><GraduationCap /> Learn more</Link></Button>
            <Button asChild size="lg" variant="outline"><Link to="/summerlessons/student">Register as a student</Link></Button>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}

function ContactChip({ icon: Icon, title, text, href }: { icon: typeof Mail; title: string; text: string; href?: string }) {
  const content = (
    <div className="flex h-full items-start gap-3 rounded-2xl border border-hero-foreground/15 bg-brand-navy/40 p-4 transition hover:border-[#FF6B12]/60">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FF6B12]/15 text-[#FF6B12]">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-hero-foreground/60">{title}</p>
        <p className="mt-1 text-sm leading-6">{text}</p>
      </div>
    </div>
  );
  return href ? (
    <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener" className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B12] focus-visible:ring-offset-2 focus-visible:ring-offset-brand-navy">
      {content}
    </a>
  ) : (
    content
  );
}
