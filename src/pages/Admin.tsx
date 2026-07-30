import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import {
  CheckCircle2, Edit3, Eye, EyeOff, Loader2, Plus, ShieldCheck, Trash2, X,
  LayoutDashboard, GraduationCap, BookOpen, FolderTree, FileText, ClipboardList,
  Users, UserCheck, Clock, TrendingUp, ArrowUp, ArrowDown, ArrowUpDown, Download, Search,
  Activity, CalendarDays,
} from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

export default function Admin() {
  return (
    <>
      <Helmet>
        <title>Admin Console | CatchUp Tutors</title>
        <meta name="description" content="Manage programs, subjects, yearly papers, and topic-based past questions." />
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <AdminPage />
    </>
  );
}

type Program = { id: string; name: string; slug: string; description: string; accent: string; is_published: boolean; sort_order: number };
type Subject = { id: string; program_id: string; name: string; slug: string; description: string; is_published: boolean; sort_order: number };
type Topic = { id: string; subject_id: string; name: string; slug: string; description: string; is_published: boolean; sort_order: number };
type Resource = { id: string; program_id: string; subject_id: string; topic_id: string | null; title: string; description: string; resource_type: string; year: number | null; file_path: string; access_level: string; is_published: boolean };

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function AdminPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "denied" | "ok">("loading");

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) { navigate("/auth", { replace: true }); return; }
      const { data, error } = await supabase.rpc("has_role", { _user_id: u.user.id, _role: "admin" });
      if (error || !data) { setStatus("denied"); return; }
      setStatus("ok");
    })();
  }, [navigate]);

  if (status === "loading") return <SiteShell><div className="flex h-[60vh] items-center justify-center"><Loader2 className="animate-spin text-primary" /></div></SiteShell>;
  if (status === "denied") return <SiteShell><div className="mx-auto max-w-md py-24 text-center"><ShieldCheck className="mx-auto h-12 w-12 text-muted-foreground" /><h1 className="mt-4 font-display text-2xl font-bold">Admin access required</h1><p className="mt-2 text-muted-foreground">Your account doesn't have admin privileges.</p><Button asChild className="mt-6"><Link to="/dashboard">Back to dashboard</Link></Button></div></SiteShell>;

  return (
    <SiteShell>
      <section className="border-b bg-gradient-to-br from-brand-navy via-brand-navy to-[#000E2E] text-hero-foreground">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#FF6B12]">Admin console</p>
          <h1 className="mt-2 font-display text-4xl font-bold sm:text-5xl">Operations dashboard</h1>
          <p className="mt-3 max-w-2xl text-sm text-hero-foreground/75 sm:text-base">
            Manage curriculum, resources and summer program registrations. Every change is live for students the moment you save.
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Tabs defaultValue="overview">
          <TabsList className="grid w-full grid-cols-3 gap-1 rounded-2xl bg-muted/60 p-1 md:grid-cols-7">
            <AdminTab value="overview" icon={LayoutDashboard} label="Overview" />
            <AdminTab value="registrations" icon={ClipboardList} label="Registrations" />
            <AdminTab value="programs" icon={GraduationCap} label="Programs" />
            <AdminTab value="subjects" icon={BookOpen} label="Subjects" />
            <AdminTab value="topics" icon={FolderTree} label="Topics" />
            <AdminTab value="resources" icon={FileText} label="Resources" />
            <AdminTab value="past-papers" icon={CalendarDays} label="Past papers" />
          </TabsList>
          <TabsContent value="overview" className="mt-8"><OverviewTab /></TabsContent>
          <TabsContent value="registrations" className="mt-8"><RegistrationsTab /></TabsContent>
          <TabsContent value="programs" className="mt-8"><ProgramsTab /></TabsContent>
          <TabsContent value="subjects" className="mt-8"><SubjectsTab /></TabsContent>
          <TabsContent value="topics" className="mt-8"><TopicsTab /></TabsContent>
          <TabsContent value="resources" className="mt-8"><ResourcesTab /></TabsContent>
          <TabsContent value="past-papers" className="mt-8"><PastPapersTab /></TabsContent>
        </Tabs>

      </section>
    </SiteShell>
  );
}

function AdminTab({ value, icon: Icon, label }: { value: string; icon: typeof LayoutDashboard; label: string }) {
  return (
    <TabsTrigger value={value} className="gap-2 rounded-xl text-xs data-[state=active]:bg-background data-[state=active]:shadow sm:text-sm">
      <Icon className="h-4 w-4" /> <span className="hidden sm:inline">{label}</span>
    </TabsTrigger>
  );
}

function useTable<T extends { id: string }>(table: "programs" | "subjects" | "topics" | "resources", orderBy = "sort_order") {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const reload = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any).from(table).select("*").order(orderBy, { ascending: true });
    if (error) toast.error(`Failed to load ${table}: ${error.message}`);
    setRows((data ?? []) as T[]);
    setLoading(false);
  };
  useEffect(() => { reload(); }, []);
  return { rows, loading, reload };
}

async function togglePublish(table: string, id: string, value: boolean) {
  const { error } = await (supabase as any).from(table).update({ is_published: value }).eq("id", id);
  if (error) toast.error(error.message); else toast.success(value ? "Published" : "Unpublished");
}

async function removeRow(table: string, id: string) {
  if (!confirm("Delete this item? This cannot be undone.")) return false;
  const { error } = await (supabase as any).from(table).delete().eq("id", id);
  if (error) { toast.error(error.message); return false; }
  toast.success("Deleted"); return true;
}

const programSchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z.string().trim().min(2).max(80).regex(/^[a-z0-9-]+$/, "lowercase letters, numbers, hyphens"),
  description: z.string().trim().min(10).max(500),
  accent: z.enum(["blue", "orange", "green", "navy"]),
  sort_order: z.coerce.number().int().min(0).max(999),
  is_published: z.boolean(),
});

function ProgramsTab() {
  const { rows, loading, reload } = useTable<Program>("programs");
  const [editing, setEditing] = useState<Partial<Program> | null>(null);

  return (
    <div>
      <Toolbar title="Programs" onNew={() => setEditing({ name: "", slug: "", description: "", accent: "blue", is_published: true, sort_order: rows.length })} />
      <DataTable
        loading={loading}
        rows={rows}
        columns={[
          { key: "name", header: "Name" },
          { key: "slug", header: "Slug" },
          { key: "accent", header: "Accent" },
        ]}
        onEdit={(r) => setEditing(r)}
        onPublishToggle={async (r) => { await togglePublish("programs", r.id, !r.is_published); reload(); }}
        onDelete={async (r) => { if (await removeRow("programs", r.id)) reload(); }}
      />
      {editing && (
        <EditDialog title={editing.id ? "Edit program" : "New program"} onClose={() => setEditing(null)} onSave={async () => {
          const parsed = programSchema.safeParse({ ...editing, slug: editing.slug || slugify(editing.name || "") });
          if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
          const payload = parsed.data;
          const { error } = editing.id
            ? await (supabase as any).from("programs").update(payload).eq("id", editing.id)
            : await (supabase as any).from("programs").insert(payload);
          if (error) { toast.error(error.message); return; }
          toast.success("Saved"); setEditing(null); reload();
        }}>
          <Field label="Name"><Input value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value, slug: editing.slug || slugify(e.target.value) })} maxLength={80} /></Field>
          <Field label="Slug"><Input value={editing.slug ?? ""} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} maxLength={80} /></Field>
          <Field label="Description"><Textarea rows={4} value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} maxLength={500} /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Accent">
              <Select value={editing.accent ?? "blue"} onValueChange={(v) => setEditing({ ...editing, accent: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["blue","orange","green","navy"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Sort order"><Input type="number" value={editing.sort_order ?? 0} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} /></Field>
          </div>
          <PublishSwitch value={!!editing.is_published} onChange={(v) => setEditing({ ...editing, is_published: v })} />
        </EditDialog>
      )}
    </div>
  );
}

const subjectSchema = z.object({
  program_id: z.string().uuid("Pick a program"),
  name: z.string().trim().min(2).max(80),
  slug: z.string().trim().min(2).max(80).regex(/^[a-z0-9-]+$/),
  description: z.string().trim().min(5).max(500),
  sort_order: z.coerce.number().int().min(0).max(999),
  is_published: z.boolean(),
});

function SubjectsTab() {
  const programs = useTable<Program>("programs");
  const { rows, loading, reload } = useTable<Subject>("subjects");
  const [editing, setEditing] = useState<Partial<Subject> | null>(null);
  const programName = (id: string) => programs.rows.find((p) => p.id === id)?.name ?? "—";

  return (
    <div>
      <Toolbar title="Subjects" onNew={() => setEditing({ program_id: programs.rows[0]?.id, name: "", slug: "", description: "", is_published: true, sort_order: rows.length })} />
      <DataTable
        loading={loading}
        rows={rows}
        columns={[
          { key: "name", header: "Subject" },
          { key: "program_id", header: "Program", render: (r) => programName(r.program_id) },
          { key: "slug", header: "Slug" },
        ]}
        onEdit={(r) => setEditing(r)}
        onPublishToggle={async (r) => { await togglePublish("subjects", r.id, !r.is_published); reload(); }}
        onDelete={async (r) => { if (await removeRow("subjects", r.id)) reload(); }}
      />
      {editing && (
        <EditDialog title={editing.id ? "Edit subject" : "New subject"} onClose={() => setEditing(null)} onSave={async () => {
          const parsed = subjectSchema.safeParse({ ...editing, slug: editing.slug || slugify(editing.name || "") });
          if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
          const { error } = editing.id
            ? await (supabase as any).from("subjects").update(parsed.data).eq("id", editing.id)
            : await (supabase as any).from("subjects").insert(parsed.data);
          if (error) { toast.error(error.message); return; }
          toast.success("Saved"); setEditing(null); reload();
        }}>
          <Field label="Program">
            <Select value={editing.program_id ?? ""} onValueChange={(v) => setEditing({ ...editing, program_id: v })}>
              <SelectTrigger><SelectValue placeholder="Select program" /></SelectTrigger>
              <SelectContent>{programs.rows.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Name"><Input value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value, slug: editing.slug || slugify(e.target.value) })} maxLength={80} /></Field>
          <Field label="Slug"><Input value={editing.slug ?? ""} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} maxLength={80} /></Field>
          <Field label="Description"><Textarea rows={3} value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} maxLength={500} /></Field>
          <Field label="Sort order"><Input type="number" value={editing.sort_order ?? 0} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} /></Field>
          <PublishSwitch value={!!editing.is_published} onChange={(v) => setEditing({ ...editing, is_published: v })} />
        </EditDialog>
      )}
    </div>
  );
}

const topicSchema = z.object({
  subject_id: z.string().uuid("Pick a subject"),
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().min(2).max(120).regex(/^[a-z0-9-]+$/),
  description: z.string().trim().max(500).default(""),
  sort_order: z.coerce.number().int().min(0).max(999),
  is_published: z.boolean(),
});

