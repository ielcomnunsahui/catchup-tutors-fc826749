import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarCheck, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type SessionRow = {
  bookingId: string;
  tutorId: string;
  studentId: string;
  sessionDate: string;
  startsAt: string;
  label: string;
  studentMarked: boolean | null;
  tutorMarked: boolean | null;
};

const dateKey = (iso: string) => new Date(iso).toISOString().slice(0, 10);

function useSessions(role: "student" | "tutor", id: string | null) {
  const [rows, setRows] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) { setRows([]); setLoading(false); return; }
    const column = role === "student" ? "student_id" : "tutor_id";
    const { data: bookings } = await supabase
      .from("bookings")
      .select("id, tutor_id, student_id, preferred_start, status, student_name, ref_code")
      .eq(column, id)
      .in("status", ["confirmed", "completed"])
      .lte("preferred_start", new Date().toISOString())
      .order("preferred_start", { ascending: false })
      .limit(30);

    const list = bookings ?? [];
    if (!list.length) { setRows([]); setLoading(false); return; }

    const { data: marks } = await supabase
      .from("attendance")
      .select("booking_id, session_date, student_marked, tutor_marked")
      .in("booking_id", list.map((b) => b.id));

    const byKey = new Map((marks ?? []).map((m: any) => [`${m.booking_id}|${m.session_date}`, m]));
    setRows(
      list.map((b: any) => {
        const sd = dateKey(b.preferred_start);
        const m: any = byKey.get(`${b.id}|${sd}`);
        return {
          bookingId: b.id,
          tutorId: b.tutor_id,
          studentId: b.student_id,
          sessionDate: sd,
          startsAt: b.preferred_start,
          label: role === "tutor" ? (b.student_name || b.ref_code || "Student") : (b.ref_code || "Session"),
          studentMarked: m?.student_marked ?? null,
          tutorMarked: m?.tutor_marked ?? null,
        };
      }),
    );
    setLoading(false);
  }, [role, id]);

  useEffect(() => { load(); }, [load]);
  return { rows, loading, reload: load };
}

function AttendanceList({ role, ownerId, title, subtitle }: { role: "student" | "tutor"; ownerId: string | null; title: string; subtitle: string }) {
  const { rows, loading, reload } = useSessions(role, ownerId);
  const [saving, setSaving] = useState<string | null>(null);

  const pending = useMemo(
    () => rows.filter((r) => (role === "student" ? r.studentMarked : r.tutorMarked) === null).length,
    [rows, role],
  );

  async function mark(row: SessionRow, value: boolean) {
    setSaving(row.bookingId);
    const payload: Record<string, unknown> = {
      booking_id: row.bookingId,
      student_id: row.studentId,
      tutor_id: row.tutorId,
      session_date: row.sessionDate,
      attended: value,
      [role === "student" ? "student_marked" : "tutor_marked"]: value,
    };
    const { error } = await (supabase as any)
      .from("attendance")
      .upsert(payload, { onConflict: "booking_id,session_date" });
    setSaving(null);
    if (error) { toast.error(error.message); return; }
    toast.success(value ? "Marked as attended" : "Marked as absent");
    reload();
  }

  return (
    <section className="rounded-3xl border bg-card p-6 shadow-soft sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold sm:text-xl">{title}</h2>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        {pending > 0 && <Badge variant="secondary">{pending} to mark</Badge>}
      </div>

      {loading ? (
        <div className="mt-6 h-20 animate-pulse rounded-2xl bg-muted/60" />
      ) : rows.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          No completed sessions yet. Attendance appears here once a session date has passed.
        </p>
      ) : (
        <ul className="mt-5 divide-y">
          {rows.map((r) => {
            const mine = role === "student" ? r.studentMarked : r.tutorMarked;
            const other = role === "student" ? r.tutorMarked : r.studentMarked;
            const clash = mine !== null && other !== null && mine !== other;
            return (
              <li key={`${r.bookingId}-${r.sessionDate}`} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <CalendarCheck className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{r.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(r.startsAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                    </p>
                    {clash && <p className="mt-1 text-xs font-semibold text-destructive">Marks disagree — admin has been notified.</p>}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {saving === r.bookingId && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
                  <Button
                    size="sm"
                    variant={mine === true ? "default" : "outline"}
                    className={cn(mine === true && "pointer-events-none")}
                    onClick={() => mark(r, true)}
                  >
                    <CheckCircle2 className="size-4" /> Attended
                  </Button>
                  <Button
                    size="sm"
                    variant={mine === false ? "destructive" : "outline"}
                    className={cn(mine === false && "pointer-events-none")}
                    onClick={() => mark(r, false)}
                  >
                    <XCircle className="size-4" /> Missed
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export function StudentAttendance({ userId }: { userId: string | null }) {
  return (
    <AttendanceList
      role="student"
      ownerId={userId}
      title="My attendance"
      subtitle="Mark each session after it happens — your tutor marks it too."
    />
  );
}

export function TutorAttendance({ tutorId }: { tutorId: string | null }) {
  return (
    <AttendanceList
      role="tutor"
      ownerId={tutorId}
      title="Session attendance"
      subtitle="Confirm whether each student attended their session with you."
    />
  );
}
