import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PROGRAMME_PLANS, type ProgrammePlan } from "@/lib/programme-plans";

type ProgrammeSetting = {
  programme: string;
  name: string;
  monthly_fee: number;
  days_per_week: number;
  min_lessons_per_day: number;
  max_lessons_per_day: number;
  note: string | null;
  blurb: string;
  sort_order: number;
};

export function useProgrammePlans() {
  return useQuery({
    queryKey: ["programme-plans"],
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<ProgrammePlan[]> => {
      const { data, error } = await supabase
        .from("programme_plan_settings")
        .select("programme,name,monthly_fee,days_per_week,min_lessons_per_day,max_lessons_per_day,note,blurb,sort_order")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return ((data ?? []) as ProgrammeSetting[]).map((row) => {
        const fallback = PROGRAMME_PLANS.find((plan) => plan.key === row.programme);
        return {
          key: row.programme,
          name: row.name,
          fee: row.monthly_fee,
          days: row.days_per_week,
          minLessonsPerDay: row.min_lessons_per_day,
          maxLessonsPerDay: row.max_lessons_per_day,
          note: row.note ?? undefined,
          subjects: fallback?.subjects,
          blurb: row.blurb,
        };
      });
    },
    placeholderData: PROGRAMME_PLANS,
  });
}