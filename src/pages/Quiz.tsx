import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Brain, Timer, Shuffle, CheckCircle2, XCircle, Crown, Loader2, RotateCcw, ArrowLeft, ArrowRight, Trophy,
} from "lucide-react";
import { PageHero, Seo, SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { usePremium } from "@/hooks/use-premium";
import { heroImages } from "@/assets/heroes";
import { MathText } from "@/components/math-text";

type Question = {
  id: string;
  exam_type: string;
  subject_key: string;
  year: number | null;
  session: string | null;
  paper_number: string | null;
  topic: string | null;
  question_text: string;
  image_url: string | null;
  options: string[];
  correct_index: number;
  explanation: string | null;
  difficulty: string;
  access_level: "free" | "premium";
};

const ANY = "__any__";
const LENGTHS = [5, 10, 20, 40];
const TIME_LIMITS = [0, 10, 20, 30, 60]; // minutes; 0 = no limit

const fmtTime = (secs: number) => {
  const m = Math.floor(Math.max(0, secs) / 60);
  const s = Math.max(0, secs) % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

const shuffle = <T,>(arr: T[]) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const uniq = (values: (string | null)[]) =>
  [...new Set(values.filter((v): v is string => !!v && v.trim().length > 0))].sort();

export default function Quiz() {
  const { isPremium, isAuthed } = usePremium();
  const [params] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [bank, setBank] = useState<Question[]>([]);

  const [examType, setExamType] = useState(params.get("exam") ?? ANY);
  const [subject, setSubject] = useState(params.get("subject") ?? ANY);
  const [year, setYear] = useState(params.get("year") ?? ANY); // ANY = shuffle years
  const [topic, setTopic] = useState(params.get("topic") ?? ANY);
  const [length, setLength] = useState(10);
  const [timeLimit, setTimeLimit] = useState(0); // minutes
  const [remaining, setRemaining] = useState<number | null>(null);

  const [quiz, setQuiz] = useState<Question[] | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [current, setCurrent] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("quiz_questions")
        .select("*")
        .eq("is_published", true);
      setBank(
        ((data ?? []) as unknown as Question[]).map((q) => ({
          ...q,
          options: Array.isArray(q.options) ? q.options : [],
        })).filter((q) => q.options.length >= 2),
      );
      setLoading(false);
    })();
  }, []);

  const accessible = useMemo(
    () => bank.filter((q) => q.access_level === "free" || isPremium),
    [bank, isPremium],
  );
  const lockedCount = bank.length - accessible.length;

  const examTypes = useMemo(() => uniq(accessible.map((q) => q.exam_type)), [accessible]);
  const byExam = useMemo(
    () => accessible.filter((q) => examType === ANY || q.exam_type === examType),
    [accessible, examType],
  );
  const subjects = useMemo(() => uniq(byExam.map((q) => q.subject_key)), [byExam]);
  const bySubject = useMemo(
    () => byExam.filter((q) => subject === ANY || q.subject_key === subject),
    [byExam, subject],
  );
  const years = useMemo(
    () => uniq(bySubject.map((q) => (q.year ? String(q.year) : null))).sort((a, b) => Number(b) - Number(a)),
    [bySubject],
  );
  const topics = useMemo(() => uniq(bySubject.map((q) => q.topic)), [bySubject]);

  const pool = useMemo(
    () =>
      bySubject.filter(
        (q) =>
          (year === ANY || String(q.year) === year) &&
          (topic === ANY || q.topic === topic),
      ),
    [bySubject, year, topic],
  );

  const start = () => {
    setQuiz(shuffle(pool).slice(0, length));
    setAnswers({});
    setCurrent(0);
    setSubmitted(false);
    setRemaining(timeLimit > 0 ? timeLimit * 60 : null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const reset = () => {
    setQuiz(null);
    setSubmitted(false);
    setAnswers({});
    setCurrent(0);
    setRemaining(null);
  };

  const score = useMemo(
    () => (quiz ?? []).filter((q) => answers[q.id] === q.correct_index).length,
    [quiz, answers],
  );

  const submit = async (autoSubmitted = false) => {
    setSubmitted(true);
    setRemaining(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !quiz) return;
    await supabase.from("quiz_attempts").insert({
      user_id: user.id,
      exam_type: examType === ANY ? null : examType,
      subject_key: subject === ANY ? null : subject,
      filters: {
        year: year === ANY ? "shuffled" : year,
        topic: topic === ANY ? "all" : topic,
        length,
        time_limit_minutes: timeLimit || null,
        auto_submitted: autoSubmitted,
      },
      answers: quiz.map((q) => ({ id: q.id, chosen: answers[q.id] ?? null, correct: q.correct_index })),
      score,
      total: quiz.length,
      completed_at: new Date().toISOString(),
    });
  };

  useEffect(() => {
    if (remaining === null || submitted || !quiz) return;
    if (remaining <= 0) { submit(true); return; }
    const t = window.setTimeout(() => setRemaining((r) => (r === null ? null : r - 1)), 1000);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, submitted, quiz]);

  return (
    <SiteShell>
      <Seo
        title="Practice Quizzes & Timed Tests | CatchUp Tutors"
        description="Practise exam questions by exam type, course, year or topic. Answer, submit and instantly review worked answers and explanations."
      />
      <PageHero
        image={heroImages.quiz}
        eyebrow="Practice"
        title="Quiz & test yourself"
        description="Pick an exam type, course and year — or shuffle across years and topics. Answer the questions, submit, then review every answer with explanations."
      />

      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-20 text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Loading question bank…
          </div>
        ) : !quiz ? (
          <SetupCard
            {...{ examTypes, subjects, years, topics, examType, subject, year, topic, length, timeLimit, pool, lockedCount, isPremium, isAuthed }}
            onExam={(v) => { setExamType(v); setSubject(ANY); setYear(ANY); setTopic(ANY); }}
            onSubject={(v) => { setSubject(v); setYear(ANY); setTopic(ANY); }}
            onYear={setYear}
            onTopic={setTopic}
            onLength={setLength}
            onTimeLimit={setTimeLimit}
            onStart={start}
          />
        ) : submitted ? (
          <Results quiz={quiz} answers={answers} score={score} onRetry={reset} />
        ) : (
          <Runner
            quiz={quiz}
            current={current}
            answers={answers}
            onPick={(id, i) => setAnswers((a) => ({ ...a, [id]: i }))}
            onGo={setCurrent}
            onSubmit={() => submit(false)}
            onQuit={reset}
            remaining={remaining}
          />
        )}
      </section>
    </SiteShell>
  );
}

