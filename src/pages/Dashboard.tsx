import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { BookOpen, CalendarCheck, Clock3, Crown, GraduationCap, LogOut, PlayCircle, Settings2, UserRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const navigate = useNavigate();
  const [name, setName] = useState("Student");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { navigate("/auth", { replace: true }); return; }
      setName(String(data.user.user_metadata.full_name || data.user.email || "Student"));
      const { data: role } = await supabase.rpc("has_role", { _user_id: data.user.id, _role: "admin" });
      if (role) { navigate("/admin", { replace: true }); return; }
      setIsAdmin(!!role);
    });
  }, [navigate]);

  async function logout() {
    await supabase.auth.signOut();
    navigate("/auth", { replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Student Dashboard | CatchUp Tutors</title>
        <meta name="description" content="Your CatchUp Tutors learning dashboard — sessions, progress, and resources." />
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <header className="border-b bg-card">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2 font-display font-bold"><GraduationCap className="text-primary" /> CatchUp Tutors</Link>
          <div className="flex items-center gap-2">
            {isAdmin && <Button asChild variant="outline"><Link to="/admin"><Settings2 /> Admin</Link></Button>}
            <Button variant="ghost" onClick={logout}><LogOut /> Sign out</Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <p className="text-sm font-bold uppercase tracking-widest text-primary">Student dashboard</p>
        <h1 className="mt-2 font-display text-4xl font-bold">Welcome back, {name.split(" ")[0]}.</h1>
        <div className="mt-10 grid gap-5 md:grid-cols-4">
          {[[CalendarCheck, "0", "Upcoming sessions"], [Crown, "Free", "Current plan"], [BookOpen, "0", "Saved resources"], [Clock3, "0h", "Learning this week"]].map(([Icon, value, label]) => {
            const I = Icon as typeof CalendarCheck;
            return <article key={String(label)} className="rounded-2xl border bg-card p-5 shadow-soft"><I className="text-primary" /><p className="mt-5 font-display text-3xl font-bold">{String(value)}</p><p className="text-sm text-muted-foreground">{String(label)}</p></article>;
          })}
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_.6fr]">
          <section className="rounded-3xl border bg-card p-7">
            <div className="flex items-center justify-between"><h2 className="font-display text-xl font-bold">Continue learning</h2><Button asChild variant="link"><Link to="/resources">Browse library</Link></Button></div>
            <div className="mt-8 rounded-2xl border border-dashed p-10 text-center">
              <PlayCircle className="mx-auto h-10 w-10 text-muted-foreground" />
              <h3 className="mt-4 font-semibold">Your recent topics will appear here</h3>
              <p className="mt-2 text-sm text-muted-foreground">Open a topic or lesson to start tracking progress.</p>
            </div>
          </section>
          <aside className="rounded-3xl bg-brand-navy p-7 text-hero-foreground">
            <Crown className="text-brand-orange" />
            <h2 className="mt-5 font-display text-2xl font-bold">Go deeper with Premium</h2>
            <p className="mt-3 text-sm leading-6 text-hero-foreground/65">Unlock full video lessons, worked examples, and premium resources.</p>
            <Button asChild variant="hero" className="mt-6 w-full"><Link to="/pricing">View plans</Link></Button>
          </aside>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {[[UserRound, "Profile overview"], [CalendarCheck, "Booking history"], [BookOpen, "Downloads & saved resources"]].map(([Icon, label]) => {
            const I = Icon as typeof UserRound;
            return <div key={String(label)} className="flex items-center gap-4 rounded-2xl border bg-card p-5"><I className="text-primary" /><span className="font-semibold">{String(label)}</span></div>;
          })}
        </div>
      </main>
    </div>
  );
}
