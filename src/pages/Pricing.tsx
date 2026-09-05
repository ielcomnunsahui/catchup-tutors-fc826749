import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Check, Sparkles, GraduationCap, BookOpen, Star, Loader2 } from "lucide-react";
import { SiteShell, PageHero, Seo } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { heroImages } from "@/assets/heroes";

type DbPlan = { id: string; slug: string; name: string; price_ngn: number; price_usd: number | null };

type Plan = {
  slug: string;
  name: string;
  usd: string;
  ngn: string;
  period: string;
  features: string[];
  featured?: boolean;
  badge?: string;
  cta: { label: string; to: string };
};

const RESOURCE_PLANS: Plan[] = [
  {
    slug: "premium-monthly",
    name: "Monthly",
    usd: "$20",
    ngn: "₦30,000",
    period: "per month",
    features: [
      "Unlimited premium videos",
      "All topic-based past questions",
      "Worked solutions library",
      "Practice exams & mark schemes",
      "Cancel anytime",
    ],
    cta: { label: "Start Monthly", to: "/auth" },
  },
  {
    slug: "premium-quarterly",
    name: "Quarterly",
    usd: "$70",
    ngn: "₦100,000",
    period: "per quarter",
    features: [
      "Everything in Monthly",
      "3 months uninterrupted access",
      "Save vs paying monthly",
      "Priority learning support",
    ],
    featured: true,
    badge: "MOST POPULAR",
    cta: { label: "Start Quarterly", to: "/auth" },
  },
  {
    slug: "premium-annual",
    name: "Annually",
    usd: "$200",
    ngn: "₦300,000",
    period: "per year",
    badge: "BEST VALUE",
    features: [
      "Everything in Quarterly",
      "12 months uninterrupted access",
      "Best yearly value",
      "Access as new content drops",
    ],
    cta: { label: "Start Annually", to: "/auth" },
  },
];

const COMPARE: [string, boolean, boolean, boolean, boolean][] = [
  // [feature, hourly, monthly, quarterly, annual]
  ["1-on-1 tutor session", true, false, false, false],
  ["Personalised study plan", true, false, false, false],
  ["Premium video walkthroughs", false, true, true, true],
  ["Topic-based past questions", false, true, true, true],
  ["Worked solutions & mark schemes", false, true, true, true],
  ["Practice exams library", false, true, true, true],
  ["Priority learning support", false, false, true, true],
  ["12 months uninterrupted access", false, false, false, true],
];

