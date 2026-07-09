import { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, MapPin, CalendarDays, GraduationCap, HeartHandshake, CheckCircle2, ArrowRight } from "lucide-react";
import { SiteShell, PageHero, Seo } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const VENUE = "Al-Bayan High School, Ilorin, Kwara State, Nigeria";
const TARGET_EXAMS = ["WAEC", "NECO", "JAMB", "IGCSE", "Cambridge A-Level", "SAT", "TMUA"];
const SUBJECTS = ["Mathematics", "Further Mathematics", "Physics", "Chemistry", "Biology", "English", "Economics"];

export default function SummerLessons() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "EducationEvent",
    name: "CatchUp Tutors Free Summer Lessons",
    description: "Free in-person summer academic programme for secondary students at Al-Bayan High School, Ilorin.",
    location: { "@type": "Place", name: "Al-Bayan High School", address: { "@type": "PostalAddress", addressLocality: "Ilorin", addressRegion: "Kwara", addressCountry: "NG" } },
    organizer: { "@type": "EducationalOrganization", name: "CatchUp Tutors" },
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    isAccessibleForFree: true,
  };
  return (
    <SiteShell>
      <Seo
        title="Free Summer Lessons | CatchUp Tutors"
        description="Register for CatchUp Tutors' free in-person summer academic programme at Al-Bayan High School, Ilorin. Open to students and volunteer tutors."
        path="/summerlessons"
        jsonLd={jsonLd}
      />
      <PageHero
        eyebrow="Community programme"
        title="Free Summer Lessons — Ilorin"
        description="A fully-funded, in-person summer academy for secondary students. Taught by volunteer tutors from across the country, hosted at Al-Bayan High School."
      >
        <div className="flex flex-wrap gap-4 text-sm text-hero-foreground/80">
          <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4" /> {VENUE}</span>
          <span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4" /> Physical classes only</span>
        </div>
      </PageHero>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { icon: GraduationCap, title: "For students", desc: "Free coaching in Mathematics, Sciences, and exam prep for WAEC, NECO, IGCSE and A-Level." },
            { icon: HeartHandshake, title: "For volunteer tutors", desc: "Give back by teaching a class. Meals and transport within Ilorin are covered." },
            { icon: CheckCircle2, title: "Admission letter", desc: "Every accepted student receives an official admission and enrollment letter by email." },
          ].map(({ icon: Icon, title, desc }) => (
            <article key={title} className="rounded-2xl border bg-card p-6 shadow-soft">
              <Icon className="h-6 w-6 text-primary" />
              <h2 className="mt-4 font-display text-lg font-bold">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="register" className="mx-auto max-w-4xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">Register now</p>
          <h2 className="mt-3 font-display text-3xl font-bold text-brand-navy sm:text-4xl">Reserve your seat or teach a class.</h2>
        </div>
        <Tabs defaultValue="student" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="student">I'm a student</TabsTrigger>
            <TabsTrigger value="tutor">I want to volunteer</TabsTrigger>
          </TabsList>
          <TabsContent value="student" className="mt-6">
            <StudentForm />
          </TabsContent>
          <TabsContent value="tutor" className="mt-6">
            <TutorForm />
          </TabsContent>
        </Tabs>
        <p className="mt-8 text-center text-sm text-muted-foreground">
          Questions? <Link to="/contact" className="font-semibold text-primary hover:underline">Contact us</Link> or WhatsApp{" "}
          <a href="https://wa.me/2348101804411" className="font-semibold text-primary hover:underline">+234 810 180 4411</a>.
        </p>
      </section>
    </SiteShell>
  );
}

