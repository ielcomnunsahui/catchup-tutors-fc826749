import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { GraduationCap, Loader2, Search, BookOpenCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { callMyschool } from "@/lib/nigerian-exams";

type School = { name: string; slug: string };
type Course = { name: string; slug?: string; url?: string; requirements_path?: string };

const SCHOOL_TYPES = [
  { id: "university", label: "Universities" },
  { id: "polytechnic", label: "Polytechnics" },
  { id: "college of education", label: "Colleges of education" },
] as const;

const LABELS: Record<string, string> = {
  utme_subject_combination: "UTME subject combination",
  "UTME Subject Combination": "UTME subject combination",
  olevel_requirements: "O'Level requirements",
  "O'Level Requirements": "O'Level requirements",
  direct_entry_requirements: "Direct Entry requirements",
  "Direct Entry Requirements": "Direct Entry requirements",
};

/** Look up JAMB/O'Level admission requirements for a course at a Nigerian school. */
export default function AdmissionRequirements() {
  const [type, setType] = useState<string>("university");
  const [schoolQuery, setSchoolQuery] = useState("");
  const [school, setSchool] = useState<School | null>(null);
  const [course, setCourse] = useState<Course | null>(null);

  const schools = useQuery({
    queryKey: ["ng-schools", type],
    queryFn: () => callMyschool<{ schools: School[] }>({ action: "schools", school_type: type }),
    staleTime: 24 * 60 * 60_000,
  });

  const courses = useQuery({
    queryKey: ["ng-courses", school?.slug],
    enabled: !!school,
    queryFn: () => callMyschool<{ courses: Course[] }>({ action: "courses", school: school!.slug }),
    staleTime: 24 * 60 * 60_000,
  });

  const requirements = useQuery({
    queryKey: ["ng-requirements", school?.slug, course?.slug ?? course?.name],
    enabled: !!school && !!course?.requirements_path,
    queryFn: () =>
      callMyschool<{ requirements: Record<string, unknown> }>({
        action: "requirements",
        school: school!.slug,
        school_name: school!.name,
        course: course!.slug ?? course!.name,
        course_name: course!.name,
        path: course!.requirements_path!,
      }),
    staleTime: 24 * 60 * 60_000,
  });

  const filteredSchools = (schools.data?.schools ?? []).filter((s) =>
    s.name.toLowerCase().includes(schoolQuery.trim().toLowerCase()),
  );

  const entries = Object.entries(requirements.data?.requirements ?? {}).filter(
    ([, v]) => typeof v === "string" && v.trim().length > 0,
  ) as [string, string][];

  return (
    <div className="rounded-3xl border bg-card p-6 shadow-soft sm:p-8">
      <div className="flex flex-wrap items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <GraduationCap className="size-5" />
        </span>
        <div className="min-w-0">
          <h3 className="font-display text-xl font-bold sm:text-2xl">Admission requirements checker</h3>
          <p className="text-sm text-muted-foreground">
            Pick a Nigerian school and course to see the UTME subject combination, O'Level and Direct Entry requirements.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label>Institution type</Label>
          <Select
            value={type}
            onValueChange={(v) => { setType(v); setSchool(null); setCourse(null); }}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {SCHOOL_TYPES.map((t) => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label>School</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              value={school ? school.name : schoolQuery}
              onChange={(e) => { setSchool(null); setCourse(null); setSchoolQuery(e.target.value); }}
              placeholder={schools.isLoading ? "Loading schools…" : "Type a school name, e.g. Unilorin"}
            />
          </div>
          {!school && schoolQuery.trim().length > 1 && (
            <div className="max-h-56 overflow-y-auto rounded-xl border bg-background">
              {schools.isLoading && (
                <p className="flex items-center gap-2 p-3 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" /> Loading…
                </p>
              )}
              {schools.isError && <p className="p-3 text-sm text-muted-foreground">Could not load schools right now.</p>}
              {filteredSchools.slice(0, 40).map((s) => (
                <button
                  key={s.slug}
                  type="button"
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-muted"
                  onClick={() => { setSchool(s); setSchoolQuery(s.name); setCourse(null); }}
                >
                  {s.name}
                </button>
              ))}
              {!schools.isLoading && filteredSchools.length === 0 && (
                <p className="p-3 text-sm text-muted-foreground">No school matches that name.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {school && (
        <div className="mt-4 space-y-1.5">
          <Label>Course</Label>
          {courses.isLoading ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Loading courses at {school.name}…
            </p>
          ) : courses.isError ? (
            <p className="text-sm text-muted-foreground">Could not load courses for this school.</p>
          ) : (
            <Select
              value={course?.slug ?? course?.name ?? ""}
              onValueChange={(v) =>
                setCourse((courses.data?.courses ?? []).find((c) => (c.slug ?? c.name) === v) ?? null)
              }
            >
              <SelectTrigger><SelectValue placeholder="Select a course" /></SelectTrigger>
              <SelectContent className="max-h-72">
                {(courses.data?.courses ?? []).map((c) => (
                  <SelectItem key={c.slug ?? c.name} value={c.slug ?? c.name}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      {course && (
        <div className="mt-5 rounded-2xl border bg-muted/20 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <BookOpenCheck className="size-4 text-primary" />
            <h4 className="font-display text-base font-bold">{course.name}</h4>
            <Badge variant="secondary">{school?.name}</Badge>
          </div>
          {requirements.isLoading ? (
            <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Fetching requirements…
            </p>
          ) : requirements.isError ? (
            <p className="mt-3 text-sm text-muted-foreground">Requirements aren't available for this course yet.</p>
          ) : entries.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">No published requirements for this course.</p>
          ) : (
            <dl className="mt-3 space-y-3">
              {entries.map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    {LABELS[k] ?? k.replace(/_/g, " ")}
                  </dt>
                  <dd className="mt-1 text-sm leading-6">{v}</dd>
                </div>
              ))}
            </dl>
          )}
          <p className="mt-4 text-[11px] text-muted-foreground">
            Source: myschool.ng JAMB brochure data. Always confirm with the official JAMB brochure before applying.
          </p>
        </div>
      )}
    </div>
  );
}
