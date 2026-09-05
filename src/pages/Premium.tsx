import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Crown, FileText, Loader2, LockKeyhole, PlayCircle, Search, Sparkles, Unlock } from "lucide-react";
import { SiteShell, PageHero, Seo } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { usePremium } from "@/hooks/use-premium";
import { fetchPastPapers, paperFileName, SUBJECT_OPTIONS, type PastPaper } from "@/lib/past-papers";
import { heroImages } from "@/assets/heroes";
import PremiumTopicLibrary from "@/components/premium-topic-library";

type PremiumSettings = {
  headline: string;
  subheadline: string;
  perks: string[];
  cta_label: string;
};

const DEFAULTS: PremiumSettings = {
  headline: "Premium learning library",
  subheadline:
    "Full mark schemes, examiner-style solutions and topic video lessons — unlocked with a Catch-Up Tutors premium plan.",
  perks: [
    "Every mark scheme, every session, every variant",
    "Topic-by-topic video lessons",
    "Priority tutor support on WhatsApp",
  ],
  cta_label: "Unlock premium",
};

type PremiumVideo = { id: string; title: string; description: string; thumbnail_url: string | null };

export default function Premium() {
  const premium = usePremium();
  const [q, setQ] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["premium-page"],
    queryFn: async () => {
      const [s, allPapers, v] = await Promise.all([
        supabase.from("settings").select("value").eq("key", "premium_content").maybeSingle(),
        fetchPastPapers().catch(() => [] as PastPaper[]),
        supabase
          .from("videos")
          .select("id, title, description, thumbnail_url")
          .eq("access_level", "premium")
          .eq("is_published", true)
          .limit(24),
      ]);
      const val = (s.data?.value ?? {}) as Partial<PremiumSettings>;
      return {
        settings: {
          headline: val.headline || DEFAULTS.headline,
          subheadline: val.subheadline || DEFAULTS.subheadline,
          perks: val.perks?.length ? val.perks : DEFAULTS.perks,
          cta_label: val.cta_label || DEFAULTS.cta_label,
        } satisfies PremiumSettings,
        papers: allPapers.filter((p) => p.access_level === "premium" && p.is_published),
        videos: (v.data ?? []) as PremiumVideo[],
      };
    },
  });

  const settings = data?.settings ?? DEFAULTS;
  const papers = data?.papers ?? [];
  const videos = data?.videos ?? [];
  const loading = isLoading;

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return papers;
    return papers.filter((p) =>
      [p.title ?? "", p.subject_key, String(p.year), p.session, p.paper_number].join(" ").toLowerCase().includes(term),
    );
  }, [papers, q]);

  const subjectLabel = (key: string) => SUBJECT_OPTIONS.find((s) => s.id === key)?.label ?? key;
  const unlocked = premium.isPremium;


  return (
    <SiteShell>
      <Seo
        title="Premium Resources | CatchUp Tutors"
        description="Browse the CatchUp Tutors premium library — mark schemes, solutions and video lessons. Subscribe to unlock instant access."
      />
      <PageHero
        image={heroImages.premium}
        eyebrow="Premium"
        title={settings.headline}
        description={settings.subheadline}
      />

      <div className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        {/* Status / CTA banner */}
        <div className="-mt-8 rounded-2xl border bg-card p-5 shadow-soft sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${unlocked ? "bg-brand-green/10 text-brand-green" : "bg-brand-orange/10 text-brand-orange"}`}>
              {unlocked ? <Unlock /> : <Crown />}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-lg font-bold sm:text-xl">
                {unlocked ? "Your premium access is active" : "These resources are locked"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {unlocked
                  ? "Open any item below — downloads and viewers are fully unlocked for you."
                  : "Preview everything in the library below. Subscribe to open the files instantly."}
              </p>
            </div>
            {!unlocked && (
              <Button asChild size="lg" className="w-full sm:w-auto sm:shrink-0">
                <Link to="/pricing"><Sparkles /> {settings.cta_label}</Link>
              </Button>
            )}
          </div>
          <ul className="mt-5 grid gap-2 sm:grid-cols-3">
            {settings.perks.map((perk) => (
              <li key={perk} className="flex items-start gap-2 rounded-xl border bg-muted/30 p-3 text-sm">
                <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" /> <span className="min-w-0 break-words">{perk}</span>
              </li>
            ))}
          </ul>
        </div>


        <PremiumTopicLibrary unlocked={unlocked} ctaLabel={settings.cta_label} />

        {/* Search */}
        <div className="mt-10 flex flex-wrap items-center gap-3">
          <h2 className="font-display text-xl font-bold sm:text-2xl">Premium past papers</h2>
          <Badge variant="secondary">{filtered.length}</Badge>
          <div className="relative w-full sm:ml-auto sm:w-auto sm:max-w-xs sm:flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search subject, year, session…" className="pl-9" />
          </div>
        </div>

        {loading ? (
          <div className="flex h-40 items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <p className="mt-6 rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
            No premium papers published yet — check back soon.
          </p>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <article key={p.id} className="flex flex-col overflow-hidden rounded-2xl border bg-card p-4 transition hover:-translate-y-0.5 hover:shadow-soft sm:p-5">
                <div className="flex items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><FileText className="size-5" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-primary break-words">{subjectLabel(p.subject_key)}</p>
                    <h3 className="break-words font-display text-base font-bold leading-snug" title={p.title ?? paperFileName(p)}>
                      {p.title ?? paperFileName(p)}
                    </h3>
                    <p className="mt-0.5 break-words text-xs text-muted-foreground">{p.year} · {p.session} · Paper {p.paper_number}</p>
                  </div>
                </div>
                <div className="mt-4">
                  {unlocked ? (
                    <Button asChild size="sm" variant="outline" className="h-auto w-full whitespace-normal py-2 text-center">
                      <a href={p.file_url} target="_blank" rel="noopener"><Unlock className="size-4 shrink-0" /> Open resource</a>
                    </Button>
                  ) : (
                    <Button asChild size="sm" variant="outline" className="h-auto w-full whitespace-normal py-2 text-center">
                      <Link to="/pricing"><LockKeyhole className="size-4 shrink-0" /> Locked · {settings.cta_label}</Link>
                    </Button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}


        {videos.length > 0 && (
          <>
            <h2 className="mt-14 font-display text-xl font-bold sm:text-2xl">Premium video lessons</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {videos.map((v) => (
                <article key={v.id} className="flex flex-col overflow-hidden rounded-2xl border bg-card">
                  <div className="relative aspect-video bg-muted">
                    {v.thumbnail_url && <img src={v.thumbnail_url} alt={v.title} loading="lazy" className="h-full w-full object-cover" />}
                    {!unlocked && (
                      <div className="absolute inset-0 grid place-items-center bg-brand-navy/60 text-hero-foreground">
                        <LockKeyhole className="size-8" />
                      </div>
                    )}
                    {unlocked && <PlayCircle className="absolute inset-0 m-auto size-10 text-primary" />}
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <h3 className="break-words font-display text-base font-bold leading-snug">{v.title}</h3>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{v.description}</p>
                    {!unlocked && (
                      <Button asChild size="sm" variant="outline" className="mt-3 h-auto w-full whitespace-normal py-2">
                        <Link to="/pricing"><LockKeyhole className="size-4 shrink-0" /> {settings.cta_label}</Link>
                      </Button>
                    )}
                  </div>

                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </SiteShell>
  );
}