function StudentForm() {
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    full_name: "", gender: "", age: "", home_address: "", parent_name: "",
    phone: "", email: "", current_class: "", department: "", target_exams: [] as string[],
    commit_excellence: false, commit_character: false, commit_proximity: false,
  });
  const toggleExam = (v: string) =>
    setForm((f) => ({ ...f, target_exams: f.target_exams.includes(v) ? f.target_exams.filter((x) => x !== v) : [...f.target_exams, v] }));

  const submit = async () => {
    if (!form.full_name || !form.gender || !form.age || !form.phone || !form.email || !form.current_class || !form.parent_name || !form.home_address) {
      toast.error("Please complete all required fields"); return;
    }
    if (!form.commit_excellence || !form.commit_character || !form.commit_proximity) {
      toast.error("Please accept the three commitments"); return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("summer_student_registrations").insert({
      ...form, age: parseInt(form.age), department: form.department || null,
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    setDone(true); toast.success("Registration submitted");
  };

  if (done) return <SuccessCard title="Registration received" body="We've saved your details. You'll receive an admission and enrollment letter by email once your seat is confirmed." />;

  return (
    <div className="rounded-3xl border bg-card p-6 shadow-soft sm:p-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name *"><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></Field>
        <Field label="Gender *">
          <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem></SelectContent>
          </Select>
        </Field>
        <Field label="Age *"><Input type="number" min={5} max={30} value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} /></Field>
        <Field label="Current class *"><Input placeholder="e.g. SS2, Year 11" value={form.current_class} onChange={(e) => setForm({ ...form, current_class: e.target.value })} /></Field>
        <Field label="Department (optional)"><Input placeholder="Science / Arts / Commercial" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} /></Field>
        <Field label="Phone *"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
        <Field label="Email *"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
        <Field label="Parent / guardian name *"><Input value={form.parent_name} onChange={(e) => setForm({ ...form, parent_name: e.target.value })} /></Field>
        <Field label="Home address *" className="sm:col-span-2"><Textarea rows={2} value={form.home_address} onChange={(e) => setForm({ ...form, home_address: e.target.value })} /></Field>
      </div>

      <div className="mt-6">
        <Label className="text-sm">Target exams</Label>
        <div className="mt-3 flex flex-wrap gap-2">
          {TARGET_EXAMS.map((ex) => {
            const active = form.target_exams.includes(ex);
            return (
              <button type="button" key={ex} onClick={() => toggleExam(ex)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:bg-muted"}`}>
                {ex}
              </button>
            );
          })}
        </div>
      </div>

      <fieldset className="mt-8 space-y-3 rounded-2xl bg-muted/50 p-5">
        <legend className="px-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Student commitments</legend>
        <Commit label="I commit to excellence — attending consistently and giving my best." checked={form.commit_excellence} onChange={(v) => setForm({ ...form, commit_excellence: v })} />
        <Commit label="I commit to good character — respecting tutors, peers, and the venue." checked={form.commit_character} onChange={(v) => setForm({ ...form, commit_character: v })} />
        <Commit label="I confirm I can attend physically at Al-Bayan High School, Ilorin." checked={form.commit_proximity} onChange={(v) => setForm({ ...form, commit_proximity: v })} />
      </fieldset>

      <Button onClick={submit} disabled={submitting} className="mt-6 w-full sm:w-auto">
        {submitting && <Loader2 className="animate-spin" />} Submit registration <ArrowRight />
      </Button>
    </div>
  );
}

function TutorForm() {
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    full_name: "", gender: "", phone: "", email: "", qualification: "",
    subjects: [] as string[], experience_years: "", availability: "", motivation: "",
    commit_integrity: false, commit_impact: false, commit_reliability: false,
  });
  const toggleSubject = (v: string) =>
    setForm((f) => ({ ...f, subjects: f.subjects.includes(v) ? f.subjects.filter((x) => x !== v) : [...f.subjects, v] }));

  const submit = async () => {
    if (!form.full_name || !form.phone || !form.email || !form.qualification || !form.availability || form.subjects.length === 0) {
      toast.error("Please complete all required fields"); return;
    }
    if (!form.commit_integrity || !form.commit_impact || !form.commit_reliability) {
      toast.error("Please accept the three volunteer commitments"); return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("summer_tutor_volunteers").insert({
      ...form,
      experience_years: form.experience_years ? parseInt(form.experience_years) : null,
      gender: form.gender || null,
      motivation: form.motivation || null,
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    setDone(true); toast.success("Application submitted");
  };

  if (done) return <SuccessCard title="Application received" body="Thank you for volunteering. Our team will review your application and get in touch by email." />;

  return (
    <div className="rounded-3xl border bg-card p-6 shadow-soft sm:p-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name *"><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></Field>
        <Field label="Gender">
          <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem></SelectContent>
          </Select>
        </Field>
        <Field label="Phone *"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
        <Field label="Email *"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
        <Field label="Highest qualification *" className="sm:col-span-2"><Input placeholder="e.g. BSc Mathematics, University of Ilorin" value={form.qualification} onChange={(e) => setForm({ ...form, qualification: e.target.value })} /></Field>
        <Field label="Years of teaching experience"><Input type="number" min={0} value={form.experience_years} onChange={(e) => setForm({ ...form, experience_years: e.target.value })} /></Field>
        <Field label="Availability *"><Input placeholder="e.g. Mon-Fri afternoons, all of August" value={form.availability} onChange={(e) => setForm({ ...form, availability: e.target.value })} /></Field>
      </div>

      <div className="mt-6">
        <Label className="text-sm">Subjects you can teach *</Label>
        <div className="mt-3 flex flex-wrap gap-2">
          {SUBJECTS.map((s) => {
            const active = form.subjects.includes(s);
            return (
              <button type="button" key={s} onClick={() => toggleSubject(s)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:bg-muted"}`}>
                {s}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6">
        <Label className="text-sm">Why do you want to volunteer? (optional)</Label>
        <Textarea rows={3} className="mt-2" value={form.motivation} onChange={(e) => setForm({ ...form, motivation: e.target.value })} />
      </div>

      <fieldset className="mt-8 space-y-3 rounded-2xl bg-muted/50 p-5">
        <legend className="px-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Volunteer commitments</legend>
        <Commit label="I will teach with integrity and treat every student with respect." checked={form.commit_integrity} onChange={(v) => setForm({ ...form, commit_integrity: v })} />
        <Commit label="I commit to preparing lessons and creating real learning impact." checked={form.commit_impact} onChange={(v) => setForm({ ...form, commit_impact: v })} />
        <Commit label="I will show up on time and honour my scheduled sessions." checked={form.commit_reliability} onChange={(v) => setForm({ ...form, commit_reliability: v })} />
      </fieldset>

      <Button onClick={submit} disabled={submitting} className="mt-6 w-full sm:w-auto">
        {submitting && <Loader2 className="animate-spin" />} Submit application <ArrowRight />
      </Button>
    </div>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`grid gap-1.5 ${className ?? ""}`}>
      <Label className="text-sm">{label}</Label>
      {children}
    </div>
  );
}

function Commit({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-start gap-3 text-sm leading-6 text-foreground">
      <Checkbox checked={checked} onCheckedChange={(v) => onChange(!!v)} className="mt-0.5" />
      <span>{label}</span>
    </label>
  );
}

function SuccessCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-3xl border bg-card p-10 text-center shadow-soft">
      <CheckCircle2 className="mx-auto h-10 w-10 text-brand-green" />
      <h3 className="mt-4 font-display text-2xl font-bold text-brand-navy">{title}</h3>
      <p className="mx-auto mt-3 max-w-lg text-muted-foreground">{body}</p>
      <Button asChild className="mt-6"><Link to="/">Back to home</Link></Button>
    </div>
  );
}
