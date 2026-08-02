import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, Search, RotateCcw, Download, Mail, Phone, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

type Row = {
  id: string; full_name: string; email: string; phone: string | null; country: string | null;
  created_at: string; role: string; premium: boolean;
};

export default function StudentsTab() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");

  const reload = async () => {
    setLoading(true);
    const [p, r, s] = await Promise.all([
      supabase.from("profiles").select("id, full_name, email, phone, country, created_at").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role"),
      supabase.from("premium_subscriptions").select("user_id, status, ends_at").eq("status", "active").gte("ends_at", new Date().toISOString()),
    ]);
    if (p.error) toast.error(p.error.message);
    const roleBy = new Map<string, string[]>();
    (r.data ?? []).forEach((x) => roleBy.set(x.user_id, [...(roleBy.get(x.user_id) ?? []), x.role]));
    const premium = new Set((s.data ?? []).map((x) => x.user_id));
    setRows((p.data ?? []).map((x) => {
      const roles = roleBy.get(x.id) ?? ["student"];
      return {
        ...x,
        role: roles.includes("admin") ? "admin" : roles.includes("tutor") ? "tutor" : "student",
        premium: premium.has(x.id),
      } as Row;
    }));
    setLoading(false);
  };
  useEffect(() => { reload(); }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return rows.filter((x) => {
      if (filter === "premium" && !x.premium) return false;
      if (filter !== "all" && filter !== "premium" && x.role !== filter) return false;
      if (!s) return true;
      return [x.full_name, x.email, x.phone ?? "", x.country ?? ""].join(" ").toLowerCase().includes(s);
    });
  }, [rows, q, filter]);

  const exportCsv = () => {
    const head = ["Name", "Email", "Phone", "Country", "Role", "Premium", "Joined"];
    const body = filtered.map((x) => [x.full_name, x.email, x.phone ?? "", x.country ?? "", x.role, x.premium ? "Yes" : "No", new Date(x.created_at).toISOString()]);
    const csv = [head, ...body].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url; a.download = `students-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="flex h-40 items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Registered users" value={rows.length} />
        <Stat label="Students" value={rows.filter((r) => r.role === "student").length} />
        <Stat label="Tutors" value={rows.filter((r) => r.role === "tutor").length} />
        <Stat label="Premium" value={rows.filter((r) => r.premium).length} />
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-2xl border bg-card p-3 shadow-soft">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search name, email, phone…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Everyone</SelectItem>
            <SelectItem value="student">Students</SelectItem>
            <SelectItem value="tutor">Tutors</SelectItem>
            <SelectItem value="admin">Admins</SelectItem>
            <SelectItem value="premium">Premium only</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={reload}><RotateCcw className="h-4 w-4" /> Refresh</Button>
        <Button variant="outline" size="sm" onClick={exportCsv}><Download className="h-4 w-4" /> CSV</Button>
        <span className="ml-auto text-xs text-muted-foreground">{filtered.length} of {rows.length}</span>
      </div>

      <div className="overflow-x-auto rounded-2xl border bg-card shadow-soft">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Country</th>
              <th className="px-4 py-3">Access</th>
              <th className="px-4 py-3">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">No accounts match your filters.</td></tr>
            )}
            {filtered.map((x) => (
              <tr key={x.id} className="transition-colors hover:bg-muted/30">
                <td className="px-4 py-3 font-semibold">{x.full_name}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  <div className="inline-flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {x.email}</div>
                  {x.phone && <div className="inline-flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> {x.phone}</div>}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{x.country ?? "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="secondary" className="capitalize">{x.role}</Badge>
                    {x.premium && <Badge variant="outline" className="border-amber-500/20 bg-amber-500/10 text-amber-600"><Crown className="mr-1 h-3 w-3" /> Premium</Badge>}
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(x.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-card px-4 py-3">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="font-display text-2xl font-bold">{value}</p>
    </div>
  );
}
