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

const TARGET_EXAMS = ["WAEC", "NECO", "JAMB", "IGCSE", "Cambridge A-Level", "SAT", "TMUA"];

export default function SummerStudentRegister() {
  const navigate = useNavigate();
  const letterRef = useRef<HTMLDivElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<null | { id: string; fullName: string }>(null);
  const [form, setForm] = useState({
    full_name: "", gender: "", age: "", home_address: "", parent_name: "",
    phone: "", email: "", current_class: "", department: "", target_exams: [] as string[],
    commit_excellence: false, commit_character: false, commit_proximity: false,
  });

  const toggleExam = (v: string) =>
    setForm((f) => ({ ...f, target_exams: f.target_exams.includes(v) ? f.target_exams.filter((x) => x !== v) : [...f.target_exams, v] }));

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
    if (!form.full_name || !form.gender || !form.age || !form.phone || !form.email || !form.current_class || !form.parent_name || !form.home_address) {
      toast.error("Please complete all required fields"); return;
    }
    if (!form.commit_excellence || !form.commit_character || !form.commit_proximity) {
      toast.error("Please accept the three commitments"); return;
    }
    setSubmitting(true);
    const { data, error } = await supabase.from("summer_student_registrations").insert({
      ...form, age: parseInt(form.age), department: form.department || null,
    }).select("id").single();
    setSubmitting(false);
    if (error || !data) { toast.error(error?.message ?? "Could not submit"); return; }

    setDone({ id: data.id, fullName: form.full_name });
    fireConfetti();
    toast.success("Admission confirmed 🎉");
  };

  // Generate PDF after letter is rendered, then email it as attachment.
  const [pdf, setPdf] = useState<{ download: () => void; fileName: string } | null>(null);
  useEffect(() => {
    if (!done || !letterRef.current) return;
    let cancelled = false;
    (async () => {
      try {
        const admissionId = `CUT-STU-${done.id.slice(0, 8).toUpperCase()}`;
        const fileName = `CatchUp-Admission-${admissionId}.pdf`;
        const out = await renderLetterPdf(letterRef.current!, fileName);
        if (cancelled) return;
        setPdf({ download: out.download, fileName: out.fileName });
        supabase.functions.invoke("send-summer-admission", {
          body: {
            kind: "student", fullName: done.fullName, email: form.email,
            phone: form.phone, admissionId,
            attachmentBase64: out.base64, attachmentFilename: fileName,
          },
        }).catch(() => {});
      } catch { /* PDF failed – user still has on-screen letter and print */ }
    })();
    return () => { cancelled = true; };
  }, [done]);

  if (done) {
    const admissionId = `CUT-STU-${done.id.slice(0, 8).toUpperCase()}`;
    return (
      <SiteShell>
        <Seo title="Admission confirmed | CatchUp Tutors" description="Your CatchUp Tutors Summer Academy admission letter." path="/summerlessons/student" noindex />
        <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 print:py-0 print:max-w-none">
          <div className="mb-8 text-center print:hidden">
            <PartyPopper className="mx-auto h-10 w-10 text-[#FF6B12]" />
            <h1 className="mt-4 font-display text-3xl font-bold text-brand-navy sm:text-4xl">Congratulations, {done.fullName.split(" ")[0]}!</h1>
            <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
              Your seat is confirmed. Your admission letter has been emailed to you — you can also print or download it below.
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
            <AdmissionLetter ref={letterRef} kind="student" fullName={done.fullName} admissionId={admissionId} />
          </div>
        </section>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <Seo title="Register for Free Summer Lessons | CatchUp Tutors" description="Student registration form for the CatchUp Tutors Free Summer Academy in Ilorin." path="/summerlessons/student" />
      <PageHero eyebrow="Student registration" title="Reserve your free seat." description="Fill in your details below. Once you submit, your admission letter appears instantly and is emailed to you." />
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <Button variant="ghost" onClick={() => navigate("/summerlessons")} className="mb-6"><ArrowLeft /> Back to Summer Lessons</Button>
        <div className="rounded-3xl border bg-card p-6 shadow-soft sm:p-10">
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

          <Button onClick={submit} disabled={submitting} size="lg" className="mt-8 w-full sm:w-auto">
            {submitting && <Loader2 className="animate-spin" />} Submit & get admission letter <ArrowRight />
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
