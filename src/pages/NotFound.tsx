import { Link } from "react-router-dom";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <SiteShell>
      <section className="mx-auto max-w-2xl px-4 py-32 text-center sm:px-6 lg:px-8">
        <p className="text-sm font-bold uppercase tracking-widest text-primary">404</p>
        <h1 className="mt-3 font-display text-5xl font-bold">Page not found</h1>
        <p className="mt-4 text-muted-foreground">The page you're looking for doesn't exist or has been moved.</p>
        <Button asChild className="mt-8" size="lg"><Link to="/">Go home</Link></Button>
      </section>
    </SiteShell>
  );
}
