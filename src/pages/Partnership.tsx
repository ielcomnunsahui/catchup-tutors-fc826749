import { Link } from "react-router-dom";
import {
  Handshake, HeartHandshake, Building2, ArrowRight, Mail, Phone, MapPin, MessageCircle,
  Sparkles, Target, Users, GraduationCap, Trophy, CheckCircle2, Globe2,
} from "lucide-react";
import { SiteShell, PageHero, Seo } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { heroImages } from "@/assets/heroes";

const TRACKS = [
  {
    icon: HeartHandshake,
    title: "Program sponsorship",
    body: "Sponsor learning materials, textbooks or exam registration fees (WAEC, JAMB, IGCSE, SAT) for brilliant but underserved students.",
    perks: ["Named cohorts", "Impact reporting", "Scholarship placement"],
  },
  {
    icon: Building2,
    title: "Center & facility support",
    body: "Fund or upgrade physical learning hubs, solar / power solutions, teaching aids and safe classroom spaces.",
    perks: ["Branded venues", "On-site presence", "Community access"],
  },
  {
    icon: Handshake,
    title: "Corporate social responsibility",
    body: "Align your organisation's community-development goals with our free educational interventions across Nigeria.",
    perks: ["CSR reports", "Employee volunteering", "Co-branded events"],
  },
];

const WHY_US = [
  { icon: Target, title: "Focused impact", body: "Every ₦1 sponsored ties directly to a named student, exam or facility upgrade." },
  { icon: Users, title: "Trusted since 2018", body: "Hundreds of students coached to top marks and elite universities worldwide." },
  { icon: Trophy, title: "Proven outcomes", body: "800/800 SAT Math, Cambridge High Achievement Awards, Harvard & Oxford placements." },
  { icon: Globe2, title: "Local + global", body: "Roots in Ilorin, students across Nigeria, the UK, US, Canada and beyond." },
];

const PROCESS = [
  { step: "01", title: "Discovery call", body: "We meet, understand your goals and shortlist the tracks that fit your objectives." },
  { step: "02", title: "Tailored proposal", body: "You receive a written partnership plan with scope, timeline, deliverables and impact metrics." },
  { step: "03", title: "Launch & sponsor", body: "We roll out the programme together — students onboarded, materials distributed, milestones tracked." },
  { step: "04", title: "Impact reporting", body: "Quarterly reports with stories, photos and measurable outcomes for your board or CSR ledger." },
];

