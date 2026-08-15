import { BookOpen, CheckCircle2, Facebook, HelpCircle, Instagram, LockKeyhole, Mail, MapPin, MessageCircle, ShieldCheck, Youtube } from "lucide-react";
import { SiteShell, PageHero } from "./site-shell";
import { Button } from "./ui/button";

type PageKind = "about" | "testimonials" | "contact" | "faq" | "privacy" | "terms";

const pageCopy: Record<PageKind, { eyebrow: string; title: string; description: string }> = {
  about: { eyebrow: "Our story", title: "Built to turn learning gaps into lasting confidence.", description: "CatchUp Tutors combines expert teaching, deliberate practice, and modern learning tools to help every student make measurable progress." },
  testimonials: { eyebrow: "Student outcomes", title: "Progress students can feel—and results they can measure.", description: "Stories from learners who strengthened their foundations, improved exam technique, and moved ahead with confidence." },
  contact: { eyebrow: "Talk to our team", title: "Let’s build your next academic breakthrough.", description: "Ask about programs, resources, subscriptions, or finding the right Mathematics tutor." },
  faq: { eyebrow: "Help center", title: "Clear answers for confident learning.", description: "Everything you need to know about resources, tutoring, premium access, and the CatchUp learning experience." },
  privacy: { eyebrow: "Your privacy", title: "Your learning data deserves thoughtful protection.", description: "This policy explains how CatchUp Tutors handles account, booking, learning, and payment information." },
  terms: { eyebrow: "Platform terms", title: "Fair terms for a trusted academic community.", description: "These terms set expectations for learners, tutors, guardians, and platform administrators." },
};

export function ContentPage({ kind }: { kind: PageKind }) {
  const copy = pageCopy[kind];
  return <SiteShell><PageHero {...copy} /><section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">{renderContent(kind)}</section></SiteShell>;
}

