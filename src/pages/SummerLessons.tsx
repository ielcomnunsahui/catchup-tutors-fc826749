import { Link } from "react-router-dom";
import { MapPin, CalendarDays, GraduationCap, HeartHandshake, CheckCircle2, ArrowRight, Sparkles } from "lucide-react";
import { SiteShell, PageHero, Seo } from "@/components/site-shell";
import { Button } from "@/components/ui/button";

const VENUE = "Al-Bayan High School, Ilorin, Kwara State, Nigeria";

export default function SummerLessons() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "EducationEvent",
    name: "CatchUp Tutors Free Summer Lessons",
    description: "Free in-person summer academic programme for secondary students at Al-Bayan High School, Ilorin.",
    location: { "@type": "Place", name: "Al-Bayan High School", address: { "@type": "PostalAddress", addressLocality: "Ilorin", addressRegion: "Kwara", addressCountry: "NG" } },
    organizer: { "@type": "EducationalOrganization", name: "CatchUp Tutors" },
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    isAccessibleForFree: true,
  };
  return (
    <SiteShell>
      <Seo
        title="Free Summer Lessons | CatchUp Tutors"
        description="Register for CatchUp Tutors' free in-person summer academic programme at Al-Bayan High School, Ilorin. Open to students and volunteer tutors."
        path="/summerlessons"
        jsonLd={jsonLd}
      />
      <PageHero
        eyebrow="Community programme"
        title="Free Summer Lessons, Ilorin"
        description="A fully-funded, in-person summer academy for secondary students. Taught by volunteer tutors from across the country, hosted at Al-Bayan High School."
      >
        <div className="flex flex-wrap gap-4 text-sm text-hero-foreground/80">
          <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4" /> {VENUE}</span>
          <span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4" /> Physical classes only</span>
        </div>
      </PageHero>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2">
          {/* Student card */}
          <article className="group flex flex-col overflow-hidden rounded-3xl border bg-card shadow-soft transition hover:-translate-y-1 hover:shadow-lift">
            <div className="bg-brand-navy p-8 text-hero-foreground">
              <GraduationCap className="h-9 w-9 text-[#FF6B12]" />
              <h2 className="mt-6 font-display text-3xl font-bold leading-tight">For students</h2>
              <p className="mt-3 text-hero-foreground/80">Free coaching in Mathematics, Sciences and exam prep for WAEC, NECO, IGCSE, SAT and Cambridge A-Level.</p>
            </div>
            <div className="flex flex-1 flex-col p-8">
              <ul className="space-y-3 text-sm">
                {[
                  "Zero tuition · fully sponsored seat",
                  "Physical classes at Al-Bayan High School, Ilorin",
                  "Official admission & enrollment letter",
                  "Small groups · patient, personal teaching",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2.5"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-green" /><span>{f}</span></li>
                ))}
              </ul>
              <Button asChild size="lg" className="mt-8 w-full">
                <Link to="/summerlessons/student">Register now <ArrowRight /></Link>
              </Button>
              <p className="mt-3 text-center text-xs text-muted-foreground">Instant admission letter · emailed to you</p>
            </div>
          </article>

          {/* Tutor card */}
          <article className="group flex flex-col overflow-hidden rounded-3xl border bg-card shadow-soft transition hover:-translate-y-1 hover:shadow-lift">
            <div className="bg-[#FF6B12] p-8 text-white">
              <HeartHandshake className="h-9 w-9" />
              <h2 className="mt-6 font-display text-3xl font-bold leading-tight">For volunteer tutors</h2>
              <p className="mt-3 text-white/90">Give back by teaching a class. Meals and transport within Ilorin are covered. A meaningful summer of impact.</p>
            </div>
            <div className="flex flex-1 flex-col p-8">
              <ul className="space-y-3 text-sm">
                {[
                  "Choose the subjects you're strongest in",
                  "Meals + local transport covered",
                  "Volunteer certificate on completion",
                  "Coach the next generation of scholars",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2.5"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-green" /><span>{f}</span></li>
                ))}
              </ul>
              <Button asChild size="lg" variant="outline" className="mt-8 w-full border-[#FF6B12] text-[#FF6B12] hover:bg-[#FF6B12] hover:text-white">
                <Link to="/summerlessons/tutor">Apply as tutor <ArrowRight /></Link>
              </Button>
              <p className="mt-3 text-center text-xs text-muted-foreground">Reviewed within 48 hours · acceptance emailed</p>
            </div>
          </article>
        </div>

        <div className="mt-14 rounded-3xl border bg-muted/40 p-8 text-center">
          <Sparkles className="mx-auto h-6 w-6 text-[#FF6B12]" />
          <h3 className="mt-4 font-display text-xl font-bold text-brand-navy">Taught with wisdom, delivered with heart.</h3>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            The Summer Academy runs on donations and volunteer time. Every accepted student receives an admission letter
            and a place in a small, supportive class. Questions? WhatsApp{" "}
            <a href="https://wa.me/447350890668" className="font-semibold text-primary hover:underline">+44 7350 890668</a>.
          </p>
        </div>
      </section>
    </SiteShell>
  );
}
