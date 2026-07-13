import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import {
  CheckCircle2, Edit3, Eye, EyeOff, Loader2, Plus, ShieldCheck, Trash2, X,
  LayoutDashboard, GraduationCap, BookOpen, FolderTree, FileText, ClipboardList,
  Users, UserCheck, Clock, TrendingUp, ArrowUp, ArrowDown, ArrowUpDown, Download, Search,
  Activity,
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
          <TabsList className="grid w-full grid-cols-3 gap-1 rounded-2xl bg-muted/60 p-1 md:grid-cols-6">
            <AdminTab value="overview" icon={LayoutDashboard} label="Overview" />
            <AdminTab value="registrations" icon={ClipboardList} label="Registrations" />
            <AdminTab value="programs" icon={GraduationCap} label="Programs" />
            <AdminTab value="subjects" icon={BookOpen} label="Subjects" />
            <AdminTab value="topics" icon={FolderTree} label="Topics" />
            <AdminTab value="resources" icon={FileText} label="Resources" />
          </TabsList>
          <TabsContent value="overview" className="mt-8"><OverviewTab /></TabsContent>
          <TabsContent value="registrations" className="mt-8"><RegistrationsTab /></TabsContent>
          <TabsContent value="programs" className="mt-8"><ProgramsTab /></TabsContent>
          <TabsContent value="subjects" className="mt-8"><SubjectsTab /></TabsContent>
          <TabsContent value="topics" className="mt-8"><TopicsTab /></TabsContent>
          <TabsContent value="resources" className="mt-8"><ResourcesTab /></TabsContent>
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

function RegistrationsTab() {
  const [kind, setKind] = useState<"student" | "tutor">("student");
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant={kind === "student" ? "default" : "outline"} onClick={() => setKind("student")}>Students</Button>
        <Button variant={kind === "tutor" ? "default" : "outline"} onClick={() => setKind("tutor")}>Volunteer tutors</Button>
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

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800 border-amber-200",
    approved: "bg-emerald-100 text-emerald-800 border-emerald-200",
    waitlisted: "bg-blue-100 text-blue-800 border-blue-200",
    rejected: "bg-red-100 text-red-800 border-red-200",
  };
  return <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize ${map[status] ?? "bg-muted"}`}>{status}</span>;
}

function StudentRegTable() {
  const { rows, loading, updateStatus, remove, reload } = useRegs<StudentReg>("summer_student_registrations");
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (!s) return true;
      return [r.full_name, r.email, r.phone, r.parent_name, r.current_class, r.department ?? "", (r.target_exams ?? []).join(" ")]
        .join(" ").toLowerCase().includes(s);
    });
  }, [rows, q, statusFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input placeholder="Search name, email, phone, class, exam…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {REG_STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={reload}>Refresh</Button>
        <span className="ml-auto text-sm text-muted-foreground">{filtered.length} of {rows.length}</span>
      </div>
      {loading ? <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div> : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Student</th><th className="px-4 py-3">Contact</th><th className="px-4 py-3">Class</th>
                <th className="px-4 py-3">Exams</th><th className="px-4 py-3">Submitted</th><th className="px-4 py-3">Status</th><th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((r) => (
                <tr key={r.id} className="align-top">
                  <td className="px-4 py-3">
                    <div className="font-semibold">{r.full_name}</div>
                    <div className="text-xs text-muted-foreground">{r.gender} · {r.age ?? "—"} yrs</div>
                    <div className="text-xs text-muted-foreground">Parent: {r.parent_name}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div>{r.email}</div>
                    <div className="text-xs text-muted-foreground">{r.phone}</div>
                    <div className="text-xs text-muted-foreground line-clamp-2 max-w-[220px]">{r.home_address}</div>
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
                  <td className="px-4 py-3">
                    <Select value={r.status} onValueChange={(v) => updateStatus(r.id, v)}>
                      <SelectTrigger className="h-8 w-32"><StatusBadge status={r.status} /></SelectTrigger>
                      <SelectContent>{REG_STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="icon" onClick={() => remove(r.id)} aria-label="Delete"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">No registrations match.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function TutorRegTable() {
  const { rows, loading, updateStatus, remove, reload } = useRegs<TutorReg>("summer_tutor_volunteers");
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (!s) return true;
      return [r.full_name, r.email, r.phone, r.qualification, (r.subjects ?? []).join(" "), r.availability]
        .join(" ").toLowerCase().includes(s);
    });
  }, [rows, q, statusFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input placeholder="Search name, email, subject, availability…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {REG_STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={reload}>Refresh</Button>
        <span className="ml-auto text-sm text-muted-foreground">{filtered.length} of {rows.length}</span>
      </div>
      {loading ? <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div> : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Volunteer</th><th className="px-4 py-3">Contact</th><th className="px-4 py-3">Qualification</th>
                <th className="px-4 py-3">Subjects</th><th className="px-4 py-3">Availability</th><th className="px-4 py-3">Status</th><th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((r) => (
                <tr key={r.id} className="align-top">
                  <td className="px-4 py-3">
                    <div className="font-semibold">{r.full_name}</div>
                    <div className="text-xs text-muted-foreground">{r.gender} · {r.experience_years ?? 0} yrs exp</div>
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
                  <td className="px-4 py-3 text-xs">{r.availability}</td>
                  <td className="px-4 py-3">
                    <Select value={r.status} onValueChange={(v) => updateStatus(r.id, v)}>
                      <SelectTrigger className="h-8 w-32"><StatusBadge status={r.status} /></SelectTrigger>
                      <SelectContent>{REG_STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="icon" onClick={() => remove(r.id)} aria-label="Delete"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">No volunteers match.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
