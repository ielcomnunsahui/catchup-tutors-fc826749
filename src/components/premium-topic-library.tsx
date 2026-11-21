import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { LockKeyhole, PlayCircle, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CardGridSkeleton } from "@/components/skeletons";
import { supabase } from "@/integrations/supabase/client";
import { parseVideoSource, videoEmbedSource, videoSourceUrl } from "@/lib/tutorial-videos";

type TutorialVideo = {
  id: string;
  title: string;
  description: string;
  program_id: string;
  subject_id: string;
  topic_id: string | null;
  provider: string;
  provider_id: string;
  provider_url: string | null;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  access_level: "free" | "premium";
};

type NamedRecord = { id: string; name: string; program_id?: string; subject_id?: string };
const ALL = "__all__";

/**
 * Shows published tutorial videos from the admin-managed programme, subject and topic catalogue.
 */
export default function PremiumTopicLibrary({ unlocked, ctaLabel }: { unlocked: boolean; ctaLabel: string }) {
  const [programmeId, setProgrammeId] = useState(ALL);
  const [subjectId, setSubjectId] = useState(ALL);
  const [topicId, setTopicId] = useState(ALL);
  const [activeVideo, setActiveVideo] = useState<TutorialVideo | null>(null);
  const library = useQuery({
    queryKey: ["tutorial-video-library"],
    queryFn: async () => {
      const [videoResult, programmeResult, subjectResult, topicResult] = await Promise.all([
        supabase.from("videos").select("*").eq("is_published", true).order("created_at", { ascending: false }).limit(200),
        supabase.from("programs").select("id,name"),
        supabase.from("subjects").select("id,name,program_id"),
        supabase.from("topics").select("id,name,subject_id"),
      ]);
      const error = videoResult.error ?? programmeResult.error ?? subjectResult.error ?? topicResult.error;
      if (error) throw error;
      return {
        videos: (videoResult.data ?? []) as TutorialVideo[],
        programmes: (programmeResult.data ?? []) as NamedRecord[],
        subjects: (subjectResult.data ?? []) as NamedRecord[],
        topics: (topicResult.data ?? []) as NamedRecord[],
      };
    },
  });

  const data = library.data;
  const availableSubjects = useMemo(
    () => (data?.subjects ?? []).filter((subject) => programmeId === ALL || subject.program_id === programmeId),
    [data?.subjects, programmeId],
  );
  const availableTopics = useMemo(
    () => (data?.topics ?? []).filter((topic) => subjectId === ALL || topic.subject_id === subjectId),
    [data?.topics, subjectId],
  );
  const videos = useMemo(() => (data?.videos ?? []).filter((video) =>
    (programmeId === ALL || video.program_id === programmeId) &&
    (subjectId === ALL || video.subject_id === subjectId) &&
    (topicId === ALL || video.topic_id === topicId),
  ), [data?.videos, programmeId, subjectId, topicId]);

  const resetSubjects = (value: string) => {
    setProgrammeId(value);
    setSubjectId(ALL);
    setTopicId(ALL);
  };
  const resetTopics = (value: string) => {
    setSubjectId(value);
    setTopicId(ALL);
  };
  const activeSource = activeVideo ? parseVideoSource(videoSourceUrl(activeVideo)) : null;
  const activeEmbed = activeSource ? videoEmbedSource(activeSource) : null;

  return (
    <section className="mt-14">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="font-display text-xl font-bold sm:text-2xl">Tutor-led video lessons</h2>
        <Badge variant="secondary">{videos.length} lessons</Badge>
      </div>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Browse lessons by programme, subject, and topic.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Select value={programmeId} onValueChange={resetSubjects}>
          <SelectTrigger><SelectValue placeholder="All programmes" /></SelectTrigger>
          <SelectContent><SelectItem value={ALL}>All programmes</SelectItem>{(data?.programmes ?? []).map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={subjectId} onValueChange={resetTopics}>
          <SelectTrigger><SelectValue placeholder="All subjects" /></SelectTrigger>
          <SelectContent><SelectItem value={ALL}>All subjects</SelectItem>{availableSubjects.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={topicId} onValueChange={setTopicId}>
          <SelectTrigger><SelectValue placeholder="All topics" /></SelectTrigger>
          <SelectContent><SelectItem value={ALL}>All topics</SelectItem>{availableTopics.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {library.isLoading ? <CardGridSkeleton count={3} className="mt-6" /> : library.isError ? (
        <div className="mt-6 rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">Video lessons could not be loaded. Refresh the page and try again.</div>
      ) : videos.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed p-10 text-center">
          <Video className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">No video lessons are available for these selections yet.</p>
          {!unlocked && <Button asChild variant="outline" className="mt-4"><Link to="/pricing"><LockKeyhole className="size-4" /> {ctaLabel}</Link></Button>}
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((video) => {
            const locked = video.access_level === "premium" && !unlocked;
            const programme = data?.programmes.find((item) => item.id === video.program_id)?.name;
            const subject = data?.subjects.find((item) => item.id === video.subject_id)?.name;
            const topic = data?.topics.find((item) => item.id === video.topic_id)?.name;
            return (
              <article key={video.id} className="flex flex-col overflow-hidden rounded-xl border bg-card">
                <div className="relative aspect-video bg-muted">
                  {video.thumbnail_url && <img src={video.thumbnail_url} alt="" loading="lazy" className="h-full w-full object-cover" />}
                  {!video.thumbnail_url && <div className="grid h-full place-items-center text-muted-foreground"><Video className="size-9" /></div>}
                  {locked && <div className="absolute inset-0 grid place-items-center bg-brand-navy/60 text-hero-foreground"><LockKeyhole className="size-8" /></div>}
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <div className="flex flex-wrap gap-2"><Badge variant="outline">{video.access_level === "premium" ? "Premium" : "Free"}</Badge>{video.duration_seconds && <Badge variant="secondary">{Math.ceil(video.duration_seconds / 60)} min</Badge>}</div>
                  <h3 className="mt-2 break-words font-display text-base font-bold leading-snug">{video.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{[programme, subject, topic].filter(Boolean).join(" · ")}</p>
                  {video.description && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{video.description}</p>}
                  {locked ? (
                    <Button asChild size="sm" variant="outline" className="mt-auto pt-2"><Link to="/pricing"><LockKeyhole className="size-4" /> {ctaLabel}</Link></Button>
                  ) : (
                    <Button size="sm" className="mt-auto pt-2" onClick={() => setActiveVideo(video)}><PlayCircle className="size-4" /> Watch lesson</Button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Dialog open={!!activeVideo} onOpenChange={(open) => { if (!open) setActiveVideo(null); }}>
        <DialogContent className="max-w-4xl p-4 sm:p-6">
          <DialogHeader><DialogTitle>{activeVideo?.title}</DialogTitle><DialogDescription>{activeVideo?.description}</DialogDescription></DialogHeader>
          {activeVideo && activeEmbed && (
            <div className="aspect-video overflow-hidden rounded-lg bg-muted">
              {activeEmbed.kind === "file" ? (
                <video key={activeEmbed.url} src={activeEmbed.url} controls playsInline className="h-full w-full" />
              ) : (
                <iframe key={activeEmbed.url} src={activeEmbed.url} title={activeVideo.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen className="h-full w-full border-0" />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