function renderContent(kind: PageKind) {
  if (kind === "about") return <div className="space-y-16">
    <div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr]">
      <div className="rounded-3xl bg-primary/10 p-8">
        <div className="flex aspect-square items-center justify-center rounded-2xl border border-primary/20 bg-background text-center text-muted-foreground">
          <div className="px-6"><div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-primary/15 font-display text-2xl font-bold text-primary">AT</div>Founder photo<br /><span className="text-xs">(upload from Admin Dashboard)</span></div>
        </div>
      </div>
      <div>
        <p className="text-sm font-bold uppercase tracking-widest text-primary">Ahmed Thaoban · Founder</p>
        <h2 className="mt-3 font-display text-3xl font-bold">Teaching that meets students where they are—and takes them further.</h2>
        <p className="mt-5 leading-7 text-muted-foreground">CatchUp Tutors was founded by Ahmed Thaoban to make high-quality Mathematics learning personal, structured, and accessible for Cambridge and IGCSE students. Full founder biography and journey content are editable from the Admin Dashboard as the story grows.</p>
        {["Make complex ideas feel clear", "Connect practice to exam performance", "Build confidence through measurable progress"].map((x) => <div key={x} className="mt-5 flex gap-3"><CheckCircle2 className="mt-0.5 text-brand-green" /><span>{x}</span></div>)}
      </div>
    </div>
    <div className="rounded-3xl border bg-card p-8">
      <h2 className="font-display text-2xl font-bold">Contact & Community</h2>
      <p className="mt-2 text-muted-foreground">Reach the CatchUp team directly or follow our learning community.</p>
      <div className="mt-7 grid gap-5 md:grid-cols-2">
        <Info icon={Mail} title="Contact email" text="Catchuptutors01@gmail.com" href="mailto:Catchuptutors01@gmail.com" />
        <Info icon={Mail} title="Support email" text="support@catchuptutors.com" href="mailto:support@catchuptutors.com" />
        <Info icon={MessageCircle} title="WhatsApp bookings" text="+234 810 180 4411" href="https://wa.me/2348101804411" />
        <Info icon={MapPin} title="Locations" text="Nigeria · United Kingdom" />
      </div>
      <div className="mt-7 flex flex-wrap items-center gap-4">
        <span className="text-sm font-semibold">Follow us:</span>
        <a href="https://www.instagram.com/tutors.catchup?igsh=MXB4cmgzdGVucjM0aw==" target="_blank" rel="noopener" aria-label="Instagram" className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground"><Instagram className="size-5"/></a>
        <a href="https://www.facebook.com/share/1BTRMp9BPw/" target="_blank" rel="noopener" aria-label="Facebook" className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground"><Facebook className="size-5"/></a>
        <a href="https://youtube.com/@catch-uptutors2691?si=9YKS7NsmOUOdU96f" target="_blank" rel="noopener" aria-label="YouTube" className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground"><Youtube className="size-5"/></a>
      </div>
    </div>
  </div>;
  if (kind === "testimonials") return <div className="grid gap-6 md:grid-cols-2">{TESTIMONIALS.map((t) => <article key={t.name} className="flex flex-col rounded-3xl border bg-card p-7 shadow-soft"><div className="flex items-center gap-4">{t.image && <img src={t.image} alt={`Portrait of ${t.name}`} loading="lazy" className="size-16 shrink-0 rounded-2xl object-cover" />}<div className="min-w-0"><p className="font-display font-bold">{t.name}</p><p className="text-sm text-muted-foreground">{t.role}</p></div></div><div className="mt-4 text-brand-orange">★★★★★</div><blockquote className="mt-3 leading-7 text-muted-foreground">“{t.quote}”</blockquote></article>)}</div>;
  if (kind === "contact") return <div className="grid gap-10 lg:grid-cols-2"><form className="rounded-3xl border bg-card p-7 shadow-soft" onSubmit={(e) => e.preventDefault()}><div className="grid gap-5"><label className="grid gap-2 text-sm font-semibold">Full name<input required maxLength={100} className="h-12 rounded-xl border bg-background px-4" /></label><label className="grid gap-2 text-sm font-semibold">Email<input required type="email" maxLength={255} className="h-12 rounded-xl border bg-background px-4" /></label><label className="grid gap-2 text-sm font-semibold">How can we help?<textarea required maxLength={2000} rows={6} className="rounded-xl border bg-background p-4" /></label><Button type="submit" size="lg">Send message</Button></div></form><div className="space-y-5"><Info icon={Mail} title="Email" text="Catchuptutors01@gmail.com"/><Info icon={MessageCircle} title="WhatsApp" text="+234 810 180 4411"/><Info icon={MapPin} title="Locations" text="Nigeria · United Kingdom"/></div></div>;
  if (kind === "faq") return <div className="mx-auto max-w-3xl space-y-4">{[["What can I access for free?","Selected lesson videos, tutor discovery, and selected past-question resources."],["How does premium access work?","An active monthly, quarterly, or annual subscription unlocks premium video lessons and resources."],["Are tutoring sessions included?","No. One-to-one sessions are priced separately by each approved tutor."],["How are tutors approved?","Applications, qualifications, identity details, and teaching information are reviewed before profiles become public."]].map(([q,a]) => <details key={q} className="rounded-2xl border bg-card p-5"><summary className="cursor-pointer font-display font-semibold">{q}</summary><p className="mt-3 text-muted-foreground">{a}</p></details>)}</div>;
  const isPrivacy = kind === "privacy";
  return <article className="prose mx-auto max-w-3xl"><div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">{isPrivacy ? <ShieldCheck /> : <BookOpen />}</div><h2 className="font-display text-3xl font-bold">{isPrivacy ? "Information we handle" : "Using CatchUp Tutors"}</h2><p className="mt-4 leading-7 text-muted-foreground">{isPrivacy ? "We process account, profile, learning activity, booking, communication, and payment records only to provide and improve the platform. Access is limited by role and purpose." : "Use the platform respectfully, provide accurate information, protect your account, and do not redistribute protected learning materials. Tutor sessions and subscriptions have separate pricing."}</p><h2 className="mt-10 font-display text-2xl font-bold">Your choices and responsibilities</h2><p className="mt-4 leading-7 text-muted-foreground">Contact support to ask questions, correct account details, or request help. Specific legal wording and effective dates can be updated by the administrator before launch.</p></article>;
}

function Info({ icon: Icon, title, text, href }: { icon: typeof HelpCircle; title: string; text: string; href?: string }) { const content = <div className="flex gap-4 rounded-2xl border bg-card p-5 transition hover:border-primary/40"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon /></div><div><p className="font-semibold">{title}</p><p className="text-muted-foreground">{text}</p></div></div>; return href ? <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener">{content}</a> : content; }