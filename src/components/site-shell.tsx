import { Link, useLocation, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  Menu, X, GraduationCap, Instagram, Facebook, Youtube, Mail, Phone, MapPin, MessageCircle, ArrowUpRight,
  ChevronDown, LayoutDashboard, LogOut, ShieldCheck,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import logoUrl from "@/assets/catchup-logo.png";
import { CONTACT, waLink, waLinkNG } from "@/lib/contact";


const navigation = [
  ["About", "/about"], ["Programs", "/programs"], ["Resources", "/resources"],
  ["Premium Resources", "/premium"], ["Quiz", "/quiz"], ["Tutors", "/tutors"],
  ["Events", "/events"], ["Partnership", "/partnership"], ["Pricing", "/pricing"],
] as const;

const SOCIAL = {
  instagram: { url: "https://www.instagram.com/tutors.catchup?igsh=MXB4cmgzdGVucjM0aw==", handle: "@tutors.catchup" },
  facebook:  { url: "https://www.facebook.com/share/1BTRMp9BPw/", handle: "CatchUp Tutors" },
  youtube:   { url: "https://youtube.com/@catch-uptutors2691?si=9YKS7NsmOUOdU96f", handle: "@catch-uptutors2691" },
} as const;

type NavUser = { id: string; email: string; name: string };

export function SiteShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  // undefined = still resolving, null = signed out
  const [session, setSession] = useState<NavUser | null | undefined>(undefined);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const resolve = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled) return;
      if (!user) { setSession(null); setIsAdmin(false); return; }
      setSession({
        id: user.id,
        email: user.email ?? "",
        name: (user.user_metadata?.full_name as string) ?? user.email?.split("@")[0] ?? "Account",
      });
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
      if (!cancelled) setIsAdmin(!!roles?.some((r) => r.role === "admin"));
    };
    resolve();
    const { data: sub } = supabase.auth.onAuthStateChange(() => resolve());
    return () => { cancelled = true; sub.subscription.unsubscribe(); };
  }, []);

  const displayName = session?.name ?? "";
  const initials = displayName.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase() || "CU";

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setIsAdmin(false);
    navigate("/");
  };

  return (

    <div className="min-h-screen bg-background text-foreground">
      {/* Utility topbar */}
      <div className="hidden bg-brand-navy text-hero-foreground md:block">
        <div className="mx-auto flex h-9 max-w-7xl items-center justify-between px-4 text-[12px] sm:px-6 lg:px-8">
          <div className="flex items-center gap-5 text-hero-foreground/85">
            <a href="mailto:Catchuptutors01@gmail.com" className="inline-flex items-center gap-1.5 transition-colors hover:text-brand-orange focus-visible:outline-none focus-visible:text-brand-orange">
              <Mail className="h-3.5 w-3.5" aria-hidden="true" /> Catchuptutors01@gmail.com
            </a>
            <a href={waLink()} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 font-semibold transition-colors hover:text-brand-orange">
              <Phone className="h-3.5 w-3.5" aria-hidden="true" /> {CONTACT.primary.label} <span className="hidden lg:inline text-hero-foreground/60">(UK)</span>
            </a>
            <a href={waLinkNG()} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 transition-colors hover:text-brand-orange">
              <Phone className="h-3.5 w-3.5" aria-hidden="true" /> {CONTACT.secondary.label} <span className="hidden lg:inline text-hero-foreground/60">(NG)</span>
            </a>
            <span className="inline-flex items-center gap-1.5 text-hero-foreground/70"><MapPin className="h-3.5 w-3.5" aria-hidden="true" /> UK · Nigeria</span>
          </div>
          <div className="flex items-center gap-4">
            <a href={SOCIAL.youtube.url} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 text-hero-foreground/85 transition-colors hover:text-brand-orange focus-visible:outline-none focus-visible:text-brand-orange" aria-label={`YouTube ${SOCIAL.youtube.handle}`}>
              <Youtube className="h-3.5 w-3.5" aria-hidden="true" /> <span className="hidden lg:inline">{SOCIAL.youtube.handle}</span>
            </a>
            <a href={SOCIAL.instagram.url} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 text-hero-foreground/85 transition-colors hover:text-brand-orange" aria-label={`Instagram ${SOCIAL.instagram.handle}`}>
              <Instagram className="h-3.5 w-3.5" aria-hidden="true" /> <span className="hidden lg:inline">{SOCIAL.instagram.handle}</span>
            </a>
            <a href={SOCIAL.facebook.url} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 text-hero-foreground/85 transition-colors hover:text-brand-orange" aria-label={`Facebook ${SOCIAL.facebook.handle}`}>
              <Facebook className="h-3.5 w-3.5" aria-hidden="true" /> <span className="hidden lg:inline">{SOCIAL.facebook.handle}</span>
            </a>
          </div>
        </div>
      </div>

      {/* Primary nav */}
      <header className="sticky top-0 z-50 border-b border-border/70 bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" aria-label="CatchUp Tutors home" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-md">
            <img src={logoUrl} alt="CatchUp Tutors" className="h-14 w-auto" />
          </Link>
          <nav aria-label="Main navigation" className="hidden items-center gap-1 lg:flex">
            {navigation.map(([label, to]) => (
              <Link
                key={to}
                to={to}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${pathname === to ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="hidden items-center gap-2 lg:flex">
            {session === null ? (
              <>
                <Button asChild variant="ghost"><Link to="/auth">Sign in</Link></Button>
                <Button asChild><Link to="/auth?mode=signup">Get started</Link></Button>
              </>
            ) : session ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2">
                    <span className="grid size-7 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {initials}
                    </span>
                    <span className="max-w-[140px] truncate text-sm font-medium">{displayName}</span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-popover">
                  <DropdownMenuLabel className="truncate font-normal text-muted-foreground">{session.email}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild><Link to="/dashboard"><LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard</Link></DropdownMenuItem>
                  {isAdmin && <DropdownMenuItem asChild><Link to="/admin"><ShieldCheck className="mr-2 h-4 w-4" /> Admin</Link></DropdownMenuItem>}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut}><LogOut className="mr-2 h-4 w-4" /> Sign out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen((v) => !v)} aria-label="Toggle navigation" aria-expanded={open}>
            {open ? <X /> : <Menu />}
          </Button>
        </div>
        {open && (
          <nav className="border-t bg-background p-4 lg:hidden" aria-label="Mobile navigation">
            {navigation.map(([label, to]) => (
              <Link key={to} to={to} onClick={() => setOpen(false)} className="block rounded-lg px-4 py-3 font-medium hover:bg-muted">{label}</Link>
            ))}
            <div className="mt-3 grid grid-cols-2 gap-2">
              {session ? (
                <>
                  <Button asChild variant="outline" onClick={() => setOpen(false)}><Link to="/dashboard">Dashboard</Link></Button>
                  {isAdmin && <Button asChild variant="outline" onClick={() => setOpen(false)}><Link to="/admin">Admin</Link></Button>}
                  <Button onClick={() => { setOpen(false); signOut(); }}><LogOut className="h-4 w-4" /> Sign out</Button>
                </>
              ) : (
                <>
                  <Button asChild variant="outline"><Link to="/auth">Sign in</Link></Button>
                  <Button asChild><Link to="/auth?mode=signup">Get started</Link></Button>
                </>
              )}
            </div>

            <div className="mt-4 flex items-center gap-4 border-t pt-4 text-muted-foreground">
              <a href={SOCIAL.instagram.url} aria-label="Instagram" target="_blank" rel="noopener"><Instagram className="h-5 w-5" /></a>
              <a href={SOCIAL.facebook.url} aria-label="Facebook" target="_blank" rel="noopener"><Facebook className="h-5 w-5" /></a>
              <a href={SOCIAL.youtube.url} aria-label="YouTube" target="_blank" rel="noopener"><Youtube className="h-5 w-5" /></a>
            </div>
          </nav>
        )}
      </header>

      <main>{children}</main>

      {/* Footer */}
      <footer className="bg-brand-navy text-hero-foreground">
        <div className="mx-auto max-w-7xl px-4 pt-16 pb-10 sm:px-6 lg:px-8">
          {/* Contact ribbon */}
          <div className="grid gap-6 border-b border-hero-foreground/15 pb-10 md:grid-cols-3">
            <a href="mailto:Catchuptutors01@gmail.com" className="group flex items-start gap-4 rounded-xl p-4 -m-4 transition-colors hover:bg-hero-foreground/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hero-foreground">
              <span className="grid h-11 w-11 place-items-center rounded-lg bg-brand-orange/15 text-brand-orange"><Mail className="h-5 w-5" aria-hidden="true" /></span>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-hero-foreground/60">Email us</p>
                <p className="mt-1 text-sm font-medium">Catchuptutors01@gmail.com</p>
                <p className="text-xs text-hero-foreground/60">We reply within 24 hours</p>
              </div>
            </a>
            <a href={waLink()} target="_blank" rel="noopener" className="group flex items-start gap-4 rounded-xl p-4 -m-4 transition-colors hover:bg-hero-foreground/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hero-foreground">
              <span className="grid h-11 w-11 place-items-center rounded-lg bg-brand-orange/15 text-brand-orange"><MessageCircle className="h-5 w-5" aria-hidden="true" /></span>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-hero-foreground/60">WhatsApp</p>
                <p className="mt-1 text-base font-semibold">{CONTACT.primary.label} <span className="text-hero-foreground/60">(UK · main)</span></p>
                <p className="mt-0.5 text-sm font-medium text-hero-foreground/80">{CONTACT.secondary.label} <span className="text-hero-foreground/60">(NG)</span></p>
                <p className="text-xs text-hero-foreground/60">Bookings & fast replies</p>
              </div>
            </a>
            <div className="flex items-start gap-4">
              <span className="grid h-11 w-11 place-items-center rounded-lg bg-brand-orange/15 text-brand-orange"><MapPin className="h-5 w-5" aria-hidden="true" /></span>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-hero-foreground/60">Where we work</p>
                <p className="mt-1 text-sm font-medium">United Kingdom · Nigeria</p>
                <p className="text-xs text-hero-foreground/60">Online worldwide</p>
              </div>
            </div>
          </div>

          {/* Link grid */}
          <div className="grid gap-10 py-12 md:grid-cols-12">
            <div className="md:col-span-5">
              <Link to="/" className="inline-flex items-center gap-2 font-display text-xl font-bold">
                <GraduationCap className="text-brand-orange" aria-hidden="true" /> CatchUp Tutors
              </Link>
              <p className="mt-4 max-w-md text-sm leading-6 text-hero-foreground/70">
                Personalized Cambridge, IGCSE, SAT and A-Level tutoring for students ready to catch up, build confidence, and stay ahead.
              </p>
              <div className="mt-6 flex items-center gap-3">
                {[
                  { href: SOCIAL.youtube.url,   Icon: Youtube,   label: "YouTube" },
                  { href: SOCIAL.instagram.url, Icon: Instagram, label: "Instagram" },
                  { href: SOCIAL.facebook.url,  Icon: Facebook,  label: "Facebook" },
                ].map(({ href, Icon, label }) => (
                  <a key={label} href={href} target="_blank" rel="noopener" aria-label={label}
                     className="grid h-10 w-10 place-items-center rounded-full border border-hero-foreground/20 text-hero-foreground transition hover:border-brand-orange hover:text-brand-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </a>
                ))}
              </div>
            </div>

            <FooterCol title="Learn" links={[["Programs","/programs"],["Resources","/resources"],["Premium","/premium"],["Tutors","/tutors"],["Pricing","/pricing"]]} />
            <FooterCol title="Company" links={[["About","/about"],["Events","/events"],["Testimonials","/testimonials"],["FAQ","/faq"]]} />
            <FooterCol title="Support" links={[["Contact","/contact"],["Sign in","/auth"],["Privacy","/privacy"],["Terms","/terms"]]} />
          </div>

          <div className="flex flex-col items-start justify-between gap-3 border-t border-hero-foreground/15 pt-6 text-xs text-hero-foreground/60 sm:flex-row sm:items-center">
            <p>© {new Date().getFullYear()} CatchUp Tutors. All rights reserved.</p>
            <p className="italic">Catch Up. Stay Ahead.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div className="md:col-span-2">
      <h2 className="font-display text-sm font-semibold tracking-wide">{title}</h2>
      <ul className="mt-4 space-y-2.5 text-sm">
        {links.map(([label, to]) => (
          <li key={to}>
            <Link to={to} className="inline-flex items-center gap-1 text-hero-foreground/70 transition-colors hover:text-brand-orange focus-visible:outline-none focus-visible:text-brand-orange">
              {label} <ArrowUpRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PageHero({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children?: ReactNode }) {
  return (
    <section className="bg-hero text-hero-foreground">
      <div className="hero-grid mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <p className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-brand-orange">{eyebrow}</p>
        <h1 className="max-w-4xl font-display text-4xl font-bold tracking-tight sm:text-6xl">{title}</h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-hero-foreground/80">{description}</p>
        {children && <div className="mt-8">{children}</div>}
      </div>
    </section>
  );
}

export type SeoProps = { title: string; description: string; image?: string; path?: string; noindex?: boolean; jsonLd?: Record<string, unknown> | Record<string, unknown>[] };
export function Seo({ title, description, image, path, noindex, jsonLd }: SeoProps) {
  const url = path ?? (typeof window !== "undefined" ? window.location.pathname : undefined);
  const blocks = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      {url && <meta property="og:url" content={url} />}
      {url && <link rel="canonical" href={url} />}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {image && <meta property="og:image" content={image} />}
      {image && <meta name="twitter:image" content={image} />}
      {noindex && <meta name="robots" content="noindex,nofollow" />}
      {blocks.map((b, i) => (
        <script key={`ld-${i}`} type="application/ld+json">{JSON.stringify(b)}</script>
      ))}
    </Helmet>
  );
}
