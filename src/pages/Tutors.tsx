import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BadgeCheck, Calendar, MessageCircle, Search, Star, Clock, Loader2, GraduationCap } from "lucide-react";
import { SiteShell, PageHero, Seo } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import BookingBioForm from "@/components/booking-bio-form";
import BookingReceipt from "@/components/booking-receipt";
import { heroImages } from "@/assets/heroes";

const ADMIN_WHATSAPP = "447350890668";
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const FULL_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** Exam catalogue used by the one-to-one registration flow. */
const INTERNATIONAL_EXAMS = ["Cambridge", "Edexcel", "IB", "IGCSE", "TMUA", "GRE", "TOEFL", "IELTS", "SAT", "GMAT"];
const LOCAL_EXAMS = ["JAMB", "WAEC", "NECO", "JUPEB", "IJMB"];
const SUBJECT_CATALOGUE = [
  "Mathematics", "Further Mathematics", "Physics", "Chemistry", "Biology",
  "Computer Science", "Sociology", "Law", "Psychology", "English",
  "Accounting", "Economics", "Business",
];


type Tutor = {
  id: string; display_name: string; bio: string; photo_url: string | null;
  subjects: string[]; topics: string[]; qualifications: string[]; years_experience: number;
  pricing: { hourly?: { NGN?: number; GBP?: number } }; rating: number; review_count: number;
  ref_code: string | null; highest_qualification: string | null;
};
type Slot = { tutor_id: string; day_of_week: number; start_time: string; end_time: string };
type Subject = { id: string; name: string; program_id: string };

/** Best available academic qualification label (BSc / MSc / PhD …). */
function qualificationOf(t: Tutor): string | null {
  if (t.highest_qualification?.trim()) return t.highest_qualification.trim();
  const q = (t.qualifications ?? []).find((x) => /bsc|b\.sc|msc|m\.sc|phd|ph\.d|bachelor|master|doctor|b\.ed|m\.ed|pgce/i.test(x));
  return q ?? (t.qualifications ?? [])[0] ?? null;
}



