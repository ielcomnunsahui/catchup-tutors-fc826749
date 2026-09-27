import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, CalendarDays, CheckCircle2, CreditCard, Loader2, ShieldCheck, XCircle } from "lucide-react";
import { toast } from "sonner";
import { SiteShell, Seo } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { CLASS_TIMES, PROGRAMME_PLANS, WEEK_DAYS, findPlan, naira } from "@/lib/programme-plans";

const empty = {
  full_name: "", email: "", phone: "", gender: "", age: "", location: "",
  guardian_name: "", guardian_phone: "", current_level: "", school: "",
  subjects: "", target_exam_date: "", target_score: "", notes: "",
};

export default function Enrol() {
  const { programme } = useParams();
  const navigate = useNavigate();
  const plan = findPlan(programme) ?? PROGRAMME_PLANS[0];
  const [form, setForm] = useState(empty);
  const [days, setDays] = useState<string[]>([]);
  const [time, setTime] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [enrolId, setEnrolId] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [params, setParams] = useSearchParams();
  const [verify, setVerify] = useState<{ state: "checking" | "paid" | "failed"; e?: any } | null>(null);

  useEffect(() => {
    const reference = params.get("reference") ?? params.get("trxref");
    if (!reference) return;
    setVerify({ state: "checking" });
    supabase.functions.invoke("paystack-enrol", { body: { action: "verify", reference } }).then(({ data, error }) => {
      if (error || data?.error) return setVerify({ state: "failed" });
      setVerify({ state: data.status === "paid" ? "paid" : "failed", e: data.enrolment });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pay = async (id: string) => {
    setPaying(true);
    const callbackUrl = `${window.location.origin}/enrol/${plan.key.toLowerCase()}`;
    const { data, error } = await supabase.functions.invoke("paystack-enrol", { body: { action: "init", enrolmentId: id, callbackUrl } });
    if (error || data?.error || !data?.authorizationUrl) {
      setPaying(false);
      return toast.error(data?.error ?? "Could not start payment. Please try again or contact us.");
    }
    window.location.href = data.authorizationUrl;
  };
  const set = (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value });

  const toggleDay = (d: string) => setDays((cur) =>
    cur.includes(d) ? cur.filter((x) => x !== d) : cur.length >= plan.days ? cur : [...cur, d]);
  const orderedDays = useMemo(() => WEEK_DAYS.filter((d) => days.includes(d)), [days]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name || !form.email || !form.phone || !form.current_level) return toast.error("Please fill in all required fields");
    if (days.length !== plan.days) return toast.error(`Please choose exactly ${plan.days} days`);
    if (!time) return toast.error("Please choose a preferred class time");
    setBusy(true);
    const id = crypto.randomUUID();
    const { error } = await supabase.from("programme_enrolments" as any).insert({
      id, programme: plan.key, monthly_fee: plan.fee, days_per_week: plan.days,
      available_days: orderedDays, preferred_time: time,
      full_name: form.full_name.trim(), email: form.email.trim(), phone: form.phone.trim(),
      gender: form.gender || null, age: form.age ? parseInt(form.age) : null, location: form.location || null,
      guardian_name: form.guardian_name || null, guardian_phone: form.guardian_phone || null,
      current_level: form.current_level, school: form.school || null,
      subjects: plan.subjects ?? form.subjects.split(",").map((s) => s.trim()).filter(Boolean),
      target_exam_date: form.target_exam_date || null, target_score: form.target_score || null, notes: form.notes || null,
    });
    if (error) { setBusy(false); return toast.error(error.message); }
    const { data: ref } = await supabase.rpc("get_enrolment_ref" as any, { _id: id });
    supabase.functions.invoke("send-enrolment-email", { body: { id } }).catch(() => {});
    setBusy(false);
    setEnrolId(id);
    setDone((ref as string) ?? "received");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (verify) return (
    <SiteShell>
      <Seo title="Payment | CatchUp Tutors" description="Programme enrolment payment." path={`/enrol/${plan.key.toLowerCase()}`} noindex />
      <section className="mx-auto max-w-xl px-4 py-20 text-center">
        {verify.state === "checking" ? (
          <><Loader2 className="mx-auto size-12 animate-spin text-primary" /><p className="mt-4 text-muted-foreground">Confirming your payment…</p></>
        ) : verify.state === "paid" ? (
          <>
            <CheckCircle2 className="mx-auto size-14 text-brand-green" />
            <h1 className="mt-4 font-display text-3xl font-bold">Payment received — you're in!</h1>
            <p className="mt-3 text-lg">{verify.e?.programme} · Reference <b>{verify.e?.ref_code}</b></p>
            <p className="mt-2 text-muted-foreground">{naira(verify.e?.amount_paid ?? plan.fee)} paid for your first month. {(verify.e?.available_days ?? []).join(", ")} · {verify.e?.preferred_time}. We'll send your class timetable shortly.</p>
            <Button asChild className="mt-8"><Link to="/">Back to home</Link></Button>
          </>
        ) : (
          <>
            <XCircle className="mx-auto size-14 text-destructive" />
            <h1 className="mt-4 font-display text-3xl font-bold">Payment not completed</h1>
            <p className="mt-3 text-muted-foreground">Your enrolment is saved{verify.e?.ref_code ? ` (${verify.e.ref_code})` : ""}, but we couldn't confirm the payment.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              {verify.e?.id && <Button onClick={() => pay(verify.e.id)} disabled={paying}>{paying ? <Loader2 className="animate-spin" /> : <CreditCard />} Try again</Button>}
              <Button variant="outline" onClick={() => { setParams({}); setVerify(null); }}>Back to form</Button>
            </div>
          </>
        )}
      </section>
    </SiteShell>
  );

  if (done) return (
    <SiteShell>
      <Seo title="Enrolment received | CatchUp Tutors" description="Your programme enrolment has been received." path={`/enrol/${plan.key.toLowerCase()}`} noindex />
      <section className="mx-auto max-w-xl px-4 py-20 text-center">
        <CheckCircle2 className="mx-auto size-14 text-brand-green" />
        <h1 className="mt-4 font-display text-3xl font-bold">You're enrolled for {plan.name}!</h1>
        {done !== "received" && <p className="mt-3 text-lg">Reference: <b>{done}</b></p>}
        <p className="mt-3 text-muted-foreground">
          {orderedDays.join(", ")} · {time}. Complete your first month's payment to secure your place.
        </p>
        <div className="mx-auto mt-8 max-w-sm rounded-3xl border bg-card p-6 shadow-soft">
          <p className="text-sm text-muted-foreground">Amount due</p>
          <p className="font-display text-3xl font-bold">{naira(plan.fee)}</p>
          {enrolId && (
            <Button size="lg" className="mt-4 w-full" onClick={() => pay(enrolId)} disabled={paying}>
              {paying ? <Loader2 className="animate-spin" /> : <CreditCard />} Pay now
            </Button>
          )}
          <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground"><ShieldCheck className="size-3.5" /> Secure card, transfer or USSD via Paystack</p>
        </div>
        <Button asChild variant="ghost" className="mt-4"><Link to="/">I'll pay later — our team will contact you</Link></Button>
      </section>
    </SiteShell>
  );

  return (
    <SiteShell>
      <Seo title={`Enrol for ${plan.name} | CatchUp Tutors`} description={`Enrol in the ${plan.name} preparation programme — ${naira(plan.fee)} per month, ${plan.days} days a week.`} path={`/enrol/${plan.key.toLowerCase()}`} />
      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <Button variant="ghost" asChild className="mb-4"><Link to="/pricing#programmes"><ArrowLeft /> All programmes</Link></Button>

        <div className="rounded-3xl border bg-primary p-6 text-primary-foreground shadow-lift sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] opacity-80">Enrolment</p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl font-bold">{plan.name} programme</h1>
              <p className="mt-1 opacity-90">{naira(plan.fee)} / month · {plan.days} days a week{plan.note ? ` · ${plan.note}` : ""}</p>
            </div>
            <Select value={plan.key} onValueChange={(v) => { setDays([]); navigate(`/enrol/${v.toLowerCase()}`); }}>
              <SelectTrigger className="w-44 bg-card text-foreground"><SelectValue /></SelectTrigger>
              <SelectContent>{PROGRAMME_PLANS.map((p) => <SelectItem key={p.key} value={p.key}>{p.name} — {naira(p.fee)}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>

        <form onSubmit={submit} className="mt-6 space-y-6">
          <Card title="Your schedule" hint={`Pick ${plan.days} days and a class time`}>
            <Label className="text-sm">Available days * <span className="text-muted-foreground">({days.length}/{plan.days})</span></Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {WEEK_DAYS.map((d) => {
                const on = days.includes(d);
                const disabled = !on && days.length >= plan.days;
                return (
                  <button type="button" key={d} onClick={() => toggleDay(d)} disabled={disabled}
                    className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${on ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-muted"} ${disabled ? "opacity-40" : ""}`}>
                    {d}
                  </button>
                );
              })}
            </div>
            <Label className="mt-5 block text-sm">Preferred class time *</Label>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {CLASS_TIMES.map((t) => (
                <button type="button" key={t} onClick={() => setTime(t)}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition ${time === t ? "border-primary bg-primary/10 text-primary" : "bg-background hover:bg-muted"}`}>
                  <CalendarDays className="size-4" /> {t}
                </button>
              ))}
            </div>
          </Card>

          <Card title="Personal details">
            <div className="grid gap-4 sm:grid-cols-2">
              <F label="Full name *"><Input value={form.full_name} onChange={set("full_name")} /></F>
              <F label="Email *"><Input type="email" value={form.email} onChange={set("email")} /></F>
              <F label="Phone / WhatsApp *"><Input value={form.phone} onChange={set("phone")} /></F>
              <F label="Gender">
                <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem></SelectContent>
                </Select>
              </F>
              <F label="Age"><Input type="number" min={8} max={80} value={form.age} onChange={set("age")} /></F>
              <F label="City / State"><Input value={form.location} onChange={set("location")} /></F>
              <F label="Parent / guardian name"><Input value={form.guardian_name} onChange={set("guardian_name")} /></F>
              <F label="Parent / guardian phone"><Input value={form.guardian_phone} onChange={set("guardian_phone")} /></F>
            </div>
          </Card>

          <Card title="Academic details">
            <div className="grid gap-4 sm:grid-cols-2">
              <F label="Current class / level *"><Input placeholder="e.g. SS3, Year 11, Graduate" value={form.current_level} onChange={set("current_level")} /></F>
              <F label="School / institution"><Input value={form.school} onChange={set("school")} /></F>
              <F label="Subjects" className="sm:col-span-2">
                {plan.subjects
                  ? <p className="rounded-xl bg-muted px-3 py-2 text-sm font-medium">{plan.subjects.join(" & ")}</p>
                  : <Input placeholder="e.g. Mathematics, Physics, English" value={form.subjects} onChange={set("subjects")} />}
              </F>
              <F label="Target exam date"><Input placeholder="e.g. May 2027" value={form.target_exam_date} onChange={set("target_exam_date")} /></F>
              <F label="Target score / grade"><Input placeholder="e.g. 1450, A1, Band 7" value={form.target_score} onChange={set("target_score")} /></F>
              <F label="Anything we should know?" className="sm:col-span-2"><Textarea rows={3} value={form.notes} onChange={set("notes")} /></F>
            </div>
          </Card>

          <Button type="submit" size="lg" disabled={busy} className="w-full sm:w-auto">
            {busy && <Loader2 className="animate-spin" />} Enrol for {plan.name} <ArrowRight />
          </Button>
        </form>
      </section>
    </SiteShell>
  );
}

function Card({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border bg-card p-6 shadow-soft sm:p-8">
      <h2 className="font-display text-lg font-bold">{title}</h2>
      {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
      <div className="mt-4">{children}</div>
    </div>
  );
}
function F({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return <div className={`grid gap-1.5 ${className ?? ""}`}><Label className="text-sm">{label}</Label>{children}</div>;
}
