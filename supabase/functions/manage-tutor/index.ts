import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";
import { createClient } from "npm:@supabase/supabase-js@2";

const Body = z.object({
  tutorProfileId: z.string().uuid(),
  action: z.enum(["suspend", "reinstate", "revoke"]),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const json = (b: unknown, status = 200) =>
    new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
      auth: { persistSession: false },
    });

    const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
    if (!token) return json({ error: "Sign in required" }, 401);
    const { data: authData } = await db.auth.getUser(token);
    const caller = authData.user;
    if (!caller) return json({ error: "Sign in required" }, 401);
    const { data: isAdmin } = await db.rpc("has_role", { _user_id: caller.id, _role: "admin" });
    if (!isAdmin) return json({ error: "Admin only" }, 403);

    const parsed = Body.safeParse(await req.json());
    if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400);
    const { tutorProfileId, action } = parsed.data;

    const { data: profile } = await db
      .from("tutor_profiles").select("id, user_id").eq("id", tutorProfileId).maybeSingle();
    if (!profile) return json({ error: "Tutor not found" }, 404);

    if (action === "suspend") {
      await db.from("tutor_profiles").update({ is_visible: false }).eq("id", tutorProfileId);
    } else if (action === "reinstate") {
      await db.from("tutor_profiles").update({ is_visible: true, is_approved: true }).eq("id", tutorProfileId);
      await db.from("user_roles").upsert(
        { user_id: profile.user_id, role: "tutor" },
        { onConflict: "user_id,role", ignoreDuplicates: true },
      );
    } else {
      // revoke: remove tutor access entirely
      await db.from("tutor_profiles").update({ is_approved: false, is_visible: false }).eq("id", tutorProfileId);
      await db.from("user_roles").delete().eq("user_id", profile.user_id).eq("role", "tutor");
    }

    return json({ ok: true, action });
  } catch (e) {
    return json({ error: (e as Error).message }, 400);
  }
});
