import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type PremiumState = { loading: boolean; isPremium: boolean; isAuthed: boolean; refresh: () => void };

/** Fire this after a successful payment so every mounted view unlocks instantly. */
export const PREMIUM_REFRESH_EVENT = "premium:refresh";
export const notifyPremiumChanged = () => window.dispatchEvent(new Event(PREMIUM_REFRESH_EVENT));

export function usePremium(): PremiumState {
  const [state, setState] = useState<Omit<PremiumState, "refresh">>({ loading: true, isPremium: false, isAuthed: false });
  const cancelled = useRef(false);
  const isPremiumRef = useRef(false);

  const check = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      if (!cancelled.current) setState({ loading: false, isPremium: false, isAuthed: false });
      isPremiumRef.current = false;
      return;
    }
    const { data } = await supabase
      .from("premium_subscriptions")
      .select("id, status, ends_at")
      .eq("user_id", user.id)
      .eq("status", "active")
      .gte("ends_at", new Date().toISOString())
      .limit(1)
      .maybeSingle();
    isPremiumRef.current = !!data;
    if (!cancelled.current) setState({ loading: false, isPremium: !!data, isAuthed: true });
  }, []);

  useEffect(() => {
    cancelled.current = false;
    check();

    const { data: sub } = supabase.auth.onAuthStateChange(() => check());

    // Realtime: new subscription rows unlock the UI without a refresh.
    const channel = supabase
      .channel("premium-subscriptions-watch")
      .on("postgres_changes", { event: "*", schema: "public", table: "premium_subscriptions" }, () => check())
      .subscribe();

    const onFocus = () => { if (!isPremiumRef.current) check(); };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    window.addEventListener(PREMIUM_REFRESH_EVENT, check);

    // Safety net while still locked (covers webhook-completed payments).
    const poll = window.setInterval(() => { if (!isPremiumRef.current) check(); }, 20000);

    return () => {
      cancelled.current = true;
      sub.subscription.unsubscribe();
      supabase.removeChannel(channel);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
      window.removeEventListener(PREMIUM_REFRESH_EVENT, check);
      window.clearInterval(poll);
    };
  }, [check]);

  return { ...state, refresh: check };
}
