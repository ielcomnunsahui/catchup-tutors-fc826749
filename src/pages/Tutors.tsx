import { Link } from "react-router-dom";
import { BadgeCheck, Calendar, Search, Star } from "lucide-react";
import { SiteShell, PageHero, Seo } from "@/components/site-shell";
import { Button } from "@/components/ui/button";

export default function Tutors() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: "One-to-one Mathematics tutoring",
    provider: { "@type": "EducationalOrganization", name: "CatchUp Tutors" },
    areaServed: ["Nigeria", "United Kingdom", "Worldwide"],
    audience: { "@type": "EducationalAudience", educationalRole: "student" },
  };
  return (
    <SiteShell>
      <Seo title="Expert Mathematics Tutors | CatchUp Tutors" description="Find approved Cambridge and IGCSE Mathematics tutors and book one-to-one sessions." path="/tutors" jsonLd={jsonLd} />
      <PageHero eyebrow="Approved experts" title="Find the tutor who understands your next step." description="Compare subjects, teaching focus, experience, availability, and tutor-set session pricing." />
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 rounded-2xl border bg-card px-4 shadow-soft">
          <Search className="text-muted-foreground" />
          <input placeholder="Search tutors by subject or topic" aria-label="Search tutors" className="h-14 flex-1 bg-transparent outline-none" />
        </div>
        <div className="mt-10 rounded-3xl border border-dashed p-12 text-center">
          <BadgeCheck className="mx-auto h-10 w-10 text-primary" />
          <h2 className="mt-4 font-display text-2xl font-bold">Approved tutor profiles will appear here</h2>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">Every public tutor completes an application and admin review before students can book.</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Button asChild><Link to="/auth">Apply as a tutor</Link></Button>
            <Button asChild variant="outline"><Link to="/contact">Get tutor matching help</Link></Button>
          </div>
        </div>
        <div className="mt-14 grid gap-5 sm:grid-cols-3">
          {[[Star, "Trusted profiles", "Qualifications and teaching details reviewed"], [Calendar, "Clear availability", "Choose a tutor and preferred learning time"], [BadgeCheck, "Protected contact", "Bookings coordinated without exposing student phone numbers"]].map(([Icon, title, text]) => {
            const I = Icon as typeof Star;
            return <div key={String(title)} className="rounded-2xl bg-muted p-6"><I className="text-primary" /><h3 className="mt-4 font-display font-bold">{String(title)}</h3><p className="mt-2 text-sm text-muted-foreground">{String(text)}</p></div>;
          })}
        </div>
      </section>
    </SiteShell>
  );
}
