import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, Pencil, PlayCircle, Plus, Search, Trash2, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ListSkeleton } from "@/components/skeletons";
import { supabase } from "@/integrations/supabase/client";
import { fetchManagedQuestionCatalogue, type ManagedProgramme, type ManagedSubject } from "@/lib/past-papers";
import { parseVideoSource, videoSourceUrl } from "@/lib/tutorial-videos";
import type { Database } from "@/integrations/supabase/types";

type VideoRow = Database["public"]["Tables"]["videos"]["Row"];
type TopicRow = { id: string; subject_id: string; name: string; is_published: boolean };
type Draft = {
  id?: string;
  program_id: string;
  subject_id: string;
  topic_id: string;
  title: string;
  description: string;
  url: string;
  thumbnail_url: string;
  duration_minutes: string;
  access_level: "free" | "premium";
  is_published: boolean;
};

const ALL = "__all__";
const NONE = "__none__";

export default function TutorialVideosTab() {
  const [programmes, setProgrammes] = useState<ManagedProgramme[]>([]);
  const [subjects, setSubjects] = useState<ManagedSubject[]>([]);
  const [topics, setTopics] = useState<TopicRow[]>([]);
  const [rows, setRows] = useState<VideoRow[]>([]);
  const [catalogueLoading, setCatalogueLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [search, setSearch] = useState("");
  const [programmeFilter, setProgrammeFilter] = useState(ALL);
  const [subjectFilter, setSubjectFilter] = useState(ALL);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<VideoRow | null>(null);

  const loadVideos = async () => {
    setLoading(true);
    setLoadError(false);
    const { data, error } = await supabase.from("videos").select("*").order("created_at", { ascending: false });
    if (error) {
      setRows([]);
      setLoadError(true);
      toast.error("Could not load tutorial videos. Check your connection and try again.");
    } else {
      setRows(data ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    let active = true;
    Promise.all([
      fetchManagedQuestionCatalogue(),
      supabase.from("topics").select("id,subject_id,name,is_published").order("sort_order"),
    ]).then(([catalogue, topicResult]) => {
      if (!active) return;
      if (topicResult.error) throw topicResult.error;
      setProgrammes(catalogue.programmes);
      setSubjects(catalogue.subjects);
      setTopics(topicResult.data ?? []);
    }).catch(() => {
      if (active) toast.error("Could not load the programme, subject, and topic list. Refresh and try again.");
    }).finally(() => { if (active) setCatalogueLoading(false); });
    void loadVideos();
    return () => { active = false; };
  }, []);

  const filteredSubjects = useMemo(
    () => subjects.filter((subject) => subject.program_id === (draft?.program_id ?? programmeFilter)),
    [subjects, draft?.program_id, programmeFilter],
  );
  const formTopics = useMemo(
    () => topics.filter((topic) => topic.subject_id === draft?.subject_id),
    [topics, draft?.subject_id],
  );
  const visibleRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (programmeFilter !== ALL && row.program_id !== programmeFilter) return false;
      if (subjectFilter !== ALL && row.subject_id !== subjectFilter) return false;
      if (!term) return true;
      const programmeName = programmes.find((p) => p.id === row.program_id)?.name ?? "";
      const subjectName = subjects.find((s) => s.id === row.subject_id)?.name ?? "";
      const topicName = topics.find((t) => t.id === row.topic_id)?.name ?? "";
      return [row.title, row.description, programmeName, subjectName, topicName].join(" ").toLowerCase().includes(term);
    });
  }, [rows, search, programmeFilter, subjectFilter, programmes, subjects, topics]);

  const beginNew = () => {
    const firstProgramme = programmes[0];
    const firstSubject = subjects.find((subject) => subject.program_id === firstProgramme?.id);
    setDraft({
      program_id: firstProgramme?.id ?? "",
      subject_id: firstSubject?.id ?? "",
      topic_id: NONE,
      title: "",
      description: "",
      url: "",
      thumbnail_url: "",
      duration_minutes: "",
      access_level: "premium",
      is_published: false,
    });
  };

  const beginEdit = (row: VideoRow) => setDraft({
    id: row.id,
    program_id: row.program_id,
    subject_id: row.subject_id,
    topic_id: row.topic_id ?? NONE,
    title: row.title,
    description: row.description,
    url: videoSourceUrl(row),
    thumbnail_url: row.thumbnail_url ?? "",
    duration_minutes: row.duration_seconds ? String(row.duration_seconds / 60) : "",
    access_level: row.access_level,
    is_published: row.is_published,
  });

  const save = async () => {
    if (!draft) return;
    if (!draft.title.trim() || !draft.program_id || !draft.subject_id) {
      toast.error("Enter a title and choose a programme and subject.");
      return;
    }
    const source = parseVideoSource(draft.url);
    if (!source) {
      toast.error("Use a secure YouTube, Vimeo, Google Drive, or direct video link.");
      return;
    }
    const duration = draft.duration_minutes.trim() ? Number(draft.duration_minutes) : null;
    if (duration !== null && (!Number.isFinite(duration) || duration <= 0 || duration > 1440)) {
      toast.error("Video length must be a number between 1 minute and 24 hours.");
      return;
    }

    setSaving(true);
    const payload = {
      program_id: draft.program_id,
      subject_id: draft.subject_id,
      topic_id: draft.topic_id === NONE ? null : draft.topic_id,
      title: draft.title.trim(),
      description: draft.description.trim(),
      provider: source.provider,
      provider_id: source.providerId,
      provider_url: source.url,
      thumbnail_url: draft.thumbnail_url.trim() || source.thumbnailUrl,
      duration_seconds: duration === null ? null : Math.round(duration * 60),
      access_level: draft.access_level,
      is_published: draft.is_published,
    };
    const result = draft.id
      ? await supabase.from("videos").update(payload).eq("id", draft.id)
      : await supabase.from("videos").insert(payload);
    setSaving(false);
    if (result.error) {
      toast.error("The video could not be saved. Check the details and try again.");
      return;
    }
    toast.success(draft.id ? "Tutorial video updated." : "Tutorial video added.");
    setDraft(null);
    void loadVideos();
  };

  const togglePublished = async (row: VideoRow) => {
    const next = !row.is_published;
    setRows((current) => current.map((item) => item.id === row.id ? { ...item, is_published: next } : item));
    const { error } = await supabase.from("videos").update({ is_published: next }).eq("id", row.id);
    if (error) {
      setRows((current) => current.map((item) => item.id === row.id ? { ...item, is_published: row.is_published } : item));
      toast.error("The publish setting could not be changed. Try again.");
    } else {
      toast.success(next ? "Video published for learners." : "Video hidden from learners.");
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    const { error } = await supabase.from("videos").delete().eq("id", deleting.id);
    if (error) {
      toast.error("The video could not be deleted. Try again.");
    } else {
      setRows((current) => current.filter((row) => row.id !== deleting.id));
      toast.success("Tutorial video deleted.");
    }
    setDeleting(null);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Video className="size-5" /></span>
          <div>
            <h1 className="font-display text-2xl font-bold">Tutorial videos</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Add hosted lessons and organise them by programme, subject, and topic.</p>
          </div>
        </div>
        <Button onClick={beginNew} disabled={catalogueLoading || !subjects.length}><Plus className="size-4" /> Add video</Button>
      </header>

      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_220px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search videos, subjects, topics…" className="pl-9" />
        </div>
        <Select value={programmeFilter} onValueChange={(value) => { setProgrammeFilter(value); setSubjectFilter(ALL); }}>
          <SelectTrigger><SelectValue placeholder="All programmes" /></SelectTrigger>
          <SelectContent><SelectItem value={ALL}>All programmes</SelectItem>{programmes.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={subjectFilter} onValueChange={setSubjectFilter}>
          <SelectTrigger><SelectValue placeholder="All subjects" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All subjects</SelectItem>
            {subjects.filter((s) => programmeFilter === ALL || s.program_id === programmeFilter).map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? <ListSkeleton rows={5} /> : loadError ? (
        <div className="rounded-xl border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">Your video list could not be loaded.</p>
          <Button variant="outline" className="mt-3" onClick={() => void loadVideos()}><Loader2 className="size-4" /> Try again</Button>
        </div>
      ) : visibleRows.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <Video className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 font-medium">{rows.length ? "No videos match these filters" : "No tutorial videos yet"}</p>
          <p className="mt-1 text-sm text-muted-foreground">Add a hosted lesson link and connect it to a subject or topic.</p>
          {!rows.length && <Button className="mt-4" onClick={beginNew} disabled={!subjects.length}><Plus className="size-4" /> Add first video</Button>}
        </div>
      ) : (
        <div className="divide-y rounded-xl border bg-card">
          {visibleRows.map((row) => {
            const programme = programmes.find((item) => item.id === row.program_id)?.name ?? "Programme";
            const subject = subjects.find((item) => item.id === row.subject_id)?.name ?? "Subject";
            const topic = topics.find((item) => item.id === row.topic_id)?.name;
            return (
              <article key={row.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                {row.thumbnail_url ? (
                  <img src={row.thumbnail_url} alt="" loading="lazy" className="aspect-video w-full rounded-lg border object-cover sm:w-40" />
                ) : (
                  <span className="grid aspect-video w-full shrink-0 place-items-center rounded-lg border bg-muted text-muted-foreground sm:w-40"><PlayCircle className="size-8" /></span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="break-words font-semibold">{row.title}</h2>
                    <Badge variant={row.access_level === "premium" ? "default" : "secondary"}>{row.access_level === "premium" ? "Premium" : "Free"}</Badge>
                    <Badge variant="outline">{row.is_published ? "Published" : "Hidden"}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{programme} · {subject}{topic ? ` · ${topic}` : ""}</p>
                  {row.description && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{row.description}</p>}
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button type="button" variant="ghost" size="icon" aria-label={row.is_published ? "Hide video" : "Publish video"} title={row.is_published ? "Hide video" : "Publish video"} onClick={() => void togglePublished(row)}>
                    {row.is_published ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </Button>
                  <Button type="button" variant="ghost" size="icon" aria-label="Edit video" title="Edit video" onClick={() => beginEdit(row)}><Pencil className="size-4" /></Button>
                  <Button type="button" variant="ghost" size="icon" aria-label="Delete video" title="Delete video" onClick={() => setDeleting(row)}><Trash2 className="size-4" /></Button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Dialog open={!!draft} onOpenChange={(open) => { if (!open && !saving) setDraft(null); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{draft?.id ? "Edit tutorial video" : "Add tutorial video"}</DialogTitle>
            <DialogDescription>Use a YouTube, Vimeo, Google Drive, or direct HTTPS video link.</DialogDescription>
          </DialogHeader>
          {draft && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2"><Label htmlFor="video-title">Video title</Label><Input id="video-title" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} maxLength={180} /></div>
              <div className="space-y-2 sm:col-span-2"><Label htmlFor="video-description">Description</Label><Textarea id="video-description" rows={3} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} maxLength={2000} /></div>
              <div className="space-y-2"><Label>Programme</Label><Select value={draft.program_id} onValueChange={(value) => {
                const nextSubject = subjects.find((subject) => subject.program_id === value);
                setDraft({ ...draft, program_id: value, subject_id: nextSubject?.id ?? "", topic_id: NONE });
              }}><SelectTrigger><SelectValue placeholder="Choose programme" /></SelectTrigger><SelectContent>{programmes.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Subject</Label><Select value={draft.subject_id} onValueChange={(value) => setDraft({ ...draft, subject_id: value, topic_id: NONE })} disabled={!filteredSubjects.length}><SelectTrigger><SelectValue placeholder="Choose subject" /></SelectTrigger><SelectContent>{filteredSubjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2 sm:col-span-2"><Label>Topic (optional)</Label><Select value={draft.topic_id} onValueChange={(value) => setDraft({ ...draft, topic_id: value })} disabled={!formTopics.length}><SelectTrigger><SelectValue placeholder="Choose topic" /></SelectTrigger><SelectContent><SelectItem value={NONE}>No specific topic</SelectItem>{formTopics.map((topic) => <SelectItem key={topic.id} value={topic.id}>{topic.name}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2 sm:col-span-2"><Label htmlFor="video-url">Hosted video link</Label><Input id="video-url" type="url" inputMode="url" placeholder="https://…" value={draft.url} onChange={(event) => {
                const url = event.target.value;
                const source = parseVideoSource(url);
                setDraft((current) => current ? { ...current, url, thumbnail_url: current.thumbnail_url || source?.thumbnailUrl || "" } : current);
              }} /></div>
              <div className="space-y-2"><Label htmlFor="video-thumbnail">Thumbnail URL (optional)</Label><Input id="video-thumbnail" type="url" value={draft.thumbnail_url} onChange={(event) => setDraft({ ...draft, thumbnail_url: event.target.value })} /></div>
              <div className="space-y-2"><Label htmlFor="video-duration">Length in minutes (optional)</Label><Input id="video-duration" type="number" min="1" max="1440" step="0.5" value={draft.duration_minutes} onChange={(event) => setDraft({ ...draft, duration_minutes: event.target.value })} /></div>
              <div className="space-y-2"><Label>Access</Label><Select value={draft.access_level} onValueChange={(value: "free" | "premium") => setDraft({ ...draft, access_level: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="free">Free</SelectItem><SelectItem value="premium">Premium</SelectItem></SelectContent></Select></div>
              <div className="flex items-center justify-between rounded-lg border px-3 py-2"><Label htmlFor="video-published">Published for learners</Label><Switch id="video-published" checked={draft.is_published} onCheckedChange={(checked) => setDraft({ ...draft, is_published: checked })} /></div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setDraft(null)} disabled={saving}>Cancel</Button><Button onClick={() => void save()} disabled={saving || catalogueLoading}>{saving && <Loader2 className="size-4 animate-spin" />} Save video</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(open) => { if (!open) setDeleting(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete this video?</AlertDialogTitle><AlertDialogDescription>“{deleting?.title}” will be removed from the learner library.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Keep video</AlertDialogCancel><AlertDialogAction onClick={(event) => { event.preventDefault(); void confirmDelete(); }}>Delete video</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}