export default function Tutors() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: "One-to-one Mathematics tutoring",
    provider: { "@type": "EducationalOrganization", name: "CatchUp Tutors" },
    areaServed: ["Nigeria", "United Kingdom", "Worldwide"],
    audience: { "@type": "EducationalAudience", educationalRole: "student" },
  };

  const [q, setQ] = useState("");
  const [subjectFilter, setSubjectFilter] = useState<string>("All subjects");
  const [booking, setBooking] = useState<Tutor | null>(null);

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["tutors-page"],
    queryFn: async () => {
      const [tRes, aRes, sRes] = await Promise.all([
        supabase.from("tutor_profiles").select("id,display_name,bio,photo_url,subjects,topics,qualifications,years_experience,pricing,rating,review_count,ref_code,highest_qualification").eq("is_approved", true).eq("is_visible", true).order("rating", { ascending: false }),
        supabase.from("tutor_availability").select("tutor_id,day_of_week,start_time,end_time").eq("is_active", true),
        supabase.from("subjects").select("id,name,program_id"),
      ]);
      if (tRes.error) throw tRes.error;
      return {
        tutors: (tRes.data as Tutor[]) ?? [],
        slots: (aRes.data as Slot[]) ?? [],
        subjects: (sRes.data as Subject[]) ?? [],
      };
    },
  });

  const tutors = data?.tutors ?? [];
  const slots = data?.slots ?? [];
  const subjects = data?.subjects ?? [];

  const subjectChips = useMemo(() => {
    const set = new Set<string>();
    tutors.forEach((t) => (t.subjects ?? []).forEach((s) => set.add(s)));
    return ["All subjects", ...[...set].sort()];
  }, [tutors]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return tutors.filter((t) => {
      const matchesSubject = subjectFilter === "All subjects" || (t.subjects ?? []).includes(subjectFilter);
      if (!matchesSubject) return false;
      if (!needle) return true;
      return [t.display_name, t.bio, ...(t.subjects ?? []), ...(t.topics ?? [])]
        .filter(Boolean).some((x) => x.toLowerCase().includes(needle));
    });
  }, [q, subjectFilter, tutors]);

  return (
    <SiteShell>
      <Seo title="Expert Mathematics Tutors | CatchUp Tutors" description="Find approved Cambridge and IGCSE Mathematics tutors and book one-to-one sessions." path="/tutors" jsonLd={jsonLd} />
      <PageHero image={heroImages.tutors} eyebrow="Approved experts" title="Find the tutor who understands your next step." description="Compare subjects, teaching focus, experience, availability, and tutor-set session pricing." />
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <ErrorBoundary title="The tutor list could not load">
        <div className="rounded-3xl border bg-card p-4 shadow-soft sm:p-5">
          <div className="flex items-center gap-3 rounded-2xl border bg-background px-4">
            <Search className="size-5 shrink-0 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tutors by name, subject or topic" aria-label="Search tutors" className="h-12 flex-1 bg-transparent outline-none" />
            {q && (
              <button type="button" onClick={() => setQ("")} aria-label="Clear search" className="text-muted-foreground transition hover:text-foreground">
                <X className="size-4" />
              </button>
            )}
          </div>
          <div className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {subjectChips.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSubjectFilter(s)}
                className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition active:scale-95 ${
                  s === subjectFilter ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-muted"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground" aria-live="polite">
            {isLoading ? "Loading tutors…" : `Showing ${filtered.length} of ${tutors.length} approved tutor${tutors.length === 1 ? "" : "s"}`}
            {isFetching && !isLoading ? " · refreshing" : ""}
          </p>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-4 rounded-2xl border bg-muted/40 p-5">
          <BadgeCheck className="text-primary" />
          <p className="flex-1 text-sm text-muted-foreground">
            Are you a teacher or subject expert? Join our team of Cambridge, Edexcel, IB, TMUA and SAT tutors.
          </p>
          <Button asChild variant="outline"><Link to="/tutors/apply">Apply as a tutor</Link></Button>
        </div>

        {isLoading ? (
          <CardGridSkeleton count={6} className="mt-10" />
        ) : isError ? (
          <div className="mt-10 rounded-3xl border border-destructive/30 bg-destructive/5 p-12 text-center">
            <h2 className="font-display text-xl font-bold">We couldn't load the tutors</h2>
            <p className="mt-2 text-sm text-muted-foreground">Check your connection and try again.</p>
            <Button className="mt-5" onClick={() => refetch()}>Retry</Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-dashed p-12 text-center">
            <BadgeCheck className="mx-auto h-10 w-10 text-primary" />
            <h2 className="mt-4 font-display text-2xl font-bold">No tutors match that search</h2>
            <p className="mx-auto mt-3 max-w-lg text-muted-foreground">Try a different subject or topic, or apply as a tutor.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Button variant="outline" onClick={() => { setQ(""); setSubjectFilter("All subjects"); }}>Clear filters</Button>
              <Button asChild><Link to="/tutors/apply">Apply as a tutor</Link></Button>
            </div>
          </div>
        ) : (
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((t) => {
              const sl = slots.filter((s) => s.tutor_id === t.id);
              const priceNGN = t.pricing?.hourly?.NGN; const priceGBP = t.pricing?.hourly?.GBP;
              return (
                <article key={t.id} className="flex flex-col rounded-3xl border bg-card p-6 shadow-soft transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lift">
                  <div className="flex items-center gap-4">
                    <img src={t.photo_url ?? "https://i.pravatar.cc/200"} alt={t.display_name} loading="lazy" className="size-16 rounded-full object-cover ring-2 ring-primary/15" />
                    <div>
                      <h2 className="font-display text-lg font-bold leading-tight">{t.display_name}</h2>
                      {qualificationOf(t) && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <p className="mt-1 inline-flex cursor-help items-center gap-1 rounded-full bg-brand-green/10 px-2 py-0.5 text-xs font-bold text-brand-green">
                              <GraduationCap className="size-3.5" /> {qualificationOf(t)}
                            </p>
                          </TooltipTrigger>
                          <TooltipContent>Highest academic qualification verified by our team</TooltipContent>
                        </Tooltip>
                      )}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <p className="mt-0.5 flex cursor-help items-center gap-1 text-sm text-muted-foreground">
                            <Star className="size-4 text-brand-orange" fill="currentColor" /> {Number(t.rating).toFixed(1)} · {t.review_count} reviews
                          </p>
                        </TooltipTrigger>
                        <TooltipContent>Average rating from completed sessions</TooltipContent>
                      </Tooltip>
                      {t.ref_code && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <p className="mt-0.5 cursor-help font-mono text-[11px] text-muted-foreground">ID: {t.ref_code}</p>
                          </TooltipTrigger>
                          <TooltipContent>Unique CatchUp tutor reference — quote it when you contact us</TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </div>
                  <p className="mt-4 line-clamp-3 text-sm text-muted-foreground">{t.bio}</p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {(t.subjects ?? []).map((s) => <span key={s} className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">{s}</span>)}
                  </div>
                  <div className="mt-4 space-y-1 text-xs text-muted-foreground">
                    {(t.qualifications ?? []).length > 0 && (
                      <p className="flex items-center gap-1.5"><GraduationCap className="size-3.5" /> {(t.qualifications ?? []).join(" · ")}</p>
                    )}
                    <p className="flex items-center gap-1.5"><Clock className="size-3.5" /> {t.years_experience}+ years experience</p>
                    {sl.length > 0 && (
                      <p className="flex items-center gap-1.5"><Calendar className="size-3.5" /> {sl.slice(0, 3).map((s) => `${DAY_NAMES[s.day_of_week]} ${s.start_time.slice(0, 5)}`).join(" · ")}</p>
                    )}
                  </div>
                  <div className="mt-5 flex items-end justify-between border-t pt-4">
                    <div>
                      <p className="font-display text-xl font-bold">{priceNGN ? `₦${priceNGN.toLocaleString()}` : "—"}</p>
                      <p className="text-xs text-muted-foreground">{priceGBP ? `£${priceGBP} · per hour` : "per hour"}</p>
                    </div>
                    <Button className="transition active:scale-95" onClick={() => setBooking(t)}>Book session</Button>
                  </div>
                </article>
              );

            })}
          </div>
        )}
        </ErrorBoundary>
      </section>


      <BookingDialog tutor={booking} subjects={subjects} slots={booking ? slots.filter((s) => s.tutor_id === booking.id) : []} onClose={() => setBooking(null)} />
    </SiteShell>
  );
}

type Step = "details" | "auth" | "pay" | "bio";

/** Hour labels between two "HH:MM[:SS]" times, e.g. 16:00 → 19:00 gives 16:00, 17:00, 18:00. */
function hoursBetween(start: string, end: string): string[] {
  const s = Number(start.slice(0, 2));
  const e = Number(end.slice(0, 2));
  const out: string[] = [];
  for (let h = s; h < e; h++) out.push(`${String(h).padStart(2, "0")}:00`);
  return out;
}

/** Next calendar date (yyyy-mm-dd) for a weekday index, today included. */
function nextDateFor(dayIndex: number): string {
  const now = new Date();
  const diff = (dayIndex - now.getDay() + 7) % 7;
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diff);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function BookingDialog({ tutor, subjects, slots, onClose }: { tutor: Tutor | null; subjects: Subject[]; slots: Slot[]; onClose: () => void }) {

  const [step, setStep] = useState<Step>("details");
  /** Sub-step inside "details": 1 course · 2 schedule · 3 you. */
  const [sub, setSub] = useState(1);
  const [busy, setBusy] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [bookingRef, setBookingRef] = useState<string | null>(null);
  const [waUrl, setWaUrl] = useState("");
  const [payNote, setPayNote] = useState("");
  const [form, setForm] = useState({
    examScope: "" as "" | "international" | "local" | "both",
    examTypes: [] as string[],
    subjectNames: [] as string[], contacts: {} as Record<string, number>,
    date: "", time: "16:00", sessionType: "google_meet",
    studentName: "", studentEmail: "", studentPhone: "",
    availableDays: [] as string[], availableTimes: "", notes: "",
    /** Chosen weekly slots encoded as "dayIndex|HH:MM". */
    picked: [] as string[],
  });
  const [activeDay, setActiveDay] = useState<number | null>(null);
  const [auth, setAuth] = useState({ mode: "signin" as "signin" | "signup", email: "", password: "" });

  useEffect(() => {
    if (!tutor) return;
    setStep("details"); setSub(1); setBookingId(null); setBookingRef(null); setPayNote("");
    setForm((f) => ({ ...f, examScope: "", examTypes: [], subjectNames: [], contacts: {}, picked: [], availableDays: [], availableTimes: "", date: "" }));

    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) setForm((f) => ({ ...f, studentEmail: f.studentEmail || data.user!.email! }));
    });
  }, [tutor, subjects]);

  if (!tutor) return null;

  const hourlyRate = tutor.pricing?.hourly?.NGN ?? 0;
  const hourlyGBP = tutor.pricing?.hourly?.GBP ?? 0;
  /** Exams offered for the chosen scope. */
  const examOptions =
    form.examScope === "international" ? INTERNATIONAL_EXAMS
      : form.examScope === "local" ? LOCAL_EXAMS
        : form.examScope === "both" ? [...INTERNATIONAL_EXAMS, ...LOCAL_EXAMS]
          : [];
  const contactsFor = (name: string) => form.contacts[name] ?? 1;
  /** Each contact = 1 hour of one subject, charged at the tutor's hourly rate per contact per subject. */
  const totalContacts = form.subjectNames.reduce((n, name) => n + contactsFor(name), 0);
  const priceAmount = hourlyRate * totalContacts;
  const priceGBP = hourlyGBP * totalContacts;
  const subjectName = form.subjectNames.join(", ") || "Mathematics";
  const programme = form.examTypes.join(", ");
  /** Bookings need a real subject row: match by name, else fall back to the first one. */
  const primarySubjectId =
    subjects.find((s) => s.name.toLowerCase() === (form.subjectNames[0] ?? "").toLowerCase())?.id
    ?? subjects[0]?.id ?? "";

  const setScope = (scope: "international" | "local" | "both") =>
    setForm((f) => ({ ...f, examScope: scope, examTypes: [] }));
  const toggleExam = (name: string) =>
    setForm((f) => ({ ...f, examTypes: f.examTypes.includes(name) ? f.examTypes.filter((x) => x !== name) : [...f.examTypes, name] }));
  const toggleSubject = (name: string) =>
    setForm((f) => f.subjectNames.includes(name)
      ? { ...f, subjectNames: f.subjectNames.filter((x) => x !== name) }
      : { ...f, subjectNames: [...f.subjectNames, name], contacts: { ...f.contacts, [name]: f.contacts[name] ?? 1 } });
  const setContacts = (name: string, n: number) =>
    setForm((f) => ({ ...f, contacts: { ...f.contacts, [name]: Math.min(7, Math.max(1, n)) } }));
  const planSummary = form.subjectNames
    .map((name) => `${name} × ${contactsFor(name)} contact(s)/week`).join("; ");
  const preferredStart = form.date && form.time ? new Date(`${form.date}T${form.time}:00`).toISOString() : "";

  /** Tutor's published availability as day index → selectable hour labels. */
  const availability: Record<number, string[]> = {};
  for (const s of slots) {
    const hrs = hoursBetween(s.start_time, s.end_time);
    availability[s.day_of_week] = Array.from(new Set([...(availability[s.day_of_week] ?? []), ...hrs])).sort();
  }
  const hasPublishedAvailability = Object.keys(availability).length > 0;
  if (!hasPublishedAvailability) {
    // Fallback window when the tutor has not published slots yet.
    for (let d = 1; d <= 6; d++) availability[d] = hoursBetween("09:00", "20:00");
  }
  const openDays = Object.keys(availability).map(Number).sort();
  const dayInView = activeDay !== null && availability[activeDay] ? activeDay : (openDays[0] ?? null);

  /** Add / remove a weekly slot and keep the derived schedule fields in sync. */
  const togglePick = (dayIndex: number, time: string) =>
    setForm((f) => {
      const key = `${dayIndex}|${time}`;
      const picked = f.picked.includes(key) ? f.picked.filter((x) => x !== key) : [...f.picked, key];
      const sorted = [...picked].sort((a, b) => {
        const [da, ta] = a.split("|"); const [db, tb] = b.split("|");
        return Number(da) - Number(db) || ta.localeCompare(tb);
      });
      const days = Array.from(new Set(sorted.map((k) => FULL_DAYS[Number(k.split("|")[0])])));
      const times = sorted.map((k) => `${DAY_NAMES[Number(k.split("|")[0])]} ${k.split("|")[1]}`).join(", ");
      const first = sorted[0];
      return {
        ...f, picked: sorted, availableDays: days, availableTimes: times,
        date: first ? nextDateFor(Number(first.split("|")[0])) : "",
        time: first ? first.split("|")[1] : f.time,
      };
    });

  /** Guarded move between the details sub-steps. */
  const nextSub = () => {
    if (sub === 1) {
      if (!form.examScope) { toast.error("Choose international, local or both examinations"); return; }
      if (!form.examTypes.length) { toast.error("Select at least one exam type"); return; }
      if (!form.subjectNames.length) { toast.error("Select at least one subject"); return; }
    }
    if (sub === 2) {
      if (!form.picked.length) { toast.error("Pick at least one available time slot"); return; }
      if (form.picked.length < totalContacts) { toast.error(`Pick ${totalContacts} slots — one per contact per week`); return; }
    }

    setSub((n) => Math.min(3, n + 1));
  };

  /** Step 1 → sign in (or straight to payment when already signed in). */
  const submitDetails = async () => {
    if (!form.examScope) { toast.error("Choose whether this is for international, local or both examinations"); return; }
    if (!form.examTypes.length) { toast.error("Select at least one exam type"); return; }
    if (!form.subjectNames.length) { toast.error("Select at least one subject"); return; }
    if (!form.studentName || !form.studentEmail) { toast.error("Please add your name and email"); return; }
    if (!form.picked.length) { toast.error("Pick at least one available time slot"); return; }

    const { data } = await supabase.auth.getUser();
    if (!data.user) { setAuth((a) => ({ ...a, email: form.studentEmail })); setStep("auth"); return; }
    await createBookingAndPay();
  };


  /** Step 2: inline sign in / sign up — the form data above is preserved. */
  const doAuth = async () => {
    if (!auth.email || auth.password.length < 6) { toast.error("Enter your email and a password of at least 6 characters"); return; }
    setBusy(true);
    try {
      if (auth.mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email: auth.email, password: auth.password });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: auth.email, password: auth.password,
          options: { emailRedirectTo: `${window.location.origin}/tutors`, data: { full_name: form.studentName } },
        });
        if (error) throw error;
        if (!data.session) { toast.success("Check your email to confirm your account, then sign in here."); setAuth((a) => ({ ...a, mode: "signin" })); return; }
      }
      await createBookingAndPay();
    } catch (e) {
      toast.error((e as Error)?.message ?? "Could not sign you in");
    } finally { setBusy(false); }
  };

  /** Step 3: create the booking, then send the student to Paystack. */
  const createBookingAndPay = async () => {
    setBusy(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) { setStep("auth"); return; }

      let id = bookingId;
      let ref = bookingRef;
      if (!id) {
        const { data: booking, error } = await supabase.from("bookings").insert({
          student_id: user.id, tutor_id: tutor.id, subject_id: primarySubjectId,
          preferred_start: preferredStart, duration_minutes: 60, // each contact is a 1-hour session
          session_type: form.sessionType, price_amount: priceAmount, currency: "NGN",
          student_notes: [`${form.examScope} examinations: ${programme}`, planSummary, form.notes].filter(Boolean).join(" — ") || null,
          bio_details: {
            examScope: form.examScope, examTypes: form.examTypes,
            plan: form.subjectNames.map((name) => ({ subject: name, contactsPerWeek: contactsFor(name) })),
            hourlyRate, totalContacts,
          },
          student_name: form.studentName,
          student_email: form.studentEmail, student_phone: form.studentPhone || null,
          programme, available_days: form.availableDays,
          available_times: form.availableTimes || null,

        }).select("id,ref_code").single();
        if (error) throw error;
        id = booking.id; ref = booking.ref_code;
        setBookingId(id); setBookingRef(ref);

        supabase.functions.invoke("send-booking-email", {
          body: {
            bookingId: id, studentName: form.studentName, studentEmail: form.studentEmail,
            tutorName: tutor.display_name, subjectName, preferredStart,
            durationMinutes: 60, sessionType: form.sessionType,
            priceAmount, currency: "NGN", notes: form.notes,
          },
        }).catch((e) => console.warn("email failed", e));

        setWaUrl(`https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(
          `Hi! I just booked ${totalContacts} weekly contact(s) of ${subjectName} with ${tutor.display_name} for ${new Date(preferredStart).toLocaleString()}. Booking ref: ${ref ?? id}. — ${form.studentName} (${form.studentEmail})`,
        )}`);
      }

      setStep("pay");
      if (priceAmount > 0) {
        const { data, error } = await supabase.functions.invoke("paystack-booking", {
          body: { action: "init", bookingId: id, callbackUrl: `${window.location.origin}/payment/callback?type=booking` },
        });
        const res = data as { authorizationUrl?: string; error?: string } | null;
        if (error || res?.error || !res?.authorizationUrl) {
          setPayNote(res?.error ?? error?.message ?? "Online payment is unavailable right now. Our team will contact you with payment details.");
          return;
        }
        window.location.href = res.authorizationUrl;
        return;
      }
      setPayNote("This tutor has not set a session price yet — no payment is required now. Our team will confirm the fee with you.");
    } catch (e) {
      toast.error((e as Error)?.message ?? "Could not create booking");
    } finally { setBusy(false); }
  };

  return (
    <Dialog open={!!tutor} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === "details" && `Book a session with ${tutor.display_name}`}
            {step === "auth" && "Sign in to continue"}
            {step === "pay" && "Payment"}
            {step === "bio" && "A few more details"}
          </DialogTitle>
          <DialogDescription>
            {step === "details" && "Three quick steps — course, schedule, then your details."}
            {step === "auth" && "Your details are saved, nothing is lost."}
            {step === "pay" && "Step 3 of 4 — secure payment via Paystack."}
            {step === "bio" && "Step 4 of 4 — help your tutor prepare for the first session."}
          </DialogDescription>
        </DialogHeader>

        {step === "details" && (
          <>
            {/* progress rail */}
            <div className="flex items-center gap-2">
              {["Course", "Schedule", "You"].map((label, i) => {
                const n = i + 1;
                const done = sub > n;
                const active = sub === n;
                return (
                  <button key={label} type="button" onClick={() => n < sub && setSub(n)}
                    className={`flex flex-1 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${active ? "border-primary bg-primary/10 text-foreground" : done ? "border-primary/40 text-primary" : "text-muted-foreground"}`}>
                    <span className={`grid size-5 shrink-0 place-items-center rounded-full text-[10px] ${active || done ? "bg-primary text-primary-foreground" : "bg-muted"}`}>{done ? "✓" : n}</span>
                    <span className="truncate">{label}</span>
                  </button>
                );
              })}
            </div>

            <div className="grid gap-4">
              {/* ---------- 1. Course ---------- */}
              {sub === 1 && (
                <>
                  <div className="grid gap-2">
                    <Label>Which examinations is this for?</Label>
                    <div className="grid gap-2 sm:grid-cols-3">
                      {([
                        { key: "international", label: "International", hint: "Cambridge, IB, SAT…" },
                        { key: "local", label: "Local", hint: "JAMB, WAEC, NECO…" },
                        { key: "both", label: "Both", hint: "Mix of exam boards" },
                      ] as const).map((o) => (
                        <button key={o.key} type="button" onClick={() => setScope(o.key)}
                          className={`rounded-2xl border p-3 text-left transition ${form.examScope === o.key ? "border-primary bg-primary/10 ring-1 ring-primary" : "hover:border-primary/40"}`}>
                          <span className="block text-sm font-bold">{o.label}</span>
                          <span className="block text-xs text-muted-foreground">{o.hint}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {examOptions.length > 0 && (
                    <div className="grid gap-2">
                      <Label>Exam type(s)</Label>
                      <div className="flex flex-wrap gap-1.5">
                        {examOptions.map((e) => (
                          <button key={e} type="button" onClick={() => toggleExam(e)}
                            className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${form.examTypes.includes(e) ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground hover:border-primary/40"}`}>
                            {e}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {form.examTypes.length > 0 && (
                    <div className="grid gap-2">
                      <Label>Subject(s)</Label>
                      <div className="flex flex-wrap gap-1.5">
                        {SUBJECT_CATALOGUE.map((s) => (
                          <button key={s} type="button" onClick={() => toggleSubject(s)}
                            className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${form.subjectNames.includes(s) ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground hover:border-primary/40"}`}>
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {form.subjectNames.length > 0 && (
                    <div className="grid gap-2 rounded-2xl border bg-muted/30 p-3">
                      <Label className="text-xs uppercase tracking-wide text-muted-foreground">Contacts per week · 1 contact = 1 hour</Label>
                      {form.subjectNames.map((name) => (
                        <div key={name} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                          <span className="font-medium">{name}</span>
                          <div className="flex items-center gap-2">
                            <Button type="button" size="icon" variant="outline" className="size-7" onClick={() => setContacts(name, contactsFor(name) - 1)}>−</Button>
                            <span className="w-6 text-center font-bold">{contactsFor(name)}</span>
                            <Button type="button" size="icon" variant="outline" className="size-7" onClick={() => setContacts(name, contactsFor(name) + 1)}>+</Button>
                            <span className="w-24 text-right text-xs text-muted-foreground">{hourlyRate ? `₦${(hourlyRate * contactsFor(name)).toLocaleString()}` : "—"}/week</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* ---------- 2. Schedule ---------- */}
              {sub === 2 && (
                <>
                  <div className="grid gap-1.5">
                    <Label>Pick your weekly slots</Label>
                    <p className="text-xs text-muted-foreground">
                      {hasPublishedAvailability
                        ? "Only times this tutor is available are shown."
                        : "This tutor has not published slots yet — choose from the standard teaching window."}
                      {" "}You need {totalContacts || 0} slot{totalContacts === 1 ? "" : "s"} for {totalContacts || 0} contact{totalContacts === 1 ? "" : "s"} per week.
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {FULL_DAYS.map((d, i) => {
                        const open = !!availability[i]?.length;
                        return (
                          <button key={d} type="button" disabled={!open} onClick={() => setActiveDay(i)}
                            className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${dayInView === i ? "border-primary bg-primary text-primary-foreground" : open ? "text-muted-foreground hover:border-primary/40" : "cursor-not-allowed opacity-40"}`}>
                            {DAY_NAMES[i]}
                            {form.picked.some((k) => k.startsWith(`${i}|`)) && <span className="ml-1">•</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {dayInView === null ? (
                      <p className="col-span-full text-sm text-muted-foreground">No availability published.</p>
                    ) : (availability[dayInView] ?? []).map((t) => {
                      const active = form.picked.includes(`${dayInView}|${t}`);
                      return (
                        <button key={t} type="button" onClick={() => togglePick(dayInView, t)}
                          className={`rounded-xl border px-2 py-2 text-xs font-semibold transition ${active ? "border-primary bg-primary text-primary-foreground" : "hover:border-primary/40"}`}>
                          {t}
                        </button>
                      );
                    })}
                  </div>

                  <div className="grid gap-1.5 rounded-2xl border bg-muted/30 p-3">
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">Selected slots ({form.picked.length})</Label>
                    {form.picked.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Nothing selected yet.</p>
                    ) : (
                      <ul className="grid gap-1.5">
                        {form.picked.map((k) => {
                          const [d, t] = k.split("|");
                          return (
                            <li key={k} className="flex items-center justify-between rounded-lg bg-background px-3 py-1.5 text-sm">
                              <span className="font-medium">{FULL_DAYS[Number(d)]} · {t} – {String(Number(t.slice(0, 2)) + 1).padStart(2, "0")}:00</span>
                              <button type="button" onClick={() => togglePick(Number(d), t)} className="text-xs font-semibold text-muted-foreground hover:text-destructive">Remove</button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                    {form.date && <p className="text-xs text-muted-foreground">First session: {form.date} at {form.time}</p>}
                  </div>

                  <div className="grid gap-1.5"><Label>How would you like to meet?</Label>
                    <Select value={form.sessionType} onValueChange={(v) => setForm({ ...form, sessionType: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="google_meet">Google Meet</SelectItem>
                        <SelectItem value="zoom">Zoom</SelectItem>
                        <SelectItem value="whatsapp_coordination">WhatsApp coordination</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {/* ---------- 3. You ---------- */}
              {sub === 3 && (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="grid gap-1.5"><Label>Your name *</Label><Input value={form.studentName} onChange={(e) => setForm({ ...form, studentName: e.target.value })} /></div>
                    <div className="grid gap-1.5"><Label>Email *</Label><Input type="email" value={form.studentEmail} onChange={(e) => setForm({ ...form, studentEmail: e.target.value })} /></div>
                    <div className="grid gap-1.5 sm:col-span-2"><Label>Phone</Label><Input value={form.studentPhone} onChange={(e) => setForm({ ...form, studentPhone: e.target.value })} /></div>
                  </div>
                  <div className="grid gap-1.5"><Label>Notes (optional)</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Topics you want to focus on" /></div>
                  <div className="rounded-2xl border bg-muted/30 p-3 text-sm">
                    <p className="font-semibold">{planSummary || "No subjects selected yet"}</p>
                    <p className="text-xs text-muted-foreground">{form.examTypes.join(", ") || "—"} · {form.availableDays.map((d) => d.slice(0, 3)).join(", ") || "days TBC"} · {form.availableTimes || "times TBC"}</p>
                  </div>
                </>
              )}
            </div>

            {/* sticky price + actions */}
            <div className="sticky bottom-0 -mx-6 mt-2 border-t bg-background/95 px-6 pt-3 backdrop-blur">
              <div className="mb-3 flex items-end justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{totalContacts} contact{totalContacts === 1 ? "" : "s"}/week{hourlyRate ? ` × ₦${hourlyRate.toLocaleString()}` : ""}</p>
                  <p className="font-display text-xl font-bold">{priceAmount ? `₦${priceAmount.toLocaleString()}` : "Fee to be confirmed"} <span className="text-xs font-normal text-muted-foreground">per week</span></p>
                </div>
                {priceGBP > 0 && <p className="text-xs text-muted-foreground">≈ £{priceGBP}</p>}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => (sub === 1 ? onClose() : setSub(sub - 1))}>{sub === 1 ? "Cancel" : "Back"}</Button>
                {sub < 3
                  ? <Button className="flex-1" onClick={nextSub}>Continue</Button>
                  : <Button className="flex-1" onClick={submitDetails} disabled={busy}>{busy && <Loader2 className="animate-spin" />} Continue to payment</Button>}
              </div>
            </div>
          </>
        )}


        {step === "auth" && (
          <>
            <div className="grid gap-3">
              <div className="grid gap-1.5"><Label>Email</Label><Input type="email" value={auth.email} onChange={(e) => setAuth({ ...auth, email: e.target.value })} /></div>
              <div className="grid gap-1.5"><Label>Password</Label><Input type="password" value={auth.password} onChange={(e) => setAuth({ ...auth, password: e.target.value })} /></div>
              <button type="button" className="text-left text-xs font-semibold text-primary underline-offset-2 hover:underline"
                onClick={() => setAuth((a) => ({ ...a, mode: a.mode === "signin" ? "signup" : "signin" }))}>
                {auth.mode === "signin" ? "New here? Create an account instead" : "Already have an account? Sign in"}
              </button>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStep("details")}>Back</Button>
              <Button onClick={doAuth} disabled={busy}>{busy && <Loader2 className="animate-spin" />} {auth.mode === "signin" ? "Sign in & continue" : "Create account & continue"}</Button>
            </DialogFooter>
          </>
        )}

        {step === "pay" && (
          <>
            <div className="rounded-2xl border bg-muted/40 p-4 text-sm">
              <p className="font-semibold">Booking ref: <span className="font-mono">{bookingRef ?? bookingId}</span></p>
              <p className="mt-1 text-muted-foreground">{planSummary} with {tutor.display_name} · starts {preferredStart && new Date(preferredStart).toLocaleString()}</p>
              <p className="mt-2 font-display text-xl font-bold">{priceAmount ? `₦${priceAmount.toLocaleString()} / week` : "Fee to be confirmed"}</p>
            </div>
            {busy && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Redirecting to Paystack…</p>}
            {payNote && <p className="text-sm text-muted-foreground">{payNote}</p>}
            <DialogFooter className="flex-wrap gap-2">
              {waUrl && <Button variant="outline" asChild><a href={waUrl} target="_blank" rel="noopener"><MessageCircle /> WhatsApp us</a></Button>}
              {priceAmount > 0 && payNote && <Button onClick={createBookingAndPay} disabled={busy}>Retry payment</Button>}
              <Button onClick={() => setStep("bio")} variant={payNote ? "default" : "outline"}>Continue to bio details</Button>
            </DialogFooter>
          </>
        )}

        {step === "bio" && bookingId && (
          <>
            <BookingReceipt data={{
              reference: bookingRef ?? bookingId, bookingRef, tutorName: tutor.display_name, tutorRef: tutor.ref_code,
              amount: priceAmount, currency: "NGN", start: preferredStart, durationMinutes: 60,
              paidAt: priceAmount > 0 && !payNote ? new Date().toISOString() : null,
            }} />
            <div className="mt-4"><BookingBioForm bookingId={bookingId} onDone={() => toast.success("All set — see you in class!")} /></div>
            <DialogFooter><Button variant="outline" onClick={onClose}>Close</Button></DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

