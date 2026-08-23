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

const ADMIN_WHATSAPP = "447350890668";
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const FULL_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

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

  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [booking, setBooking] = useState<Tutor | null>(null);

  useEffect(() => {
    (async () => {
      const [tRes, aRes, sRes] = await Promise.all([
        supabase.from("tutor_profiles").select("id,display_name,bio,photo_url,subjects,topics,qualifications,years_experience,pricing,rating,review_count,ref_code,highest_qualification").eq("is_approved", true).eq("is_visible", true).order("rating", { ascending: false }),
        supabase.from("tutor_availability").select("tutor_id,day_of_week,start_time,end_time").eq("is_active", true),
        supabase.from("subjects").select("id,name,program_id"),
      ]);
      setTutors((tRes.data as Tutor[]) ?? []);
      setSlots((aRes.data as Slot[]) ?? []);
      setSubjects((sRes.data as Subject[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return tutors;
    return tutors.filter((t) =>
      [t.display_name, t.bio, ...(t.subjects ?? []), ...(t.topics ?? [])]
        .filter(Boolean).some((x) => x.toLowerCase().includes(needle))
    );
  }, [q, tutors]);

  return (
    <SiteShell>
      <Seo title="Expert Mathematics Tutors | CatchUp Tutors" description="Find approved Cambridge and IGCSE Mathematics tutors and book one-to-one sessions." path="/tutors" jsonLd={jsonLd} />
      <PageHero eyebrow="Approved experts" title="Find the tutor who understands your next step." description="Compare subjects, teaching focus, experience, availability, and tutor-set session pricing." />
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 rounded-2xl border bg-card px-4 shadow-soft">
          <Search className="text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tutors by subject or topic" aria-label="Search tutors" className="h-14 flex-1 bg-transparent outline-none" />
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-4 rounded-2xl border bg-muted/40 p-5">
          <BadgeCheck className="text-primary" />
          <p className="flex-1 text-sm text-muted-foreground">
            Are you a teacher or subject expert? Join our team of Cambridge, Edexcel, IB, TMUA and SAT tutors.
          </p>
          <Button asChild variant="outline"><Link to="/tutors/apply">Apply as a tutor</Link></Button>
        </div>

        {loading ? (
          <div className="mt-10 flex justify-center py-16 text-muted-foreground"><Loader2 className="animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-dashed p-12 text-center">
            <BadgeCheck className="mx-auto h-10 w-10 text-primary" />
            <h2 className="mt-4 font-display text-2xl font-bold">No tutors match that search</h2>
            <p className="mx-auto mt-3 max-w-lg text-muted-foreground">Try a different subject or topic, or apply as a tutor.</p>
            <Button asChild className="mt-6"><Link to="/tutors/apply">Apply as a tutor</Link></Button>
          </div>
        ) : (
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((t) => {
              const sl = slots.filter((s) => s.tutor_id === t.id);
              const priceNGN = t.pricing?.hourly?.NGN; const priceGBP = t.pricing?.hourly?.GBP;
              return (
                <article key={t.id} className="flex flex-col rounded-3xl border bg-card p-6 shadow-soft">
                  <div className="flex items-center gap-4">
                    <img src={t.photo_url ?? "https://i.pravatar.cc/200"} alt={t.display_name} className="size-16 rounded-full object-cover" />
                    <div>
                      <h2 className="font-display text-lg font-bold leading-tight">{t.display_name}</h2>
                      {qualificationOf(t) && (
                        <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-brand-green/10 px-2 py-0.5 text-xs font-bold text-brand-green">
                          <GraduationCap className="size-3.5" /> {qualificationOf(t)}
                        </p>
                      )}
                      <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
                        <Star className="size-4 text-brand-orange" fill="currentColor" /> {Number(t.rating).toFixed(1)} · {t.review_count} reviews
                      </p>
                      {t.ref_code && <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">ID: {t.ref_code}</p>}
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
                    <Button onClick={() => setBooking(t)}>Book session</Button>
                  </div>
                </article>
              );

            })}
          </div>
        )}
      </section>

      <BookingDialog tutor={booking} subjects={subjects} onClose={() => setBooking(null)} />
    </SiteShell>
  );
}

type Step = "details" | "auth" | "pay" | "bio";

function BookingDialog({ tutor, subjects, onClose }: { tutor: Tutor | null; subjects: Subject[]; onClose: () => void }) {
  const [step, setStep] = useState<Step>("details");
  const [busy, setBusy] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [bookingRef, setBookingRef] = useState<string | null>(null);
  const [waUrl, setWaUrl] = useState("");
  const [payNote, setPayNote] = useState("");
  const [form, setForm] = useState({
    subjectIds: [] as string[], contacts: {} as Record<string, number>,
    date: "", time: "16:00", sessionType: "google_meet",
    studentName: "", studentEmail: "", studentPhone: "", programme: "",
    availableDays: [] as string[], availableTimes: "", notes: "",
  });
  const [auth, setAuth] = useState({ mode: "signin" as "signin" | "signup", email: "", password: "" });

  useEffect(() => {
    if (!tutor) return;
    setStep("details"); setBookingId(null); setBookingRef(null); setPayNote("");
    setForm((f) => ({ ...f, subjectIds: [], contacts: {} }));
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) setForm((f) => ({ ...f, studentEmail: f.studentEmail || data.user!.email! }));
    });
  }, [tutor, subjects]);

  if (!tutor) return null;

  const hourlyRate = tutor.pricing?.hourly?.NGN ?? 0;
  const hourlyGBP = tutor.pricing?.hourly?.GBP ?? 0;
  const selectedSubjects = subjects.filter((s) => form.subjectIds.includes(s.id));
  const contactsFor = (id: string) => form.contacts[id] ?? 1;
  /** Each contact = 1 hour of one subject, charged at the tutor's hourly rate. */
  const totalContacts = form.subjectIds.reduce((n, id) => n + contactsFor(id), 0);
  const priceAmount = hourlyRate * totalContacts;
  const priceGBP = hourlyGBP * totalContacts;
  const subjectName = selectedSubjects.map((s) => s.name).join(", ") || "Mathematics";
  const primarySubjectId = form.subjectIds[0] ?? "";
  const toggleSubject = (id: string) =>
    setForm((f) => f.subjectIds.includes(id)
      ? { ...f, subjectIds: f.subjectIds.filter((x) => x !== id) }
      : { ...f, subjectIds: [...f.subjectIds, id], contacts: { ...f.contacts, [id]: f.contacts[id] ?? 1 } });
  const setContacts = (id: string, n: number) =>
    setForm((f) => ({ ...f, contacts: { ...f.contacts, [id]: Math.min(7, Math.max(1, n)) } }));
  const planSummary = selectedSubjects
    .map((s) => `${s.name} × ${contactsFor(s.id)} contact(s)/week`).join("; ");
  const preferredStart = form.date && form.time ? new Date(`${form.date}T${form.time}:00`).toISOString() : "";

  const toggleDay = (d: string) =>
    setForm((f) => ({ ...f, availableDays: f.availableDays.includes(d) ? f.availableDays.filter((x) => x !== d) : [...f.availableDays, d] }));

  /** Step 1 → sign in (or straight to payment when already signed in). */
  const submitDetails = async () => {
    if (!form.subjectIds.length) { toast.error("Select at least one subject"); return; }
    if (!form.date || !form.time || !form.studentName || !form.studentEmail || !form.programme) {
      toast.error("Please fill out name, email, programme, date and time"); return;
    }
    if (!form.availableDays.length) { toast.error("Pick the days you want your contacts to hold"); return; }
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
          preferred_start: preferredStart, duration_minutes: totalContacts * 60,
          session_type: form.sessionType, price_amount: priceAmount, currency: "NGN",
          student_notes: [planSummary, form.notes].filter(Boolean).join(" — ") || null,
          bio_details: { plan: selectedSubjects.map((s) => ({ subject: s.name, contactsPerWeek: contactsFor(s.id) })), hourlyRate, totalContacts }, student_name: form.studentName,
          student_email: form.studentEmail, student_phone: form.studentPhone || null,
          programme: form.programme, available_days: form.availableDays,
          available_times: form.availableTimes || null,
        }).select("id,ref_code").single();
        if (error) throw error;
        id = booking.id; ref = booking.ref_code;
        setBookingId(id); setBookingRef(ref);

        supabase.functions.invoke("send-booking-email", {
          body: {
            bookingId: id, studentName: form.studentName, studentEmail: form.studentEmail,
            tutorName: tutor.display_name, subjectName, preferredStart,
            durationMinutes: totalContacts * 60, sessionType: form.sessionType,
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
            {step === "details" && "Step 1 of 4 — brief details. Sign in, payment and your full bio come next."}
            {step === "auth" && "Step 2 of 4 — your details are saved, nothing is lost."}
            {step === "pay" && "Step 3 of 4 — secure payment via Paystack."}
            {step === "bio" && "Step 4 of 4 — help your tutor prepare for the first session."}
          </DialogDescription>
        </DialogHeader>

        {step === "details" && (
          <>
            <div className="grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5"><Label>Your name *</Label><Input value={form.studentName} onChange={(e) => setForm({ ...form, studentName: e.target.value })} /></div>
                <div className="grid gap-1.5"><Label>Email *</Label><Input type="email" value={form.studentEmail} onChange={(e) => setForm({ ...form, studentEmail: e.target.value })} /></div>
                <div className="grid gap-1.5"><Label>Phone</Label><Input value={form.studentPhone} onChange={(e) => setForm({ ...form, studentPhone: e.target.value })} /></div>
                <div className="grid gap-1.5"><Label>Programme *</Label><Input value={form.programme} onChange={(e) => setForm({ ...form, programme: e.target.value })} placeholder="e.g. IGCSE Maths" /></div>
              </div>
              <div className="grid gap-2">
                <Label>Subjects you want one-to-one tutoring in *</Label>
                <div className="flex flex-wrap gap-1.5">
                  {subjects.map((s) => (
                    <button key={s.id} type="button" onClick={() => toggleSubject(s.id)}
                      className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${form.subjectIds.includes(s.id) ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground hover:border-primary/40"}`}>
                      {s.name}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">{form.subjectIds.length} subject{form.subjectIds.length === 1 ? "" : "s"} selected</p>
              </div>

              {selectedSubjects.length > 0 && (
                <div className="grid gap-2 rounded-2xl border bg-muted/30 p-3">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">Contacts per week (1 contact = 1 hour)</Label>
                  {selectedSubjects.map((s) => (
                    <div key={s.id} className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-medium">{s.name}</span>
                      <div className="flex items-center gap-2">
                        <Button type="button" size="icon" variant="outline" className="size-7" onClick={() => setContacts(s.id, contactsFor(s.id) - 1)}>−</Button>
                        <span className="w-6 text-center font-bold">{contactsFor(s.id)}</span>
                        <Button type="button" size="icon" variant="outline" className="size-7" onClick={() => setContacts(s.id, contactsFor(s.id) + 1)}>+</Button>
                        <span className="w-24 text-right text-xs text-muted-foreground">{hourlyRate ? `₦${(hourlyRate * contactsFor(s.id)).toLocaleString()}` : "—"}/week</span>
                      </div>
                    </div>
                  ))}
                  <div className="mt-1 flex items-end justify-between border-t pt-2">
                    <div>
                      <p className="text-xs text-muted-foreground">{totalContacts} contact(s)/week × {hourlyRate ? `₦${hourlyRate.toLocaleString()}` : "rate TBC"} per hour</p>
                      <p className="font-display text-xl font-bold">{priceAmount ? `₦${priceAmount.toLocaleString()}` : "Fee to be confirmed"} <span className="text-xs font-normal text-muted-foreground">per week</span></p>
                    </div>
                    {priceGBP > 0 && <p className="text-xs text-muted-foreground">≈ £{priceGBP}</p>}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5"><Label>Date *</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
                <div className="grid gap-1.5"><Label>Time *</Label><Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5"><Label>Session</Label>
                  <Select value={form.sessionType} onValueChange={(v) => setForm({ ...form, sessionType: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="google_meet">Google Meet</SelectItem>
                      <SelectItem value="zoom">Zoom</SelectItem>
                      <SelectItem value="whatsapp_coordination">WhatsApp coordination</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label>Days for your contacts *</Label>
                <div className="flex flex-wrap gap-1.5">
                  {FULL_DAYS.map((d) => (
                    <button key={d} type="button" onClick={() => toggleDay(d)}
                      className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${form.availableDays.includes(d) ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground hover:border-primary/40"}`}>
                      {d.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid gap-1.5"><Label>Preferred times *</Label><Input value={form.availableTimes} onChange={(e) => setForm({ ...form, availableTimes: e.target.value })} placeholder="e.g. Mon & Wed 5–6pm" /></div>
              <div className="grid gap-1.5"><Label>Notes (optional)</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Topics you want to focus on" /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={submitDetails} disabled={busy}>{busy && <Loader2 className="animate-spin" />} Continue</Button>
            </DialogFooter>
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
              amount: priceAmount, currency: "NGN", start: preferredStart, durationMinutes: totalContacts * 60,
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

