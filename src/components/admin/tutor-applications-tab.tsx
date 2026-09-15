import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Loader2, Search, CheckCircle2, XCircle, RotateCcw, ShieldOff, ShieldCheck, Eye, Mail, Phone, MapPin,
  Tag as TagIcon, Plus, X, Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";

type Application = {
  id: string; ref_code: string | null; user_id: string; full_name: string; email: string; phone: string; location: string | null;
  occupation: string | null; highest_qualification: string | null; field_of_study: string | null;
  experience_band: string | null; years_experience: number | null; subjects: string[]; curricula: string[] | null;
  teaching_philosophy: string | null; biography: string | null; video_experience: string | null;
  sample_video_url: string | null; intro_video_url: string | null; has_equipment: boolean;
  tools: string[] | null; hours_per_week: string | null; availability: string[] | null;
  cv_path: string | null; photo_path: string | null; status: string; admin_feedback: string | null;
  created_at: string;
};

type TutorProfile = {
  id: string; user_id: string; display_name: string; photo_url: string | null; subjects: string[];
  years_experience: number; rating: number; review_count: number; is_approved: boolean; is_visible: boolean;
  created_at: string;
};

type AppTag = { id: string; application_id: string; tag: string; color: string };

const STATUSES = ["pending", "approved", "changes_requested", "rejected"] as const;

const SUGGESTED_TAGS = [
  "Shortlisted", "Interview scheduled", "Strong candidate", "Needs CV", "Needs video",
  "Sciences", "Maths", "Languages", "Follow up", "Waitlist", "Not a fit",
] as const;

const TAG_TONES = [
  "bg-primary/10 text-primary border-primary/20",
  "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  "bg-amber-500/10 text-amber-600 border-amber-500/20",
  "bg-sky-500/10 text-sky-600 border-sky-500/20",
  "bg-fuchsia-500/10 text-fuchsia-600 border-fuchsia-500/20",
  "bg-rose-500/10 text-rose-600 border-rose-500/20",
];

function toneFor(tag: string) {
  let h = 0;
  for (let i = 0; i < tag.length; i++) h = (h * 31 + tag.charCodeAt(i)) >>> 0;
  return TAG_TONES[h % TAG_TONES.length];
}

function AppStatusBadge({ status }: { status: string }) {
  const tone: Record<string, string> = {
    pending: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    approved: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    rejected: "bg-destructive/10 text-destructive border-destructive/20",
    changes_requested: "bg-sky-500/10 text-sky-600 border-sky-500/20",
  };
  return <Badge variant="outline" className={`capitalize ${tone[status] ?? ""}`}>{status.replace("_", " ")}</Badge>;
}

