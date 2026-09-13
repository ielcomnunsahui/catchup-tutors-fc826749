import { useEffect, useMemo, useState } from "react";
import {
  Settings, LayoutDashboard, GraduationCap, BookOpen, FolderTree, FileText, ClipboardList,
  Users, UserCheck, CalendarDays, CalendarCheck, Brain, Layers3, Search, Command as CommandIcon, Flag,
  ChevronRight, PanelLeftClose, PanelLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export type AdminSectionId =
  | "overview" | "registrations" | "students" | "tutor-apps" | "attendance"
  | "programs" | "subjects" | "topics" | "resources"
  | "topic-questions" | "past-papers" | "quiz" | "ng-questions" | "settings";

export type AdminSection = {
  id: AdminSectionId;
  label: string;
  icon: typeof LayoutDashboard;
  description: string;
};

export type AdminGroup = { label: string; items: AdminSection[] };

export const ADMIN_GROUPS: AdminGroup[] = [
  {
    label: "Overview",
    items: [
      { id: "overview", label: "Dashboard", icon: LayoutDashboard, description: "Key numbers and recent activity" },
    ],
  },
  {
    label: "People",
    items: [
      { id: "students", label: "Students & accounts", icon: Users, description: "Every registered account and access level" },
      { id: "tutor-apps", label: "Tutor applications", icon: UserCheck, description: "Review, approve or decline tutors" },
      { id: "attendance", label: "Attendance", icon: CalendarCheck, description: "Session marks and discrepancies" },
    ],
  },
  {
    label: "Past questions",
    items: [
      { id: "past-papers", label: "Yearly past questions", icon: CalendarDays, description: "Papers and mark schemes by year and session" },
      { id: "topic-questions", label: "Topical past questions", icon: Layers3, description: "Topic sets with questions, mark schemes and videos" },
      { id: "quiz", label: "Quiz bank", icon: Brain, description: "Practice questions students answer online" },
      { id: "ng-questions", label: "JAMB / WAEC / NECO", icon: Flag, description: "Import Nigerian exam questions from myschool" },
    ],
  },
  {
    label: "Learning content",
    items: [
      { id: "programs", label: "Programs", icon: GraduationCap, description: "Top-level study pathways" },
      { id: "subjects", label: "Subjects", icon: BookOpen, description: "Subjects inside each program" },
      { id: "topics", label: "Topics", icon: FolderTree, description: "Topics inside each subject" },
      { id: "resources", label: "Resource files", icon: FileText, description: "Notes, solutions and uploaded documents" },
    ],
  },
  {
    label: "Summer program",
    items: [
      { id: "registrations", label: "Summer registrations", icon: ClipboardList, description: "Student sign-ups and volunteer tutors" },
    ],
  },
  {
    label: "System",
    items: [
      { id: "settings", label: "Settings", icon: Settings, description: "Payments, premium content and site options" },
    ],
  },
];

export const ADMIN_SECTIONS: AdminSection[] = ADMIN_GROUPS.flatMap((g) => g.items);
export const findSection = (id: string) => ADMIN_SECTIONS.find((s) => s.id === id);

/** Keeps the open section in the URL hash so admins can bookmark and refresh. */
export function useAdminSection() {
  const initial = (): AdminSectionId => {
    const fromHash = window.location.hash.replace("#", "");
    return (findSection(fromHash)?.id ?? "overview") as AdminSectionId;
  };
  const [section, setSectionState] = useState<AdminSectionId>(initial);

  useEffect(() => {
    const onHash = () => setSectionState(initial());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setSection = (id: AdminSectionId) => {
    setSectionState(id);
    if (window.location.hash.replace("#", "") !== id) window.history.replaceState(null, "", `#${id}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return { section, setSection };
}

export function AdminShell({
  section, setSection, children,
}: { section: AdminSectionId; setSection: (id: AdminSectionId) => void; children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const active = useMemo(() => findSection(section)!, [section]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="mx-auto grid max-w-[1400px] gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[auto_minmax(0,1fr)] lg:px-8">
      {/* Mobile navigation */}
      <div className="lg:hidden">
        <Select value={section} onValueChange={(v) => setSection(v as AdminSectionId)}>
          <SelectTrigger className="h-12 rounded-2xl bg-card shadow-soft">
            <div className="flex items-center gap-2">
              <active.icon className="size-4 text-primary" />
              <SelectValue />
            </div>
          </SelectTrigger>
          <SelectContent>
            {ADMIN_GROUPS.map((g) => (
              <SelectGroup key={g.label}>
                <SelectLabel>{g.label}</SelectLabel>
                {g.items.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Desktop sidebar */}
      <aside
        className={`hidden self-start lg:sticky lg:top-24 lg:block ${collapsed ? "w-[76px]" : "w-[264px]"} transition-[width] duration-300`}
      >
        <div className="rounded-3xl border bg-card p-3 shadow-soft">
          <div className="flex items-center justify-between px-1 pb-2">
            {!collapsed && <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Console</p>}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8" onClick={() => setCollapsed((v) => !v)}>
                  {collapsed ? <PanelLeft className="size-4" /> : <PanelLeftClose className="size-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">{collapsed ? "Expand menu" : "Collapse menu"}</TooltipContent>
            </Tooltip>
          </div>

          <button
            onClick={() => setPaletteOpen(true)}
            className="mb-3 flex w-full items-center gap-2 rounded-xl border bg-muted/40 px-2.5 py-2 text-left text-xs text-muted-foreground transition-colors hover:bg-muted"
          >
            <Search className="size-4 shrink-0" />
            {!collapsed && <><span className="flex-1">Jump to…</span><kbd className="rounded border bg-background px-1.5 py-0.5 text-[10px] font-semibold">⌘K</kbd></>}
          </button>

          <nav className="space-y-4">
            {ADMIN_GROUPS.map((g) => (
              <div key={g.label}>
                {!collapsed && (
                  <p className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground/70">{g.label}</p>
                )}
                <ul className="space-y-0.5">
                  {g.items.map((s) => {
                    const isActive = s.id === section;
                    const btn = (
                      <button
                        onClick={() => setSection(s.id)}
                        className={`group flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-medium transition-all duration-200 ${
                          isActive
                            ? "bg-primary text-primary-foreground shadow-soft"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        } ${collapsed ? "justify-center" : ""}`}
                      >
                        <s.icon className={`size-4 shrink-0 transition-transform duration-200 ${isActive ? "" : "group-hover:scale-110"}`} />
                        {!collapsed && <span className="truncate">{s.label}</span>}
                      </button>
                    );
                    return (
                      <li key={s.id}>
                        {collapsed ? (
                          <Tooltip>
                            <TooltipTrigger asChild>{btn}</TooltipTrigger>
                            <TooltipContent side="right">{s.label}</TooltipContent>
                          </Tooltip>
                        ) : btn}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </div>
      </aside>

      <main className="min-w-0">
        <header className="mb-6 flex flex-wrap items-start justify-between gap-3 border-b pb-5">
          <div className="min-w-0">
            <p className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
              Admin <ChevronRight className="size-3" /> <span className="text-foreground">{active.label}</span>
            </p>
            <h1 className="mt-1 font-display text-2xl font-bold sm:text-3xl">{active.label}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{active.description}</p>
          </div>
          <Button variant="outline" size="sm" className="hidden gap-2 sm:inline-flex" onClick={() => setPaletteOpen(true)}>
            <CommandIcon className="size-4" /> Quick jump
          </Button>
        </header>
        {children}
      </main>

      <CommandDialog open={paletteOpen} onOpenChange={setPaletteOpen}>
        <CommandInput placeholder="Search admin sections…" />
        <CommandList>
          <CommandEmpty>No section found.</CommandEmpty>
          {ADMIN_GROUPS.map((g) => (
            <CommandGroup key={g.label} heading={g.label}>
              {g.items.map((s) => (
                <CommandItem key={s.id} value={`${s.label} ${s.description}`} onSelect={() => { setSection(s.id); setPaletteOpen(false); }}>
                  <s.icon className="mr-2 size-4" />
                  <span>{s.label}</span>
                  {s.id === section && <Badge variant="secondary" className="ml-auto text-[10px]">Current</Badge>}
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </div>
  );
}
