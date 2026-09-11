import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export type Booking = {
  id: string; preferred_start: string; duration_minutes: number; status: string;
  session_type: string; meeting_url: string | null; student_notes: string | null;
  programme: string | null; ref_code: string | null; price_amount: number | null;
  currency: string | null; tutor_id: string | null;
};

export type ActivityRow = {
  id: string; activity_type: string; progress: number | null; last_viewed_at: string | null;
  resource_id: string | null; video_id: string | null; topic_id: string | null;
};

export type SavedRow = {
  id: string; created_at: string;
  resources: { id: string; title: string; description: string | null; resource_type: string | null; access_level: string | null } | null;
};

export type QuizAttempt = {
  id: string; exam_type: string | null; subject_key: string | null;
  score: number; total: number; completed_at: string | null; created_at: string;
};

export type StudentProfile = {
  id: string; full_name: string; email: string; phone: string | null; country: string | null;
};

/** Signed-in user plus the role checks that decide where they belong. */
export function useStudentIdentity() {
  return useQuery({
    queryKey: ["student", "identity"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) return { user: null, isAdmin: false, tutorId: null as string | null };
      const [{ data: isAdmin }, { data: tutor }] = await Promise.all([
        supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }),
        supabase.from("tutor_profiles").select("id,is_approved").eq("user_id", user.id).maybeSingle(),
      ]);
      return {
        user,
        isAdmin: !!isAdmin,
        tutorId: tutor?.is_approved ? (tutor.id as string) : null,
      };
    },
  });
}

export function useStudentBookings(userId: string | null) {
  return useQuery({
    queryKey: ["student", "bookings", userId],
    enabled: !!userId,
    queryFn: async (): Promise<Booking[]> => {
      const { data, error } = await supabase
        .from("bookings")
        .select("id,preferred_start,duration_minutes,status,session_type,meeting_url,student_notes,programme,ref_code,price_amount,currency,tutor_id")
        .eq("student_id", userId!)
        .order("preferred_start", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Booking[];
    },
  });
}

export function useStudentActivity(userId: string | null) {
  return useQuery({
    queryKey: ["student", "activity", userId],
    enabled: !!userId,
    queryFn: async (): Promise<ActivityRow[]> => {
      const { data, error } = await supabase
        .from("learning_activity")
        .select("id,activity_type,progress,last_viewed_at,resource_id,video_id,topic_id")
        .eq("user_id", userId!)
        .order("last_viewed_at", { ascending: false, nullsFirst: false })
        .limit(12);
      if (error) throw error;
      return (data ?? []) as ActivityRow[];
    },
  });
}

export function useSavedResources(userId: string | null) {
  return useQuery({
    queryKey: ["student", "saved", userId],
    enabled: !!userId,
    queryFn: async (): Promise<SavedRow[]> => {
      const { data, error } = await supabase
        .from("saved_resources")
        .select("id, created_at, resources ( id, title, description, resource_type, access_level )")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as SavedRow[];
    },
  });
}

export function useUnsaveResource(userId: string | null) {
  const qc = useQueryClient();
  const key = ["student", "saved", userId];
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("saved_resources").delete().eq("id", id);
      if (error) throw error;
    },
    // Optimistic: the card disappears immediately, and comes back if the save fails.
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<SavedRow[]>(key);
      qc.setQueryData<SavedRow[]>(key, (cur) => (cur ?? []).filter((r) => r.id !== id));
      return { previous };
    },
    onError: (err: any, _id, ctx) => {
      if (ctx?.previous) qc.setQueryData(key, ctx.previous);
      toast.error(err?.message ?? "Could not remove that item");
    },
    onSuccess: () => toast.success("Removed from your library"),
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });
}

export function useQuizAttempts(userId: string | null) {
  return useQuery({
    queryKey: ["student", "quiz", userId],
    enabled: !!userId,
    queryFn: async (): Promise<QuizAttempt[]> => {
      const { data, error } = await supabase
        .from("quiz_attempts")
        .select("id,exam_type,subject_key,score,total,completed_at,created_at")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false })
        .limit(25);
      if (error) throw error;
      return (data ?? []) as QuizAttempt[];
    },
  });
}

export function useStudentProfile(userId: string | null) {
  return useQuery({
    queryKey: ["student", "profile", userId],
    enabled: !!userId,
    queryFn: async (): Promise<StudentProfile | null> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id,full_name,email,phone,country")
        .eq("id", userId!)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as StudentProfile | null;
    },
  });
}

export function useSaveProfile(userId: string | null) {
  const qc = useQueryClient();
  const key = ["student", "profile", userId];
  return useMutation({
    mutationFn: async (patch: Partial<StudentProfile>) => {
      const { error } = await supabase.from("profiles").update(patch).eq("id", userId!);
      if (error) throw error;
    },
    onMutate: async (patch) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<StudentProfile>(key);
      qc.setQueryData<StudentProfile>(key, (cur) => (cur ? { ...cur, ...patch } : cur));
      return { previous };
    },
    onError: (err: any, _p, ctx) => {
      if (ctx?.previous) qc.setQueryData(key, ctx.previous);
      toast.error(err?.message ?? "Could not save your details");
    },
    onSuccess: () => toast.success("Profile updated"),
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });
}

export function useSubscription(userId: string | null) {
  return useQuery({
    queryKey: ["student", "subscription", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("premium_subscriptions")
        .select("id,status,starts_at,ends_at, subscription_plans ( name, interval )")
        .eq("user_id", userId!)
        .order("ends_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
  });
}
