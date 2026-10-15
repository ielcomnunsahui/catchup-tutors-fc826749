/** Resend connector keys are gateway credentials, never direct Resend API keys. */
export function resendRequest(path: string, body: unknown, idempotencyKey?: string) {
  const key = Deno.env.get("RESEND_API_KEY");
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  if (!key || !lovableKey) throw new Error("Resend sending is not configured. Check the connected Resend account.");
  return fetch(`https://connector-gateway.lovable.dev/resend/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json", Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": key,
      ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
    },
    body: JSON.stringify(body),
  });
}