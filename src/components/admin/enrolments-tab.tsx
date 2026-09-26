import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Search } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { PROGRAMME_PLANS, naira } from "@/lib/programme-plans";

const STATUSES = ["new", "contacted", "enrolled", "cancelled"];
type Row = Record<string, any>;

export default function EnrolmentsTab() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin", "enrolments"],
    queryFn: async (): Promise<Row[]> => {
      const { data, error } = await supabase.from("programme_enrolments" as any).select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });
  const [q, setQ] = useState("");
  const [prog, setProg] = useState("all");
  const [status, setStatus] = useState("all");
  const [open, setOpen] = useState<Row | null>(null);

  const rows = useMemo(() => data.filter((r) =>
    (prog === "all" || r.programme === prog) && (status === "all" || r.status === status) &&
    (!q || [r.full_name, r.email, r.phone, r.ref_code].join(" ").toLowerCase().includes(q.toLowerCase()))), [data, q, prog, status]);

  const updateStatus = async (r: Row, s: string) => {
    qc.setQueryData<Row[]>(["admin", "enrolments"], (cur) => (cur ?? []).map((x) => x.id === r.id ? { ...x, status: s } : x));
    if (open?.id === r.id) setOpen({ ...r, status: s });
    const { error } = await supabase.from("programme_enrolments" as any).update({ status: s }).eq("id", r.id);
    if (error) { toast.error(error.message); qc.invalidateQueries({ queryKey: ["admin", "enrolments"] }); }
    else toast.success("Status updated");
  };

  const exportCsv = () => {
    const cols = ["ref_code", "programme", "monthly_fee", "full_name", "email", "phone", "available_days", "preferred_time", "current_level", "school", "status", "created_at"];
    const esc = (v: any) => `"${String(Array.isArray(v) ? v.join("; ") : v ?? "").replace(/"/g, '""')}"`;
    const csv = [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "programme-enrolments.csv"; a.click();
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-4">
        {PROGRAMME_PLANS.slice(0, 4).map((p) => (
          <div key={p.key} className="rounded-2xl border bg-card p-4">
            <p className="text-xs text-muted-foreground">{p.name}</p>
            <p className="font-display text-2xl font-bold">{data.filter((r) => r.programme === p.key).length}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search name, email, phone, reference" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select value={prog} onValueChange={setProg}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">All programmes</SelectItem>{PROGRAMME_PLANS.map((p) => <SelectItem key={p.key} value={p.key}>{p.name}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">All statuses</SelectItem>{STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
        </Select>
        <Button variant="outline" onClick={exportCsv}><Download className="size-4" /> CSV</Button>
      </div>

      <div className="overflow-x-auto rounded-2xl border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr><th className="p-3">Reference</th><th className="p-3">Candidate</th><th className="p-3">Programme</th><th className="p-3">Schedule</th><th className="p-3">Status</th></tr>
          </thead>
          <tbody>
            {isLoading ? <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Loading…</td></tr>
              : rows.length === 0 ? <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">No enrolments yet</td></tr>
              : rows.map((r) => (
                <tr key={r.id} className="cursor-pointer border-t hover:bg-muted/40" onClick={() => setOpen(r)}>
                  <td className="p-3 font-mono text-xs">{r.ref_code}</td>
                  <td className="p-3"><p className="font-semibold">{r.full_name}</p><p className="text-xs text-muted-foreground">{r.phone} · {r.email}</p></td>
                  <td className="p-3"><Badge variant="secondary">{r.programme}</Badge> <span className="text-xs text-muted-foreground">{naira(r.monthly_fee)}</span></td>
                  <td className="p-3 text-xs">{(r.available_days ?? []).map((d: string) => d.slice(0, 3)).join(", ")}<br /><span className="text-muted-foreground">{r.preferred_time}</span></td>
                  <td className="p-3" onClick={(e) => e.stopPropagation()}>
                    <Select value={r.status} onValueChange={(s) => updateStatus(r, s)}>
                      <SelectTrigger className="h-8 w-32 capitalize"><SelectValue /></SelectTrigger>
                      <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <Dialog open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{open?.full_name} · {open?.ref_code}</DialogTitle></DialogHeader>
          {open && (
            <dl className="grid grid-cols-[140px_1fr] gap-x-3 gap-y-2 text-sm">
              {[
                ["Programme", `${open.programme} — ${naira(open.monthly_fee)}/month`], ["Days", (open.available_days ?? []).join(", ")],
                ["Class time", open.preferred_time], ["Email", open.email], ["Phone", open.phone], ["Gender", open.gender], ["Age", open.age],
                ["Location", open.location], ["Guardian", [open.guardian_name, open.guardian_phone].filter(Boolean).join(" · ")],
                ["Level", open.current_level], ["School", open.school], ["Subjects", (open.subjects ?? []).join(", ")],
                ["Exam date", open.target_exam_date], ["Target", open.target_score], ["Notes", open.notes],
                ["Submitted", new Date(open.created_at).toLocaleString()],
              ].map(([k, v]) => (<><dt key={`k${k}`} className="text-muted-foreground">{k}</dt><dd key={`v${k}`}>{v || "—"}</dd></>))}
            </dl>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
