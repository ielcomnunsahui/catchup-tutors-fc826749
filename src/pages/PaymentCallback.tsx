import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { SiteShell, Seo } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { notifyPremiumChanged } from "@/hooks/use-premium";


export default function PaymentCallback() {
  const [params] = useSearchParams();
  const reference = params.get("reference") ?? params.get("trxref") ?? "";
  const [state, setState] = useState<"verifying" | "paid" | "failed">("verifying");
  const [detail, setDetail] = useState("");

  useEffect(() => {
    (async () => {
      if (!reference) { setState("failed"); setDetail("No payment reference was provided."); return; }
      const { data, error } = await supabase.functions.invoke("paystack-verify", { body: { reference } });
      const res = data as { status?: string; error?: string; endsAt?: string } | null;
      if (error || res?.error || res?.status !== "paid") {
        setState("failed");
        setDetail(res?.error ?? error?.message ?? "We could not confirm this payment.");
        return;
      }
      setState("paid");
      if (res.endsAt) setDetail(`Your premium access runs until ${new Date(res.endsAt).toLocaleDateString()}.`);
    })();
  }, [reference]);

  return (
    <SiteShell>
      <Seo title="Payment status | CatchUp Tutors" description="Confirming your CatchUp Tutors premium subscription payment." path="/payment/callback" noindex />
      <div className="mx-auto max-w-xl px-4 py-28 text-center sm:px-6">
        {state === "verifying" && (
          <>
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
            <h1 className="mt-6 font-display text-2xl font-bold">Confirming your payment…</h1>
            <p className="mt-2 text-muted-foreground">Please don't close this page.</p>
          </>
        )}
        {state === "paid" && (
          <>
            <CheckCircle2 className="mx-auto h-14 w-14 text-brand-green" />
            <h1 className="mt-6 font-display text-3xl font-bold">Payment confirmed</h1>
            <p className="mt-3 text-muted-foreground">Premium is now active on your account. {detail}</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild><Link to="/dashboard">Go to dashboard</Link></Button>
              <Button variant="outline" asChild><Link to="/resources">Browse resources</Link></Button>
            </div>
          </>
        )}
        {state === "failed" && (
          <>
            <XCircle className="mx-auto h-14 w-14 text-destructive" />
            <h1 className="mt-6 font-display text-3xl font-bold">Payment not confirmed</h1>
            <p className="mt-3 text-muted-foreground">{detail}</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild><Link to="/pricing">Back to pricing</Link></Button>
              <Button variant="outline" asChild><Link to="/contact">Contact support</Link></Button>
            </div>
          </>
        )}
      </div>
    </SiteShell>
  );
}
