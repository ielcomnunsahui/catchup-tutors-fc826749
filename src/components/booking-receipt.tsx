import { CheckCircle2 } from "lucide-react";

export type ReceiptData = {
  reference: string;
  paidAt?: string | null;
  bookingRef?: string | null;
  tutorName?: string | null;
  tutorRef?: string | null;
  amount?: number | null;
  currency?: string | null;
  start?: string | null;
  durationMinutes?: number | null;
};

export function BookingReceipt({ data }: { data: ReceiptData }) {
  const rows: Array<[string, string]> = [
    ["Payment reference", data.reference],
    ["Booking reference", data.bookingRef ?? "—"],
    ["Tutor", `${data.tutorName ?? "—"}${data.tutorRef ? ` (${data.tutorRef})` : ""}`],
    ["Session", data.start ? `${new Date(data.start).toLocaleString()} · ${data.durationMinutes ?? 60} min` : "—"],
    ["Amount paid", data.amount ? `${data.currency === "GBP" ? "£" : "₦"}${Number(data.amount).toLocaleString()}` : "—"],
    ["Paid at", data.paidAt ? new Date(data.paidAt).toLocaleString() : "—"],
  ];
  return (
    <div className="rounded-2xl border bg-card p-6 text-left shadow-soft">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-5 w-5 text-brand-green" />
        <h2 className="font-display text-lg font-bold">Payment receipt</h2>
      </div>
      <dl className="mt-4 divide-y text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-start justify-between gap-4 py-2">
            <dt className="text-muted-foreground">{k}</dt>
            <dd className="text-right font-medium">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default BookingReceipt;
