import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import confetti from "canvas-confetti";
import { Loader2, ArrowRight, Printer, Download, ArrowLeft, PartyPopper, Mail } from "lucide-react";
import { renderLetterPdf } from "@/lib/letter-pdf";
import { SiteShell, PageHero, Seo } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AdmissionLetter } from "@/components/admission-letter";
import { heroImages } from "@/assets/heroes";

const SUBJECTS = ["Mathematics", "Further Mathematics", "Physics", "Chemistry", "Biology", "English", "Economics"];

export default function SummerTutorRegister() {
  const navigate = useNavigate();
  const letterRef = useRef<HTMLDivElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<null | { id: string; fullName: string; subjects: string[] }>(null);
  const [form, setForm] = useState({
    full_name: "", gender: "", phone: "", email: "", qualification: "",
    subjects: [] as string[], experience_years: "", availability: "", motivation: "",
    commit_integrity: false, commit_impact: false, commit_reliability: false,
  });

  const toggleSubject = (v: string) =>
    setForm((f) => ({ ...f, subjects: f.subjects.includes(v) ? f.subjects.filter((x) => x !== v) : [...f.subjects, v] }));

  const fireConfetti = () => {
    const end = Date.now() + 1200;
    const colors = ["#000E2E", "#FF6B12", "#1151CF", "#ffffff"];
    (function frame() {
      confetti({ particleCount: 5, angle: 60, spread: 60, origin: { x: 0, y: 0.7 }, colors });
      confetti({ particleCount: 5, angle: 120, spread: 60, origin: { x: 1, y: 0.7 }, colors });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  };

  const submit = async () => {
    if (!form.full_name || !form.phone || !form.email || !form.qualification || !form.availability || form.subjects.length === 0) {
      toast.error("Please complete all required fields"); return;
    }
    if (!form.commit_integrity || !form.commit_impact || !form.commit_reliability) {
      toast.error("Please accept the three volunteer commitments"); return;
    }
    setSubmitting(true);
    const applicationId = crypto.randomUUID();
    const { error } = await supabase.from("summer_tutor_volunteers").insert({
      id: applicationId, ...form,
      experience_years: form.experience_years ? parseInt(form.experience_years) : null,
      gender: form.gender || null,
      motivation: form.motivation || null,
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }

    setDone({ id: applicationId, fullName: form.full_name, subjects: form.subjects });
    fireConfetti();
    toast.success("Application received 🎉");
  };

  const [pdf, setPdf] = useState<{ download: () => void; fileName: string } | null>(null);
  useEffect(() => {
    if (!done || !letterRef.current) return;
    let cancelled = false;
    (async () => {
      try {
        const admissionId = `CUT-TUT-${done.id.slice(0, 8).toUpperCase()}`;
        const fileName = `CatchUp-Volunteer-${admissionId}.pdf`;
        const out = await renderLetterPdf(letterRef.current!, fileName);
        if (cancelled) return;
        setPdf({ download: out.download, fileName: out.fileName });
        supabase.functions.invoke("send-summer-admission", {
          body: {
            kind: "tutor", fullName: done.fullName, email: form.email,
            phone: form.phone, admissionId,
            attachmentBase64: out.base64, attachmentFilename: fileName,
          },
        }).catch(() => {});
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, [done]);

  if (done) {
    const admissionId = `CUT-TUT-${done.id.slice(0, 8).toUpperCase()}`;
    return (
      <SiteShell>
        <Seo title="Application received | CatchUp Tutors" description="Your CatchUp Tutors volunteer acceptance letter." path="/summerlessons/tutor" noindex />
        <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 print:py-0 print:max-w-none">
          <div className="mb-8 text-center print:hidden">
            <PartyPopper className="mx-auto h-10 w-10 text-[#FF6B12]" />
            <h1 className="mt-4 font-display text-3xl font-bold text-brand-navy sm:text-4xl">Welcome to the team, {done.fullName.split(" ")[0]}!</h1>
            <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
              Your acceptance letter has been emailed to you. You can also print or download a copy below.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button onClick={() => window.print()}><Printer /> Print letter</Button>
              <Button variant="outline" onClick={() => pdf?.download()} disabled={!pdf}>
                {pdf ? <Download /> : <Loader2 className="animate-spin" />}
                {pdf ? "Download PDF" : "Preparing PDF…"}
              </Button>
              <Button variant="ghost" asChild><Link to="/"><ArrowLeft /> Back to home</Link></Button>
            </div>
            <p className="mx-auto mt-4 flex max-w-md items-center justify-center gap-2 text-xs text-muted-foreground">
              <Mail className="h-3.5 w-3.5" /> A signed PDF copy is attached to the confirmation email sent to <b className="ml-1 text-foreground">{form.email}</b>. Check spam if you don't see it.
            </p>
          </div>
          <div className="print:m-0">
            <AdmissionLetter
              ref={letterRef}
              kind="tutor"
              fullName={done.fullName}
              admissionId={admissionId}
              extras={[{ label: "Subjects", value: done.subjects.join(", ") }]}
            />
          </div>
        </section>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <Seo title="Volunteer as a tutor | CatchUp Tutors" description="Apply to volunteer at the CatchUp Tutors Free Summer Academy in Ilorin." path="/summerlessons/tutor" />
      <PageHero image={heroImages.summer} eyebrow="Volunteer application" title="Teach a class this summer." description="Tell us about you. Submit the form to receive your provisional acceptance letter instantly." />
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <Button variant="ghost" onClick={() => navigate("/summerlessons")} className="mb-6"><ArrowLeft /> Back to Summer Lessons</Button>
        <div className="rounded-3xl border bg-card p-6 shadow-soft sm:p-10">
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

          <Button onClick={submit} disabled={submitting} size="lg" className="mt-8 w-full sm:w-auto">
            {submitting && <Loader2 className="animate-spin" />} Submit application <ArrowRight />
          </Button>
        </div>
      </section>
    </SiteShell>
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