export default function Pricing() {
  const navigate = useNavigate();
  const [busySlug, setBusySlug] = useState<string | null>(null);

  const { data: pricingData } = useQuery({
    queryKey: ["pricing-plans"],
    queryFn: async () => {
      const [plansRes, settingRes] = await Promise.all([
        supabase.from("subscription_plans").select("id,slug,name,price_ngn,price_usd").eq("is_active", true),
        supabase.from("settings").select("value").eq("key", "paystack").maybeSingle(),
      ]);
      return {
        plans: (plansRes.data as DbPlan[]) ?? [],
        paystackEnabled: Boolean((settingRes.data?.value as { enabled?: boolean } | null)?.enabled),
      };
    },
  });
  const dbPlans = pricingData?.plans ?? [];
  const paystackEnabled = pricingData?.paystackEnabled ?? false;

  const subscribe = async (slug: string) => {
    const plan = dbPlans.find((p) => p.slug === slug);
    if (!plan) { toast.error("This plan is not available right now."); return; }
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) { navigate(`/auth?redirect=/pricing`); return; }
    setBusySlug(slug);
    try {
      const { data, error } = await supabase.functions.invoke("paystack-init", {
        body: { planId: plan.id, callbackUrl: `${window.location.origin}/payment/callback` },
      });
      const res = data as { authorization_url?: string; error?: string } | null;
      if (error || res?.error || !res?.authorization_url) throw new Error(res?.error ?? error?.message ?? "Could not start checkout");
      window.location.href = res.authorization_url;
    } catch (e) {
      toast.error((e as Error).message);
      setBusySlug(null);
    }
  };

  const jsonLd = RESOURCE_PLANS.map((p) => ({
    "@context": "https://schema.org",
    "@type": "Product",
    name: `CatchUp Tutors — Premium ${p.name}`,
    description: p.features.join(". "),
    brand: { "@type": "Brand", name: "CatchUp Tutors" },
    offers: [
      { "@type": "Offer", price: p.usd.replace(/[^\d]/g, ""), priceCurrency: "USD", availability: "https://schema.org/InStock" },
      { "@type": "Offer", price: p.ngn.replace(/[^\d]/g, ""), priceCurrency: "NGN", availability: "https://schema.org/InStock" },
    ],
  }));

  return (
    <SiteShell>
      <Seo
        title="Pricing — Tutoring & Premium Plans | CatchUp Tutors"
        description="Book 1-on-1 tutoring at $17 / ₦25,000 per hour, or subscribe to unlimited premium resources from $20 / ₦30,000 per month."
        path="/pricing"
        jsonLd={jsonLd}
      />
      <PageHero
        image={heroImages.pricing}
        eyebrow="Choose your plan"
        title="Two clear paths. One serious goal — mastery."
        description="Pick 1-on-1 tutoring for personal coaching, or a resource subscription for unlimited self-study. Or combine both."
      />

      {/* Hourly */}
      <section className="mx-auto max-w-6xl px-4 pt-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 rounded-3xl border bg-card p-8 shadow-soft md:grid-cols-[1.1fr,1fr] md:p-12">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#FF6B12]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#FF6B12]">
              <GraduationCap className="h-3.5 w-3.5" /> Hourly Tutoring
            </div>
            <h2 className="mt-4 font-display text-3xl font-bold text-brand-navy sm:text-4xl">Personal, 1-on-1 coaching.</h2>
            <p className="mt-4 leading-7 text-muted-foreground">
              Book a session with an approved CatchUp tutor. Every session is tailored to your pace, your syllabus and the exact
              concepts you're stuck on.
            </p>
            <ul className="mt-6 space-y-2.5 text-sm">
              {["Personalised, at your pace", "Any board: IGCSE, A-Level, SAT, WAEC, NECO", "Google Meet, Zoom, or in-person", "Pay per session — no subscription needed"].map((f) => (
                <li key={f} className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-brand-green" /> {f}</li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col justify-center rounded-2xl border-2 border-brand-navy bg-brand-navy p-8 text-hero-foreground">
            <p className="text-xs font-semibold uppercase tracking-wider text-hero-foreground/60">Rate</p>
            <p className="mt-2 font-display text-5xl font-bold">$17<span className="text-xl font-normal text-hero-foreground/70"> / hr</span></p>
            <p className="mt-1 text-hero-foreground/80">or <b>₦25,000</b> per hour</p>
            <Button asChild size="lg" className="mt-8 bg-[#FF6B12] text-white hover:bg-[#FF6B12]/90">
              <Link to="/tutors">Find a tutor</Link>
            </Button>
            <p className="mt-3 text-xs text-hero-foreground/60">Book directly with an approved tutor.</p>
          </div>
        </div>
      </section>

      {/* Subscriptions */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
              <BookOpen className="h-3.5 w-3.5" /> Premium Resource Subscription
            </div>
            <h2 className="mt-4 font-display text-3xl font-bold text-brand-navy sm:text-4xl">Unlimited access to every resource.</h2>
          </div>
          <p className="max-w-md text-sm text-muted-foreground">
            All study materials, practice exams and platform resources — one subscription, one price.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {RESOURCE_PLANS.map((p) => (
            <article
              key={p.name}
              className={`relative flex flex-col rounded-3xl border p-7 transition ${
                p.featured
                  ? "border-brand-navy bg-brand-navy text-hero-foreground shadow-lift"
                  : "border-border bg-card shadow-soft hover:-translate-y-1 hover:shadow-lift"
              }`}
            >
              {p.badge && (
                <span className={`absolute -top-3 left-6 rounded-full px-3 py-1 text-[10px] font-bold tracking-wider ${p.featured ? "bg-[#FF6B12] text-white" : "bg-brand-navy text-white"}`}>
                  {p.badge}
                </span>
              )}
              <h3 className="font-display text-xl font-bold">{p.name}</h3>
              <p className="mt-5 font-display text-4xl font-bold">{p.usd}</p>
              <p className={`text-sm ${p.featured ? "text-hero-foreground/70" : "text-muted-foreground"}`}>{p.ngn} · {p.period}</p>
              <ul className="mt-6 space-y-2.5 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className={`mt-0.5 h-4 w-4 shrink-0 ${p.featured ? "text-[#FF6B12]" : "text-brand-green"}`} /> {f}
                  </li>
                ))}
              </ul>
              {paystackEnabled ? (
                <Button
                  className={`mt-8 w-full ${p.featured ? "bg-[#FF6B12] text-white hover:bg-[#FF6B12]/90" : ""}`}
                  variant={p.featured ? "default" : "outline"}
                  disabled={busySlug === p.slug}
                  onClick={() => subscribe(p.slug)}
                >
                  {busySlug === p.slug ? <Loader2 className="animate-spin" /> : null} Pay with Paystack
                </Button>
              ) : (
                <Button
                  asChild
                  className={`mt-8 w-full ${p.featured ? "bg-[#FF6B12] text-white hover:bg-[#FF6B12]/90" : ""}`}
                  variant={p.featured ? "default" : "outline"}
                >
                  <Link to={p.cta.to}>{p.cta.label}</Link>
                </Button>
              )}
            </article>
          ))}
        </div>
      </section>

      {/* Compare */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
          <h2 className="font-display text-2xl font-bold text-brand-navy sm:text-3xl">Feature comparison</h2>
          <div className="mt-8 overflow-x-auto rounded-2xl border">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="p-4 font-semibold">Feature</th>
                  <th className="p-4 font-semibold">Hourly</th>
                  <th className="p-4 font-semibold">Monthly</th>
                  <th className="p-4 font-semibold">Quarterly</th>
                  <th className="p-4 font-semibold">Annual</th>
                </tr>
              </thead>
              <tbody>
                {COMPARE.map(([f, ...cols]) => (
                  <tr key={f as string} className="border-t">
                    <td className="p-4 font-medium">{f as string}</td>
                    {(cols as boolean[]).map((c, i) => (
                      <td key={i} className="p-4">
                        {c ? <Check className="h-4 w-4 text-brand-green" aria-label="included" /> : <span className="text-muted-foreground/50">—</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:px-8">
          <Star className="mx-auto h-8 w-8 text-[#FF6B12]" />
          <h2 className="mt-4 font-display text-3xl font-bold text-brand-navy sm:text-4xl">Ready to catch up and stay ahead?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Join thousands of students building real confidence with CatchUp Tutors.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg"><Link to="/auth">Start Premium</Link></Button>
            <Button asChild size="lg" variant="outline"><Link to="/tutors">Find a Tutor</Link></Button>
          </div>
          <p className="mx-auto mt-8 flex max-w-xl items-center justify-center gap-2 rounded-xl bg-muted/50 px-4 py-3 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-[#FF6B12]" /> {paystackEnabled
              ? "Secure card, bank transfer and USSD payments in Naira, powered by Paystack."
              : "USD & NGN pricing shown. Paystack checkout activates once the team completes provider onboarding."}
          </p>
        </div>
      </section>
    </SiteShell>
  );
}
