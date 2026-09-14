import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  LayoutDashboard, CalendarCheck, ClipboardCheck, Library, Brain, Crown, UserRound,
  FileBadge, Search, Command as CommandIcon, ChevronRight, PanelLeft, PanelLeftClose, LogOut, GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export type StudentSectionId =
  | "application" | "overview" | "sessions" | "attendance" | "library" | "quiz" | "premium" | "profile";

export type StudentSection = {
  id: StudentSectionId;
  label: string;
  icon: typeof LayoutDashboard;
  description: string;
};

export type StudentGroup = { label: string; items: StudentSection[] };

export const STUDENT_GROUPS: StudentGroup[] = [
  {
    label: "My application",
    items: [
      { id: "application", label: "My application", icon: FileBadge, description: "The status of your tutor application" },
    ],
  },
  {
    label: "Overview",
    items: [
      { id: "overview", label: "My dashboard", icon: LayoutDashboard, description: "Your progress, next session and quick actions" },
    ],
  },
  {
    label: "Tutoring",
    items: [
      { id: "sessions", label: "My sessions", icon: CalendarCheck, description: "Upcoming and past bookings with your tutors" },
      { id: "attendance", label: "Attendance", icon: ClipboardCheck, description: "Mark each session once it has happened" },
    ],
  },
  {
    label: "Study",
    items: [
      { id: "library", label: "My library", icon: Library, description: "Saved resources and everything you're part-way through" },
      { id: "quiz", label: "Practice & results", icon: Brain, description: "Your quiz attempts, scores and best subjects" },
    ],
  },
  {
    label: "Account",
    items: [
      { id: "premium", label: "Premium access", icon: Crown, description: "Your plan and what it unlocks" },
      { id: "profile", label: "My profile", icon: UserRound, description: "Name, contact details and preferences" },
    ],
  },
];

export const STUDENT_SECTIONS: StudentSection[] = STUDENT_GROUPS.flatMap((g) => g.items);
export const findStudentSection = (id: string) => STUDENT_SECTIONS.find((s) => s.id === id);

/** Keeps the open section in the URL hash so students can bookmark and refresh. */
export function useStudentSection() {
  const initial = (): StudentSectionId => {
    const fromHash = window.location.hash.replace("#", "");
    return (findStudentSection(fromHash)?.id ?? "overview") as StudentSectionId;
  };
  const [section, setSectionState] = useState<StudentSectionId>(initial);

  useEffect(() => {
    const onHash = () => setSectionState(initial());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setSection = (id: StudentSectionId) => {
    setSectionState(id);
    if (window.location.hash.replace("#", "") !== id) window.history.replaceState(null, "", `#${id}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return { section, setSection };
}

export function StudentTopbar({ name, onSignOut }: { name: string; onSignOut: () => void }) {
  const initials = name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase() || "CU";
  return (
    <header className="sticky top-0 z-40 border-b bg-card/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 font-display font-bold">
          <GraduationCap className="text-primary" /> CatchUp Tutors
        </Link>
        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-2 rounded-full border bg-background px-3 py-1.5 sm:flex">
            <span className="grid size-6 place-items-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">{initials}</span>
            <span className="max-w-[160px] truncate text-sm font-medium">{name}</span>
          </span>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={onSignOut}><LogOut className="size-4" /> Sign out</Button>
            </TooltipTrigger>
            <TooltipContent>End your session on this device</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </header>
  );
}

export function StudentShell({
  section, setSection, badges, hidden, children,
}: {
  section: StudentSectionId;
  setSection: (id: StudentSectionId) => void;
  badges?: Partial<Record<StudentSectionId, number>>;
  /** Sections to leave out of the menus (e.g. the application status when there is none). */
  hidden?: StudentSectionId[];
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const active = useMemo(() => findStudentSection(section) ?? findStudentSection("overview")!, [section]);
  const groups = useMemo(
    () => STUDENT_GROUPS
      .map((g) => ({ ...g, items: g.items.filter((s) => !(hidden ?? []).includes(s.id)) }))
      .filter((g) => g.items.length > 0),
    [hidden],
  );

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
        <Select value={section} onValueChange={(v) => setSection(v as StudentSectionId)}>
          <SelectTrigger className="h-12 rounded-2xl bg-card shadow-soft">
            <div className="flex items-center gap-2">
              <active.icon className="size-4 text-primary" />
              <SelectValue />
            </div>
          </SelectTrigger>
          <SelectContent>
            {groups.map((g) => (
              <SelectGroup key={g.label}>
                <SelectLabel>{g.label}</SelectLabel>
                {g.items.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Desktop sidebar */}
      <aside className={`hidden self-start lg:sticky lg:top-24 lg:block ${collapsed ? "w-[76px]" : "w-[254px]"} transition-[width] duration-300`}>
        <div className="rounded-3xl border bg-card p-3 shadow-soft">
          <div className="flex items-center justify-between px-1 pb-2">
            {!collapsed && <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">My space</p>}
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
            {groups.map((g) => (
              <div key={g.label}>
                {!collapsed && (
                  <p className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground/70">{g.label}</p>
                )}
                <ul className="space-y-0.5">
                  {g.items.map((s) => {
                    const isActive = s.id === section;
                    const count = badges?.[s.id] ?? 0;
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
                        {!collapsed && (
                          <>
                            <span className="truncate">{s.label}</span>
                            {count > 0 && (
                              <span className={`ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-bold ${isActive ? "bg-primary-foreground/20" : "bg-primary/10 text-primary"}`}>
                                {count}
                              </span>
                            )}
                          </>
                        )}
                      </button>
                    );
                    return (
                      <li key={s.id}>
                        {collapsed ? (
                          <Tooltip>
                            <TooltipTrigger asChild>{btn}</TooltipTrigger>
                            <TooltipContent side="right">{s.label}{count > 0 ? ` · ${count}` : ""}</TooltipContent>
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
              My space <ChevronRight className="size-3" /> <span className="text-foreground">{active.label}</span>
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
        <CommandInput placeholder="Search your dashboard…" />
        <CommandList>
          <CommandEmpty>Nothing matches that.</CommandEmpty>
          {groups.map((g) => (
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
