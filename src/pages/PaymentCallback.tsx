import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { SiteShell, Seo } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { notifyPremiumChanged } from "@/hooks/use-premium";
import BookingReceipt, { type ReceiptData } from "@/components/booking-receipt";
import BookingBioForm from "@/components/booking-bio-form";

type BookingRow = {
  id: string; ref_code: string | null; preferred_start: string; duration_minutes: number;
  price_amount: number; currency: string; bio_completed: boolean;
};

export default function PaymentCallback() {
  const [params] = useSearchParams();
  const reference = params.get("reference") ?? params.get("trxref") ?? "";
  const isBooking = params.get("type") === "booking";
  const [state, setState] = useState<"verifying" | "paid" | "failed">("verifying");
  const [detail, setDetail] = useState("");
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [bioDone, setBioDone] = useState(false);

  useEffect(() => {
    (async () => {
      if (!reference) { setState("failed"); setDetail("No payment reference was provided."); return; }

      if (isBooking) {
        const { data, error } = await supabase.functions.invoke("paystack-booking", { body: { action: "verify", reference } });
        const res = data as { status?: string; error?: string; paidAt?: string; booking?: BookingRow; tutorName?: string; tutorRef?: string } | null;
        if (error || res?.error || res?.status !== "paid") {
          setState("failed");
          setDetail(res?.error ?? error?.message ?? "We could not confirm this session payment.");
          return;
        }
        const b = res.booking;
        setState("paid");
        setBookingId(b?.id ?? null);
        setBioDone(!!b?.bio_completed);
        setReceipt({
          reference, paidAt: res.paidAt, bookingRef: b?.ref_code ?? null,
          tutorName: res.tutorName ?? null, tutorRef: res.tutorRef ?? null,
          amount: b?.price_amount ?? null, currency: b?.currency ?? "NGN",
          start: b?.preferred_start ?? null, durationMinutes: b?.duration_minutes ?? null,
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke("paystack-verify", { body: { reference } });
      const res = data as { status?: string; error?: string; endsAt?: string } | null;
      if (error || res?.error || res?.status !== "paid") {
        setState("failed");
        setDetail(res?.error ?? error?.message ?? "We could not confirm this payment.");
        return;
      }
      setState("paid");
      notifyPremiumChanged();
      if (res.endsAt) setDetail(`Your premium access runs until ${new Date(res.endsAt).toLocaleDateString()}.`);
    })();
  }, [reference, isBooking]);

  return (
    <SiteShell>
      <Seo title="Payment status | CatchUp Tutors" description="Confirming your CatchUp Tutors payment." path="/payment/callback" noindex />
      <div className="mx-auto max-w-xl px-4 py-24 text-center sm:px-6">
        {state === "verifying" && (
          <>
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
            <h1 className="mt-6 font-display text-2xl font-bold">Confirming your payment…</h1>
            <p className="mt-2 text-muted-foreground">Please don't close this page.</p>
          </>
        )}
        {state === "paid" && isBooking && (
          <>
            <CheckCircle2 className="mx-auto h-14 w-14 text-brand-green" />
            <h1 className="mt-6 font-display text-3xl font-bold">Session payment confirmed</h1>
            <p className="mt-3 text-muted-foreground">Here is your receipt. One last step: your bio details.</p>
            {receipt && <div className="mt-6"><BookingReceipt data={receipt} /></div>}
            <div className="mt-6 rounded-3xl border bg-card p-6 shadow-soft">
              <h2 className="text-left font-display text-lg font-bold">Bio details</h2>
              {bioDone ? (
                <p className="mt-2 text-left text-sm text-muted-foreground">You have already submitted your bio details.</p>
              ) : bookingId ? (
                <div className="mt-4"><BookingBioForm bookingId={bookingId} onDone={() => setBioDone(true)} /></div>
              ) : null}
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild><Link to="/dashboard">Go to dashboard</Link></Button>
              <Button variant="outline" asChild><Link to="/tutors">Book another session</Link></Button>
            </div>
          </>
        )}
        {state === "paid" && !isBooking && (
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
              <Button asChild><Link to={isBooking ? "/tutors" : "/pricing"}>Try again</Link></Button>
              <Button variant="outline" asChild><Link to="/contact">Contact support</Link></Button>
            </div>
          </>
        )}
      </div>
    </SiteShell>
  );
}