function TopicsTab() {
  const subjects = useTable<Subject>("subjects");
  const { rows, loading, reload } = useTable<Topic>("topics");
  const [editing, setEditing] = useState<Partial<Topic> | null>(null);
  const subjectName = (id: string) => subjects.rows.find((s) => s.id === id)?.name ?? "—";

  return (
    <div>
      <Toolbar title="Topics" onNew={() => setEditing({ subject_id: subjects.rows[0]?.id, name: "", slug: "", description: "", is_published: true, sort_order: rows.length })} />
      <DataTable
        loading={loading}
        rows={rows}
        columns={[
          { key: "name", header: "Topic" },
          { key: "subject_id", header: "Subject", render: (r) => subjectName(r.subject_id) },
        ]}
        onEdit={(r) => setEditing(r)}
        onPublishToggle={async (r) => { await togglePublish("topics", r.id, !r.is_published); reload(); }}
        onDelete={async (r) => { if (await removeRow("topics", r.id)) reload(); }}
      />
      {editing && (
        <EditDialog title={editing.id ? "Edit topic" : "New topic"} onClose={() => setEditing(null)} onSave={async () => {
          const parsed = topicSchema.safeParse({ ...editing, slug: editing.slug || slugify(editing.name || ""), description: editing.description ?? "" });
          if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
          const { error } = editing.id
            ? await (supabase as any).from("topics").update(parsed.data).eq("id", editing.id)
            : await (supabase as any).from("topics").insert(parsed.data);
          if (error) { toast.error(error.message); return; }
          toast.success("Saved"); setEditing(null); reload();
        }}>
          <Field label="Subject">
            <Select value={editing.subject_id ?? ""} onValueChange={(v) => setEditing({ ...editing, subject_id: v })}>
              <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
              <SelectContent>{subjects.rows.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Name"><Input value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value, slug: editing.slug || slugify(e.target.value) })} maxLength={120} /></Field>
          <Field label="Slug"><Input value={editing.slug ?? ""} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} maxLength={120} /></Field>
          <Field label="Description"><Textarea rows={3} value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} maxLength={500} /></Field>
          <Field label="Sort order"><Input type="number" value={editing.sort_order ?? 0} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} /></Field>
          <PublishSwitch value={!!editing.is_published} onChange={(v) => setEditing({ ...editing, is_published: v })} />
        </EditDialog>
      )}
    </div>
  );
}

const RESOURCE_TYPES = ["question_paper", "marking_scheme", "topic_questions", "solutions", "notes"] as const;

const resourceSchema = z.object({
  program_id: z.string().uuid("Pick a program"),
  subject_id: z.string().uuid("Pick a subject"),
  topic_id: z.string().uuid().nullable().optional(),
  title: z.string().trim().min(3).max(200),
  description: z.string().trim().max(1000).default(""),
  resource_type: z.enum(RESOURCE_TYPES),
  year: z.coerce.number().int().min(1990).max(2100).nullable().optional(),
  file_path: z.string().trim().min(1, "Storage file path is required").max(500),
  access_level: z.enum(["free", "premium"]),
  is_published: z.boolean(),
});

