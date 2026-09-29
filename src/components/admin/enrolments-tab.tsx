import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Minus, Plus, Save, Search, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { CLASS_TIMES, PROGRAMME_PLANS, WEEK_DAYS, naira } from "@/lib/programme-plans";

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
  const { data: settings = [], isLoading: settingsLoading } = useQuery({
    queryKey: ["admin", "programme-settings"],
    queryFn: async (): Promise<Row[]> => {
      const { data: rows, error } = await supabase.from("programme_plan_settings").select("*").order("sort_order");
      if (error) throw error;
      return (rows ?? []) as Row[];
    },
  });
  const [q, setQ] = useState("");
  const [prog, setProg] = useState("all");
  const [status, setStatus] = useState("all");
  const [payFilter, setPayFilter] = useState("all");
  const [open, setOpen] = useState<Row | null>(null);
  const [scheduleDraft, setScheduleDraft] = useState<Record<string, string[]>>({});
  const [savingSchedule, setSavingSchedule] = useState(false);

  const rows = useMemo(() => data.filter((r) =>
    (prog === "all" || r.programme === prog) && (status === "all" || r.status === status) && (payFilter === "all" || r.payment_status === payFilter) &&
    (!q || [r.full_name, r.email, r.phone, r.ref_code].join(" ").toLowerCase().includes(q.toLowerCase()))), [data, q, prog, status, payFilter]);

  const updateStatus = async (r: Row, s: string) => {
    qc.setQueryData<Row[]>(["admin", "enrolments"], (cur) => (cur ?? []).map((x) => x.id === r.id ? { ...x, status: s } : x));
    if (open?.id === r.id) setOpen({ ...r, status: s });
    const { error } = await supabase.from("programme_enrolments" as any).update({ status: s }).eq("id", r.id);
    if (error) { toast.error(error.message); qc.invalidateQueries({ queryKey: ["admin", "enrolments"] }); }
    else toast.success("Status updated");
  };

  const openEnrolment = (row: Row) => {
    const existing = row.daily_schedule && Object.keys(row.daily_schedule).length > 0
      ? row.daily_schedule
      : Object.fromEntries((row.available_days ?? []).map((day: string) => [day, [row.preferred_time].filter(Boolean)]));
    setScheduleDraft(existing);
    setOpen(row);
  };

  const saveSchedule = async () => {
    if (!open) return;
    if (Object.values(scheduleDraft).some((times) => times.length === 0 || times.some((time) => !time))) return toast.error("Choose a time for every lesson");
    setSavingSchedule(true);
    const ordered = WEEK_DAYS.filter((day) => scheduleDraft[day]);
    const { error } = await supabase.from("programme_enrolments" as any).update({ daily_schedule: scheduleDraft, available_days: ordered, preferred_time: "Multiple lesson schedule" }).eq("id", open.id);
    setSavingSchedule(false);
    if (error) return toast.error(error.message);
    const next = { ...open, daily_schedule: scheduleDraft, available_days: ordered, preferred_time: "Multiple lesson schedule" };
    setOpen(next);
    qc.setQueryData<Row[]>(["admin", "enrolments"], (current) => (current ?? []).map((row) => row.id === open.id ? next : row));
    toast.success("Schedule updated");
  };

  const saveSetting = async (setting: Row) => {
    const { error } = await supabase.from("programme_plan_settings").update({
      monthly_fee: Number(setting.monthly_fee), days_per_week: Number(setting.days_per_week),
      min_lessons_per_day: Number(setting.min_lessons_per_day), max_lessons_per_day: Number(setting.max_lessons_per_day),
    }).eq("programme", setting.programme);
    if (error) return toast.error(error.message);
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["admin", "programme-settings"] }),
      qc.invalidateQueries({ queryKey: ["programme-plans"] }),
    ]);
    toast.success(`${setting.name} settings saved`);
  };

  const changeSetting = (programme: string, field: string, value: string) => qc.setQueryData<Row[]>(["admin", "programme-settings"], (current) =>
    (current ?? []).map((setting) => setting.programme === programme ? { ...setting, [field]: value } : setting));

  const exportCsv = () => {
    const cols = ["ref_code", "programme", "monthly_fee", "full_name", "email", "phone", "available_days", "preferred_time", "payment_status", "amount_paid", "paid_at", "current_level", "school", "status", "created_at"];
    const esc = (v: any) => `"${String(Array.isArray(v) ? v.join("; ") : v ?? "").replace(/"/g, '""')}"`;
    const csv = [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "programme-enrolments.csv"; a.click();
  };

  return (
    <Tabs defaultValue="enrolments" className="space-y-4">
      <TabsList><TabsTrigger value="enrolments">Enrolments</TabsTrigger><TabsTrigger value="settings"><Settings2 className="mr-2 size-4" />Programme settings</TabsTrigger></TabsList>
      <TabsContent value="enrolments" className="space-y-4">
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
        <Select value={payFilter} onValueChange={setPayFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">All payments</SelectItem>{["paid", "pending", "unpaid", "failed"].map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
        </Select>
        <Button variant="outline" onClick={exportCsv}><Download className="size-4" /> CSV</Button>
      </div>

      <div className="overflow-x-auto rounded-2xl border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr><th className="p-3">Reference</th><th className="p-3">Candidate</th><th className="p-3">Programme</th><th className="p-3">Schedule</th><th className="p-3">Payment</th><th className="p-3">Status</th></tr>
          </thead>
          <tbody>
            {isLoading ? <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Loading…</td></tr>
              : rows.length === 0 ? <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No enrolments yet</td></tr>
              : rows.map((r) => (
                <tr key={r.id} className="cursor-pointer border-t hover:bg-muted/40" onClick={() => openEnrolment(r)}>
                  <td className="p-3 font-mono text-xs">{r.ref_code}</td>
                  <td className="p-3"><p className="font-semibold">{r.full_name}</p><p className="text-xs text-muted-foreground">{r.phone} · {r.email}</p></td>
                  <td className="p-3"><Badge variant="secondary">{r.programme}</Badge> <span className="text-xs text-muted-foreground">{naira(r.monthly_fee)}</span></td>
                   <td className="p-3 text-xs">{Object.entries((r.daily_schedule ?? {}) as Record<string, string[]>).length > 0
                     ? Object.entries((r.daily_schedule ?? {}) as Record<string, string[]>).map(([day, times]) => `${day.slice(0, 3)} ${times.length}×`).join(" · ")
                     : (r.available_days ?? []).map((d: string) => d.slice(0, 3)).join(", ")}</td>
                  <td className="p-3"><Badge variant={r.payment_status === "paid" ? "default" : "outline"} className="capitalize">{r.payment_status}</Badge></td>
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
             <div className="space-y-5">
             <dl className="grid grid-cols-[140px_1fr] gap-x-3 gap-y-2 text-sm">
              {[
                 ["Programme", `${open.programme} — ${naira(open.monthly_fee)}/month`],
                ["Payment", `${open.payment_status}${open.amount_paid ? ` — ${naira(open.amount_paid)}` : ""}${open.paid_at ? ` on ${new Date(open.paid_at).toLocaleDateString()}` : ""}`],
                ["Paystack ref", open.payment_reference], ["Email", open.email], ["Phone", open.phone], ["Gender", open.gender], ["Age", open.age],
                ["Location", open.location], ["Guardian", [open.guardian_name, open.guardian_phone].filter(Boolean).join(" · ")],
                ["Level", open.current_level], ["School", open.school], ["Subjects", (open.subjects ?? []).join(", ")],
                ["Exam date", open.target_exam_date], ["Target", open.target_score], ["Notes", open.notes],
                ["Submitted", new Date(open.created_at).toLocaleString()],
              ].map(([k, v]) => (<><dt key={`k${k}`} className="text-muted-foreground">{k}</dt><dd key={`v${k}`}>{v || "—"}</dd></>))}
            </dl>
             <div className="border-t pt-4">
               <div className="flex items-center justify-between"><div><h3 className="font-medium">Lesson schedule</h3><p className="text-xs text-muted-foreground">Adjust lesson counts and times for this candidate.</p></div><Button size="sm" onClick={saveSchedule} disabled={savingSchedule}>{savingSchedule ? <LoaderText /> : <Save className="size-4" />} Save</Button></div>
               <div className="mt-3 space-y-3">
                 {WEEK_DAYS.filter((day) => scheduleDraft[day]).map((day) => (
                   <div key={day} className="rounded-lg border p-3">
                     <div className="flex items-center justify-between"><span className="text-sm font-medium">{day}</span><div className="flex items-center gap-1"><Button size="icon" variant="outline" className="size-7" onClick={() => setScheduleDraft((current) => ({ ...current, [day]: current[day].slice(0, -1) }))} disabled={scheduleDraft[day].length <= 1}><Minus className="size-3" /></Button><span className="w-7 text-center text-xs">{scheduleDraft[day].length}×</span><Button size="icon" variant="outline" className="size-7" onClick={() => setScheduleDraft((current) => ({ ...current, [day]: [...current[day], ""] }))} disabled={scheduleDraft[day].length >= 6}><Plus className="size-3" /></Button></div></div>
                     <div className="mt-2 grid gap-2 sm:grid-cols-2">{scheduleDraft[day].map((time, index) => <Select key={`${day}-${index}`} value={time} onValueChange={(value) => setScheduleDraft((current) => ({ ...current, [day]: current[day].map((item, i) => i === index ? value : item) }))}><SelectTrigger className="h-9"><SelectValue placeholder={`Lesson ${index + 1}`} /></SelectTrigger><SelectContent>{CLASS_TIMES.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent></Select>)}</div>
                   </div>
                 ))}
               </div>
             </div>
             </div>
          )}
        </DialogContent>
      </Dialog>
      </TabsContent>
      <TabsContent value="settings">
        {settingsLoading ? <p className="py-8 text-center text-sm text-muted-foreground">Loading programme settings…</p> : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {settings.map((setting) => <div key={setting.programme} className="rounded-lg border bg-card p-5">
              <div className="flex items-center justify-between"><div><h3 className="font-display text-lg font-semibold">{setting.name}</h3><p className="text-xs text-muted-foreground">{setting.programme}</p></div><Badge variant="outline">{setting.days_per_week} days/week</Badge></div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <SettingInput label="Monthly fee (₦)" value={setting.monthly_fee} onChange={(value) => changeSetting(setting.programme, "monthly_fee", value)} />
                <SettingInput label="Study days" value={setting.days_per_week} min={1} max={7} onChange={(value) => changeSetting(setting.programme, "days_per_week", value)} />
                <SettingInput label="Minimum lessons/day" value={setting.min_lessons_per_day} min={1} max={6} onChange={(value) => changeSetting(setting.programme, "min_lessons_per_day", value)} />
                <SettingInput label="Maximum lessons/day" value={setting.max_lessons_per_day} min={1} max={6} onChange={(value) => changeSetting(setting.programme, "max_lessons_per_day", value)} />
              </div>
              <Button className="mt-4 w-full" variant="outline" onClick={() => saveSetting(setting)}><Save className="size-4" /> Save settings</Button>
            </div>)}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}

function SettingInput({ label, value, onChange, min, max }: { label: string; value: string | number; onChange: (value: string) => void; min?: number; max?: number }) {
  return <div className="space-y-1.5"><Label className="text-xs">{label}</Label><Input type="number" value={value} min={min} max={max} onChange={(event) => onChange(event.target.value)} /></div>;
}

function LoaderText() {
  return <span className="text-xs">Saving…</span>;
}
