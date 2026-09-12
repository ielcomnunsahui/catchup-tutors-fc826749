import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export default function ResetPassword() {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState<boolean | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active && session) setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      const hash = window.location.hash;
      setReady(Boolean(data.session) || hash.includes("type=recovery"));
    });
    return () => { active = false; sub.subscription.unsubscribe(); };
  }, []);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const password = String(form.get("password"));
    const confirm = String(form.get("confirm"));
    if (password.length < 8) { setMessage("Use at least 8 characters."); return; }
    if (password !== confirm) { setMessage("Both passwords must match."); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) { setMessage(error.message); return; }
    setMessage("Password updated. Taking you to sign in…");
    setTimeout(() => navigate("/auth"), 1500);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-5">
      <Helmet>
        <title>Reset Password | CatchUp Tutors</title>
        <meta name="description" content="Set a new password for your CatchUp Tutors account." />
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <form onSubmit={submit} className="w-full max-w-md rounded-3xl border bg-card p-8 shadow-soft">
        <h1 className="font-display text-3xl font-bold">Set a new password</h1>
        <p className="mt-2 text-muted-foreground">Choose a secure password for your CatchUp account.</p>
        {ready === false && (
          <p className="mt-5 rounded-xl bg-muted p-3 text-sm">
            This reset link is invalid or has expired. Request a new one from the sign in page.
          </p>
        )}
        <label className="mt-6 grid gap-2 text-sm font-semibold">New password
          <input name="password" type="password" minLength={8} maxLength={72} required className="h-12 w-full rounded-xl border bg-card px-4" />
        </label>
        <label className="mt-4 grid gap-2 text-sm font-semibold">Confirm password
          <input name="confirm" type="password" minLength={8} maxLength={72} required className="h-12 w-full rounded-xl border bg-card px-4" />
        </label>
        {message && <p role="alert" className="mt-4 rounded-xl bg-muted p-3 text-sm">{message}</p>}
        <Button type="submit" size="lg" className="mt-5 w-full" disabled={busy || ready === false}>{busy ? "Updating…" : "Update password"}</Button>
        <Link to="/auth" className="mt-5 block text-center text-sm text-primary">Back to sign in</Link>
      </form>
    </main>
  );
}