function Field({ label, value, onChange, options, anyLabel }: {
  label: string; value: string; onChange: (v: string) => void; options: string[]; anyLabel: string;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent className="bg-popover">
          <SelectItem value={ANY}>{anyLabel}</SelectItem>
          {options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

function SetupCard(props: {
  examTypes: string[]; subjects: string[]; years: string[]; topics: string[];
  examType: string; subject: string; year: string; topic: string; length: number; timeLimit: number;
  pool: Question[]; lockedCount: number; isPremium: boolean; isAuthed: boolean;
  onExam: (v: string) => void; onSubject: (v: string) => void; onYear: (v: string) => void;
  onTopic: (v: string) => void; onLength: (n: number) => void; onTimeLimit: (n: number) => void; onStart: () => void;
}) {
  const { pool, lockedCount, isPremium } = props;
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border bg-card p-5 shadow-soft sm:p-8">
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Brain className="size-5" /></span>
        <div className="min-w-0">
          <h2 className="font-display text-xl font-bold">Build your practice set</h2>
          <p className="text-sm text-muted-foreground">Leave a field on “All” to shuffle across it.</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Field label="Exam type" value={props.examType} onChange={props.onExam} options={props.examTypes} anyLabel="All exam types" />
        <Field label="Course / subject" value={props.subject} onChange={props.onSubject} options={props.subjects} anyLabel="All courses" />
        <Field label="Year" value={props.year} onChange={props.onYear} options={props.years} anyLabel="Shuffle all years" />
        <Field label="Topic" value={props.topic} onChange={props.onTopic} options={props.topics} anyLabel="All topics" />
      </div>

      <div className="mt-6 space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Number of questions</Label>
        <div className="flex flex-wrap gap-2">
          {LENGTHS.map((n) => (
            <Button key={n} type="button" variant={props.length === n ? "default" : "outline"} size="sm" onClick={() => props.onLength(n)}>
              {n}
            </Button>
          ))}
        </div>
      </div>

      <div className="mt-6 space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Time limit</Label>
        <div className="flex flex-wrap gap-2">
          {TIME_LIMITS.map((n) => (
            <Button key={n} type="button" variant={props.timeLimit === n ? "default" : "outline"} size="sm" onClick={() => props.onTimeLimit(n)}>
              {n === 0 ? "No limit" : `${n} min`}
            </Button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">Timed sets auto-submit when the countdown reaches zero.</p>
      </div>

      <div className="mt-6 flex flex-col gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{pool.length}</span> question{pool.length === 1 ? "" : "s"} match your filters.
          {!isPremium && lockedCount > 0 && (
            <> {" "}<span className="inline-flex items-center gap-1 text-brand-orange"><Crown className="size-3.5" /> {lockedCount} premium locked</span></>
          )}
        </p>
        <div className="flex flex-wrap gap-2">
          {!isPremium && lockedCount > 0 && (
            <Button asChild variant="outline"><Link to="/premium"><Crown /> Unlock premium</Link></Button>
          )}
          <Button size="lg" disabled={pool.length === 0} onClick={props.onStart}>
            <Shuffle /> Start quiz
          </Button>
        </div>
      </div>

      {pool.length === 0 && (
        <p className="mt-4 rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
          No questions available for this combination yet. Try widening the filters — new questions are added regularly.
        </p>
      )}
    </motion.div>
  );
}

function Runner({ quiz, current, answers, onPick, onGo, onSubmit, onQuit, remaining }: {
  quiz: Question[]; current: number; answers: Record<string, number>;
  onPick: (id: string, i: number) => void; onGo: (i: number) => void; onSubmit: () => void; onQuit: () => void;
  remaining: number | null;
}) {
  const q = quiz[current];
  const answered = Object.keys(answers).length;
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-card p-4 shadow-soft sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-medium">Question {current + 1} of {quiz.length}</p>
          <div className="flex items-center gap-3">
            {remaining !== null && (
              <span
                role="timer"
                aria-live="off"
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold tabular-nums ${remaining <= 60 ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}
              >
                <Timer className="size-4" /> {fmtTime(remaining)}
              </span>
            )}
            <p className="text-sm text-muted-foreground">{answered}/{quiz.length} answered</p>
          </div>
        </div>
        <Progress value={(answered / quiz.length) * 100} className="mt-3 h-2" />
      </div>

      <motion.div key={q.id} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} className="rounded-2xl border bg-card p-5 shadow-soft sm:p-7">
        <div className="mb-3 flex flex-wrap gap-2 text-xs">
          <Badge variant="secondary">{q.exam_type}</Badge>
          <Badge variant="outline">{q.subject_key}</Badge>
          {q.year && <Badge variant="outline">{q.year}{q.session ? ` · ${q.session}` : ""}</Badge>}
          {q.topic && <Badge variant="outline">{q.topic}</Badge>}
        </div>
        <MathText block className="text-base leading-7">{q.question_text}</MathText>
        {q.image_url && <img src={q.image_url} alt="Question figure" loading="lazy" className="mt-4 max-h-80 w-auto rounded-xl border" />}

        <div className="mt-5 grid gap-2">
          {q.options.map((opt, i) => {
            const picked = answers[q.id] === i;
            return (
              <button
                key={i}
                type="button"
                onClick={() => onPick(q.id, i)}
                className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left text-sm transition ${picked ? "border-primary bg-primary/10" : "hover:bg-muted/60"}`}
              >
                <span className={`grid size-6 shrink-0 place-items-center rounded-full border text-xs font-bold ${picked ? "border-primary bg-primary text-primary-foreground" : ""}`}>
                  {String.fromCharCode(65 + i)}
                </span>
                <MathText className="min-w-0">{opt}</MathText>
              </button>
            );
          })}
        </div>
      </motion.div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="ghost" onClick={onQuit}>Exit</Button>
        <div className="flex gap-2">
          <Button variant="outline" disabled={current === 0} onClick={() => onGo(current - 1)}><ArrowLeft /> Previous</Button>
          {current < quiz.length - 1 ? (
            <Button onClick={() => onGo(current + 1)}>Next <ArrowRight /></Button>
          ) : (
            <Button onClick={onSubmit}>Submit answers</Button>
          )}
        </div>
      </div>
    </div>
  );
}

function Results({ quiz, answers, score, onRetry }: {
  quiz: Question[]; answers: Record<string, number>; score: number; onRetry: () => void;
}) {
  const pct = Math.round((score / quiz.length) * 100);
  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="rounded-2xl border bg-card p-6 text-center shadow-soft">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-brand-orange/10 text-brand-orange"><Trophy className="size-7" /></span>
        <h2 className="mt-4 font-display text-2xl font-bold">You scored {score}/{quiz.length}</h2>
        <p className="text-muted-foreground">{pct}% correct — review every answer below.</p>
        <Progress value={pct} className="mx-auto mt-4 h-2 max-w-sm" />
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Button onClick={onRetry}><RotateCcw /> New quiz</Button>
          <Button asChild variant="outline"><Link to="/resources">Back to resources</Link></Button>
        </div>
      </motion.div>

      {quiz.map((q, idx) => {
        const chosen = answers[q.id];
        const correct = chosen === q.correct_index;
        return (
          <div key={q.id} className="rounded-2xl border bg-card p-5 shadow-soft">
            <div className="flex items-start gap-3">
              <span className={`grid size-8 shrink-0 place-items-center rounded-full ${correct ? "bg-brand-green/10 text-brand-green" : "bg-destructive/10 text-destructive"}`}>
                {correct ? <CheckCircle2 className="size-4" /> : <XCircle className="size-4" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Question {idx + 1}</p>
                <MathText block className="mt-1 text-sm leading-6">{q.question_text}</MathText>
                <div className="mt-3 grid gap-2">
                  {q.options.map((opt, i) => {
                    const isCorrect = i === q.correct_index;
                    const isChosen = i === chosen;
                    return (
                      <div
                        key={i}
                        className={`flex items-start gap-3 rounded-xl border p-3 text-sm ${
                          isCorrect ? "border-brand-green/50 bg-brand-green/5"
                            : isChosen ? "border-destructive/50 bg-destructive/5" : ""
                        }`}
                      >
                        <span className="grid size-6 shrink-0 place-items-center rounded-full border text-xs font-bold">{String.fromCharCode(65 + i)}</span>
                        <MathText className="min-w-0">{opt}</MathText>
                        {isCorrect && <span className="ml-auto shrink-0 text-xs font-semibold text-brand-green">Correct</span>}
                        {isChosen && !isCorrect && <span className="ml-auto shrink-0 text-xs font-semibold text-destructive">Your answer</span>}
                      </div>
                    );
                  })}
                </div>
                {chosen === undefined && <p className="mt-2 text-xs text-muted-foreground">You skipped this question.</p>}
                {q.explanation && (
                  <div className="mt-3 rounded-xl border bg-muted/40 p-3 text-sm">
                    <p className="font-semibold">Explanation</p>
                    <MathText block className="mt-1 leading-6 text-muted-foreground">{q.explanation}</MathText>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
