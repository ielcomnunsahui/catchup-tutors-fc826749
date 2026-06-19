import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BadgeCheck, Calendar, MessageCircle, Search, Star, Clock, Loader2 } from "lucide-react";
import { SiteShell, PageHero, Seo } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ADMIN_WHATSAPP = "2348101804411";
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type Tutor = {
  id: string; display_name: string; bio: string; photo_url: string | null;
  subjects: string[]; topics: string[]; qualifications: string[]; years_experience: number;
  pricing: { hourly?: { NGN?: number; GBP?: number } }; rating: number; review_count: number;
};
type Slot = { tutor_id: string; day_of_week: number; start_time: string; end_time: string };
type Subject = { id: string; name: string; program_id: string };

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
        supabase.from("tutor_profiles").select("id,display_name,bio,photo_url,subjects,topics,qualifications,years_experience,pricing,rating,review_count").eq("is_approved", true).eq("is_visible", true).order("rating", { ascending: false }),
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

        {loading ? (
          <div className="mt-10 flex justify-center py-16 text-muted-foreground"><Loader2 className="animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-dashed p-12 text-center">
            <BadgeCheck className="mx-auto h-10 w-10 text-primary" />
            <h2 className="mt-4 font-display text-2xl font-bold">No tutors match that search</h2>
            <p className="mx-auto mt-3 max-w-lg text-muted-foreground">Try a different subject or topic, or apply as a tutor.</p>
            <Button asChild className="mt-6"><Link to="/auth">Apply as a tutor</Link></Button>
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
                      <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
                        <Star className="size-4 text-brand-orange" fill="currentColor" /> {Number(t.rating).toFixed(1)} · {t.review_count} reviews
                      </p>
                    </div>
                  </div>
                  <p className="mt-4 line-clamp-3 text-sm text-muted-foreground">{t.bio}</p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {(t.subjects ?? []).map((s) => <span key={s} className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">{s}</span>)}
                  </div>
                  <div className="mt-4 space-y-1 text-xs text-muted-foreground">
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

function BookingDialog({ tutor, subjects, onClose }: { tutor: Tutor | null; subjects: Subject[]; onClose: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<null | { id: string; waUrl: string; summary: string }>(null);
  const [form, setForm] = useState({
    subjectId: "", date: "", time: "16:00", duration: "60", sessionType: "google_meet",
    studentName: "", studentEmail: "", notes: "",
  });

  useEffect(() => {
    if (tutor) {
      setDone(null);
      const tutorSubjects = subjects.filter((s) => (tutor.subjects ?? []).some((n) => s.name.toLowerCase().includes(n.toLowerCase())));
      setForm((f) => ({ ...f, subjectId: tutorSubjects[0]?.id ?? subjects[0]?.id ?? "" }));
    }
  }, [tutor, subjects]);

  if (!tutor) return null;

  const handle = async () => {
    if (!form.subjectId || !form.date || !form.time || !form.studentName || !form.studentEmail) {
      toast.error("Please fill out all required fields"); return;
    }
    setSubmitting(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) { toast.error("Please sign in to book a session"); window.location.href = `/auth?redirect=/tutors`; return; }

      const preferredStart = new Date(`${form.date}T${form.time}:00`).toISOString();
      const priceAmount = tutor.pricing?.hourly?.NGN ?? 0;
      const { data: booking, error } = await supabase.from("bookings").insert({
        student_id: user.id, tutor_id: tutor.id, subject_id: form.subjectId,
        preferred_start: preferredStart, duration_minutes: parseInt(form.duration),
        session_type: form.sessionType, price_amount: priceAmount, currency: "NGN",
        student_notes: form.notes || null,
      }).select("id").single();
      if (error) throw error;

      const subjectName = subjects.find((s) => s.id === form.subjectId)?.name ?? "Mathematics";
      const summary = `Hi! I just booked a ${form.duration}-min ${subjectName} session with ${tutor.display_name} for ${new Date(preferredStart).toLocaleString()}. Booking ID: ${booking.id}. — ${form.studentName} (${form.studentEmail})`;
      const waUrl = `https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(summary)}`;

      // Send confirmation email (non-blocking failure)
      supabase.functions.invoke("send-booking-email", {
        body: {
          bookingId: booking.id, studentName: form.studentName, studentEmail: form.studentEmail,
          tutorName: tutor.display_name, subjectName, preferredStart,
          durationMinutes: parseInt(form.duration), sessionType: form.sessionType,
          priceAmount, currency: "NGN", notes: form.notes,
        },
      }).catch((e) => console.warn("email failed", e));

      setDone({ id: booking.id, waUrl, summary });
      toast.success("Booking request created");
    } catch (e: unknown) {
      toast.error((e as Error)?.message ?? "Could not create booking");
    } finally { setSubmitting(false); }
  };

  return (
    <Dialog open={!!tutor} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        {!done ? (
          <>
            <DialogHeader>
              <DialogTitle>Book a session with {tutor.display_name}</DialogTitle>
              <DialogDescription>We'll email a confirmation and open WhatsApp so you can finalize timing.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-3">
              <div className="grid gap-1.5">
                <Label>Subject</Label>
                <Select value={form.subjectId} onValueChange={(v) => setForm({ ...form, subjectId: v })}>
                  <SelectTrigger><SelectValue placeholder="Pick a subject" /></SelectTrigger>
                  <SelectContent>{subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5"><Label>Date</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
                <div className="grid gap-1.5"><Label>Time</Label><Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5"><Label>Duration</Label>
                  <Select value={form.duration} onValueChange={(v) => setForm({ ...form, duration: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{[30, 60, 90, 120].map((d) => <SelectItem key={d} value={String(d)}>{d} min</SelectItem>)}</SelectContent>
                  </Select>
                </div>
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
              <div className="grid gap-1.5"><Label>Your name</Label><Input value={form.studentName} onChange={(e) => setForm({ ...form, studentName: e.target.value })} /></div>
              <div className="grid gap-1.5"><Label>Your email</Label><Input type="email" value={form.studentEmail} onChange={(e) => setForm({ ...form, studentEmail: e.target.value })} /></div>
              <div className="grid gap-1.5"><Label>Notes (optional)</Label><Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Topics you want to focus on" /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={handle} disabled={submitting}>{submitting && <Loader2 className="animate-spin" />} Confirm booking</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Booking received</DialogTitle>
              <DialogDescription>Your booking ID is <code className="font-mono text-xs">{done.id}</code>. We've emailed a confirmation. Tap below to send a WhatsApp note to the team.</DialogDescription>
            </DialogHeader>
            <div className="rounded-xl bg-muted p-4 text-sm">{done.summary}</div>
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>Close</Button>
              <Button asChild><a href={done.waUrl} target="_blank" rel="noopener"><MessageCircle /> Open WhatsApp</a></Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
