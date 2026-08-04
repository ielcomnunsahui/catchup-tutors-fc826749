import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CreditCard, Crown, ExternalLink, Loader2, Save, ShieldAlert } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

type PaystackSettings = { public_key: string; enabled: boolean; currency: string };

export default function SettingsTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<PaystackSettings>({ public_key: "", enabled: false, currency: "NGN" });
  const [secretKey, setSecretKey] = useState("");
  const [secretSet, setSecretSet] = useState(false);

  const load = async () => {
    setLoading(true);
    const [pub, sec] = await Promise.all([
      supabase.from("settings").select("value").eq("key", "paystack").maybeSingle(),
      supabase.from("settings").select("value").eq("key", "paystack_secret").maybeSingle(),
    ]);
    const v = (pub.data?.value ?? {}) as Partial<PaystackSettings>;
    setSettings({ public_key: v.public_key ?? "", enabled: !!v.enabled, currency: v.currency ?? "NGN" });
    setSecretSet(Boolean((sec.data?.value as { secret_key?: string } | null)?.secret_key));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (settings.enabled && !settings.public_key.trim()) {
      toast.error("Add your Paystack public key before enabling checkout.");
      return;
    }
    setSaving(true);
    const ops: Promise<{ error: unknown }>[] = [
      supabase.from("settings").upsert(
        { key: "paystack", value: { ...settings, public_key: settings.public_key.trim() }, is_public: true },
        { onConflict: "key" },
      ) as unknown as Promise<{ error: unknown }>,
    ];
    if (secretKey.trim()) {
      ops.push(
        supabase.from("settings").upsert(
          { key: "paystack_secret", value: { secret_key: secretKey.trim() }, is_public: false },
          { onConflict: "key" },
        ) as unknown as Promise<{ error: unknown }>,
      );
    }
    const results = await Promise.all(ops);
    setSaving(false);
    const failed = results.find((r) => r.error);
    if (failed) { toast.error((failed.error as { message: string }).message); return; }
    toast.success("Paystack settings saved");
    setSecretKey("");
    load();
  };

  if (loading) return <div className="flex h-40 items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="max-w-3xl space-y-6">
      <section className="rounded-2xl border bg-card p-6">
        <div className="flex items-start gap-4">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><CreditCard /></div>
          <div className="flex-1">
            <h2 className="font-display text-xl font-bold">Paystack payments</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Connect your Paystack account so students can subscribe to premium plans in Naira with card,
              bank transfer and USSD.
            </p>
          </div>
          <Badge variant={settings.enabled ? "default" : "secondary"}>{settings.enabled ? "Live" : "Disabled"}</Badge>
        </div>

        <div className="mt-6 space-y-5">
          <div className="grid gap-1.5">
            <Label>Public key</Label>
            <Input value={settings.public_key} onChange={(e) => setSettings({ ...settings, public_key: e.target.value })} placeholder="pk_test_… or pk_live_…" />
            <p className="text-xs text-muted-foreground">Safe to expose in the browser.</p>
          </div>

          <div className="grid gap-1.5">
            <Label>Secret key {secretSet && <span className="ml-1 text-xs font-normal text-brand-green">• saved</span>}</Label>
            <Input type="password" value={secretKey} onChange={(e) => setSecretKey(e.target.value)} placeholder={secretSet ? "•••••••••• (leave blank to keep current)" : "sk_test_… or sk_live_…"} />
            <p className="text-xs text-muted-foreground">
              Used server-side only to initialise and verify transactions. Never shown to students.
            </p>
          </div>

          <div className="grid gap-1.5">
            <Label>Currency</Label>
            <Input value={settings.currency} onChange={(e) => setSettings({ ...settings, currency: e.target.value.toUpperCase() })} className="max-w-[140px]" />
          </div>

          <div className="flex items-center justify-between rounded-xl border p-4">
            <div>
              <p className="text-sm font-semibold">Enable checkout on the pricing page</p>
              <p className="text-xs text-muted-foreground">When off, plan buttons link to sign-up instead of Paystack.</p>
            </div>
            <Switch checked={settings.enabled} onCheckedChange={(v) => setSettings({ ...settings, enabled: v })} />
          </div>

          <div className="flex flex-wrap gap-3">
            <Button onClick={save} disabled={saving}>{saving ? <Loader2 className="animate-spin" /> : <Save />} Save settings</Button>
            <Button variant="outline" asChild>
              <a href="https://dashboard.paystack.com/#/settings/developers" target="_blank" rel="noopener">
                <ExternalLink /> Get your API keys
              </a>
            </Button>
          </div>
        </div>
      </section>

      <section className="flex items-start gap-3 rounded-2xl border border-brand-orange/30 bg-brand-orange/5 p-5 text-sm">
        <ShieldAlert className="mt-0.5 size-5 shrink-0 text-brand-orange" />
        <div>
          <p className="font-semibold">Keep your secret key private</p>
          <p className="mt-1 text-muted-foreground">
            Only admins can read this value and it is never sent to the browser of a student. If you suspect it
            leaked, roll the key in your Paystack dashboard and paste the new one here.
          </p>
        </div>
      </section>

      <PremiumContentSection />

      <section className="rounded-2xl border bg-card p-6 text-sm">
        <h3 className="font-display text-lg font-bold">How the flow works</h3>
        <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-muted-foreground">
          <li>Student picks a plan on <b>/pricing</b> and signs in.</li>
          <li>We initialise a Paystack transaction for the plan price in Naira.</li>
          <li>Paystack returns the student to <b>/payment/callback</b>.</li>
          <li>We verify the reference, record the payment and activate their premium subscription.</li>
        </ol>
      </section>
    </div>
  );
}

