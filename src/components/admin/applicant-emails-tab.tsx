import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowLeft, CheckCircle2, Loader2, Mail, Search, Send, Tag, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { fetchAllTutorApplicants } from "@/lib/tutor-applicants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

type Applicant = Awaited<ReturnType<typeof fetchAllTutorApplicants>>[number];
type SendRun = { batches: { ids: string[]; requestId: string }[]; next: number; subject: string; message: string; accepted: number };
type AppTag = { id: string; application_id: string; tag: string; color: string };

export default function ApplicantEmailsTab({ onBack }: { onBack: () => void }) {
  const [apps, setApps] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [chosen, setChosen] = useState<Set<string>>(new Set());
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [sending, setSending] = useState(false);
  const [run, setRun] = useState<SendRun | null>(null);
  const [sendError, setSendError] = useState("");
  const [technical, setTechnical] = useState("");
  const [tags, setTags] = useState<AppTag[]>([]);
  const [tagFilter, setTagFilter] = useState<string[]>([]);

  const load = async () => {
    setLoading(true); setLoadError(false);
    try {
      const [applicants, tagRows] = await Promise.all([
        fetchAllTutorApplicants(),
        supabase.from("tutor_application_tags").select("id, application_id, tag, color"),
      ]);
      if (tagRows.error) throw tagRows.error;
      setApps(applicants);
      setTags((tagRows.data ?? []) as AppTag[]);
    }
    catch { setLoadError(true); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);
  const subjects = useMemo(() => [...new Set(apps.flatMap((app) => app.subjects ?? []))].sort(), [apps]);
  const tagsFor = useMemo(() => {
    const byApp = new Map<string, string[]>();
    tags.forEach((tag) => byApp.set(tag.application_id, [...(byApp.get(tag.application_id) ?? []), tag.tag]));
    return byApp;
  }, [tags]);
  const allTags = useMemo(() => {
    const counts = new Map<string, number>();
    tags.forEach((tag) => counts.set(tag.tag, (counts.get(tag.tag) ?? 0) + 1));
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [tags]);
  const untaggedCount = apps.filter((app) => !(tagsFor.get(app.id) ?? []).length).length;
  const filtered = useMemo(() => apps.filter((app) => {
    if (status !== "all" && app.status !== status) return false;
    if (subjectFilter !== "all" && !(app.subjects ?? []).includes(subjectFilter)) return false;
    if (tagFilter.length) {
      const mine = tagsFor.get(app.id) ?? [];
      if (tagFilter.includes("__untagged__")) { if (mine.length) return false; }
      else if (!tagFilter.every((tag) => mine.includes(tag))) return false;
    }
    return [app.full_name, app.email, app.ref_code ?? "", ...(app.subjects ?? [])].join(" ").toLowerCase().includes(q.toLowerCase().trim());
  }), [apps, q, status, subjectFilter, tagFilter, tagsFor]);
  const toggleTag = (tag: string) => setTagFilter((previous) =>
    previous.includes(tag) ? previous.filter((value) => value !== tag) : [...previous, tag]);
  const selected = apps.filter((app) => chosen.has(app.id));
  const recipients = [...new Map(selected.map((app) => [app.email.trim().toLowerCase(), app])).values()];
  const preview = recipients[0];
  const complete = !!run && run.next === run.batches.length;
  const locked = !!run && !complete;
  const invalidEmail = recipients.some((app) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(app.email.trim()));

  const toggle = (id: string, checked: boolean) => setChosen((previous) => {
    const next = new Set(previous); if (checked) next.add(id); else next.delete(id); return next;
  });
  const startSend = async () => {
    if (sending) return;
    let current = run;
    if (!current) {
      current = { batches: [], next: 0, subject: subject.trim(), message: message.trim(), accepted: 0 };
      for (let i = 0; i < recipients.length; i += 100) current.batches.push({ ids: recipients.slice(i, i + 100).map((app) => app.id), requestId: crypto.randomUUID() });
    }
    setRun(current); setSending(true); setSendError(""); setTechnical("");
    try {
      while (current.next < current.batches.length) {
        const batch: SendRun["batches"][number] = current.batches[current.next];
        const responseResult: { data: { accepted?: number; error?: string; details?: string } | null; error: { message: string; context?: Response } | null } = await supabase.functions.invoke<{ accepted?: number; error?: string; details?: string }>("send-applicant-emails", {
          body: { applicationIds: batch.ids, subject: current.subject, message: current.message, requestId: batch.requestId },
        });
        const data: { accepted?: number; error?: string; details?: string } | null = responseResult.data;
        const error = responseResult.error;
        if (error || data?.error) {
          let detail = data;
          const response = (error as { context?: Response } | null)?.context;
          if (response) { try { detail = await response.clone().json(); } catch { /* no readable service details */ } }
          setTechnical(detail?.details ?? error?.message ?? "");
          throw new Error(detail?.error ?? "Sending could not be confirmed. Retry this batch to avoid duplicate emails.");
        }
        if (typeof data?.accepted !== "number") throw new Error("Sending could not be confirmed. Retry this batch.");
        current = { ...current, next: current.next + 1, accepted: current.accepted + data.accepted };
        setRun(current);
      }
      toast.success(`Resend accepted ${current.accepted} applicant emails.`);
    } catch (error) { setSendError(error instanceof Error ? error.message : "Sending could not be confirmed."); }
    finally { setSending(false); }
  };

  return <div className="space-y-6">
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="ghost" size="sm" onClick={onBack} disabled={locked}><ArrowLeft /> Applications</Button>
      <div><h2 className="font-display text-xl font-semibold">Email tutor applicants</h2><p className="text-sm text-muted-foreground">Application updates · Resend</p></div>
    </div>
    {loading ? <div className="flex items-center gap-2 py-12 text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Loading applicants…</div>
      : loadError ? <div role="alert" className="flex flex-wrap items-center gap-3 rounded-lg border border-destructive/30 p-5"><AlertTriangle className="text-destructive" /><p>Applicants could not load. Check your connection and admin session.</p><Button variant="outline" onClick={load}>Try again</Button></div>
      : <div className="grid gap-8 xl:grid-cols-2">
        <section className="min-w-0 space-y-4">
          <h3 className="font-medium">Recipients <span className="text-sm text-muted-foreground">{chosen.size} applicants · {recipients.length} email addresses</span></h3>
          <div className="relative"><Search className="absolute left-3 top-3 size-4 text-muted-foreground" /><Input aria-label="Search applicants" placeholder="Search name, email, reference, subject…" value={q} onChange={(event) => setQ(event.target.value)} className="pl-9" disabled={locked} /></div>
          <div className="grid grid-cols-2 gap-3">
            <Select value={status} onValueChange={setStatus} disabled={locked}><SelectTrigger aria-label="Applicant status"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem>{["pending", "approved", "changes_requested", "rejected"].map((value) => <SelectItem key={value} value={value}>{value.replace(/_/g, " ")}</SelectItem>)}</SelectContent></Select>
            <Select value={subjectFilter} onValueChange={setSubjectFilter} disabled={locked}><SelectTrigger aria-label="Teaching subject"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All subjects</SelectItem>{subjects.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Tag className="size-4 text-muted-foreground" aria-hidden />
            {allTags.map(([tag, count]) => (
              <button key={tag} type="button" disabled={locked} aria-pressed={tagFilter.includes(tag)} onClick={() => toggleTag(tag)}
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${tagFilter.includes(tag) ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/60"}`}>
                {tag} ({count})
              </button>
            ))}
            {untaggedCount > 0 && (
              <button type="button" disabled={locked} aria-pressed={tagFilter.includes("__untagged__")} onClick={() => toggleTag("__untagged__")}
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${tagFilter.includes("__untagged__") ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/60"}`}>
                No category ({untaggedCount})
              </button>
            )}
            {tagFilter.length > 0 && <button type="button" disabled={locked} onClick={() => setTagFilter([])} className="text-xs text-muted-foreground underline underline-offset-2">Clear</button>}
            {!allTags.length && <span className="text-xs text-muted-foreground">No categories yet — tag applicants in Tutor applications, then select them here.</span>}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2"><Button size="sm" variant="outline" disabled={locked || !filtered.length} onClick={() => setChosen((previous) => new Set([...previous, ...filtered.map((app) => app.id)]))}>Select all matching ({filtered.length})</Button><Button size="sm" variant="ghost" disabled={locked || !chosen.size} onClick={() => setChosen(new Set())}><X /> Clear selection</Button></div>
          <div className="max-h-[600px] overflow-y-auto rounded-lg border divide-y">
            {!filtered.length && <p className="p-6 text-sm text-muted-foreground">No applicants match these filters.</p>}
            {filtered.map((app) => <label key={app.id} className="flex cursor-pointer items-start gap-3 p-4 transition-colors hover:bg-muted/40">
              <Checkbox checked={chosen.has(app.id)} onCheckedChange={(value) => toggle(app.id, value === true)} disabled={locked} aria-label={`Select ${app.full_name}`} />
              <span className="min-w-0"><span className="block text-sm font-medium">{app.full_name}</span><span className="block break-all text-xs text-muted-foreground">{app.email}</span><span className="mt-1 block text-xs text-muted-foreground">{(app.subjects ?? []).join(" · ")} · {app.status.replace(/_/g, " ")}</span></span>
            </label>)}
          </div>
        </section>
        <section className="min-w-0 space-y-4">
          <h3 className="font-medium">Message</h3>
          <div className="space-y-2"><Label htmlFor="applicant-email-subject">Subject</Label><Input id="applicant-email-subject" value={subject} maxLength={200} onChange={(event) => setSubject(event.target.value.replace(/[\r\n]/g, ""))} disabled={!!run} /></div>
          <div className="space-y-2"><Label htmlFor="applicant-email-message">Application update</Label><Textarea id="applicant-email-message" value={message} maxLength={12000} rows={10} onChange={(event) => setMessage(event.target.value)} disabled={!!run} /></div>
          <div className="rounded-lg border bg-muted/20 p-5"><p className="mb-3 flex items-center gap-2 text-xs font-medium text-muted-foreground"><Mail className="size-4" /> Preview</p><p className="text-sm font-medium">{subject || "Email subject"}</p><p className="mt-4 text-sm">Dear {preview?.full_name ?? "Applicant"},</p><p className="mt-3 whitespace-pre-wrap break-words text-sm">{message || "Your application update"}</p><p className="mt-4 text-xs text-muted-foreground">{preview?.ref_code && <>Application reference: {preview.ref_code}<br /><br /></>}The Recruitment Team<br />Catch-Up Tutors</p></div>
          <p className="text-xs text-muted-foreground">Each applicant receives a separate email. Duplicate addresses receive one copy. Replies go to Catchuptutors01@gmail.com.</p>
          {invalidEmail && <p role="alert" className="text-sm text-destructive">Remove applicants with invalid email addresses before sending.</p>}
          {run && <div role="status" className="flex items-center gap-2 rounded-lg border p-4 text-sm">{complete ? <CheckCircle2 className="text-brand-green" /> : <Mail className="text-primary" />}<span>{run.accepted} emails accepted by Resend · {run.next} of {run.batches.length} batches complete{complete ? ". Acceptance does not confirm inbox delivery." : ". Keep this page open until sending finishes."}</span></div>}
          {sendError && <div role="alert" className="space-y-2 rounded-lg border border-destructive/30 p-4 text-sm"><p>{sendError}</p><p className="text-xs text-muted-foreground">Completed batches will not be repeated. Retry within 24 hours using the same message.</p>{technical && <details><summary className="cursor-pointer text-xs">Service details</summary><pre className="mt-2 whitespace-pre-wrap break-all text-xs">{technical}</pre></details>}</div>}
          {complete ? <Button variant="outline" onClick={() => { setRun(null); setMessage(""); setSubject(""); setChosen(new Set()); }}>New message</Button>
            : <Button disabled={sending || !recipients.length || invalidEmail || !subject.trim() || !message.trim()} onClick={() => locked ? void startSend() : setConfirm(true)}>{sending ? <Loader2 className="animate-spin" /> : <Send />}{sending ? "Sending…" : locked ? "Retry remaining batch" : `Review & send to ${recipients.length}`}</Button>}
        </section>
      </div>}
    <AlertDialog open={confirm} onOpenChange={setConfirm}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Send to {recipients.length} applicants?</AlertDialogTitle><AlertDialogDescription>Resend will send “{subject}” separately to each selected email address. This will not change application statuses.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Keep editing</AlertDialogCancel><AlertDialogAction onClick={() => void startSend()}>Send emails</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div>;
}