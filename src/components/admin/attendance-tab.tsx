import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, HelpCircle, Loader2, Search, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Row = {
  id: string;
  session_date: string;
  student_marked: boolean | null;
  tutor_marked: boolean | null;
  booking_id: string;
  bookings: { ref_code: string | null; student_name: string | null; preferred_start: string } | null;
  tutor_profiles: { display_name: string; ref_code: string | null } | null;
};

const MarkPill = ({ value }: { value: boolean | null }) =>
  value === null ? (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><HelpCircle className="size-3.5" /> Not marked</span>
  ) : value ? (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-green"><CheckCircle2 className="size-3.5" /> Attended</span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-destructive"><XCircle className="size-3.5" /> Missed</span>
  );

export default function AttendanceTab() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [onlyClashes, setOnlyClashes] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from("attendance")
        .select("id, session_date, student_marked, tutor_marked, booking_id, bookings(ref_code, student_name, preferred_start), tutor_profiles(display_name, ref_code)")
        .order("session_date", { ascending: false })
        .limit(500);
      setRows((data ?? []) as Row[]);
      setLoading(false);
    })();
  }, []);

  const clash = (r: Row) => r.student_marked !== null && r.tutor_marked !== null && r.student_marked !== r.tutor_marked;
  const missing = (r: Row) => r.student_marked === null || r.tutor_marked === null;

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (onlyClashes && !clash(r)) return false;
      if (!term) return true;
      return [r.bookings?.student_name, r.bookings?.ref_code, r.tutor_profiles?.display_name, r.tutor_profiles?.ref_code, r.session_date]
        .filter(Boolean).join(" ").toLowerCase().includes(term);
    });
  }, [rows, q, onlyClashes]);

  const clashes = rows.filter(clash).length;
  const pending = rows.filter(missing).length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border bg-card p-5"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Records</p><p className="mt-1 font-display text-3xl font-bold">{rows.length}</p></div>
        <div className="rounded-2xl border bg-card p-5"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Awaiting a mark</p><p className="mt-1 font-display text-3xl font-bold">{pending}</p></div>
        <div className="rounded-2xl border bg-card p-5"><p className="text-xs font-semibold uppercase tracking-wide text-destructive">Discrepancies</p><p className="mt-1 font-display text-3xl font-bold text-destructive">{clashes}</p></div>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border bg-card p-4">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search student, tutor, ref or date…" className="pl-9" />
        </div>
        <Button variant={onlyClashes ? "default" : "outline"} size="sm" onClick={() => setOnlyClashes((v) => !v)}>
          <AlertTriangle className="size-4" /> Discrepancies only
        </Button>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">No attendance records yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border bg-card">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Tutor</th>
                <th className="px-4 py-3">Student mark</th>
                <th className="px-4 py-3">Tutor mark</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((r) => (
                <tr key={r.id} className={clash(r) ? "bg-destructive/5" : undefined}>
                  <td className="px-4 py-3 whitespace-nowrap">{r.session_date}</td>
                  <td className="px-4 py-3">
                    <p className="font-semibold">{r.bookings?.student_name ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">{r.bookings?.ref_code ?? ""}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold">{r.tutor_profiles?.display_name ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">{r.tutor_profiles?.ref_code ?? ""}</p>
                  </td>
                  <td className="px-4 py-3"><MarkPill value={r.student_marked} /></td>
                  <td className="px-4 py-3"><MarkPill value={r.tutor_marked} /></td>
                  <td className="px-4 py-3">
                    {clash(r) ? <Badge variant="destructive">Discrepancy</Badge>
                      : missing(r) ? <Badge variant="secondary">Pending</Badge>
                      : <Badge>Agreed</Badge>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
