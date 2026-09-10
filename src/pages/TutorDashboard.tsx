import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { toast } from "sonner";
import {
  ArrowRight, BadgeCheck, CalendarCheck, CheckCircle2, Clock3, GraduationCap, Loader2,
  LogOut, Star, Users, UserRound, Save, ImagePlus,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TutorAttendance } from "@/components/attendance-panel";
import ErrorBoundary from "@/components/error-boundary";
import { KpiSkeleton } from "@/components/skeletons";
import { cn } from "@/lib/utils";

type TutorProfile = {
  id: string; user_id: string; display_name: string; photo_url: string | null; bio: string;
  subjects: string[] | null; qualifications: string[] | null; years_experience: number;
  pricing: any; rating: number; review_count: number; is_approved: boolean; is_visible: boolean;
  ref_code: string | null; highest_qualification: string | null;
};
type Session = {
  id: string; ref_code: string | null; student_name: string | null; programme: string | null;
  available_days: string[] | null; available_times: string | null; preferred_start: string; status: string;
  meeting_url: string | null;
};
type Slot = { id?: string; day_of_week: number; start_time: string };

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = Array.from({ length: 13 }, (_, i) => 8 + i); // 08:00 – 20:00
const hhmm = (h: number) => `${String(h).padStart(2, "0")}:00:00`;