function ResourcesTab() {
  const programs = useTable<Program>("programs");
  const subjects = useTable<Subject>("subjects");
  const topics = useTable<Topic>("topics");
  const { rows, loading, reload } = useTable<Resource>("resources", "created_at");
  const [editing, setEditing] = useState<Partial<Resource> | null>(null);
  const [filter, setFilter] = useState<"all" | "yearly" | "topics">("all");

  const filtered = useMemo(() => {
    if (filter === "yearly") return rows.filter((r) => r.resource_type === "question_paper" || r.resource_type === "marking_scheme");
    if (filter === "topics") return rows.filter((r) => r.resource_type === "topic_questions" || r.resource_type === "solutions");
    return rows;
  }, [rows, filter]);

  const subjectsFor = (programId?: string) => subjects.rows.filter((s) => s.program_id === programId);
  const topicsFor = (subjectId?: string) => topics.rows.filter((t) => t.subject_id === subjectId);
  const lookup = (id: string, src: { id: string; name: string }[]) => src.find((x) => x.id === id)?.name ?? "—";

  return (
    <div>
      <Toolbar
        title="Past questions & resources"
        onNew={() => setEditing({ program_id: programs.rows[0]?.id, subject_id: subjectsFor(programs.rows[0]?.id)[0]?.id, topic_id: null, title: "", description: "", resource_type: "question_paper", year: new Date().getFullYear(), file_path: "", access_level: "free", is_published: true })}
        extra={
          <Select value={filter} onValueChange={(v) => setFilter(v as "all" | "yearly" | "topics")}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All resources</SelectItem>
              <SelectItem value="yearly">Yearly papers</SelectItem>
              <SelectItem value="topics">Topic past questions</SelectItem>
            </SelectContent>
          </Select>
        }
      />
      <DataTable
        loading={loading}
        rows={filtered}
        columns={[
          { key: "title", header: "Title" },
          { key: "resource_type", header: "Type", render: (r) => <Badge variant="outline">{r.resource_type}</Badge> },
          { key: "year", header: "Year", render: (r) => r.year ?? "—" },
          { key: "subject_id", header: "Subject", render: (r) => lookup(r.subject_id, subjects.rows) },
          { key: "access_level", header: "Access", render: (r) => <Badge>{r.access_level}</Badge> },
        ]}
        onEdit={(r) => setEditing(r)}
        onPublishToggle={async (r) => { await togglePublish("resources", r.id, !r.is_published); reload(); }}
        onDelete={async (r) => { if (await removeRow("resources", r.id)) reload(); }}
      />
      {editing && (
        <EditDialog title={editing.id ? "Edit resource" : "New resource"} onClose={() => setEditing(null)} onSave={async () => {
          const parsed = resourceSchema.safeParse({ ...editing, description: editing.description ?? "", topic_id: editing.topic_id || null, year: editing.year ?? null });
          if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
          const { error } = editing.id
            ? await (supabase as any).from("resources").update(parsed.data).eq("id", editing.id)
            : await (supabase as any).from("resources").insert(parsed.data);
          if (error) { toast.error(error.message); return; }
          toast.success("Saved"); setEditing(null); reload();
        }}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Program">
              <Select value={editing.program_id ?? ""} onValueChange={(v) => setEditing({ ...editing, program_id: v, subject_id: subjectsFor(v)[0]?.id, topic_id: null })}>
                <SelectTrigger><SelectValue placeholder="Program" /></SelectTrigger>
                <SelectContent>{programs.rows.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Subject">
              <Select value={editing.subject_id ?? ""} onValueChange={(v) => setEditing({ ...editing, subject_id: v, topic_id: null })}>
                <SelectTrigger><SelectValue placeholder="Subject" /></SelectTrigger>
                <SelectContent>{subjectsFor(editing.program_id).map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="Topic (optional, for topic-based PQs)">
            <Select value={editing.topic_id ?? "__none"} onValueChange={(v) => setEditing({ ...editing, topic_id: v === "__none" ? null : v })}>
              <SelectTrigger><SelectValue placeholder="No topic" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">— None —</SelectItem>
                {topicsFor(editing.subject_id).map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Title"><Input value={editing.title ?? ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} maxLength={200} /></Field>
          <Field label="Description"><Textarea rows={3} value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} maxLength={1000} /></Field>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Type">
              <Select value={editing.resource_type ?? "question_paper"} onValueChange={(v) => setEditing({ ...editing, resource_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{RESOURCE_TYPES.map((t) => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Year"><Input type="number" min={1990} max={2100} value={editing.year ?? ""} onChange={(e) => setEditing({ ...editing, year: e.target.value ? Number(e.target.value) : null })} /></Field>
            <Field label="Access">
              <Select value={editing.access_level ?? "free"} onValueChange={(v) => setEditing({ ...editing, access_level: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="free">Free</SelectItem><SelectItem value="premium">Premium</SelectItem></SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="Storage file path (e.g. cambridge/9709/2024/may-june-paper1.pdf)">
            <Input value={editing.file_path ?? ""} onChange={(e) => setEditing({ ...editing, file_path: e.target.value })} maxLength={500} />
          </Field>
          <PublishSwitch value={!!editing.is_published} onChange={(v) => setEditing({ ...editing, is_published: v })} />
        </EditDialog>
      )}
    </div>
  );
}

/* ---------- Shared UI ---------- */

function Toolbar({ title, onNew, extra }: { title: string; onNew: () => void; extra?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <h2 className="font-display text-xl font-bold">{title}</h2>
      <div className="flex items-center gap-3">
        {extra}
        <Button onClick={onNew}><Plus /> New</Button>
      </div>
    </div>
  );
}

type Column<T> = { key: keyof T; header: string; render?: (r: T) => React.ReactNode };

function DataTable<T extends { id: string; is_published: boolean }>({ rows, loading, columns, onEdit, onPublishToggle, onDelete }: {
  rows: T[]; loading: boolean; columns: Column<T>[];
  onEdit: (r: T) => void; onPublishToggle: (r: T) => void; onDelete: (r: T) => void;
}) {
  if (loading) return <div className="flex h-40 items-center justify-center rounded-2xl border bg-card"><Loader2 className="animate-spin text-primary" /></div>;
  if (!rows.length) return <div className="rounded-2xl border border-dashed bg-card p-10 text-center text-muted-foreground">No items yet. Click <strong>New</strong> to create the first one.</div>;
  return (
    <div className="overflow-x-auto rounded-2xl border bg-card">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left text-xs font-bold uppercase tracking-wide text-muted-foreground">
          <tr>{columns.map((c) => <th key={String(c.key)} className="px-4 py-3">{c.header}</th>)}<th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Actions</th></tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t hover:bg-muted/30">
              {columns.map((c) => <td key={String(c.key)} className="px-4 py-3">{c.render ? c.render(r) : String(r[c.key] ?? "")}</td>)}
              <td className="px-4 py-3">{r.is_published ? <Badge className="bg-brand-green/15 text-brand-green hover:bg-brand-green/15"><CheckCircle2 className="mr-1 size-3" /> Published</Badge> : <Badge variant="secondary">Draft</Badge>}</td>
              <td className="px-4 py-3"><div className="flex justify-end gap-1">
                <Button size="sm" variant="ghost" onClick={() => onPublishToggle(r)} title={r.is_published ? "Unpublish" : "Publish"}>{r.is_published ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</Button>
                <Button size="sm" variant="ghost" onClick={() => onEdit(r)}><Edit3 className="size-4" /></Button>
                <Button size="sm" variant="ghost" onClick={() => onDelete(r)} className="text-destructive hover:text-destructive"><Trash2 className="size-4" /></Button>
              </div></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EditDialog({ title, children, onClose, onSave }: { title: string; children: React.ReactNode; onClose: () => void; onSave: () => void }) {
  const [saving, setSaving] = useState(false);
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>Fill in the details. Drafts stay hidden until published.</DialogDescription></DialogHeader>
        <div className="grid gap-4 py-3">{children}</div>
        <DialogFooter><Button variant="ghost" onClick={onClose}><X /> Cancel</Button><Button onClick={async () => { setSaving(true); try { await onSave(); } finally { setSaving(false); } }} disabled={saving}>{saving ? <Loader2 className="animate-spin" /> : <CheckCircle2 />} Save</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="grid gap-2"><Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</Label>{children}</div>;
}

function PublishSwitch({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between rounded-xl border bg-muted/30 p-4">
      <div><p className="font-semibold">Published</p><p className="text-sm text-muted-foreground">Visible to students when on.</p></div>
      <Switch checked={value} onCheckedChange={onChange} />
    </div>
  );
}

type StudentReg = {
  id: string; full_name: string; email: string; phone: string; gender: string; age: number | null;
  home_address: string; parent_name: string; current_class: string; department: string | null;
  target_exams: string[] | null; status: string; created_at: string;
};
type TutorReg = {
  id: string; full_name: string; email: string; phone: string; gender: string; qualification: string;
  subjects: string[] | null; experience_years: number | null; availability: string; motivation: string;
  status: string; created_at: string;
};

const REG_STATUSES = ["pending", "approved", "waitlisted", "rejected"] as const;
type RegStatus = (typeof REG_STATUSES)[number];
const STATUS_META: Record<string, { cls: string; icon: typeof Clock }> = {
  pending: { cls: "bg-amber-100 text-amber-800 border-amber-200", icon: Clock },
  approved: { cls: "bg-emerald-100 text-emerald-800 border-emerald-200", icon: UserCheck },
  waitlisted: { cls: "bg-blue-100 text-blue-800 border-blue-200", icon: Users },
  rejected: { cls: "bg-red-100 text-red-800 border-red-200", icon: X },
};
function StatusBadge({ status }: { status: string }) {
  const m = STATUS_META[status];
  const Icon = m?.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize ${m?.cls ?? "bg-muted"}`}>
      {Icon && <Icon className="h-3 w-3" />} {status}
    </span>
  );
}

/* ---------- Overview ---------- */

type OverviewStats = {
  programs: number; subjects: number; topics: number; resources: number;
  studentsTotal: number; studentsPending: number; studentsWeek: number;
  tutorsTotal: number; tutorsPending: number;
};
type RecentReg = { id: string; full_name: string; email: string; status: string; created_at: string; kind: "student" | "tutor" };

function OverviewTab() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [recent, setRecent] = useState<RecentReg[]>([]);

  useEffect(() => {
    (async () => {
      const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString();
      const c = (t: any) => (supabase as any).from(t).select("*", { count: "exact", head: true });
      const [p, s, tp, r, sAll, sPend, sWeek, tAll, tPend, sRecent, tRecent] = await Promise.all([
        c("programs"), c("subjects"), c("topics"), c("resources"),
        c("summer_student_registrations"),
        c("summer_student_registrations").eq("status", "pending"),
        c("summer_student_registrations").gte("created_at", weekAgo),
        c("summer_tutor_volunteers"),
        c("summer_tutor_volunteers").eq("status", "pending"),
        (supabase as any).from("summer_student_registrations").select("id,full_name,email,status,created_at").order("created_at", { ascending: false }).limit(5),
        (supabase as any).from("summer_tutor_volunteers").select("id,full_name,email,status,created_at").order("created_at", { ascending: false }).limit(5),
      ]);
      setStats({
        programs: p.count ?? 0, subjects: s.count ?? 0, topics: tp.count ?? 0, resources: r.count ?? 0,
        studentsTotal: sAll.count ?? 0, studentsPending: sPend.count ?? 0, studentsWeek: sWeek.count ?? 0,
        tutorsTotal: tAll.count ?? 0, tutorsPending: tPend.count ?? 0,
      });
      const merged: RecentReg[] = [
        ...(sRecent.data ?? []).map((x: any) => ({ ...x, kind: "student" as const })),
        ...(tRecent.data ?? []).map((x: any) => ({ ...x, kind: "tutor" as const })),
      ].sort((a, b) => (a.created_at < b.created_at ? 1 : -1)).slice(0, 8);
      setRecent(merged);
    })();
  }, []);

  if (!stats) return <div className="flex h-40 items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <OverviewKpi icon={Users} tone="primary" value={stats.studentsTotal} label="Student registrations" hint={`${stats.studentsWeek} new this week`} />
        <OverviewKpi icon={Clock} tone="orange" value={stats.studentsPending} label="Pending students" hint="Awaiting your decision" />
        <OverviewKpi icon={UserCheck} tone="green" value={stats.tutorsTotal} label="Volunteer tutors" hint={`${stats.tutorsPending} awaiting review`} />
        <OverviewKpi icon={FileText} tone="navy" value={stats.resources} label="Published resources" hint={`${stats.programs} programs · ${stats.subjects} subjects`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-3xl border bg-card p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl font-bold">Recent registrations</h2>
              <p className="text-sm text-muted-foreground">Latest submissions across students and volunteer tutors.</p>
            </div>
            <Activity className="h-5 w-5 text-muted-foreground" />
          </div>
          <ul className="mt-5 divide-y">
            {recent.length === 0 && <li className="py-8 text-center text-sm text-muted-foreground">No submissions yet.</li>}
            {recent.map((r) => (
              <li key={r.kind + r.id} className="flex items-center gap-4 py-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${r.kind === "student" ? "bg-primary/10 text-primary" : "bg-[#FF6B12]/10 text-[#FF6B12]"}`}>
                  {r.kind === "student" ? <GraduationCap className="h-5 w-5" /> : <UserCheck className="h-5 w-5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{r.full_name}</p>
                  <p className="truncate text-xs text-muted-foreground">{r.email} · {r.kind}</p>
                </div>
                <div className="text-right">
                  <StatusBadge status={r.status} />
                  <p className="mt-1 text-[11px] text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <aside className="space-y-4">
          <div className="rounded-3xl border bg-card p-6 shadow-soft">
            <h3 className="font-display text-lg font-bold">Content library</h3>
            <div className="mt-4 space-y-3 text-sm">
              <LibraryRow icon={GraduationCap} label="Programs" value={stats.programs} />
              <LibraryRow icon={BookOpen} label="Subjects" value={stats.subjects} />
              <LibraryRow icon={FolderTree} label="Topics" value={stats.topics} />
              <LibraryRow icon={FileText} label="Resources" value={stats.resources} />
            </div>
          </div>
          <div className="rounded-3xl border bg-gradient-to-br from-brand-navy to-[#000E2E] p-6 text-hero-foreground shadow-lift">
            <TrendingUp className="h-6 w-6 text-[#FF6B12]" />
            <h3 className="mt-3 font-display text-lg font-bold">Growth this week</h3>
            <p className="mt-1 text-3xl font-bold">{stats.studentsWeek}</p>
            <p className="text-sm text-hero-foreground/70">new student registrations in the last 7 days.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function OverviewKpi({ icon: Icon, value, label, hint, tone }: { icon: typeof Users; value: number | string; label: string; hint?: string; tone: "primary" | "orange" | "green" | "navy" }) {
  const map = {
    primary: "text-primary from-primary/15",
    orange: "text-[#FF6B12] from-[#FF6B12]/15",
    green: "text-emerald-600 from-emerald-500/15",
    navy: "text-brand-navy from-brand-navy/15",
  } as const;
  return (
    <article className="relative overflow-hidden rounded-2xl border bg-card p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift">
      <div className={`absolute inset-0 bg-gradient-to-br ${map[tone]} to-transparent opacity-70`} aria-hidden />
      <div className="relative">
        <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-background ring-1 ring-border ${map[tone].split(" ")[0]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <p className="mt-4 font-display text-3xl font-bold">{value}</p>
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </div>
    </article>
  );
}

function LibraryRow({ icon: Icon, label, value }: { icon: typeof GraduationCap; label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-muted/40 px-4 py-2.5">
      <span className="flex items-center gap-2 font-semibold"><Icon className="h-4 w-4 text-primary" /> {label}</span>
      <span className="font-display text-lg font-bold">{value}</span>
    </div>
  );
}

/* ---------- Registrations ---------- */

function RegistrationsTab() {
  const [kind, setKind] = useState<"student" | "tutor">("student");
  return (
    <div className="space-y-6">
      <div className="inline-flex rounded-xl border bg-card p-1 shadow-soft">
        <button
          onClick={() => setKind("student")}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${kind === "student" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          <GraduationCap className="h-4 w-4" /> Students
        </button>
        <button
          onClick={() => setKind("tutor")}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${kind === "tutor" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          <UserCheck className="h-4 w-4" /> Volunteer tutors
        </button>
      </div>
      {kind === "student" ? <StudentRegTable /> : <TutorRegTable />}
    </div>
  );
}

function useRegs<T extends { id: string; status: string; created_at: string }>(table: "summer_student_registrations" | "summer_tutor_volunteers") {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const reload = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any).from(table).select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows((data ?? []) as T[]);
    setLoading(false);
  };
  useEffect(() => { reload(); }, []);
  const updateStatus = async (id: string, status: string) => {
    const { error } = await (supabase as any).from(table).update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    setRows((r) => r.map((x) => (x.id === id ? { ...x, status } : x)));
    toast.success(`Status set to ${status}`);
  };
  const remove = async (id: string) => {
    if (!confirm("Delete this registration? This cannot be undone.")) return;
    const { error } = await (supabase as any).from(table).delete().eq("id", id);
    if (error) return toast.error(error.message);
    setRows((r) => r.filter((x) => x.id !== id));
    toast.success("Deleted");
  };
  return { rows, loading, reload, updateStatus, remove };
}

type SortDir = "asc" | "desc";
function useSort<T>(initialKey: keyof T, initialDir: SortDir = "desc") {
  const [key, setKey] = useState<keyof T>(initialKey);
  const [dir, setDir] = useState<SortDir>(initialDir);
  const toggle = (k: keyof T) => {
    if (k === key) setDir(dir === "asc" ? "desc" : "asc");
    else { setKey(k); setDir("asc"); }
  };
  const sort = (rows: T[]) => [...rows].sort((a, b) => {
    const av = a[key] as unknown; const bv = b[key] as unknown;
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    if (av < bv) return dir === "asc" ? -1 : 1;
    if (av > bv) return dir === "asc" ? 1 : -1;
    return 0;
  });
  return { key, dir, toggle, sort };
}

function SortHeader<T>({ label, k, sort }: { label: string; k: keyof T; sort: ReturnType<typeof useSort<T>> }) {
  const active = sort.key === k;
  return (
    <th className="px-4 py-3">
      <button onClick={() => sort.toggle(k)} className="inline-flex items-center gap-1 font-bold uppercase tracking-wider hover:text-foreground">
        {label}
        {!active && <ArrowUpDown className="h-3 w-3 opacity-40" />}
        {active && (sort.dir === "asc" ? <ArrowUp className="h-3 w-3 text-primary" /> : <ArrowDown className="h-3 w-3 text-primary" />)}
      </button>
    </th>
  );
}

function StatusStrip({ rows }: { rows: { status: string }[] }) {
  const counts = REG_STATUSES.map((s) => ({ s, n: rows.filter((r) => r.status === s).length }));
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {counts.map(({ s, n }) => (
        <div key={s} className="flex items-center justify-between rounded-xl border bg-card px-4 py-3">
          <StatusBadge status={s} />
          <span className="font-display text-xl font-bold">{n}</span>
        </div>
      ))}
    </div>
  );
}

function downloadCsv(filename: string, headers: string[], rows: (string | number | null | undefined)[][]) {
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [headers.map(esc).join(","), ...rows.map((r) => r.map(esc).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

const DATE_RANGES = { all: 0, "7d": 7, "30d": 30, "90d": 90 } as const;
type DateRangeKey = keyof typeof DATE_RANGES;

function FilterBar({ q, setQ, statusFilter, setStatusFilter, range, setRange, reload, onExport, count, total, placeholder }: {
  q: string; setQ: (v: string) => void; statusFilter: string; setStatusFilter: (v: string) => void;
  range: DateRangeKey; setRange: (v: DateRangeKey) => void;
  reload: () => void; onExport: () => void; count: number; total: number; placeholder: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border bg-card p-3 shadow-soft">
      <div className="relative min-w-[220px] flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder={placeholder} value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
      </div>
      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          {REG_STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={range} onValueChange={(v) => setRange(v as DateRangeKey)}>
        <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All time</SelectItem>
          <SelectItem value="7d">Last 7 days</SelectItem>
          <SelectItem value="30d">Last 30 days</SelectItem>
          <SelectItem value="90d">Last 90 days</SelectItem>
        </SelectContent>
      </Select>
      <Button variant="outline" size="sm" onClick={reload}>Refresh</Button>
      <Button variant="outline" size="sm" onClick={onExport}><Download className="h-4 w-4" /> Export CSV</Button>
      <span className="ml-auto text-xs text-muted-foreground">{count} of {total}</span>
    </div>
  );
}

function StudentRegTable() {
  const { rows, loading, updateStatus, remove, reload } = useRegs<StudentReg>("summer_student_registrations");
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [range, setRange] = useState<DateRangeKey>("all");
  const [details, setDetails] = useState<StudentReg | null>(null);
  const sort = useSort<StudentReg>("created_at", "desc");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    const cutoff = range === "all" ? 0 : Date.now() - DATE_RANGES[range] * 864e5;
    return sort.sort(rows.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (cutoff && new Date(r.created_at).getTime() < cutoff) return false;
      if (!s) return true;
      return [r.full_name, r.email, r.phone, r.parent_name, r.current_class, r.department ?? "", (r.target_exams ?? []).join(" ")]
        .join(" ").toLowerCase().includes(s);
    }));
  }, [rows, q, statusFilter, range, sort]);

  const exportCsv = () => downloadCsv(
    `student-registrations-${new Date().toISOString().slice(0, 10)}.csv`,
    ["Name", "Email", "Phone", "Gender", "Age", "Parent", "Class", "Department", "Exams", "Status", "Submitted"],
    filtered.map((r) => [r.full_name, r.email, r.phone, r.gender, r.age, r.parent_name, r.current_class, r.department, (r.target_exams ?? []).join("; "), r.status, r.created_at]),
  );

  return (
    <div className="space-y-4">
      <StatusStrip rows={rows} />
      <FilterBar q={q} setQ={setQ} statusFilter={statusFilter} setStatusFilter={setStatusFilter} range={range} setRange={setRange} reload={reload} onExport={exportCsv} count={filtered.length} total={rows.length} placeholder="Search name, email, phone, class, exam…" />
      {loading ? <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div> : (
        <div className="overflow-x-auto rounded-2xl border bg-card shadow-soft">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <SortHeader label="Student" k="full_name" sort={sort} />
                <th className="px-4 py-3">Contact</th>
                <SortHeader label="Class" k="current_class" sort={sort} />
                <th className="px-4 py-3">Exams</th>
                <SortHeader label="Submitted" k="created_at" sort={sort} />
                <SortHeader label="Status" k="status" sort={sort} />
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((r) => (
                <tr key={r.id} className="cursor-pointer align-top transition-colors hover:bg-muted/30" onClick={() => setDetails(r)}>
                  <td className="px-4 py-3">
                    <div className="font-semibold">{r.full_name}</div>
                    <div className="text-xs text-muted-foreground">{r.gender} · {r.age ?? "—"} yrs</div>
                    <div className="text-xs text-muted-foreground">Parent: {r.parent_name}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div>{r.email}</div>
                    <div className="text-xs text-muted-foreground">{r.phone}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div>{r.current_class}</div>
                    {r.department && <div className="text-xs text-muted-foreground">{r.department}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex max-w-[180px] flex-wrap gap-1">
                      {(r.target_exams ?? []).map((e) => <Badge key={e} variant="secondary" className="text-[10px]">{e}</Badge>)}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <Select value={r.status} onValueChange={(v) => updateStatus(r.id, v)}>
                      <SelectTrigger className="h-8 w-32"><StatusBadge status={r.status} /></SelectTrigger>
                      <SelectContent>{REG_STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" onClick={() => remove(r.id)} aria-label="Delete"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">No registrations match your filters.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
      {details && (
        <Dialog open onOpenChange={(o) => !o && setDetails(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{details.full_name}</DialogTitle>
              <DialogDescription>Submitted {new Date(details.created_at).toLocaleString()}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 text-sm sm:grid-cols-2">
              <DetailRow label="Email" value={details.email} />
              <DetailRow label="Phone" value={details.phone} />
              <DetailRow label="Gender" value={details.gender} />
              <DetailRow label="Age" value={details.age ?? "—"} />
              <DetailRow label="Class" value={details.current_class} />
              <DetailRow label="Department" value={details.department ?? "—"} />
              <DetailRow label="Parent / Guardian" value={details.parent_name} />
              <DetailRow label="Status" value={<StatusBadge status={details.status} />} />
              <div className="sm:col-span-2"><DetailRow label="Home address" value={details.home_address} /></div>
              <div className="sm:col-span-2">
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Target exams</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {(details.target_exams ?? []).map((e) => <Badge key={e} variant="secondary">{e}</Badge>)}
                </div>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Select value={details.status} onValueChange={(v) => { updateStatus(details.id, v); setDetails({ ...details, status: v }); }}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>{REG_STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
              </Select>
              <Button variant="ghost" onClick={() => setDetails(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function TutorRegTable() {
  const { rows, loading, updateStatus, remove, reload } = useRegs<TutorReg>("summer_tutor_volunteers");
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [range, setRange] = useState<DateRangeKey>("all");
  const [details, setDetails] = useState<TutorReg | null>(null);
  const sort = useSort<TutorReg>("created_at", "desc");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    const cutoff = range === "all" ? 0 : Date.now() - DATE_RANGES[range] * 864e5;
    return sort.sort(rows.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (cutoff && new Date(r.created_at).getTime() < cutoff) return false;
      if (!s) return true;
      return [r.full_name, r.email, r.phone, r.qualification, (r.subjects ?? []).join(" "), r.availability]
        .join(" ").toLowerCase().includes(s);
    }));
  }, [rows, q, statusFilter, range, sort]);

  const exportCsv = () => downloadCsv(
    `tutor-volunteers-${new Date().toISOString().slice(0, 10)}.csv`,
    ["Name", "Email", "Phone", "Gender", "Qualification", "Experience yrs", "Subjects", "Availability", "Status", "Submitted"],
    filtered.map((r) => [r.full_name, r.email, r.phone, r.gender, r.qualification, r.experience_years, (r.subjects ?? []).join("; "), r.availability, r.status, r.created_at]),
  );

  return (
    <div className="space-y-4">
      <StatusStrip rows={rows} />
      <FilterBar q={q} setQ={setQ} statusFilter={statusFilter} setStatusFilter={setStatusFilter} range={range} setRange={setRange} reload={reload} onExport={exportCsv} count={filtered.length} total={rows.length} placeholder="Search name, email, subject, availability…" />
      {loading ? <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div> : (
        <div className="overflow-x-auto rounded-2xl border bg-card shadow-soft">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <SortHeader label="Volunteer" k="full_name" sort={sort} />
                <th className="px-4 py-3">Contact</th>
                <SortHeader label="Qualification" k="qualification" sort={sort} />
                <th className="px-4 py-3">Subjects</th>
                <SortHeader label="Experience" k="experience_years" sort={sort} />
                <SortHeader label="Submitted" k="created_at" sort={sort} />
                <SortHeader label="Status" k="status" sort={sort} />
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((r) => (
                <tr key={r.id} className="cursor-pointer align-top transition-colors hover:bg-muted/30" onClick={() => setDetails(r)}>
                  <td className="px-4 py-3">
                    <div className="font-semibold">{r.full_name}</div>
                    <div className="text-xs text-muted-foreground">{r.gender}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div>{r.email}</div>
                    <div className="text-xs text-muted-foreground">{r.phone}</div>
                  </td>
                  <td className="px-4 py-3">{r.qualification}</td>
                  <td className="px-4 py-3">
                    <div className="flex max-w-[200px] flex-wrap gap-1">
                      {(r.subjects ?? []).map((s) => <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>)}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs">{r.experience_years ?? 0} yrs</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <Select value={r.status} onValueChange={(v) => updateStatus(r.id, v)}>
                      <SelectTrigger className="h-8 w-32"><StatusBadge status={r.status} /></SelectTrigger>
                      <SelectContent>{REG_STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" onClick={() => remove(r.id)} aria-label="Delete"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">No volunteers match your filters.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
      {details && (
        <Dialog open onOpenChange={(o) => !o && setDetails(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{details.full_name}</DialogTitle>
              <DialogDescription>Submitted {new Date(details.created_at).toLocaleString()}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 text-sm sm:grid-cols-2">
              <DetailRow label="Email" value={details.email} />
              <DetailRow label="Phone" value={details.phone} />
              <DetailRow label="Gender" value={details.gender} />
              <DetailRow label="Experience" value={`${details.experience_years ?? 0} yrs`} />
              <DetailRow label="Qualification" value={details.qualification} />
              <DetailRow label="Availability" value={details.availability} />
              <DetailRow label="Status" value={<StatusBadge status={details.status} />} />
              <div className="sm:col-span-2">
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Subjects</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {(details.subjects ?? []).map((s) => <Badge key={s} variant="secondary">{s}</Badge>)}
                </div>
              </div>
              <div className="sm:col-span-2"><DetailRow label="Motivation" value={details.motivation} /></div>
            </div>
            <DialogFooter className="gap-2">
              <Select value={details.status} onValueChange={(v) => { updateStatus(details.id, v); setDetails({ ...details, status: v }); }}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>{REG_STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
              </Select>
              <Button variant="ghost" onClick={() => setDetails(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm">{value}</p>
    </div>
  );
}

