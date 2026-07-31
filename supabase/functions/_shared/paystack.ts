import { createClient } from "npm:@supabase/supabase-js@2";

export const admin = () =>
  createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

/** Secret key from the project secret, falling back to the admin-managed settings row. */
export async function paystackSecretKey(): Promise<string | null> {
  const env = Deno.env.get("PAYSTACK_SECRET_KEY");
  if (env) return env;
  const { data } = await admin().from("settings").select("value").eq("key", "paystack_secret").maybeSingle();
  const key = (data?.value as { secret_key?: string } | null)?.secret_key;
  return key && key.trim() ? key.trim() : null;
}

export async function paystack(path: string, init?: RequestInit) {
  const key = await paystackSecretKey();
  if (!key) throw new Error("Paystack is not configured. Add the secret key in Admin → Settings.");
  const res = await fetch(`https://api.paystack.co${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const json = await res.json();
  if (!res.ok || json.status === false) throw new Error(json.message ?? `Paystack error (${res.status})`);
  return json;
}

export async function userFromRequest(req: Request) {
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace("Bearer ", "");
  if (!token) return null;
  const { data } = await admin().auth.getUser(token);
  return data.user ?? null;
}