type PremiumContent = { headline: string; subheadline: string; perks: string[]; cta_label: string };

const PREMIUM_DEFAULTS: PremiumContent = {
  headline: "Premium learning library",
  subheadline:
    "Full mark schemes, examiner-style solutions and topic video lessons — unlocked with a Catch-Up Tutors premium plan.",
  perks: [
    "Every mark scheme, every session, every variant",
    "Topic-by-topic video lessons",
    "Priority tutor support on WhatsApp",
  ],
  cta_label: "Unlock premium",
};

function PremiumContentSection() {
  const [value, setValue] = useState<PremiumContent>(PREMIUM_DEFAULTS);
  const [perksText, setPerksText] = useState(PREMIUM_DEFAULTS.perks.join("\n"));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("settings").select("value").eq("key", "premium_content").maybeSingle();
      const v = (data?.value ?? {}) as Partial<PremiumContent>;
      const merged: PremiumContent = {
        headline: v.headline || PREMIUM_DEFAULTS.headline,
        subheadline: v.subheadline || PREMIUM_DEFAULTS.subheadline,
        perks: v.perks?.length ? v.perks : PREMIUM_DEFAULTS.perks,
        cta_label: v.cta_label || PREMIUM_DEFAULTS.cta_label,
      };
      setValue(merged);
      setPerksText(merged.perks.join("\n"));
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    const perks = perksText.split("\n").map((p) => p.trim()).filter(Boolean);
    const { error } = await supabase
      .from("settings")
      .upsert({ key: "premium_content", value: { ...value, perks }, is_public: true }, { onConflict: "key" });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    setValue({ ...value, perks });
    toast.success("Premium page content saved");
  };

  if (loading) return null;

  return (
    <section className="rounded-2xl border bg-card p-6">
      <div className="flex items-start gap-4">
        <div className="flex size-11 items-center justify-center rounded-xl bg-brand-orange/10 text-brand-orange"><Crown /></div>
        <div className="flex-1">
          <h2 className="font-display text-xl font-bold">Premium content page</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Controls the copy on <b>/premium</b>, where students preview locked resources before subscribing.
            Mark individual papers as Free or Premium in the “Past papers” tab.
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <a href="/premium" target="_blank" rel="noopener"><ExternalLink /> View page</a>
        </Button>
      </div>

      <div className="mt-6 space-y-5">
        <div className="grid gap-1.5">
          <Label>Headline</Label>
          <Input value={value.headline} onChange={(e) => setValue({ ...value, headline: e.target.value })} />
        </div>
        <div className="grid gap-1.5">
          <Label>Sub-headline</Label>
          <Textarea rows={2} value={value.subheadline} onChange={(e) => setValue({ ...value, subheadline: e.target.value })} />
        </div>
        <div className="grid gap-1.5">
          <Label>Benefits (one per line)</Label>
          <Textarea rows={4} value={perksText} onChange={(e) => setPerksText(e.target.value)} />
        </div>
        <div className="grid gap-1.5">
          <Label>Call-to-action label</Label>
          <Input className="max-w-xs" value={value.cta_label} onChange={(e) => setValue({ ...value, cta_label: e.target.value })} />
        </div>
        <Button onClick={save} disabled={saving}>{saving ? <Loader2 className="animate-spin" /> : <Save />} Save premium content</Button>
      </div>
    </section>
  );
}