export default function TutorDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<TutorProfile | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) { navigate("/auth", { replace: true }); return; }

      const { data: tp } = await supabase
        .from("tutor_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!tp || !tp.is_approved) { navigate("/dashboard", { replace: true }); return; }
      setProfile(tp as TutorProfile);

      const [bk, av] = await Promise.all([
        supabase.from("bookings")
          .select("id,ref_code,student_name,programme,available_days,available_times,preferred_start,status,meeting_url")
          .eq("tutor_id", tp.id).in("status", ["confirmed", "completed"])
          .order("preferred_start", { ascending: true }),
        supabase.from("tutor_availability").select("id,day_of_week,start_time").eq("tutor_id", tp.id).eq("is_active", true),
      ]);
      setSessions((bk.data ?? []) as Session[]);
      setSlots(((av.data ?? []) as any[]).map((s) => ({ id: s.id, day_of_week: s.day_of_week, start_time: s.start_time })));
      setLoading(false);
    })();
  }, [navigate]);

  const upcoming = useMemo(() => {
    const now = Date.now();
    return sessions.filter((s) => new Date(s.preferred_start).getTime() >= now).slice(0, 6);
  }, [sessions]);

  const thisWeek = useMemo(() => {
    const now = Date.now();
    return sessions.filter((s) => {
      const t = new Date(s.preferred_start).getTime();
      return t >= now && t <= now + 7 * 864e5;
    }).length;
  }, [sessions]);

  const completeness = useMemo(() => {
    if (!profile) return 0;
    const checks = [
      !!profile.photo_url, (profile.bio ?? "").length > 60, (profile.subjects ?? []).length > 0,
      (profile.qualifications ?? []).length > 0, profile.years_experience > 0,
      !!(profile.pricing as any)?.hourly, slots.length > 0,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [profile, slots]);

  async function logout() {
    await supabase.auth.signOut();
    navigate("/auth", { replace: true });
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/40 to-background">
      <Helmet>
        <title>Tutor Workspace | CatchUp Tutors</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      <header className="border-b bg-card/80 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2 font-display font-bold">
            <GraduationCap className="text-primary" /> CatchUp Tutors
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost"><Link to="/tutors">Public directory</Link></Button>
            <Button variant="ghost" onClick={logout}><LogOut /> Sign out</Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-brand-navy via-brand-navy to-[#000E2E] p-8 text-hero-foreground shadow-lift sm:p-10">
          <div className="absolute -right-10 -top-10 h-56 w-56 rounded-full bg-[#FF6B12]/25 blur-3xl" aria-hidden />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
            <span className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-2xl bg-hero-foreground/10 ring-1 ring-hero-foreground/20">
              {profile?.photo_url
                ? <img src={profile.photo_url} alt={profile.display_name} className="size-full object-cover" />
                : <UserRound className="size-9 text-hero-foreground/70" />}
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#FF6B12]">Tutor workspace</p>
              <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
                {profile?.display_name ?? "Tutor"}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                {profile?.ref_code && <span className="rounded-full bg-hero-foreground/10 px-3 py-1 font-mono text-xs">{profile.ref_code}</span>}
                <span className="inline-flex items-center gap-1 rounded-full bg-hero-foreground/10 px-3 py-1 text-xs">
                  <Star className="size-3.5 text-[#FF6B12]" /> {Number(profile?.rating ?? 0).toFixed(1)} ({profile?.review_count ?? 0})
                </span>
                <span className={cn(
                  "rounded-full px-3 py-1 text-xs font-semibold",
                  profile?.is_visible ? "bg-emerald-500/20 text-emerald-200" : "bg-amber-500/20 text-amber-200",
                )}>
                  {profile?.is_visible ? "Active — visible to students" : "Suspended — hidden from the directory"}
                </span>
              </div>
            </div>
          </div>
        </section>

        {loading ? <KpiSkeleton /> : (
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi icon={Users} value={new Set(sessions.map((s) => s.student_name ?? s.id)).size} label="Students" hint="Confirmed bookings" />
            <Kpi icon={CalendarCheck} value={thisWeek} label="Sessions this week" hint="Next 7 days" />
            <Kpi icon={Clock3} value={upcoming.length} label="Upcoming sessions" hint="Scheduled ahead" />
            <Kpi icon={BadgeCheck} value={`${completeness}%`} label="Profile complete" progress={completeness} />
          </section>
        )}

        <Tabs defaultValue="sessions" className="w-full">
          <TabsList className="flex w-full flex-wrap justify-start gap-1">
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="students">My students</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="profile">My profile</TabsTrigger>
            <TabsTrigger value="availability">My availability</TabsTrigger>
          </TabsList>

          <TabsContent value="sessions" className="mt-6">
            <section className="rounded-3xl border bg-card p-6 shadow-soft sm:p-7">
              <h2 className="font-display text-xl font-bold">Upcoming sessions</h2>
              <p className="text-sm text-muted-foreground">Your next confirmed lessons.</p>
              {upcoming.length === 0 ? (
                <Empty title="Nothing scheduled" body="Confirmed bookings appear here with a join link." />
              ) : (
                <ul className="mt-5 divide-y">
                  {upcoming.map((s) => {
                    const dt = new Date(s.preferred_start);
                    return (
                      <li key={s.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-4">
                          <div className="flex size-12 flex-col items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <span className="text-[10px] font-bold uppercase">{dt.toLocaleString(undefined, { month: "short" })}</span>
                            <span className="text-lg font-bold leading-none">{dt.getDate()}</span>
                          </div>
                          <div>
                            <p className="font-semibold">{s.student_name ?? "Student"}</p>
                            <p className="text-xs text-muted-foreground">
                              {dt.toLocaleString(undefined, { hour: "numeric", minute: "2-digit" })} · {s.programme ?? "Programme not specified"}
                            </p>
                          </div>
                        </div>
                        {s.meeting_url && <Button asChild size="sm"><a href={s.meeting_url} target="_blank" rel="noopener">Join <ArrowRight /></a></Button>}
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </TabsContent>

          <TabsContent value="students" className="mt-6">
            <section className="rounded-3xl border bg-card p-6 shadow-soft sm:p-7">
              <h2 className="font-display text-xl font-bold">My students</h2>
              <p className="text-sm text-muted-foreground">Students whose bookings the admin has accepted.</p>
              {sessions.length === 0 ? (
                <Empty title="No accepted students yet" body="Once admin confirms a booking, the student appears here." />
              ) : (
                <ul className="mt-5 divide-y">
                  {sessions.map((s) => (
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
                        <Badge variant="outline" className="capitalize">{s.status}</Badge>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </TabsContent>

          <TabsContent value="attendance" className="mt-6">
            <ErrorBoundary title="Attendance could not load" compact>
              <TutorAttendance tutorId={profile?.id ?? null} />
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="profile" className="mt-6">
            {profile && <ProfileForm profile={profile} onSaved={setProfile} />}
          </TabsContent>

          <TabsContent value="availability" className="mt-6">
            {profile && <AvailabilityGrid tutorId={profile.id} slots={slots} onSaved={setSlots} />}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function Kpi({ icon: Icon, value, label, hint, progress }: {
  icon: typeof Users; value: string | number; label: string; hint?: string; progress?: number;
}) {
  return (
    <article className="rounded-2xl border bg-card p-5 shadow-soft transition-all hover:-translate-y-1 hover:shadow-lift">
      <div className="inline-flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="size-5" /></div>
      <p className="mt-4 font-display text-3xl font-bold">{value}</p>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      {typeof progress === "number"
        ? <Progress value={progress} className="mt-3 h-1.5" />
        : hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </article>
  );
}

function Empty({ title, body }: { title: string; body: string }) {
  return (
    <div className="mt-5 rounded-2xl border border-dashed bg-background/30 p-10 text-center">
      <CalendarCheck className="mx-auto size-9 text-muted-foreground" />
      <h3 className="mt-3 font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

function ProfileForm({ profile, onSaved }: { profile: TutorProfile; onSaved: (p: TutorProfile) => void }) {
  const [busy, setBusy] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [form, setForm] = useState({
    display_name: profile.display_name ?? "",
    bio: profile.bio ?? "",
    subjects: (profile.subjects ?? []).join(", "),
    qualifications: (profile.qualifications ?? []).join(", "),
    years_experience: String(profile.years_experience ?? 0),
    hourly: String((profile.pricing as any)?.hourly ?? ""),
    photo_url: profile.photo_url ?? "",
  });

  const list = (v: string) => v.split(",").map((s) => s.trim()).filter(Boolean);

  async function uploadPhoto(file: File) {
    if (file.size > 5 * 1024 * 1024) return toast.error("Photo must be under 5MB.");
    setPhotoBusy(true);
    const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
    const path = `${profile.user_id}/photo-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("tutor-uploads").upload(path, file, { upsert: true, contentType: file.type });
    if (error) { setPhotoBusy(false); return toast.error(error.message); }
    const { data: signed } = await supabase.storage.from("tutor-uploads").createSignedUrl(path, 60 * 60 * 24 * 365);
    setForm((f) => ({ ...f, photo_url: signed?.signedUrl ?? f.photo_url }));
    setPhotoBusy(false);
    toast.success("Photo uploaded — remember to save.");
  }

  async function save() {
    if (form.display_name.trim().length < 2) return toast.error("Add your display name.");
    setBusy(true);
    const payload = {
      display_name: form.display_name.trim(),
      bio: form.bio.trim(),
      subjects: list(form.subjects),
      qualifications: list(form.qualifications),
      years_experience: Math.max(0, Number(form.years_experience) || 0),
      pricing: { ...(profile.pricing ?? {}), hourly: Number(form.hourly) || 0 },
      photo_url: form.photo_url || null,
    };
    const { data, error } = await supabase.from("tutor_profiles").update(payload).eq("id", profile.id).select("*").maybeSingle();
    setBusy(false);
    if (error) return toast.error(error.message);
    if (data) onSaved(data as TutorProfile);
    toast.success("Profile updated");
  }

  return (
    <section className="rounded-3xl border bg-card p-6 shadow-soft sm:p-7">
      <h2 className="font-display text-xl font-bold">My profile</h2>
      <p className="text-sm text-muted-foreground">This is what students see on the tutor directory.</p>

      <div className="mt-6 grid gap-5 lg:grid-cols-[220px_1fr]">
        <div className="space-y-3">
          <div className="grid aspect-square w-full place-items-center overflow-hidden rounded-2xl border bg-muted/40">
            {form.photo_url
              ? <img src={form.photo_url} alt="Profile" className="size-full object-cover" />
              : <UserRound className="size-12 text-muted-foreground" />}
          </div>
          <Label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold hover:bg-muted/50">
            {photoBusy ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />} Change photo
            <input type="file" accept="image/*" className="hidden" onChange={(e) => { const fl = e.target.files?.[0]; if (fl) uploadPhoto(fl); }} />
          </Label>
        </div>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5"><Label>Display name</Label>
              <Input value={form.display_name} onChange={(e) => setForm((f) => ({ ...f, display_name: e.target.value }))} /></div>
            <div className="grid gap-1.5"><Label>Years of experience</Label>
              <Input type="number" min={0} value={form.years_experience} onChange={(e) => setForm((f) => ({ ...f, years_experience: e.target.value }))} /></div>
          </div>
          <div className="grid gap-1.5"><Label>Headline bio</Label>
            <Textarea rows={5} value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} /></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5"><Label>Subjects (comma separated)</Label>
              <Input value={form.subjects} onChange={(e) => setForm((f) => ({ ...f, subjects: e.target.value }))} /></div>
            <div className="grid gap-1.5"><Label>Qualifications (comma separated)</Label>
              <Input value={form.qualifications} onChange={(e) => setForm((f) => ({ ...f, qualifications: e.target.value }))} /></div>
          </div>
          <div className="grid gap-1.5 sm:max-w-xs"><Label>Price per contact / hour (₦)</Label>
            <Input type="number" min={0} value={form.hourly} onChange={(e) => setForm((f) => ({ ...f, hourly: e.target.value }))} /></div>
          <p className="text-xs text-muted-foreground">
            Approval status, visibility and your rating are managed by the Catch-Up Tutors team.
          </p>
          <Button onClick={save} disabled={busy}>{busy ? <Loader2 className="animate-spin" /> : <Save />} Save profile</Button>
        </div>
      </div>
    </section>
  );
}

function AvailabilityGrid({ tutorId, slots, onSaved }: { tutorId: string; slots: Slot[]; onSaved: (s: Slot[]) => void }) {
  const [picked, setPicked] = useState<Set<string>>(new Set(slots.map((s) => `${s.day_of_week}|${s.start_time.slice(0, 8)}`)));
  const [busy, setBusy] = useState(false);

  const toggle = (day: number, hour: number) => {
    const key = `${day}|${hhmm(hour)}`;
    setPicked((cur) => {
      const next = new Set(cur);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  async function save() {
    setBusy(true);
    const rows = [...picked].map((k) => {
      const [d, t] = k.split("|");
      const startHour = Number(t.slice(0, 2));
      return {
        tutor_id: tutorId,
        day_of_week: Number(d),
        start_time: t,
        end_time: hhmm(Math.min(23, startHour + 1)),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
        is_active: true,
      };
    });
    const del = await supabase.from("tutor_availability").delete().eq("tutor_id", tutorId);
    if (del.error) { setBusy(false); return toast.error(del.error.message); }
    if (rows.length) {
      const { error } = await supabase.from("tutor_availability").insert(rows);
      if (error) { setBusy(false); return toast.error(error.message); }
    }
    setBusy(false);
    onSaved(rows.map((r) => ({ day_of_week: r.day_of_week, start_time: r.start_time })));
    toast.success("Availability saved");
  }

  return (
    <section className="rounded-3xl border bg-card p-6 shadow-soft sm:p-7">
      <h2 className="font-display text-xl font-bold">My availability</h2>
      <p className="text-sm text-muted-foreground">Tap the hours you teach. Students only see these slots when booking you.</p>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[620px] border-separate border-spacing-1 text-center text-xs">
          <thead>
            <tr>
              <th className="w-14" />
              {DAYS.map((d) => <th key={d} className="pb-1 font-semibold text-muted-foreground">{d}</th>)}
            </tr>
          </thead>
          <tbody>
            {HOURS.map((h) => (
              <tr key={h}>
                <td className="pr-2 text-right font-medium text-muted-foreground">{String(h).padStart(2, "0")}:00</td>
                {DAYS.map((_, d) => {
                  const on = picked.has(`${d}|${hhmm(h)}`);
                  return (
                    <td key={d}>
                      <button
                        type="button"
                        onClick={() => toggle(d, h)}
                        aria-pressed={on}
                        aria-label={`${DAYS[d]} ${h}:00`}
                        className={cn(
                          "h-8 w-full rounded-md border transition-all",
                          on ? "border-primary bg-primary/85 text-primary-foreground" : "bg-background hover:bg-muted",
                        )}
                      >
                        {on && <CheckCircle2 className="mx-auto size-3.5" />}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button onClick={save} disabled={busy}>{busy ? <Loader2 className="animate-spin" /> : <Save />} Save availability</Button>
        <span className="text-sm text-muted-foreground">{picked.size} hour{picked.size === 1 ? "" : "s"} selected</span>
      </div>
    </section>
  );
}
