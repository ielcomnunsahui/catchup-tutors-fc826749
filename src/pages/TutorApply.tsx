import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { CheckCircle2, Clock3, GraduationCap, Loader2, Upload, XCircle, AlertTriangle } from "lucide-react";
import { SiteShell, PageHero, Seo } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { heroImages } from "@/assets/heroes";

const OCCUPATIONS = ["Full-time Teacher", "Professional Tutor", "University Student / Graduate", "Other"];
const QUALIFICATIONS = ["Bachelor's Degree", "Master's Degree / PhD", "Undergraduate Student", "Other"];
const EXPERIENCE = ["Less than 1 year", "1–3 years", "3–5 years", "5+ years"];
const SUBJECTS = [
  "Mathematics", "Further Mathematics", "Physics", "Chemistry", "Biology", "English",
  "Economics", "Law", "Business", "Computing", "Sociology", "Accounting", "Geography",
];
const CURRICULA = [
  "IGCSE / Cambridge", "Edexcel", "A-Level", "IB", "TMUA", "SAT",
  "WAEC / NECO", "Checkpoint (Lower Secondary/Primary)", "Other international/local curricula",
];
const VIDEO_OPTIONS = [
  "Yes — I have created educational video content",
  "No, but I am comfortable doing so",
  "No, and I prefer live sessions only",
];
const TOOLS = ["Zoom / Google Meet", "Digital Whiteboards (Miro, Jamboard, BitPaper)", "Graphic Tablet / Pen Tablet", "Google Classroom"];
const HOURS = ["1–5 hours", "5–10 hours", "10–20 hours", "20+ hours"];
const AVAILABILITY = ["Weekday Mornings", "Weekday Afternoons/Evenings", "Weekends"];

const MAX_FILE_MB = 5;
/** Edge function requests are capped well below 10MB; keep the encoded payload small. */
const MAX_ENCODED_BYTES = 5_000_000;

const toBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error(`Could not read ${file.name}. Please try a different file.`));
    r.readAsDataURL(file);
  });

/** Downscale a passport photo so the upload stays small. */
const photoToBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const max = 800;
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      URL.revokeObjectURL(url);
      if (!ctx) return reject(new Error("Could not process the photograph."));
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("That photograph could not be read. Please upload a JPG or PNG.")); };
    img.src = url;
  });

/** Supabase invoke hides the response body on non-2xx; dig the real message out. */
const readFunctionError = async (error: unknown): Promise<string | null> => {
  const res = (error as { context?: Response })?.context;
  if (!res || typeof res.text !== "function") return null;
  try {
    const body = await res.text();
    const parsed = JSON.parse(body) as { error?: unknown };
    const e = parsed.error;
    if (typeof e === "string") return e;
    if (e && typeof e === "object") {
      const fields = Object.entries(e as Record<string, string[]>)
        .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
        .join("; ");
      if (fields) return `Please check these answers — ${fields}`;
    }
    return body.slice(0, 300) || null;
  } catch {
    return null;
  }
};

function Section({ step, title, description, children }: { step: number; title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border bg-card p-6 shadow-soft sm:p-8">
      <div className="flex items-start gap-4">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 font-display text-sm font-bold text-primary">{step}</span>
        <div>
          <h2 className="font-display text-xl font-bold">{title}</h2>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
      </div>
      <div className="mt-6 space-y-5">{children}</div>
    </section>
  );
}

