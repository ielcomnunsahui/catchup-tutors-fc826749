export type ProgrammePlan = {
  key: string;
  name: string;
  fee: number;
  days: number;
  minLessonsPerDay: number;
  maxLessonsPerDay: number;
  note?: string;
  subjects?: string[];
  blurb: string;
};

export const PROGRAMME_PLANS: ProgrammePlan[] = [
  { key: "SAT", name: "SAT", fee: 400000, days: 4, minLessonsPerDay: 1, maxLessonsPerDay: 3, note: "English & Mathematics", subjects: ["English", "Mathematics"], blurb: "Digital SAT prep for US university admission." },
  { key: "WAEC", name: "WAEC", fee: 200000, days: 4, minLessonsPerDay: 1, maxLessonsPerDay: 3, blurb: "WASSCE preparation across your core subjects." },
  { key: "GCE", name: "GCE", fee: 200000, days: 4, minLessonsPerDay: 1, maxLessonsPerDay: 3, blurb: "WAEC/NECO GCE for private candidates." },
  { key: "IGCSE", name: "IGCSE", fee: 250000, days: 4, minLessonsPerDay: 1, maxLessonsPerDay: 3, blurb: "Cambridge IGCSE with past-paper practice." },
  { key: "JAMB", name: "JAMB", fee: 150000, days: 4, minLessonsPerDay: 1, maxLessonsPerDay: 3, blurb: "UTME prep with timed CBT-style practice." },
  { key: "GRE", name: "GRE", fee: 300000, days: 5, minLessonsPerDay: 1, maxLessonsPerDay: 3, blurb: "Verbal, quantitative and writing for graduate school." },
  { key: "TOEFL", name: "TOEFL", fee: 200000, days: 4, minLessonsPerDay: 1, maxLessonsPerDay: 3, blurb: "Reading, listening, speaking and writing." },
  { key: "IELTS", name: "IELTS", fee: 200000, days: 4, minLessonsPerDay: 1, maxLessonsPerDay: 3, blurb: "Academic and General Training preparation." },
];

export const findPlan = (key?: string | null) =>
  PROGRAMME_PLANS.find((p) => p.key.toLowerCase() === (key ?? "").toLowerCase());

export const naira = (n: number) => `₦${n.toLocaleString("en-NG")}`;

export const WEEK_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
export const CLASS_TIMES = [
  "Morning (8am – 11am)",
  "Midday (11am – 2pm)",
  "Afternoon (2pm – 5pm)",
  "Evening (5pm – 8pm)",
  "Late evening (8pm – 10pm)",
];