export default function TutorApplicationsTab() {
  const [apps, setApps] = useState<Application[]>([]);
  const [tutors, setTutors] = useState<TutorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<Application | null>(null);
  const [decision, setDecision] = useState<"approved" | "rejected" | "changes_requested">("approved");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [links, setLinks] = useState<{ cv?: string; photo?: string }>({});
  const [tags, setTags] = useState<AppTag[]>([]);
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");

  const reload = async () => {
    setLoading(true);
    const [a, t, g] = await Promise.all([
      supabase.from("tutor_applications").select("*").order("created_at", { ascending: false }),
      supabase.from("tutor_profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("tutor_application_tags").select("id, application_id, tag, color"),
    ]);
    if (a.error) toast.error(a.error.message);
    if (t.error) toast.error(t.error.message);
    if (g.error) toast.error(g.error.message);
    setApps((a.data ?? []) as Application[]);
    setTutors((t.data ?? []) as TutorProfile[]);
    setTags((g.data ?? []) as AppTag[]);
    setLoading(false);
  };

  const tagsFor = (appId: string) => tags.filter((t) => t.application_id === appId);

  const allTags = useMemo(() => {
    const m = new Map<string, number>();
    tags.forEach((t) => m.set(t.tag, (m.get(t.tag) ?? 0) + 1));
    return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [tags]);

  const addTag = async (appId: string, raw: string) => {
    const tag = raw.trim().slice(0, 40);
    if (!tag) return;
    if (tagsFor(appId).some((t) => t.tag.toLowerCase() === tag.toLowerCase())) return;
    const optimistic: AppTag = { id: `tmp-${Date.now()}`, application_id: appId, tag, color: "slate" };
    setTags((prev) => [...prev, optimistic]);
    setNewTag("");
    const { data, error } = await supabase
      .from("tutor_application_tags")
      .insert({ application_id: appId, tag })
      .select("id, application_id, tag, color")
      .single();
    if (error) {
      setTags((prev) => prev.filter((t) => t.id !== optimistic.id));
      toast.error(error.message);
      return;
    }
    setTags((prev) => prev.map((t) => (t.id === optimistic.id ? (data as AppTag) : t)));
  };

  const removeTag = async (tagId: string) => {
    const prev = tags;
    setTags((p) => p.filter((t) => t.id !== tagId));
    const { error } = await supabase.from("tutor_application_tags").delete().eq("id", tagId);
    if (error) { setTags(prev); toast.error(error.message); }
  };
  useEffect(() => { reload(); }, []);

  useEffect(() => {
    (async () => {
      if (!selected) { setLinks({}); return; }
      const sign = async (path: string | null) => {
        if (!path) return undefined;
        const { data } = await supabase.storage.from("tutor-uploads").createSignedUrl(path, 600);
        return data?.signedUrl;
      };
      setLinks({ cv: await sign(selected.cv_path), photo: await sign(selected.photo_path) });
    })();
  }, [selected]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return apps.filter((a) => {
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      if (tagFilter.length) {
        const mine = tags.filter((t) => t.application_id === a.id).map((t) => t.tag);
        if (tagFilter.includes("__untagged__")) {
          if (mine.length) return false;
        } else if (!tagFilter.every((t) => mine.includes(t))) return false;
      }
      if (!s) return true;
      const mineStr = tags.filter((t) => t.application_id === a.id).map((t) => t.tag).join(" ");
      return [a.ref_code ?? "", a.full_name, a.email, a.phone, a.location ?? "", (a.subjects ?? []).join(" "), mineStr]
        .join(" ").toLowerCase().includes(s);
    });
  }, [apps, q, statusFilter, tagFilter, tags]);

  const counts = STATUSES.map((s) => ({ s, n: apps.filter((a) => a.status === s).length }));

  const submitDecision = async () => {
    if (!selected) return;
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-tutor-decision", {
        body: { applicationId: selected.id, decision, message: note.trim() || undefined },
      });
      const err = (data as { error?: string } | null)?.error;
      if (error || err) throw new Error(err ?? error?.message ?? "Could not save the decision");
      toast.success(decision === "approved"
        ? "Approved — tutor profile created and decision email sent."
        : "Decision saved and email sent.");
      setSelected(null); setNote("");
      reload();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const manage = async (tutorProfileId: string, action: "suspend" | "reinstate" | "revoke") => {
    const { data, error } = await supabase.functions.invoke("manage-tutor", { body: { tutorProfileId, action } });
    const err = (data as { error?: string } | null)?.error;
    if (error || err) return toast.error(err ?? error?.message ?? "Action failed");
    toast.success(action === "suspend" ? "Tutor suspended" : action === "revoke" ? "Tutor access revoked" : "Tutor reinstated");
    reload();
  };

  if (loading) return <div className="flex h-40 items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {counts.map(({ s, n }) => (
          <div key={s} className="flex items-center justify-between rounded-xl border bg-card px-4 py-3">
            <AppStatusBadge status={s} />
            <span className="font-display text-xl font-bold">{n}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-2xl border bg-card p-3 shadow-soft">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search name, email, subject, location…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s.replace("_", " ")}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={reload}><RotateCcw className="h-4 w-4" /> Refresh</Button>
        <span className="ml-auto text-xs text-muted-foreground">{filtered.length} of {apps.length}</span>
      </div>

      <div className="rounded-2xl border bg-card p-3 shadow-soft">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <TagIcon className="h-3.5 w-3.5" /> Categories
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium normal-case tracking-normal">
              <Lock className="h-3 w-3" /> Admin only
            </span>
          </span>
          {tagFilter.length > 0 && (
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setTagFilter([])}>Clear</Button>
          )}
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {allTags.length === 0 && (
            <p className="text-xs text-muted-foreground">No categories yet — open an application and add one to start grouping applicants.</p>
          )}
          {allTags.map(([tag, n]) => {
            const active = tagFilter.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => setTagFilter((p) => (active ? p.filter((t) => t !== tag) : [...p.filter((t) => t !== "__untagged__"), tag]))}
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${active ? "border-primary bg-primary text-primary-foreground" : toneFor(tag)}`}
              >
                {tag} <span className="opacity-70">{n}</span>
              </button>
            );
          })}
          {allTags.length > 0 && (
            <button
              type="button"
              onClick={() => setTagFilter((p) => (p.includes("__untagged__") ? [] : ["__untagged__"]))}
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${tagFilter.includes("__untagged__") ? "border-primary bg-primary text-primary-foreground" : "bg-muted/40 text-muted-foreground"}`}
            >
              Untagged
            </button>
          )}
        </div>
      </div>


      <div className="overflow-x-auto rounded-2xl border bg-card shadow-soft">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Applicant</th>
              <th className="px-4 py-3">Subjects</th>
              <th className="px-4 py-3">Categories</th>
              <th className="px-4 py-3">Experience</th>
              <th className="px-4 py-3">Submitted</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">No applications match these filters.</td></tr>
            )}
            {filtered.map((a) => (
              <tr key={a.id} className="cursor-pointer align-top transition-colors hover:bg-muted/30"
                  onClick={() => { setSelected(a); setDecision("approved"); setNote(""); }}>
                <td className="px-4 py-3">
                  <div className="font-semibold">{a.full_name}</div>
                  {a.ref_code && <div className="font-mono text-[11px] text-muted-foreground">{a.ref_code}</div>}
                  <div className="text-xs text-muted-foreground">{a.email}</div>
                  <div className="text-xs text-muted-foreground">{a.phone}{a.location ? ` · ${a.location}` : ""}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex max-w-[220px] flex-wrap gap-1">
                    {(a.subjects ?? []).slice(0, 4).map((s) => <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>)}
                    {(a.subjects ?? []).length > 4 && <Badge variant="outline" className="text-[10px]">+{a.subjects.length - 4}</Badge>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex max-w-[200px] flex-wrap gap-1">
                    {tagsFor(a.id).length === 0 && <span className="text-xs text-muted-foreground">—</span>}
                    {tagsFor(a.id).map((t) => (
                      <span key={t.id} className={`rounded-full border px-2 py-0.5 text-[10px] ${toneFor(t.tag)}`}>{t.tag}</span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{a.experience_band ?? `${a.years_experience ?? 0} yrs`}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3"><AppStatusBadge status={a.status} /></td>
                <td className="px-4 py-3 text-right"><Button variant="ghost" size="sm"><Eye className="h-4 w-4" /> Review</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Approved tutors management */}
      <section className="space-y-3">
        <div>
          <h3 className="font-display text-xl font-bold">Tutor accounts</h3>
          <p className="text-sm text-muted-foreground">Suspend hides a tutor from the directory. Revoke removes their tutor access entirely.</p>
        </div>
        <div className="overflow-x-auto rounded-2xl border bg-card shadow-soft">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Tutor</th>
                <th className="px-4 py-3">Subjects</th>
                <th className="px-4 py-3">Rating</th>
                <th className="px-4 py-3">State</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {tutors.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">No tutors approved yet.</td></tr>
              )}
              {tutors.map((t) => (
                <tr key={t.id} className="align-middle">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {t.photo_url
                        ? <img src={t.photo_url} alt="" className="h-9 w-9 rounded-full object-cover" />
                        : <span className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">{t.display_name.slice(0, 2).toUpperCase()}</span>}
                      <div>
                        <div className="font-semibold">{t.display_name}</div>
                        <div className="text-xs text-muted-foreground">{t.years_experience} yrs experience</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex max-w-[220px] flex-wrap gap-1">
                      {(t.subjects ?? []).slice(0, 4).map((s) => <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>)}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{Number(t.rating).toFixed(1)} ({t.review_count})</td>
                  <td className="px-4 py-3">
                    {!t.is_approved
                      ? <Badge variant="outline" className="border-destructive/20 bg-destructive/10 text-destructive">Revoked</Badge>
                      : t.is_visible
                        ? <Badge variant="outline" className="border-emerald-500/20 bg-emerald-500/10 text-emerald-600">Active</Badge>
                        : <Badge variant="outline" className="border-amber-500/20 bg-amber-500/10 text-amber-600">Suspended</Badge>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap justify-end gap-2">
                      {t.is_approved && t.is_visible && (
                        <Button variant="outline" size="sm" onClick={() => manage(t.id, "suspend")}><ShieldOff className="h-4 w-4" /> Suspend</Button>
                      )}
                      {(!t.is_visible || !t.is_approved) && (
                        <Button variant="outline" size="sm" onClick={() => manage(t.id, "reinstate")}><ShieldCheck className="h-4 w-4" /> Reinstate</Button>
                      )}
                      {t.is_approved && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm"><XCircle className="h-4 w-4" /> Revoke</Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Revoke {t.display_name}'s tutor access?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Their tutor role is removed, their workspace closes and their profile is hidden from the
                                public directory. You can reinstate them later.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => manage(t.id, "revoke")}>Revoke access</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-h-[88vh] max-w-3xl overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  {links.photo && <img src={links.photo} alt="" className="h-12 w-12 rounded-full object-cover" />}
                  <span>{selected.full_name}</span>
                  {selected.ref_code && <span className="font-mono text-xs text-muted-foreground">{selected.ref_code}</span>}
                  <AppStatusBadge status={selected.status} />
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-5 text-sm">
                <div className="flex flex-wrap gap-4 text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5"><Mail className="h-4 w-4" /> {selected.email}</span>
                  <span className="inline-flex items-center gap-1.5"><Phone className="h-4 w-4" /> {selected.phone}</span>
                  {selected.location && <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {selected.location}</span>}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Info label="Occupation" value={selected.occupation} />
                  <Info label="Highest qualification" value={selected.highest_qualification} />
                  <Info label="Field of study" value={selected.field_of_study} />
                  <Info label="Experience" value={selected.experience_band ?? `${selected.years_experience ?? 0} years`} />
                  <Info label="Hours per week" value={selected.hours_per_week} />
                  <Info label="Equipment ready" value={selected.has_equipment ? "Yes" : "No"} />
                </div>

                <Chips label="Subjects" items={selected.subjects} />
                <Chips label="Curricula" items={selected.curricula ?? []} />
                <Chips label="Tools" items={selected.tools ?? []} />
                <Chips label="Availability" items={selected.availability ?? []} />

                {selected.teaching_philosophy && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Teaching approach</p>
                    <p className="mt-1 whitespace-pre-wrap rounded-xl bg-muted/40 p-3">{selected.teaching_philosophy}</p>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {links.cv && <Button variant="outline" size="sm" asChild><a href={links.cv} target="_blank" rel="noopener">Open CV</a></Button>}
                  {links.photo && <Button variant="outline" size="sm" asChild><a href={links.photo} target="_blank" rel="noopener">Open photo</a></Button>}
                  {selected.sample_video_url && <Button variant="outline" size="sm" asChild><a href={selected.sample_video_url} target="_blank" rel="noopener">Sample video</a></Button>}
                  {selected.intro_video_url && <Button variant="outline" size="sm" asChild><a href={selected.intro_video_url} target="_blank" rel="noopener">Intro video</a></Button>}
                </div>

                <div className="rounded-2xl border p-4">
                  <p className="font-semibold">Decision</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(["approved", "changes_requested", "rejected"] as const).map((d) => (
                      <Button key={d} type="button" size="sm" variant={decision === d ? "default" : "outline"} onClick={() => setDecision(d)} className="capitalize">
                        {d === "approved" ? <CheckCircle2 className="h-4 w-4" /> : d === "rejected" ? <XCircle className="h-4 w-4" /> : <RotateCcw className="h-4 w-4" />}
                        {d.replace("_", " ")}
                      </Button>
                    ))}
                  </div>
                  <Textarea className="mt-3" rows={4} maxLength={4000} placeholder="Optional message included in the email to the applicant…" value={note} onChange={(e) => setNote(e.target.value)} />
                  <p className="mt-2 text-xs text-muted-foreground">
                    Approving creates the tutor profile and grants tutor access automatically. The decision email is sent to {selected.email}.
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setSelected(null)}>Close</Button>
                <Button onClick={submitDecision} disabled={busy}>
                  {busy ? <Loader2 className="animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Save & send email
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="rounded-xl bg-muted/40 px-3 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-0.5">{value || "—"}</p>
    </div>
  );
}

function Chips({ label, items }: { label: string; items: string[] }) {
  if (!items?.length) return null;
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {items.map((i) => <Badge key={i} variant="secondary">{i}</Badge>)}
      </div>
    </div>
  );
}
