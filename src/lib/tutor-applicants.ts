import { supabase } from "@/integrations/supabase/client";

/** Fetch every application, not just the service's first 1,000 rows. RLS remains authoritative. */
export async function fetchAllTutorApplicants() {
  const rows = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await supabase.from("tutor_applications").select("*")
      .order("created_at", { ascending: false }).order("id").range(offset, offset + 499);
    if (error) throw error;
    rows.push(...(data ?? []));
    if ((data ?? []).length < 500) return rows;
  }
}