export default function Partnership() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Partnership & Sponsorship — CatchUp Tutors",
    description: "Sponsor and partner with CatchUp Tutors to expand free, high-impact education across Nigeria.",
  };
  return (
    <SiteShell>
      <Seo
        title="Partnership & Sponsorship | CatchUp Tutors"
        description="Sponsor students, fund learning centres or launch a CSR partnership with CatchUp Tutors. Bridging Gaps, Building Excellence."
        path="/partnership"
        jsonLd={jsonLd}
      />
      <PageHero
        image={heroImages.partnership}
        eyebrow="Partnership · Collaboration · Sponsorship"
        title="Build the next generation of leaders with us."
        description="We welcome corporate organisations, NGOs, community leaders and individuals who share our vision of educational equity, youth development and academic excellence."
      >
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg" className="bg-[#FF6B12] text-white hover:bg-[#FF6B12]/90">
            <a href="https://wa.me/447350890668" target="_blank" rel="noopener"><MessageCircle /> WhatsApp our team</a>
          </Button>
          <Button asChild size="lg" variant="outline" className="border-hero-foreground/40 bg-transparent text-hero-foreground hover:bg-hero-foreground hover:text-brand-navy">
            <Link to="/contact">Start a conversation <ArrowRight /></Link>
          </Button>
        </div>
      </PageHero>

      {/* Tracks */}
      <section className="border-b">
        <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#FF6B12]">Ways to partner</p>
            <h2 className="mt-4 font-display text-4xl font-bold text-brand-navy sm:text-5xl">Three tracks. One shared mission.</h2>
            <p className="mt-4 text-muted-foreground">Choose the track that best fits your organisation's goals — or mix and match. We tailor every partnership.</p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {TRACKS.map(({ icon: Icon, title, body, perks }, i) => (
              <article
                key={title}
                className="group animate-fade-in relative overflow-hidden rounded-3xl border bg-card p-8 shadow-soft transition-all duration-500 hover:-translate-y-1.5 hover:shadow-lift"
                style={{ animationDelay: `${i * 120}ms` }}
              >
                <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-to-br from-[#FF6B12]/15 to-transparent blur-2xl transition-transform duration-500 group-hover:scale-125" />
                <div className="relative">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-navy text-[#FF6B12] transition-transform duration-500 group-hover:rotate-6 group-hover:scale-110">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-6 font-display text-xl font-bold text-brand-navy">{title}</h3>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">{body}</p>
                  <ul className="mt-6 space-y-2 border-t pt-5 text-sm">
                    {perks.map((p) => (
                      <li key={p} className="flex items-center gap-2 text-foreground">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-brand-green" /> {p}
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Why partner */}
      <section className="border-b bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-5">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#FF6B12]">Why partner with us</p>
              <h2 className="mt-4 font-display text-4xl font-bold text-brand-navy sm:text-5xl">Impact you can point to.</h2>
              <p className="mt-4 text-muted-foreground">We treat every sponsorship like a case study — measurable, transparent and rooted in student stories you can share with your board.</p>
              <div className="mt-8 rounded-2xl border border-[#FF6B12]/30 bg-[#FF6B12]/5 p-5">
                <div className="flex items-center gap-2 text-[#FF6B12]"><Sparkles className="h-4 w-4" /><span className="text-xs font-bold uppercase tracking-wider">Featured program</span></div>
                <p className="mt-2 font-display text-lg font-bold text-brand-navy">Free Summer Academy — Ilorin</p>
                <p className="mt-2 text-sm text-muted-foreground">Fully sponsored, in-person summer coaching for secondary students at Al-Bayan High School. Zero fees. Real mentorship.</p>
                <Button asChild variant="link" className="mt-3 px-0 text-[#FF6B12]">
                  <Link to="/events">See the programme <ArrowRight className="ml-1 h-4 w-4" /></Link>
                </Button>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:col-span-7">
              {WHY_US.map(({ icon: Icon, title, body }, i) => (
                <div
                  key={title}
                  className="group animate-fade-in rounded-2xl border bg-card p-6 shadow-soft transition hover:-translate-y-0.5 hover:border-[#FF6B12]/40 hover:shadow-lift"
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

      {/* Process */}
      <section className="border-b">
        <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#FF6B12]">How it works</p>
            <h2 className="mt-4 font-display text-4xl font-bold text-brand-navy sm:text-5xl">A simple four-step launch.</h2>
          </div>
          <ol className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {PROCESS.map((s, i) => (
              <li
                key={s.step}
                className="animate-fade-in relative rounded-3xl border bg-card p-7 shadow-soft transition hover:-translate-y-1 hover:shadow-lift"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <span className="font-display text-5xl font-bold text-[#FF6B12]/25">{s.step}</span>
                <h3 className="mt-2 font-display text-lg font-bold text-brand-navy">{s.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="bg-brand-navy text-hero-foreground">
        <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-hero-foreground/15 bg-hero-foreground/[0.04] p-8 backdrop-blur sm:p-12">
            <Badge className="bg-[#FF6B12] text-white hover:bg-[#FF6B12]">Get in touch</Badge>
            <h2 className="mt-4 font-display text-3xl font-bold sm:text-4xl">Reach our management team</h2>
            <p className="mt-3 max-w-2xl text-sm text-hero-foreground/75">
              To discuss collaboration opportunities, sponsorships, or to book a meeting with our leadership, please contact us directly through the channels below.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <ContactChip icon={Phone} title="Phone / WhatsApp" text="+44 7350 890668" href="https://wa.me/447350890668" />
              <ContactChip icon={Mail} title="Email" text="Catchuptutors01@gmail.com" href="mailto:Catchuptutors01@gmail.com" />
              <ContactChip icon={MapPin} title="Office" text="Al-Bayan High School, behind Karuma Secondary School, Akerebiate, Ilorin, Kwara State." />
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-[#FF6B12] text-white hover:bg-[#FF6B12]/90">
                <Link to="/contact">Start a conversation <ArrowRight /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-hero-foreground/40 bg-transparent text-hero-foreground hover:bg-hero-foreground hover:text-brand-navy">
                <a href="https://wa.me/447350890668" target="_blank" rel="noopener"><MessageCircle /> WhatsApp our team</a>
              </Button>
            </div>
            <p className="mt-6 text-xs italic text-hero-foreground/70">Let's build the next generation of leaders together — with wisdom and intentionality.</p>
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
