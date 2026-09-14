import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { z } from "zod";
import { ArrowLeft, Eye, EyeOff, GraduationCap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Seo } from "@/components/site-shell";
import logo from "@/assets/catchup-logo.png";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.7v3h3.9c2.3-2.1 3.5-5.2 3.5-8.9z" />
      <path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1A12 12 0 0 0 12 24z" />
      <path fill="#FBBC05" d="M5.4 14.4a7.2 7.2 0 0 1 0-4.6V6.7H1.4a12 12 0 0 0 0 10.8l4-3.1z" />
      <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4C17.9 1.2 15.2 0 12 0A12 12 0 0 0 1.4 6.7l4 3.1C6.3 6.9 8.9 4.8 12 4.8z" />
    </svg>
  );
}

const schema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(72),
});

export default function Auth() {
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [googleBusy, setGoogleBusy] = useState(false);
  const navigate = useNavigate();

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    const form = new FormData(e.currentTarget);
    if (mode === "forgot") {
      const email = z.string().trim().email().safeParse(String(form.get("email")));
      if (!email.success) { setMessage("Enter a valid email address."); return; }
      setBusy(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email.data, { redirectTo: `${window.location.origin}/reset-password` });
      setMessage(error ? error.message : "If an account exists for that email, a reset link is on its way. Check your inbox and spam folder.");
      setBusy(false);
      return;
    }
    const parsed = schema.safeParse({
      name: String(form.get("name") || "") || undefined,
      email: String(form.get("email")),
      password: String(form.get("password")),
    });
    if (!parsed.success) { setMessage(parsed.error.issues[0]?.message || "Check your details."); return; }
    setBusy(true);
    if (mode === "login") {
      const { data: signIn, error } = await supabase.auth.signInWithPassword({ email: parsed.data.email, password: parsed.data.password });
      if (error) setMessage(error.message);
      else if (signIn.user) {
        const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: signIn.user.id, _role: "admin" });
        if (isAdmin) { navigate("/admin"); }
        else {
          const { data: tutor } = await supabase
            .from("tutor_profiles").select("is_approved").eq("user_id", signIn.user.id).maybeSingle();
          if (tutor?.is_approved) { navigate("/tutor"); }
          else {
            const { data: application } = await supabase
              .from("tutor_applications").select("status")
              .eq("user_id", signIn.user.id)
              .order("created_at", { ascending: false })
              .limit(1).maybeSingle();
            const awaiting = application?.status === "pending" || application?.status === "changes_requested";
            navigate(awaiting ? "/dashboard#application" : "/dashboard");
          }
        }
      }
    } else {
      const { data, error } = await supabase.auth.signUp({
        email: parsed.data.email, password: parsed.data.password,
        options: { emailRedirectTo: `${window.location.origin}/dashboard`, data: { full_name: parsed.data.name } },
      });
      if (error) setMessage(error.message);
      else if (data.user) {
        // Profile + default 'student' role are created automatically by the on_auth_user_created trigger.
        setMessage("Check your email to verify your account, then sign in.");
      }
    }
    setBusy(false);
  }

  async function google() {
    setMessage("");
    setGoogleBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: `${window.location.origin}/dashboard`, extraParams: { prompt: "select_account" } });
      if (result.error) setMessage(result.error.message || "Google sign-in could not be started. Please try again.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Google sign-in is unavailable right now.");
    } finally {
      setGoogleBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-2">
      <Seo title="Sign In or Register | CatchUp Tutors" description="Access your CatchUp Tutors learning dashboard or create a student or tutor account." path="/auth" noindex />
      <div className="hidden bg-hero p-12 text-hero-foreground lg:flex lg:flex-col">
        <Link to="/" className="flex items-center gap-2 text-sm text-hero-foreground/70"><ArrowLeft /> Back home</Link>
        <div className="my-auto">
          <img src={logo} alt="CatchUp Tutors" className="w-72" />
          <h1 className="mt-10 font-display text-5xl font-bold">Catch Up.<br /><span className="text-brand-orange">Stay Ahead.</span></h1>
          <p className="mt-6 max-w-md text-lg leading-8 text-hero-foreground/65">Your resources, tutoring, premium lessons, and progress—all in one focused learning space.</p>
        </div>
      </div>
      <main className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-8 flex items-center gap-2 lg:hidden"><ArrowLeft /> Home</Link>
          <GraduationCap className="h-10 w-10 text-primary" />
          <h1 className="mt-5 font-display text-3xl font-bold">{mode === "login" ? "Welcome back" : mode === "register" ? "Create your account" : "Reset your password"}</h1>
          <p className="mt-2 text-muted-foreground">{mode === "login" ? "Continue your learning journey." : mode === "register" ? "Start as a student. Tutor applications follow after signup." : "Enter the email you signed up with and we'll send you a link to set a new password."}</p>
          {mode !== "forgot" && (
            <>
              <Button variant="outline" size="lg" className="mt-8 w-full gap-3" onClick={google} disabled={googleBusy || busy}>
                <GoogleIcon />
                {googleBusy ? "Opening Google…" : "Continue with Google"}
              </Button>
              <div className="my-6 flex items-center gap-4 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />OR<span className="h-px flex-1 bg-border" /></div>
            </>
          )}
          <form onSubmit={submit} className="space-y-4">
            {mode === "register" && (
              <label className="grid gap-2 text-sm font-semibold">Full name
                <input name="name" required minLength={2} maxLength={100} className="h-12 rounded-xl border bg-card px-4" />
              </label>
            )}
            <label className="grid gap-2 text-sm font-semibold">Email
              <input name="email" required type="email" maxLength={255} className="h-12 rounded-xl border bg-card px-4" />
            </label>
            {mode !== "forgot" && (
            <label className="grid gap-2 text-sm font-semibold">Password
              <div className="flex rounded-xl border bg-card">
                <input name="password" required minLength={8} maxLength={72} type={show ? "text" : "password"} className="h-12 flex-1 bg-transparent px-4 outline-none" />
                <button type="button" onClick={() => setShow(!show)} className="px-4" aria-label="Toggle password visibility">{show ? <EyeOff /> : <Eye />}</button>
              </div>
            </label>
            )}
            {message && <p role="alert" className="rounded-xl bg-muted p-3 text-sm">{message}</p>}
            <Button type="submit" size="lg" className="w-full" disabled={busy}>{busy ? "Please wait…" : mode === "login" ? "Sign in" : mode === "register" ? "Create account" : "Send reset link"}</Button>
          </form>
          {mode === "forgot" ? (
            <button onClick={() => { setMode("login"); setMessage(""); }} className="mt-6 w-full text-center text-sm font-semibold text-primary">Back to sign in</button>
          ) : (
            <>
              <button onClick={() => { setMode(mode === "login" ? "register" : "login"); setMessage(""); }} className="mt-6 w-full text-center text-sm font-semibold text-primary">{mode === "login" ? "New here? Create an account" : "Already have an account? Sign in"}</button>
              {mode === "login" && <button onClick={() => { setMode("forgot"); setMessage(""); }} className="mt-4 w-full text-center text-sm text-muted-foreground">Forgot password?</button>}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
