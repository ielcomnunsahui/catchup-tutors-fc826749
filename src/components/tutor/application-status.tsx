import { Link } from "react-router-dom";
import { AlertTriangle, CheckCircle2, Clock3, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Tutor applications closed at midnight Lagos time on 13 September 2026. */
export const APPLICATION_DEADLINE = new Date("2026-09-14T00:00:00+01:00");

/** Shared status card used on the application page and inside the student dashboard. */
export function ApplicationStatus({
  status, feedback, reference, onResubmit, compact = false,
}: {
  status: string;
  feedback: string | null;
  reference: string;
  onResubmit?: () => void;
  compact?: boolean;
}) {
  const map: Record<string, { icon: typeof CheckCircle2; tone: string; title: string; body: string }> = {
    pending: {
      icon: Clock3, tone: "text-primary",
      title: "Your application is under review",
      body: "Our recruitment team is reviewing your qualifications and experience. We'll email you as soon as there's an update.",
    },
    approved: {
      icon: CheckCircle2, tone: "text-brand-green",
      title: "You're approved — welcome to Catch-Up Tutors",
      body: "Open your tutor workspace to complete your profile, set your prices and publish your teaching hours.",
    },
    changes_requested: {
      icon: AlertTriangle, tone: "text-amber-500",
      title: "We need a few updates",
      body: "Please review the note below, update your details and resubmit your application.",
    },
    rejected: {
      icon: XCircle, tone: "text-destructive",
      title: "Application not successful",
      body: "Thank you for the time you invested. You're welcome to apply again in the future.",
    },
  };
  const s = map[status] ?? map.pending;
  const Icon = s.icon;

  return (
    <div className={`rounded-3xl border bg-card text-center shadow-soft ${compact ? "p-6 sm:p-8" : "p-8 sm:p-10"}`}>
      <Icon className={`mx-auto ${compact ? "h-11 w-11" : "h-14 w-14"} ${s.tone}`} />
      <h2 className={`mt-5 font-display font-bold ${compact ? "text-2xl" : "text-3xl"}`}>{s.title}</h2>
      <p className="mt-4 text-muted-foreground">{s.body}</p>
      {feedback && (
        <p className="mt-6 rounded-2xl border-l-4 border-brand-orange bg-muted/50 p-4 text-left text-sm">{feedback}</p>
      )}
      <p className="mt-6 rounded-xl bg-muted p-4 text-sm">Reference: <code className="font-mono text-xs">{reference}</code></p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {status === "approved" && <Button asChild><Link to="/tutor">Open tutor workspace</Link></Button>}
        {status === "changes_requested" && onResubmit && Date.now() < APPLICATION_DEADLINE.getTime() && (
          <Button onClick={onResubmit}>Update and resubmit</Button>
        )}
        {status === "changes_requested" && !onResubmit && Date.now() < APPLICATION_DEADLINE.getTime() && (
          <Button asChild><Link to="/tutors/apply">Update and resubmit</Link></Button>
        )}
        <Button variant="outline" asChild><Link to="/tutors">Back to tutors</Link></Button>
      </div>
    </div>
  );
}

export default ApplicationStatus;
