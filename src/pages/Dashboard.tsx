import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  ArrowRight, Award, Bookmark, BookOpen, Brain, CalendarCheck, ChevronRight, Clock3, Crown,
  FileText, Flame, GraduationCap, PlayCircle, Sparkles, Trash2, TrendingUp, Video, Save, Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { StudentAttendance } from "@/components/attendance-panel";
import { ApplicationStatus } from "@/components/tutor/application-status";
import ErrorBoundary from "@/components/error-boundary";
import { KpiSkeleton, ListSkeleton, CardGridSkeleton } from "@/components/skeletons";
import {
  StudentShell, StudentTopbar, useStudentSection, type StudentSectionId,
} from "@/components/student/student-shell";
import {
  useStudentIdentity, useStudentBookings, useStudentActivity, useSavedResources, useUnsaveResource,
  useQuizAttempts, useStudentProfile, useSaveProfile, useSubscription,
  type Booking, type ActivityRow, type StudentProfile,
} from "@/hooks/use-student-data";

const fade = "animate-in fade-in slide-in-from-bottom-2 duration-300";

export default function Dashboard() {
  const navigate = useNavigate();
  const { section, setSection } = useStudentSection();
  const { data: identity, isLoading: identityLoading } = useStudentIdentity();

  const user = identity?.user ?? null;
  const userId = user?.id ?? null;

  // Route people to the workspace that belongs to them.
  useEffect(() => {
    if (identityLoading || !identity) return;
    if (!identity.user) { navigate("/auth", { replace: true }); return; }
    if (identity.isAdmin) { navigate("/admin", { replace: true }); return; }
    if (identity.tutorId) { navigate("/tutor", { replace: true }); return; }
  }, [identity, identityLoading, navigate]);

  const application = identity?.application ?? null;
  const awaitingApplication = application?.status === "pending" || application?.status === "changes_requested";

  // Applicants land on their status first, unless they asked for another section.
  useEffect(() => {
    if (!awaitingApplication) return;
    if (window.location.hash.replace("#", "") === "") setSection("application");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [awaitingApplication]);

  // Nothing to show when there is no application.
  useEffect(() => {
    if (section === "application" && !application && !identityLoading) setSection("overview");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section, application, identityLoading]);

  const bookings = useStudentBookings(userId);
  const activity = useStudentActivity(userId);
  const saved = useSavedResources(userId);
  const attempts = useQuizAttempts(userId);

  const name = String(user?.user_metadata?.full_name || user?.email || "Student");
  const firstName = name.split(" ")[0];

  const upcoming = useMemo(() => {
    const now = Date.now();
    return (bookings.data ?? [])
      .filter((b) => new Date(b.preferred_start).getTime() >= now && b.status !== "cancelled");
  }, [bookings.data]);

  const past = useMemo(() => {
    const now = Date.now();
    return (bookings.data ?? [])
      .filter((b) => new Date(b.preferred_start).getTime() < now)
      .sort((a, b) => (a.preferred_start < b.preferred_start ? 1 : -1));
  }, [bookings.data]);

  const avgProgress = useMemo(() => {
    const rows = activity.data ?? [];
    if (!rows.length) return 0;
    return Math.round(rows.reduce((s, a) => s + Number(a.progress ?? 0), 0) / rows.length);
  }, [activity.data]);

  const hoursThisWeek = useMemo(() => {
    const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString();
    const count = (activity.data ?? []).filter((a) => a.last_viewed_at && a.last_viewed_at >= weekAgo).length;
    return Math.round((count * 25) / 60 * 10) / 10; // ~25 min per opened item
  }, [activity.data]);

  async function signOut() {
    await supabase.auth.signOut();
    navigate("/auth", { replace: true });
  }

  const panels: Record<StudentSectionId, React.ReactNode> = {
    application: application ? (
      <ApplicationStatus
        status={application.status}
        feedback={application.admin_feedback}
        reference={application.ref_code ?? application.id}
        compact
      />
    ) : null,
    overview: (
      <OverviewSection
        firstName={firstName}
        loading={bookings.isLoading || activity.isLoading}
        upcoming={upcoming}
        activity={activity.data ?? []}
        savedCount={(saved.data ?? []).length}
        avgProgress={avgProgress}
        hoursThisWeek={hoursThisWeek}
        attempts={attempts.data ?? []}
        onNavigate={setSection}
      />
    ),
    sessions: <SessionsSection loading={bookings.isLoading} upcoming={upcoming} past={past} />,
    attendance: <StudentAttendance userId={userId} />,
    library: <LibrarySection userId={userId} />,
    quiz: <QuizSection loading={attempts.isLoading} attempts={attempts.data ?? []} />,
    premium: <PremiumSection userId={userId} />,
    profile: <ProfileSection userId={userId} fallbackName={name} />,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/40 to-background">
      <Helmet>
        <title>Student Dashboard | CatchUp Tutors</title>
        <meta name="description" content="Your CatchUp Tutors learning dashboard — sessions, attendance, progress and resources." />
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      <StudentTopbar name={name} onSignOut={signOut} />

      {awaitingApplication && section !== "application" && (
        <div className="border-b bg-primary/10">
          <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-3 px-4 py-2.5 text-sm sm:px-6 lg:px-8">
            <span className="font-medium">
              Tutor application {application?.ref_code ?? ""} — {application?.status === "changes_requested" ? "changes requested" : "under review"}
            </span>
            <Button variant="link" size="sm" className="h-auto p-0" onClick={() => setSection("application")}>
              View status
            </Button>
          </div>
        </div>
      )}

      <StudentShell
        section={section}
        setSection={setSection}
        badges={{ sessions: upcoming.length, library: (saved.data ?? []).length }}
        hidden={application ? [] : ["application"]}
      >
        <div key={section} className={fade}>
          <ErrorBoundary key={`eb-${section}`} title="This section could not load" compact>
            {panels[section]}
          </ErrorBoundary>
        </div>
      </StudentShell>
    </div>
  );
}

/* ------------------------------------------------------------------ Overview */

function OverviewSection({
  firstName, loading, upcoming, activity, savedCount, avgProgress, hoursThisWeek, attempts, onNavigate,
}: {
  firstName: string; loading: boolean; upcoming: Booking[]; activity: ActivityRow[];
  savedCount: number; avgProgress: number; hoursThisWeek: number; attempts: any[];
  onNavigate: (id: StudentSectionId) => void;
}) {
  const next = upcoming[0];
  const bestScore = attempts.length
    ? Math.max(...attempts.map((a) => (a.total ? Math.round((a.score / a.total) * 100) : 0)))
    : 0;

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <section className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-brand-navy via-brand-navy to-[#000E2E] p-7 text-hero-foreground shadow-lift sm:p-9">
        <div className="absolute -right-10 -top-10 h-56 w-56 rounded-full bg-[#FF6B12]/25 blur-3xl" aria-hidden />
        <div className="absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-primary/25 blur-3xl" aria-hidden />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#FF6B12]">
              <Sparkles className="mr-1 inline h-3.5 w-3.5" /> Learner dashboard
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">Welcome back, {firstName}.</h2>
            <p className="mt-3 max-w-lg text-sm text-hero-foreground/70">
              {next
                ? `Your next session is ${new Date(next.preferred_start).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}.`
                : "No sessions booked yet — pick a tutor and start learning."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="hero" size="lg"><Link to="/tutors">Book a session <ArrowRight /></Link></Button>
            <Button asChild variant="outline" size="lg" className="border-hero-foreground/25 bg-hero-foreground/5 text-hero-foreground hover:bg-hero-foreground/10">
              <Link to="/resources">Browse resources</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* KPIs */}
      {loading ? <KpiSkeleton /> : (
        <section aria-label="Overview" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard icon={CalendarCheck} tone="primary" value={upcoming.length} label="Upcoming sessions"
            hint={next ? `Next: ${new Date(next.preferred_start).toLocaleDateString()}` : "None booked"}
            tip="Confirmed and pending bookings still ahead of today" onClick={() => onNavigate("sessions")} />
          <KpiCard icon={Clock3} tone="orange" value={`${hoursThisWeek}h`} label="Study this week" hint="Across all subjects"
            tip="Estimated time from the resources you opened this week" onClick={() => onNavigate("library")} />
          <KpiCard icon={Bookmark} tone="green" value={savedCount} label="Saved resources" hint="Ready to revisit"
            tip="Items you bookmarked in the library" onClick={() => onNavigate("library")} />
          <KpiCard icon={TrendingUp} tone="navy" value={`${avgProgress}%`} label="Avg. topic progress" progress={avgProgress}
            tip="Average completion across everything you've opened recently" onClick={() => onNavigate("library")} />
        </section>
      )}

      {/* Quick actions */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <QuickAction icon={CalendarCheck} label="My sessions" body="See and join bookings" onClick={() => onNavigate("sessions")} />
        <QuickAction icon={Brain} label="Practice quiz" body={bestScore ? `Best score ${bestScore}%` : "Start your first test"} to="/quiz" />
        <QuickAction icon={FileText} label="Past questions" body="Yearly and topical" to="/resources" />
        <QuickAction icon={Crown} label="Premium" body="Notes and video lessons" onClick={() => onNavigate("premium")} />
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          {/* Next sessions */}
          <Panel title="Next up" subtitle="Your closest tutor bookings"
            cta={<Button variant="ghost" size="sm" onClick={() => onNavigate("sessions")}>See all <ChevronRight className="h-4 w-4" /></Button>}>
            {loading ? <ListSkeleton rows={2} className="mt-5" /> : upcoming.length === 0 ? (
              <EmptyState icon={CalendarCheck} title="No upcoming sessions"
                body="When a booking is confirmed it appears here with a join link." ctaText="Find a tutor" ctaTo="/tutors" />
            ) : (
              <ul className="mt-5 divide-y">{upcoming.slice(0, 3).map((b) => <BookingRow key={b.id} booking={b} />)}</ul>
            )}
          </Panel>

          {/* Continue learning */}
          <Panel title="Continue learning" subtitle="Pick up where you left off"
            cta={<Button asChild variant="ghost" size="sm"><Link to="/resources">Library <ChevronRight className="h-4 w-4" /></Link></Button>}>
            {loading ? <ListSkeleton rows={4} className="mt-5" /> : activity.length === 0 ? (
              <EmptyState icon={PlayCircle} title="Nothing in progress"
                body="Open a topic, video or resource to start tracking progress." ctaText="Browse library" ctaTo="/resources" />
            ) : (
              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {activity.slice(0, 6).map((a) => <ActivityCard key={a.id} row={a} />)}
              </ul>
            )}
          </Panel>
        </div>

        <aside className="space-y-6">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#FF6B12] to-[#FF9450] p-6 text-white shadow-lift">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/15 blur-2xl" aria-hidden />
            <Crown className="h-8 w-8" />
            <h3 className="mt-4 font-display text-2xl font-bold">Unlock Premium</h3>
            <p className="mt-2 text-sm text-white/85">Full video lessons, worked examples and priority tutor bookings.</p>
            <Button asChild variant="outline" className="mt-5 w-full border-white/40 bg-white/10 text-white hover:bg-white/20">
              <Link to="/pricing">View plans <ArrowRight /></Link>
            </Button>
          </div>

          <div className="rounded-3xl border bg-card p-6 shadow-soft">
            <h3 className="font-display text-lg font-bold">Quick access</h3>
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
    </div>
  );
}

/* ------------------------------------------------------------------ Sessions */

function SessionsSection({ loading, upcoming, past }: { loading: boolean; upcoming: Booking[]; past: Booking[] }) {
  return (
    <div className="space-y-6">
      <Panel title="Upcoming" subtitle={`${upcoming.length} session${upcoming.length === 1 ? "" : "s"} ahead`}
        cta={<Button asChild size="sm"><Link to="/tutors">Book new <ArrowRight className="h-4 w-4" /></Link></Button>}>
        {loading ? <ListSkeleton rows={3} className="mt-5" /> : upcoming.length === 0 ? (
          <EmptyState icon={CalendarCheck} title="No upcoming sessions"
            body="Choose a tutor, pick your subjects and times, and your booking shows up here." ctaText="Find a tutor" ctaTo="/tutors" />
        ) : (
          <ul className="mt-5 divide-y">{upcoming.map((b) => <BookingRow key={b.id} booking={b} />)}</ul>
        )}
      </Panel>

      <Panel title="Past sessions" subtitle="Everything that already happened">
        {loading ? <ListSkeleton rows={2} className="mt-5" /> : past.length === 0 ? (
          <p className="mt-5 rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            No past sessions yet.
          </p>
        ) : (
          <ul className="mt-5 divide-y">{past.slice(0, 15).map((b) => <BookingRow key={b.id} booking={b} muted />)}</ul>
        )}
      </Panel>
    </div>
  );
}

function BookingRow({ booking: b, muted }: { booking: Booking; muted?: boolean }) {
  const dt = new Date(b.preferred_start);
  return (
    <li className={`flex flex-col gap-3 py-4 transition-colors sm:flex-row sm:items-center sm:justify-between ${muted ? "opacity-80" : ""}`}>
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-primary/10 text-primary">
          <span className="text-[10px] font-bold uppercase">{dt.toLocaleString(undefined, { month: "short" })}</span>
          <span className="text-lg font-bold leading-none">{dt.getDate()}</span>
        </div>
        <div className="min-w-0">
          <p className="font-semibold capitalize">{(b.programme || b.session_type || "Session").replace(/_/g, " ")}</p>
          <p className="text-xs text-muted-foreground">
            {dt.toLocaleString(undefined, { hour: "numeric", minute: "2-digit" })} · {b.duration_minutes} min
            {b.ref_code ? <> · <span className="font-mono">{b.ref_code}</span></> : null}
          </p>
          {b.student_notes && <p className="mt-1 line-clamp-1 max-w-md text-xs text-muted-foreground">"{b.student_notes}"</p>}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <StatusChip status={b.status} />
        {b.meeting_url && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button asChild size="sm"><a href={b.meeting_url} target="_blank" rel="noopener">Join <ArrowRight /></a></Button>
            </TooltipTrigger>
            <TooltipContent>Opens your online classroom in a new tab</TooltipContent>
          </Tooltip>
        )}
      </div>
    </li>
  );
}

/* ------------------------------------------------------------------ Library */

function LibrarySection({ userId }: { userId: string | null }) {
  const saved = useSavedResources(userId);
  const activity = useStudentActivity(userId);
  const unsave = useUnsaveResource(userId);

  return (
    <div className="space-y-6">
      <Panel title="Saved resources" subtitle="Bookmarked notes, papers and solutions"
        cta={<Button asChild variant="ghost" size="sm"><Link to="/resources">Add more <ChevronRight className="h-4 w-4" /></Link></Button>}>
        {saved.isLoading ? <CardGridSkeleton count={3} className="mt-5" /> : (saved.data ?? []).length === 0 ? (
          <EmptyState icon={Bookmark} title="Nothing saved yet"
            body="Tap the bookmark on any resource and it will wait for you here." ctaText="Browse resources" ctaTo="/resources" />
        ) : (
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {(saved.data ?? []).map((row) => (
              <li key={row.id} className="group rounded-2xl border bg-background/40 p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-soft">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{row.resources?.title ?? "Resource"}</p>
                    <p className="line-clamp-2 text-xs text-muted-foreground">{row.resources?.description || "Saved item"}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {row.resources?.resource_type && <Badge variant="secondary" className="capitalize text-[10px]">{row.resources.resource_type}</Badge>}
                      {row.resources?.access_level === "premium" && <Badge className="text-[10px]">Premium</Badge>}
                    </div>
                  </div>
                  <AlertDialog>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-destructive">
                            <Trash2 className="size-4" />
                          </Button>
                        </AlertDialogTrigger>
                      </TooltipTrigger>
                      <TooltipContent>Remove from your library</TooltipContent>
                    </Tooltip>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove this saved item?</AlertDialogTitle>
                        <AlertDialogDescription>
                          It stays available in the resources library — you're only removing your bookmark.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Keep it</AlertDialogCancel>
                        <AlertDialogAction onClick={() => unsave.mutate(row.id)}>Remove</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="In progress" subtitle="Topics, videos and files you've opened recently">
        {activity.isLoading ? <ListSkeleton rows={4} className="mt-5" /> : (activity.data ?? []).length === 0 ? (
          <EmptyState icon={PlayCircle} title="Nothing in progress"
            body="Open a topic, video or resource to start tracking progress." ctaText="Browse library" ctaTo="/resources" />
        ) : (
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {(activity.data ?? []).map((a) => <ActivityCard key={a.id} row={a} />)}
          </ul>
        )}
      </Panel>
    </div>
  );
}

function ActivityCard({ row: a }: { row: ActivityRow }) {
  return (
    <li>
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
  );
}

/* ------------------------------------------------------------------ Quiz */

function QuizSection({ loading, attempts }: { loading: boolean; attempts: any[] }) {
  const done = attempts.filter((a) => a.total > 0);
  const avg = done.length ? Math.round(done.reduce((s, a) => s + (a.score / a.total) * 100, 0) / done.length) : 0;
  const best = done.length ? Math.max(...done.map((a) => Math.round((a.score / a.total) * 100))) : 0;

  return (
    <div className="space-y-6">
      {loading ? <KpiSkeleton count={3} /> : (
        <section className="grid gap-4 sm:grid-cols-3">
          <KpiCard icon={Brain} tone="primary" value={done.length} label="Tests taken" tip="Every quiz you have submitted" />
          <KpiCard icon={TrendingUp} tone="green" value={`${avg}%`} label="Average score" progress={avg} tip="Mean score across all your attempts" />
          <KpiCard icon={Award} tone="orange" value={`${best}%`} label="Best score" tip="Your highest result so far" />
        </section>
      )}

      <Panel title="Recent attempts" subtitle="Scores from your practice tests"
        cta={<Button asChild size="sm"><Link to="/quiz">Start a quiz <ArrowRight className="h-4 w-4" /></Link></Button>}>
        {loading ? <ListSkeleton rows={4} className="mt-5" /> : done.length === 0 ? (
          <EmptyState icon={Brain} title="No attempts yet"
            body="Choose an exam, a subject and a number of questions, then see your answers explained." ctaText="Take a quiz" ctaTo="/quiz" />
        ) : (
          <ul className="mt-5 divide-y">
            {done.map((a) => {
              const pct = Math.round((a.score / a.total) * 100);
              return (
                <li key={a.id} className="flex items-center justify-between gap-4 py-4">
                  <div className="min-w-0">
                    <p className="truncate font-semibold uppercase">{a.subject_key || "Mixed"} <span className="text-muted-foreground">· {a.exam_type || "General"}</span></p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(a.completed_at ?? a.created_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <Progress value={pct} className="hidden h-1.5 w-28 sm:block" />
                    <Badge variant={pct >= 70 ? "default" : pct >= 50 ? "secondary" : "outline"}>{a.score}/{a.total} · {pct}%</Badge>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </div>
  );
}

/* ------------------------------------------------------------------ Premium */

function PremiumSection({ userId }: { userId: string | null }) {
  const sub = useSubscription(userId);
  const active = sub.data && sub.data.status === "active" && new Date(sub.data.ends_at).getTime() > Date.now();

  return (
    <div className="space-y-6">
      <section className={`relative overflow-hidden rounded-3xl p-7 shadow-lift ${active ? "bg-gradient-to-br from-emerald-600 to-emerald-500" : "bg-gradient-to-br from-[#FF6B12] to-[#FF9450]"} text-white`}>
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/15 blur-2xl" aria-hidden />
        <Crown className="h-8 w-8" />
        {sub.isLoading ? (
          <div className="mt-4 h-16 w-2/3 animate-pulse rounded-xl bg-white/20" />
        ) : active ? (
          <>
            <h2 className="mt-4 font-display text-2xl font-bold">Premium is active</h2>
            <p className="mt-2 text-sm text-white/90">
              {sub.data.subscription_plans?.name ? `${sub.data.subscription_plans.name} plan · ` : ""}
              Renews {new Date(sub.data.ends_at).toLocaleDateString()}
            </p>
            <Button asChild variant="outline" className="mt-5 border-white/40 bg-white/10 text-white hover:bg-white/20">
              <Link to="/premium">Open premium resources <ArrowRight /></Link>
            </Button>
          </>
        ) : (
          <>
            <h2 className="mt-4 font-display text-2xl font-bold">You're on the free plan</h2>
            <p className="mt-2 max-w-lg text-sm text-white/90">
              Premium unlocks topic notes, worked solutions and full video explanations for every subject.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button asChild variant="outline" className="border-white/40 bg-white/10 text-white hover:bg-white/20"><Link to="/pricing">See plans <ArrowRight /></Link></Button>
              <Button asChild variant="outline" className="border-white/40 bg-transparent text-white hover:bg-white/10"><Link to="/premium">Preview what's inside</Link></Button>
            </div>
          </>
        )}
      </section>

      <Panel title="What premium includes" subtitle="Everything unlocks instantly after payment">
        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {[
            ["Topic notes for every subject", BookOpen],
            ["Video explanations by our tutors", Video],
            ["Full mark schemes and worked solutions", FileText],
            ["Priority tutor booking", CalendarCheck],
          ].map(([label, Icon]: any) => (
            <li key={label} className="flex items-center gap-3 rounded-2xl border bg-background/40 p-4 text-sm font-medium">
              <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="size-4" /></span>
              {label}
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}

/* ------------------------------------------------------------------ Profile */

function ProfileSection({ userId, fallbackName }: { userId: string | null; fallbackName: string }) {
  const profile = useStudentProfile(userId);
  const save = useSaveProfile(userId);
  const [form, setForm] = useState<Partial<StudentProfile>>({});

  useEffect(() => {
    if (profile.data) setForm({
      full_name: profile.data.full_name ?? fallbackName,
      phone: profile.data.phone ?? "",
      country: profile.data.country ?? "",
    });
  }, [profile.data, fallbackName]);

  if (profile.isLoading) return <ListSkeleton rows={4} />;

  const dirty =
    form.full_name !== (profile.data?.full_name ?? "") ||
    (form.phone ?? "") !== (profile.data?.phone ?? "") ||
    (form.country ?? "") !== (profile.data?.country ?? "");

  return (
    <Panel title="My details" subtitle="Used on your bookings and certificates">
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="full_name">Full name</Label>
          <Input id="full_name" value={form.full_name ?? ""} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={profile.data?.email ?? ""} readOnly disabled className="mt-1.5" />
          <p className="mt-1 text-xs text-muted-foreground">Contact us if you need to change this.</p>
        </div>
        <div>
          <Label htmlFor="phone">Phone / WhatsApp</Label>
          <Input id="phone" value={form.phone ?? ""} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+44…" className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="country">Country</Label>
          <Input id="country" value={form.country ?? ""} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))} placeholder="Nigeria" className="mt-1.5" />
        </div>
      </div>
      <div className="mt-6 flex items-center gap-3">
        <Button onClick={() => save.mutate(form)} disabled={!dirty || save.isPending}>
          {save.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Save changes
        </Button>
        {!dirty && <span className="text-xs text-muted-foreground">Everything is up to date.</span>}
      </div>
    </Panel>
  );
}

/* ------------------------------------------------------------------ Shared bits */

function Panel({ title, subtitle, cta, children }: { title: string; subtitle?: string; cta?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border bg-card p-6 shadow-soft sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold">{title}</h2>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {cta}
      </div>
      {children}
    </section>
  );
}

function KpiCard({ icon: Icon, value, label, hint, progress, tone, tip, onClick }: {
  icon: typeof CalendarCheck; value: string | number; label: string; hint?: string; progress?: number;
  tone: "primary" | "orange" | "green" | "navy"; tip?: string; onClick?: () => void;
}) {
  const map = {
    primary: "from-primary/15 to-primary/0 text-primary",
    orange: "from-[#FF6B12]/15 to-[#FF6B12]/0 text-[#FF6B12]",
    green: "from-emerald-500/15 to-emerald-500/0 text-emerald-600",
    navy: "from-brand-navy/15 to-brand-navy/0 text-brand-navy",
  } as const;
  const card = (
    <article
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl border bg-card p-5 text-left shadow-soft transition-all duration-200 hover:-translate-y-1 hover:shadow-lift ${onClick ? "cursor-pointer" : ""}`}
    >
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

function QuickAction({ icon: Icon, label, body, to, onClick }: {
  icon: typeof CalendarCheck; label: string; body: string; to?: string; onClick?: () => void;
}) {
  const inner = (
    <>
      <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary transition-transform duration-200 group-hover:scale-110">
        <Icon className="size-5" />
      </span>
      <span className="mt-3 block font-semibold">{label}</span>
      <span className="block text-xs text-muted-foreground">{body}</span>
    </>
  );
  const cls = "group block rounded-2xl border bg-card p-5 text-left shadow-soft transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lift";
  return to ? <Link to={to} className={cls}>{inner}</Link> : <button type="button" onClick={onClick} className={`${cls} w-full`}>{inner}</button>;
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

function EmptyState({ icon: Icon, title, body, ctaText, ctaTo }: {
  icon: typeof CalendarCheck; title: string; body: string; ctaText: string; ctaTo: string;
}) {
  return (
    <div className="mt-5 rounded-2xl border border-dashed bg-background/30 p-10 text-center">
      <Icon className="mx-auto h-9 w-9 text-muted-foreground" />
      <h3 className="mt-3 font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
      <Button asChild variant="outline" size="sm" className="mt-4"><Link to={ctaTo}>{ctaText}</Link></Button>
    </div>
  );
}