function CheckList({ options, value, onChange, columns = 2 }: { options: string[]; value: string[]; onChange: (v: string[]) => void; columns?: number }) {
  return (
    <div className={`grid gap-2.5 ${columns === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
      {options.map((o) => {
        const checked = value.includes(o);
        return (
          <label key={o} className={`flex cursor-pointer items-start gap-2.5 rounded-xl border p-3 text-sm transition ${checked ? "border-primary bg-primary/5" : "hover:bg-muted/40"}`}>
            <Checkbox checked={checked} onCheckedChange={(c) => onChange(c ? [...value, o] : value.filter((x) => x !== o))} />
            <span>{o}</span>
          </label>
        );
      })}
    </div>
  );
}

function RadioList({ options, value, onChange, columns = 2 }: { options: string[]; value: string; onChange: (v: string) => void; columns?: number }) {
  return (
    <RadioGroup value={value} onValueChange={onChange} className={`grid gap-2.5 ${columns === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
      {options.map((o) => (
        <label key={o} className={`flex cursor-pointer items-start gap-2.5 rounded-xl border p-3 text-sm transition ${value === o ? "border-primary bg-primary/5" : "hover:bg-muted/40"}`}>
          <RadioGroupItem value={o} className="mt-0.5" />
          <span>{o}</span>
        </label>
      ))}
    </RadioGroup>
  );
}

export default function TutorApply() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [existing, setExisting] = useState<{ id: string; status: string; admin_feedback: string | null } | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  const [f, setF] = useState({
    fullName: "", email: "", password: "", phone: "", location: "",
    occupation: "", occupationOther: "", highestQualification: "", qualificationOther: "",
    fieldOfStudy: "", experienceBand: "", teachingPhilosophy: "",
    videoExperience: "", sampleVideoUrl: "", hasEquipment: "Yes",
    hoursPerWeek: "", introVideoUrl: "",
  });
  const [subjects, setSubjects] = useState<string[]>([]);
  const [otherSubjects, setOtherSubjects] = useState("");
  const [curricula, setCurricula] = useState<string[]>([]);
  const [tools, setTools] = useState<string[]>([]);
  const [availability, setAvailability] = useState<string[]>([]);
  const [cv, setCv] = useState<File | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!photo) { setPhotoPreview(null); return; }
    const url = URL.createObjectURL(photo);
    setPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);


  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) { setStatusLoading(false); return; }
      const { data } = await supabase
        .from("tutor_applications")
        .select("id,status,admin_feedback,full_name,email,phone")
        .eq("user_id", auth.user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) {
        setExisting({ id: data.id, status: data.status as string, admin_feedback: data.admin_feedback ?? null });
        setF((s) => ({ ...s, fullName: s.fullName || (data.full_name ?? ""), email: s.email || (data.email ?? ""), phone: s.phone || (data.phone ?? "") }));
      }
      setStatusLoading(false);
    })();
  }, []);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setF((s) => ({ ...s, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const allSubjects = [...subjects, ...otherSubjects.split(",").map((s) => s.trim()).filter(Boolean)];
    const occupation = f.occupation === "Other" ? f.occupationOther.trim() : f.occupation;
    const qualification = f.highestQualification === "Other" ? f.qualificationOther.trim() : f.highestQualification;

    if (!allSubjects.length) return toast.error("Select at least one subject you can teach.");
    if (!curricula.length) return toast.error("Select at least one exam curriculum.");
    if (!occupation) return toast.error("Tell us your current occupation.");
    if (!qualification) return toast.error("Tell us your highest qualification.");
    if (f.teachingPhilosophy.trim().length < 20) return toast.error("Please describe your teaching approach (at least 20 characters).");
    if (!cv) return toast.error("Please attach your CV/Resume.");
    for (const file of [cv, photo]) {
      if (file && file.size > MAX_FILE_MB * 1024 * 1024) return toast.error(`Files must be under ${MAX_FILE_MB}MB.`);
    }

    setBusy(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const signedIn = !!sessionData.session;
      if (!signedIn && f.password.length < 8) {
        setBusy(false);
        return toast.error("Choose a password of at least 8 characters to create your account.");
      }

      const payload = {
        fullName: f.fullName.trim(),
        email: f.email.trim(),
        password: signedIn ? undefined : f.password,
        phone: f.phone.trim(),
        location: f.location.trim(),
        occupation,
        highestQualification: qualification,
        fieldOfStudy: f.fieldOfStudy.trim(),
        experienceBand: f.experienceBand,
        subjects: allSubjects,
        curricula,
        teachingPhilosophy: f.teachingPhilosophy.trim(),
        videoExperience: f.videoExperience,
        sampleVideoUrl: f.sampleVideoUrl.trim(),
        hasEquipment: f.hasEquipment === "Yes",
        tools,
        hoursPerWeek: f.hoursPerWeek,
        availability,
        introVideoUrl: f.introVideoUrl.trim(),
        cv: cv ? { name: cv.name, type: cv.type, base64: await toBase64(cv) } : undefined,
        photo: photo ? { name: photo.name, type: "image/jpeg", base64: await photoToBase64(photo) } : undefined,
      };

      const encoded = (payload.cv?.base64.length ?? 0) + (payload.photo?.base64.length ?? 0);
      if (encoded > MAX_ENCODED_BYTES) {
        setBusy(false);
        return toast.error("Your CV is too large to upload. Please attach a PDF under 3MB and try again.");
      }

      const { data, error } = await supabase.functions.invoke("submit-tutor-application", { body: payload });
      const err = (data as { error?: string } | null)?.error;
      if (error || err) {
        const detail = error ? await readFunctionError(error) : null;
        throw new Error(detail ?? err ?? error?.message ?? "Could not submit your application");
      }

      // Sign the new applicant in so they can track their application.
      if (!signedIn && f.password) {
        await supabase.auth.signInWithPassword({ email: f.email.trim(), password: f.password });
      }
      setDone((data as { applicationId: string }).applicationId);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <SiteShell>
        <Seo title="Application received | Catch-Up Tutors" description="Your tutor application has been received." path="/tutors/apply" noindex />
        <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
          <CheckCircle2 className="mx-auto h-14 w-14 text-brand-green" />
          <h1 className="mt-6 font-display text-3xl font-bold">Application received</h1>
          <p className="mt-4 text-muted-foreground">
            Thank you for your interest in joining Catch-Up Tutors. We've emailed an acknowledgement to <b>{f.email}</b>.
            Our management team reviews every application carefully and will contact you with next steps.
          </p>
          <p className="mt-4 rounded-xl bg-muted p-4 text-sm">Reference: <code className="font-mono text-xs">{done}</code></p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button onClick={() => navigate("/dashboard")}>Go to dashboard</Button>
            <Button variant="outline" asChild><Link to="/tutors">Back to tutors</Link></Button>
          </div>
        </div>
      </SiteShell>
    );
  }

  if (!statusLoading && existing && !editing) {
    return (
      <SiteShell>
        <Seo title="Your tutor application | Catch-Up Tutors" description="Track the status of your Catch-Up Tutors tutor application." path="/tutors/apply" noindex />
        <div className="mx-auto max-w-2xl px-4 py-24 sm:px-6">
          <ApplicationStatus
            status={existing.status}
            feedback={existing.admin_feedback}
            reference={existing.id}
            onResubmit={() => { setEditing(true); window.scrollTo({ top: 0 }); }}
          />
        </div>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <Seo
        title="Apply to Teach — Tutor Application | Catch-Up Tutors"
        description="Join Catch-Up Tutors. Apply to teach IGCSE, Cambridge, Edexcel, IB, TMUA and SAT students in a student-centered learning environment."
        path="/tutors/apply"
      />
      <PageHero
        image={heroImages.tutors}
        eyebrow="Join the team"
        title="Catch-Up Tutors — Tutor Application Form"
        description="Our mission is to bridge educational gaps and provide student-centered, impactful learning experiences, particularly for students preparing for IGCSE, Cambridge A-Level, Edexcel, IB, TMUA and SAT. Shortlisted candidates will be contacted for an interview and a teaching demonstration."
      />

      <form onSubmit={submit} className="mx-auto max-w-3xl space-y-6 px-4 py-16 sm:px-6">
        <Section step={1} title="Personal information">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5"><Label>Full name *</Label><Input required value={f.fullName} onChange={set("fullName")} /></div>
            <div className="grid gap-1.5"><Label>Email address *</Label><Input required type="email" value={f.email} onChange={set("email")} /></div>
            <div className="grid gap-1.5"><Label>Phone number (WhatsApp accessible) *</Label><Input required value={f.phone} onChange={set("phone")} /></div>
            <div className="grid gap-1.5"><Label>Current location (City, Country) *</Label><Input required value={f.location} onChange={set("location")} /></div>
          </div>
          <div className="grid gap-1.5">
            <Label>Create a password *</Label>
            <Input type="password" minLength={8} value={f.password} onChange={set("password")} placeholder="At least 8 characters" />
            <p className="text-xs text-muted-foreground">We create your Catch-Up Tutors account with this password so you can track your application. Already have an account? <Link to="/auth" className="font-semibold text-primary">Sign in first</Link>.</p>
          </div>
          <div className="grid gap-2">
            <Label>Current occupation *</Label>
            <RadioList options={OCCUPATIONS} value={f.occupation} onChange={(v) => setF((s) => ({ ...s, occupation: v }))} />
            {f.occupation === "Other" && <Input placeholder="Please specify" value={f.occupationOther} onChange={set("occupationOther")} />}
          </div>
        </Section>

        <Section step={2} title="Academic & professional background">
          <div className="grid gap-2">
            <Label>Highest educational qualification *</Label>
            <RadioList options={QUALIFICATIONS} value={f.highestQualification} onChange={(v) => setF((s) => ({ ...s, highestQualification: v }))} />
            {f.highestQualification === "Other" && <Input placeholder="Please specify" value={f.qualificationOther} onChange={set("qualificationOther")} />}
          </div>
          <div className="grid gap-1.5"><Label>Field of study / major *</Label><Input required value={f.fieldOfStudy} onChange={set("fieldOfStudy")} /></div>
          <div className="grid gap-2">
            <Label>Years of teaching / tutoring experience *</Label>
            <RadioList options={EXPERIENCE} value={f.experienceBand} onChange={(v) => setF((s) => ({ ...s, experienceBand: v }))} />
          </div>
        </Section>

        <Section step={3} title="Subject expertise & curricula">
          <div className="grid gap-2">
            <Label>Which subjects are you highly qualified to teach? *</Label>
            <CheckList options={SUBJECTS} value={subjects} onChange={setSubjects} columns={3} />
            <Input placeholder="Other subjects (comma separated)" value={otherSubjects} onChange={(e) => setOtherSubjects(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Which exam curricula have you taught? *</Label>
            <CheckList options={CURRICULA} value={curricula} onChange={setCurricula} />
          </div>
        </Section>

        <Section step={4} title="Teaching philosophy & approach" description="Catch-Up Tutors relies on a deeply student-centered approach.">
          <div className="grid gap-1.5">
            <Label>How do you support a student who is struggling or lagging behind in your subject? *</Label>
            <Textarea rows={6} required value={f.teachingPhilosophy} onChange={set("teachingPhilosophy")} />
          </div>
          <div className="grid gap-2">
            <Label>Experience creating educational video content?</Label>
            <RadioList options={VIDEO_OPTIONS} value={f.videoExperience} onChange={(v) => setF((s) => ({ ...s, videoExperience: v }))} columns={3} />
            {f.videoExperience.startsWith("Yes") && <Input placeholder="Link to a sample video" value={f.sampleVideoUrl} onChange={set("sampleVideoUrl")} />}
          </div>
        </Section>

        <Section step={5} title="Technical readiness & availability">
          <div className="grid gap-2">
            <Label>Reliable internet, laptop/PC with working webcam and microphone?</Label>
            <RadioList options={["Yes", "No"]} value={f.hasEquipment} onChange={(v) => setF((s) => ({ ...s, hasEquipment: v }))} />
          </div>
          <div className="grid gap-2"><Label>Tools you are comfortable using</Label><CheckList options={TOOLS} value={tools} onChange={setTools} /></div>
          <div className="grid gap-2"><Label>Hours per week you can dedicate</Label><RadioList options={HOURS} value={f.hoursPerWeek} onChange={(v) => setF((s) => ({ ...s, hoursPerWeek: v }))} /></div>
          <div className="grid gap-2"><Label>General availability</Label><CheckList options={AVAILABILITY} value={availability} onChange={setAvailability} columns={3} /></div>
        </Section>

        <Section step={6} title="Supporting documents">
          <div className="grid gap-1.5">
            <Label>CV / Resume * (PDF or DOCX, max {MAX_FILE_MB}MB)</Label>
            <Input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setCv(e.target.files?.[0] ?? null)} />
          </div>
          <div className="grid gap-1.5">
            <Label>Passport photograph (JPG or PNG)</Label>
            <Input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} />
            {photoPreview && (
              <div className="mt-2 flex items-center gap-4 rounded-2xl border bg-muted/30 p-3">
                <img src={photoPreview} alt="Passport photograph preview" className="h-24 w-24 rounded-xl object-cover" />
                <div className="min-w-0 text-sm">
                  <p className="truncate font-medium">{photo?.name}</p>
                  <p className="text-xs text-muted-foreground">{((photo?.size ?? 0) / 1024).toFixed(0)} KB</p>
                  <Button type="button" variant="ghost" size="sm" className="mt-1 px-0 text-destructive" onClick={() => setPhoto(null)}>Remove</Button>
                </div>
              </div>
            )}
          </div>

          <div className="grid gap-1.5">
            <Label>Optional: link to a 2–3 minute introduction or demo teaching video</Label>
            <Input value={f.introVideoUrl} onChange={set("introVideoUrl")} placeholder="https://" />
          </div>
        </Section>

        <div className="flex flex-wrap items-center gap-3 rounded-2xl border bg-muted/40 p-5">
          <GraduationCap className="text-primary" />
          <p className="flex-1 text-sm text-muted-foreground">
            Submitting creates your Catch-Up Tutors account and sends your application to our recruitment team.
          </p>
          <Button type="submit" size="lg" disabled={busy}>
            {busy ? <Loader2 className="animate-spin" /> : <Upload />} Submit application
          </Button>
        </div>
      </form>
    </SiteShell>
  );
}

function ApplicationStatus({ status, feedback, reference, onResubmit }: {
  status: string; feedback: string | null; reference: string; onResubmit: () => void;
}) {
  const map: Record<string, { icon: typeof CheckCircle2; tone: string; title: string; body: string }> = {
    pending: {
      icon: Clock3, tone: "text-primary",
      title: "Your application is under review",
      body: "Our recruitment team is reviewing your qualifications and experience. We'll email you as soon as there's an update.",
    },
    approved: {
      icon: CheckCircle2, tone: "text-brand-green",
      title: "You're approved — welcome to Catch-Up Tutors",
      body: "Open your tutor workspace to complete your profile, set your prices and publish your teaching hours.",
    },
    changes_requested: {
      icon: AlertTriangle, tone: "text-amber-500",
      title: "We need a few updates",
      body: "Please review the note below, update your details and resubmit your application.",
    },
    rejected: {
      icon: XCircle, tone: "text-destructive",
      title: "Application not successful",
      body: "Thank you for the time you invested. You're welcome to apply again in the future.",
    },
  };
  const s = map[status] ?? map.pending;
  const Icon = s.icon;

  return (
    <div className="rounded-3xl border bg-card p-8 text-center shadow-soft sm:p-10">
      <Icon className={`mx-auto h-14 w-14 ${s.tone}`} />
      <h1 className="mt-6 font-display text-3xl font-bold">{s.title}</h1>
      <p className="mt-4 text-muted-foreground">{s.body}</p>
      {feedback && (
        <p className="mt-6 rounded-2xl border-l-4 border-brand-orange bg-muted/50 p-4 text-left text-sm">{feedback}</p>
      )}
      <p className="mt-6 rounded-xl bg-muted p-4 text-sm">Reference: <code className="font-mono text-xs">{reference}</code></p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {status === "approved" && <Button asChild><Link to="/tutor">Open tutor workspace</Link></Button>}
        {status === "changes_requested" && <Button onClick={onResubmit}>Update and resubmit</Button>}
        <Button variant="outline" asChild><Link to="/tutors">Back to tutors</Link></Button>
      </div>
    </div>
  );
}
