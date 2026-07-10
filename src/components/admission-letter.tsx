import { forwardRef } from "react";
import logoUrl from "@/assets/catchup-logo.png";

export type AdmissionLetterProps = {
  kind: "student" | "tutor";
  fullName: string;
  admissionId: string;
  issuedOn?: string;
  extras?: { label: string; value: string }[];
};

export const AdmissionLetter = forwardRef<HTMLDivElement, AdmissionLetterProps>(function AdmissionLetter(
  { kind, fullName, admissionId, issuedOn, extras = [] },
  ref
) {
  const title = kind === "student" ? "Admission & Enrollment Letter" : "Volunteer Acceptance Letter";
  const salutation = kind === "student"
    ? "You have been officially admitted to the CatchUp Tutors Free Summer Academy 2026. Your seat is reserved at Al-Bayan High School, Ilorin, Kwara State."
    : "Thank you for stepping forward to teach. Your volunteer application to the CatchUp Tutors Free Summer Academy 2026 has been received and provisionally accepted, subject to a short interview.";
  const nextSteps = kind === "student"
    ? "Please arrive on the announced start date with a notebook, pen and your school ID. Our team will reach you via WhatsApp with the class timetable."
    : "Our coordinator will contact you on the phone number you provided to confirm subjects, timetable and orientation date. Meals and local transport within Ilorin are covered.";

  return (
    <div
      ref={ref}
      className="mx-auto w-full max-w-[820px] rounded-3xl border border-border bg-white text-[#0f172a] shadow-soft print:m-0 print:max-w-none print:rounded-none print:border-0 print:shadow-none"
    >
      <div className="rounded-t-3xl bg-[#000E2E] px-8 py-8 text-white print:rounded-none sm:px-12 sm:py-10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/70">CatchUp Tutors</p>
            <h2 className="mt-2 font-display text-2xl font-bold sm:text-3xl">{title}</h2>
          </div>
          <img src={logoUrl} alt="CatchUp Tutors" className="h-12 w-auto sm:h-14" />
        </div>
        <p className="mt-6 text-sm text-white/80">Free Summer Academy 2026 · Al-Bayan High School, Ilorin, Kwara State, Nigeria</p>
      </div>

      <div className="space-y-5 px-8 py-8 text-[15px] leading-7 sm:px-12 sm:py-10">
        <p>Dear <b>{fullName}</b>,</p>
        <p>Congratulations — {salutation}</p>

        <dl className="grid gap-3 rounded-2xl border-l-4 border-[#FF6B12] bg-[#FFF4EC] px-5 py-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-[#0f172a]/60">Reference ID</dt>
            <dd className="mt-1 font-mono">{admissionId}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-[#0f172a]/60">Issued</dt>
            <dd className="mt-1">{issuedOn ?? new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-[#0f172a]/60">Venue</dt>
            <dd className="mt-1">Al-Bayan High School, behind Karuma Secondary School, Akerebiate, Ilorin, Kwara State</dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-[#0f172a]/60">Mode</dt>
            <dd className="mt-1">Physical / in-person only</dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-[#0f172a]/60">Fee</dt>
            <dd className="mt-1">Fully sponsored · ₦0</dd>
          </div>
          {extras.map((e) => (
            <div key={e.label}>
              <dt className="text-[11px] font-semibold uppercase tracking-wider text-[#0f172a]/60">{e.label}</dt>
              <dd className="mt-1">{e.value}</dd>
            </div>
          ))}
        </dl>

        <p>{nextSteps}</p>
        <p>
          For questions, contact us on WhatsApp at <b>+234 810 180 4411</b> or by email at{" "}
          <b>Catchuptutors01@gmail.com</b>.
        </p>

        <div className="mt-10 flex flex-wrap items-end justify-between gap-6 border-t border-dashed border-[#0f172a]/15 pt-6">
          <div>
            <p className="font-display text-2xl italic text-[#000E2E]">Ahmed Thaoban</p>
            <p className="mt-1 text-sm font-semibold">Mr. Ahmed Thaoban</p>
            <p className="text-xs text-[#0f172a]/60">Founder, CatchUp Tutors · MSc Mathematics</p>
          </div>
          <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-[#FF6B12] text-center text-[9px] font-bold uppercase leading-tight tracking-wider text-[#FF6B12]">
            Official<br />CatchUp<br />Tutors<br />Seal
          </div>
        </div>
      </div>
    </div>
  );
});
