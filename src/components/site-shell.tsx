import { Link, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Menu, X, GraduationCap, Instagram, Facebook, Youtube } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/catchup-logo.png.asset.json";

const navigation = [
  ["Programs", "/programs"], ["Resources", "/resources"], ["Tutors", "/tutors"],
  ["Pricing", "/pricing"], ["About", "/about"], ["Testimonials", "/testimonials"],
] as const;

export function SiteShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  return <div className="min-h-screen bg-background text-foreground">
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" aria-label="CatchUp Tutors home"><img src={logo.url} alt="CatchUp Tutors" className="h-14 w-auto" /></Link>
        <nav aria-label="Main navigation" className="hidden items-center gap-1 lg:flex">
          {navigation.map(([label, to]) => <Link key={to} to={to} className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${pathname === to ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}>{label}</Link>)}
        </nav>
        <div className="hidden items-center gap-2 lg:flex"><Button asChild variant="ghost"><Link to="/auth">Sign in</Link></Button><Button asChild><Link to="/dashboard">Dashboard</Link></Button></div>
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen((value) => !value)} aria-label="Toggle navigation">{open ? <X /> : <Menu />}</Button>
      </div>
      {open && <nav className="border-t bg-background p-4 lg:hidden">{navigation.map(([label, to]) => <Link key={to} to={to} onClick={() => setOpen(false)} className="block rounded-lg px-4 py-3 font-medium hover:bg-muted">{label}</Link>)}<div className="mt-3 grid grid-cols-2 gap-2"><Button asChild variant="outline"><Link to="/auth">Sign in</Link></Button><Button asChild><Link to="/dashboard">Dashboard</Link></Button></div></nav>}
    </header>
    <main>{children}</main>
    <footer className="bg-brand-navy text-hero-foreground">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4 lg:px-8">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 font-display text-xl font-bold"><GraduationCap className="text-brand-orange" /> CatchUp Tutors</div>
          <p className="mt-4 max-w-md text-sm leading-6 text-hero-foreground/70">Personalized Cambridge and IGCSE learning for students ready to catch up, build confidence, and stay ahead.</p>
          <div className="mt-5 space-y-2 text-sm text-hero-foreground/75">
            <p>📧 <a href="mailto:Catchuptutors01@gmail.com" className="hover:text-brand-orange">Catchuptutors01@gmail.com</a></p>
            <p>🛟 <a href="mailto:support@catchuptutors.com" className="hover:text-brand-orange">support@catchuptutors.com</a></p>
            <p>💬 <a href="https://wa.me/2348101804411" target="_blank" rel="noopener" className="hover:text-brand-orange">WhatsApp: +234 810 180 4411</a></p>
            <p>📍 Nigeria · United Kingdom</p>
          </div>
        </div>
        <div><h2 className="font-display font-semibold">Explore</h2><div className="mt-4 grid gap-2 text-sm text-hero-foreground/70"><Link to="/programs">Programs</Link><Link to="/resources">Resources</Link><Link to="/tutors">Tutors</Link><Link to="/pricing">Pricing</Link><Link to="/faq">FAQ</Link><Link to="/contact">Contact</Link><Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link></div></div>
        <div>
          <h2 className="font-display font-semibold">Follow</h2>
          <div className="mt-4 flex gap-3">
            <a href="https://www.instagram.com/tutors.catchup?igsh=MXB4cmgzdGVucjM0aw==" target="_blank" rel="noopener" aria-label="Instagram" className="hover:text-brand-orange"><Instagram /></a>
            <a href="https://www.facebook.com/share/1BTRMp9BPw/" target="_blank" rel="noopener" aria-label="Facebook" className="hover:text-brand-orange"><Facebook /></a>
            <a href="https://youtube.com/@catch-uptutors2691?si=9YKS7NsmOUOdU96f" target="_blank" rel="noopener" aria-label="YouTube" className="hover:text-brand-orange"><Youtube /></a>
          </div>
          <p className="mt-6 text-xs text-hero-foreground/55">Catch Up. Stay Ahead.</p>
        </div>
      </div>
      <div className="border-t border-hero-foreground/10 py-5 text-center text-xs text-hero-foreground/55">© 2026 CatchUp Tutors. All rights reserved.</div>
    </footer>
  </div>;
}

export function PageHero({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children?: ReactNode }) {
  return <section className="bg-hero text-hero-foreground"><div className="hero-grid mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8"><p className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-brand-green">{eyebrow}</p><h1 className="max-w-4xl font-display text-4xl font-bold tracking-tight sm:text-6xl">{title}</h1><p className="mt-6 max-w-2xl text-lg leading-8 text-hero-foreground/75">{description}</p>{children && <div className="mt-8">{children}</div>}</div></section>;
}

export type SeoProps = { title: string; description: string; image?: string; jsonLd?: Record<string, unknown> };
export function Seo({ title, description, image, jsonLd }: SeoProps) {
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {image && <meta property="og:image" content={image} />}
      {jsonLd && <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>}
    </Helmet>
  );
}
