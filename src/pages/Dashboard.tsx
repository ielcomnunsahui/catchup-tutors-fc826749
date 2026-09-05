import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import {
  BookOpen, CalendarCheck, Clock3, Crown, Flame, GraduationCap, LogOut, PlayCircle, Settings2,
  Sparkles, Video, FileText, TrendingUp, ArrowRight, ChevronRight, Bookmark, Award, Bell, Users,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { StudentAttendance, TutorAttendance } from "@/components/attendance-panel";
import ErrorBoundary from "@/components/error-boundary";
import { KpiSkeleton, ListSkeleton } from "@/components/skeletons";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type Booking = {
  id: string; preferred_start: string; duration_minutes: number; status: string;
  session_type: string; meeting_url: string | null; student_notes: string | null;
};
type TutorStudent = {
  id: string; ref_code: string | null; student_name: string | null; programme: string | null;
  available_days: string[] | null; available_times: string | null; preferred_start: string; status: string;
};
type ActivityRow = {
  id: string; activity_type: string; progress: number | null; last_viewed_at: string | null;
  resource_id: string | null; video_id: string | null; topic_id: string | null;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [name, setName] = useState("Student");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activity, setActivity] = useState<ActivityRow[]>([]);
  const [savedCount, setSavedCount] = useState(0);
  const [minutesThisWeek, setMinutesThisWeek] = useState(0);
  const [tutorStudents, setTutorStudents] = useState<TutorStudent[]>([]);
  const [isTutor, setIsTutor] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [tutorId, setTutorId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) { navigate("/auth", { replace: true }); return; }
      const u = data.user;
      setUserId(u.id);
      setName(String(u.user_metadata.full_name || u.email || "Student"));
      const { data: role } = await supabase.rpc("has_role", { _user_id: u.id, _role: "admin" });
      if (role) { navigate("/admin", { replace: true }); return; }
      setIsAdmin(!!role);

      const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString();
      const [bk, act, saved, tp] = await Promise.all([
        supabase.from("bookings").select("*").eq("student_id", u.id).order("preferred_start", { ascending: true }).limit(20),
        supabase.from("learning_activity").select("*").eq("user_id", u.id).order("last_viewed_at", { ascending: false, nullsFirst: false }).limit(6),
        supabase.from("saved_resources").select("*", { count: "exact", head: true }).eq("user_id", u.id),
        supabase.from("tutor_profiles").select("id,is_approved").eq("user_id", u.id).maybeSingle(),
      ]);
      setBookings((bk.data ?? []) as Booking[]);
      setActivity((act.data ?? []) as ActivityRow[]);
      setSavedCount(saved.count ?? 0);

      if (tp.data?.id && tp.data.is_approved) {
        setIsTutor(true);
        setTutorId(tp.data.id);
        // Only students whose booking the admin has accepted (confirmed/completed) are visible,
        // and only name / programme / availability are selected.
        const { data: st } = await supabase
          .from("bookings")
          .select("id,ref_code,student_name,programme,available_days,available_times,preferred_start,status")
          .eq("tutor_id", tp.data.id)
          .in("status", ["confirmed", "completed"])
          .order("preferred_start", { ascending: true });
        setTutorStudents((st ?? []) as TutorStudent[]);
      }

      const weekAct = (act.data ?? []).filter((a: ActivityRow) => a.last_viewed_at && a.last_viewed_at >= weekAgo);
      setMinutesThisWeek(weekAct.length * 25); // rough estimate: 25 min per session
      setLoading(false);
    })();
  }, [navigate]);


  async function logout() {
    await supabase.auth.signOut();
    navigate("/auth", { replace: true });
  }

  const upcoming = useMemo(() => {
    const now = Date.now();
    return bookings.filter((b) => new Date(b.preferred_start).getTime() >= now && b.status !== "cancelled").slice(0, 4);
  }, [bookings]);
  const upcomingCount = upcoming.length;
  const avgProgress = useMemo(() => {
    if (!activity.length) return 0;
    return Math.round(activity.reduce((s, a) => s + Number(a.progress ?? 0), 0) / activity.length);
  }, [activity]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/40 to-background">
      <Helmet>
        <title>Student Dashboard | CatchUp Tutors</title>
        <meta name="description" content="Your CatchUp Tutors learning dashboard — sessions, progress, and resources." />
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      <header className="border-b bg-card/80 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2 font-display font-bold">
            <GraduationCap className="text-primary" /> CatchUp Tutors
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" aria-label="Notifications"><Bell className="h-5 w-5" /></Button>
            {isAdmin && <Button asChild variant="outline"><Link to="/admin"><Settings2 /> Admin</Link></Button>}
            <Button variant="ghost" onClick={logout}><LogOut /> Sign out</Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Greeting hero */}
        <section className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-brand-navy via-brand-navy to-[#000E2E] p-8 text-hero-foreground shadow-lift sm:p-10">
          <div className="absolute -right-10 -top-10 h-56 w-56 rounded-full bg-[#FF6B12]/25 blur-3xl" aria-hidden />
          <div className="absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-primary/25 blur-3xl" aria-hidden />
          <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#FF6B12]">
                <Sparkles className="mr-1 inline h-3.5 w-3.5" /> Learner dashboard
              </p>
              <h1 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">
                Welcome back, {name.split(" ")[0]}.
              </h1>
              <p className="mt-3 max-w-lg text-sm text-hero-foreground/70 sm:text-base">
                {upcomingCount > 0
                  ? `You have ${upcomingCount} upcoming session${upcomingCount > 1 ? "s" : ""}. Keep the momentum going.`
                  : "No sessions booked yet — pick a program and start learning."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="hero" size="lg"><Link to="/programs">Book a session <ArrowRight /></Link></Button>
              <Button asChild variant="outline" size="lg" className="border-hero-foreground/25 bg-hero-foreground/5 text-hero-foreground hover:bg-hero-foreground/10">
                <Link to="/resources">Browse resources</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* KPI cards */}
        {loading ? (
          <section aria-label="Overview" className="mt-8"><KpiSkeleton /></section>
        ) : (
        <section aria-label="Overview" className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard icon={CalendarCheck} tone="primary" value={upcomingCount} label="Upcoming sessions" hint={upcomingCount ? "Next: " + new Date(upcoming[0].preferred_start).toLocaleDateString() : "None booked"} tip="Confirmed and pending bookings still ahead of today" />
          <KpiCard icon={Clock3} tone="orange" value={`${Math.round(minutesThisWeek / 60 * 10) / 10}h`} label="Learning this week" hint="Across all subjects" tip="Estimated study time from the resources you opened this week" />
          <KpiCard icon={Bookmark} tone="green" value={savedCount} label="Saved resources" hint="Ready to revisit" tip="Items you bookmarked in the library" />
          <KpiCard icon={TrendingUp} tone="navy" value={`${avgProgress}%`} label="Avg. topic progress" progress={avgProgress} tip="Average completion across everything you've opened recently" />
        </section>
        )}

        {/* Main grid */}
        <div className="mt-8 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          {/* Left column */}
          <div className="space-y-6">
            {/* Upcoming bookings */}
            <section className="rounded-3xl border bg-card p-6 shadow-soft sm:p-7">
              <SectionHead
                title="Upcoming sessions"
                subtitle="Your next tutor bookings"
                cta={<Button asChild variant="ghost" size="sm"><Link to="/programs">Book new <ChevronRight className="h-4 w-4" /></Link></Button>}
              />
              {loading ? (
                <ListSkeleton rows={3} className="mt-6" />
              ) : upcoming.length === 0 ? (
                <EmptyState icon={CalendarCheck} title="No upcoming sessions" body="When a booking is confirmed it will appear here with a join link." ctaText="Explore programs" ctaTo="/programs" />
              ) : (
                <ul className="mt-5 divide-y">
                  {upcoming.map((b) => {
                    const dt = new Date(b.preferred_start);
                    return (
                      <li key={b.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-4">
                          <div className="flex h-12 w-12 flex-col items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <span className="text-[10px] font-bold uppercase">{dt.toLocaleString(undefined, { month: "short" })}</span>
                            <span className="text-lg font-bold leading-none">{dt.getDate()}</span>
                          </div>
                          <div>
                            <p className="font-semibold capitalize">{b.session_type.replace(/_/g, " ")} session</p>
                            <p className="text-xs text-muted-foreground">
                              {dt.toLocaleString(undefined, { hour: "numeric", minute: "2-digit" })} · {b.duration_minutes} min
                            </p>
                            {b.student_notes && <p className="mt-1 line-clamp-1 max-w-md text-xs text-muted-foreground">"{b.student_notes}"</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusChip status={b.status} />
                          {b.meeting_url && (
                            <Button asChild size="sm"><a href={b.meeting_url} target="_blank" rel="noopener">Join <ArrowRight /></a></Button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            {/* Attendance */}
            <ErrorBoundary title="Attendance could not load" compact><StudentAttendance userId={userId} /></ErrorBoundary>
            {isTutor && <ErrorBoundary title="Attendance could not load" compact><TutorAttendance tutorId={tutorId} /></ErrorBoundary>}

            {/* Tutor view: accepted students */}
            {isTutor && (
              <section className="rounded-3xl border bg-card p-6 shadow-soft sm:p-7">
                <SectionHead title="Your students" subtitle="Students whose bookings the admin has accepted" />
                {tutorStudents.length === 0 ? (
                  <div className="mt-5 rounded-2xl border border-dashed bg-background/30 p-10 text-center">
                    <Users className="mx-auto h-9 w-9 text-muted-foreground" />
                    <h3 className="mt-3 font-semibold">No accepted students yet</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Once admin confirms a booking, the student appears here.</p>
                  </div>
                ) : (
                  <ul className="mt-5 divide-y">
                    {tutorStudents.map((s) => (
                      <li key={s.id} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="font-semibold">{s.student_name ?? "Student"}</p>
                          <p className="text-xs text-muted-foreground">{s.programme ?? "Programme not specified"}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Available: {(s.available_days?.length ? s.available_days.join(", ") : "Not specified")}
                            {s.available_times ? ` · ${s.available_times}` : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {s.ref_code && <span className="font-mono text-[11px] text-muted-foreground">{s.ref_code}</span>}
                          <StatusChip status={s.status} />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}



            {/* Continue learning */}
            <section className="rounded-3xl border bg-card p-6 shadow-soft sm:p-7">
              <SectionHead
                title="Continue learning"
                subtitle="Pick up where you left off"
                cta={<Button asChild variant="ghost" size="sm"><Link to="/resources">Library <ChevronRight className="h-4 w-4" /></Link></Button>}
              />
              {loading ? (
                <ListSkeleton rows={4} className="mt-6" />
              ) : activity.length === 0 ? (
                <EmptyState icon={PlayCircle} title="Nothing in progress" body="Open a topic, video or resource to start tracking progress." ctaText="Browse library" ctaTo="/resources" />
              ) : (
                <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                  {activity.map((a) => (
                    <li key={a.id}>
                      <Link
                        to={a.video_id ? "/resources?tab=videos" : "/resources"}
                        className="group flex items-center gap-3 rounded-2xl border bg-background/40 p-3 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/5"
                      >
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          {a.video_id ? <Video className="h-5 w-5" /> : a.resource_id ? <FileText className="h-5 w-5" /> : <BookOpen className="h-5 w-5" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold capitalize">{a.activity_type.replace(/_/g, " ")}</p>
                          <div className="mt-1.5 flex items-center gap-2">
                            <Progress value={Number(a.progress ?? 0)} className="h-1.5 flex-1" />
                            <span className="text-[11px] font-semibold text-muted-foreground">{Math.round(Number(a.progress ?? 0))}%</span>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          {/* Right column */}
          <aside className="space-y-6">
            {/* Premium */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#FF6B12] to-[#FF9450] p-6 text-white shadow-lift">
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/15 blur-2xl" aria-hidden />
              <Crown className="h-8 w-8" />
              <h2 className="mt-4 font-display text-2xl font-bold">Unlock Premium</h2>
              <p className="mt-2 text-sm text-white/85">Full video lessons, worked examples, and priority tutor bookings.</p>
              <Button asChild variant="outline" className="mt-5 w-full border-white/40 bg-white/10 text-white hover:bg-white/20">
                <Link to="/pricing">View plans <ArrowRight /></Link>
              </Button>
            </div>

            {/* Quick access */}
            <div className="rounded-3xl border bg-card p-6 shadow-soft">
              <h2 className="font-display text-lg font-bold">Quick access</h2>
              <div className="mt-4 grid gap-2">
                {[
                  { icon: FileText, label: "Past questions & notes", to: "/resources" },
                  { icon: Video, label: "Video lessons", to: "/resources?tab=videos" },
                  { icon: GraduationCap, label: "Programs & subjects", to: "/programs" },
                  { icon: Award, label: "Testimonials & awards", to: "/testimonials" },
                ].map(({ icon: Icon, label, to }) => (
                  <Link key={to} to={to} className="group flex items-center justify-between rounded-xl border bg-background/40 px-4 py-3 text-sm font-semibold transition hover:border-primary/40 hover:bg-primary/5">
                    <span className="flex items-center gap-3"><Icon className="h-4 w-4 text-primary" /> {label}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Streak / motivation */}
            <div className="rounded-3xl border bg-card p-6 shadow-soft">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600"><Flame className="h-5 w-5" /></div>
                <div>
                  <p className="font-display text-lg font-bold">Keep your streak</p>
                  <p className="text-xs text-muted-foreground">Small daily reps beat weekend cramming.</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

function KpiCard({ icon: Icon, value, label, hint, progress, tone, tip }: {
  icon: typeof CalendarCheck; value: string | number; label: string; hint?: string; progress?: number;
  tone: "primary" | "orange" | "green" | "navy"; tip?: string;
}) {
  const map = {
    primary: "from-primary/15 to-primary/0 text-primary",
    orange: "from-[#FF6B12]/15 to-[#FF6B12]/0 text-[#FF6B12]",
    green: "from-emerald-500/15 to-emerald-500/0 text-emerald-600",
    navy: "from-brand-navy/15 to-brand-navy/0 text-brand-navy",
  } as const;
  const card = (
    <article className={`relative overflow-hidden rounded-2xl border bg-card p-5 shadow-soft transition-all duration-200 hover:-translate-y-1 hover:shadow-lift`}>
      <div className={`absolute inset-0 -z-0 bg-gradient-to-br ${map[tone]} opacity-60`} aria-hidden />
      <div className="relative">
        <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-background ring-1 ring-border ${map[tone].split(" ").at(-1)}`}>
          <Icon className="h-5 w-5" />
        </div>
        <p className="mt-4 font-display text-3xl font-bold">{value}</p>
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {typeof progress === "number" ? <Progress value={progress} className="mt-3 h-1.5" /> : hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </div>
    </article>
  );
  if (!tip) return card;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{card}</TooltipTrigger>
      <TooltipContent>{tip}</TooltipContent>
    </Tooltip>
  );
}

function SectionHead({ title, subtitle, cta }: { title: string; subtitle?: string; cta?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 className="font-display text-xl font-bold">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {cta}
    </div>
  );
}

function StatusChip({ status }: { status: string }) {
  const map: Record<string, string> = {
    confirmed: "bg-emerald-100 text-emerald-800 border-emerald-200",
    pending: "bg-amber-100 text-amber-800 border-amber-200",
    completed: "bg-blue-100 text-blue-800 border-blue-200",
    cancelled: "bg-red-100 text-red-800 border-red-200",
  };
  return <Badge variant="outline" className={`capitalize ${map[status] ?? ""}`}>{status}</Badge>;
}

function EmptyState({ icon: Icon, title, body, ctaText, ctaTo }: { icon: typeof CalendarCheck; title: string; body: string; ctaText: string; ctaTo: string }) {
  return (
    <div className="mt-5 rounded-2xl border border-dashed bg-background/30 p-10 text-center">
      <Icon className="mx-auto h-9 w-9 text-muted-foreground" />
      <h3 className="mt-3 font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
      <Button asChild variant="outline" size="sm" className="mt-4"><Link to={ctaTo}>{ctaText}</Link></Button>
    </div>
  );
}
