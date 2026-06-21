import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type PremiumState = { loading: boolean; isPremium: boolean; isAuthed: boolean };

export function usePremium(): PremiumState {
  const [state, setState] = useState<PremiumState>({ loading: true, isPremium: false, isAuthed: false });

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (!cancelled) setState({ loading: false, isPremium: false, isAuthed: false });
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
      if (!cancelled) setState({ loading: false, isPremium: !!data, isAuthed: true });
    };
    check();
    const { data: sub } = supabase.auth.onAuthStateChange(() => check());
    return () => { cancelled = true; sub.subscription.unsubscribe(); };
  }, []);

  return state;
}
