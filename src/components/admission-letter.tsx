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

  return (
    <div
      ref={ref}
      className="mx-auto w-full max-w-[820px] rounded-3xl border border-border bg-white text-[#0f172a] shadow-soft print:m-0 print:max-w-none print:rounded-none print:border-0 print:shadow-none"
    >
      <div className="rounded-t-3xl bg-[#000E2E] px-8 py-8 text-white print:rounded-none sm:px-12 sm:py-10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/70">Catch-Up Tutors</p>
            <p className="mt-1 text-xs italic text-[#FF6B12]">Bridging Gaps, Building Excellence</p>
            <h2 className="mt-3 font-display text-2xl font-bold sm:text-3xl">{title}</h2>
          </div>
          <img src={logoUrl} alt="Catch-Up Tutors" className="h-14 w-auto sm:h-16" />
        </div>
        <p className="mt-6 text-sm text-white/80">Free Summer Lesson 2026 · Al-Bayan High School, Ilorin, Kwara State</p>
      </div>

      <div className="space-y-5 px-8 py-8 text-[15px] leading-7 sm:px-12 sm:py-10">
        <p>Dear <b>{fullName}</b>,</p>

        {kind === "student" ? (
          <>
            <p>
              Congratulations! We are pleased to inform you that your application for the <b>Catch-Up Tutors Free Summer Lesson</b> has
              been received and successfully processed. You have been <b>provisionally admitted</b> into our intensive summer academic program.
            </p>
            <p>
              This program is an intentional space designed to sharpen your intellect, build your character, and prepare you thoroughly
              for your upcoming academic challenges. To secure your final placement, please take note of the crucial details below.
            </p>

            <div>
              <p className="font-display text-base font-bold text-brand-navy">Program Details &amp; Schedule</p>
              <ul className="mt-2 list-disc space-y-1 pl-6">
                <li><b>Venue Address:</b> Al-Bayan High School, behind Karuma Secondary School, Akerebiate, Ilorin, Kwara State.</li>
                <li><b>Days:</b> Mondays – Fridays</li>
                <li><b>Time:</b> 8:30 AM – 1:00 PM daily</li>
              </ul>
            </div>

            <div>
              <p className="font-display text-base font-bold text-brand-navy">Mandatory Entrance Assessment</p>
              <p className="mt-2">
                To help us understand your current academic standing and place you in the right class department
                (Science, Commercial, or Arts), you are required to sit for an entrance screening.
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-6">
                <li><b>Date of Entrance Exam:</b> Monday, July 27, 2026</li>
                <li><b>Time:</b> 9:00 AM prompt</li>
              </ul>
            </div>

            <dl className="grid gap-3 rounded-2xl border-l-4 border-[#FF6B12] bg-[#FFF4EC] px-5 py-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-[#0f172a]/60">Reference ID</dt>
                <dd className="mt-1 font-mono">{admissionId}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-[#0f172a]/60">Issued</dt>
                <dd className="mt-1">{issuedOn ?? new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-[#0f172a]/60">Fee</dt>
                <dd className="mt-1">Fully sponsored · ₦0</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-[#0f172a]/60">Mode</dt>
                <dd className="mt-1">Physical / in-person only</dd>
              </div>
              {extras.map((e) => (
                <div key={e.label}>
                  <dt className="text-[11px] font-semibold uppercase tracking-wider text-[#0f172a]/60">{e.label}</dt>
                  <dd className="mt-1">{e.value}</dd>
                </div>
              ))}
            </dl>

            <div>
              <p className="font-display text-base font-bold text-brand-navy">Important Instructions for Resumption</p>
              <ol className="mt-2 list-decimal space-y-2 pl-6">
                <li>
                  <b>Print this Letter:</b> You must come along with a physical printed copy or soft copy of this
                  Admission / Enrollment Letter on the day of the exam. It serves as your entry pass into the venue.
                </li>
                <li>
                  <b>Writing Materials:</b> Bring a mathematical set, pens, pencils, and a notebook.
                </li>
                <li>
                  <b>Punctuality &amp; Conduct:</b> Ensure you arrive at least 15 minutes before the stated time.
                  We maintain strict discipline, and lateness will not be tolerated.
                </li>
              </ol>
            </div>

            <p>
              We look forward to partnering with you this summer to unlock your academic potential and build true wisdom.
            </p>
            <p>
              For questions, contact us on WhatsApp at <b>+44 7350 890668</b> or by email at{" "}
              <b>Catchuptutors01@gmail.com</b>.
            </p>

            <div className="mt-10 flex flex-wrap items-end justify-between gap-6 border-t border-dashed border-[#0f172a]/15 pt-6">
              <div>
                <p className="font-display text-lg font-semibold text-[#000E2E]">Warm regards,</p>
                <p className="mt-1 text-sm font-semibold">Management</p>
                <p className="text-xs text-[#0f172a]/60">Catch-Up Tutors</p>
              </div>
              <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-[#FF6B12] bg-white p-2">
                <img src={logoUrl} alt="Catch-Up Tutors" className="h-full w-full object-contain" crossOrigin="anonymous" />
              </div>
            </div>
          </>
        ) : (
          <>
            <p>
              Thank you for stepping forward to teach. Your volunteer application to the <b>Catch-Up Tutors Free Summer Lesson 2026</b>{" "}
              has been received and provisionally accepted, subject to a short interview.
            </p>

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
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-[#0f172a]/60">Perks</dt>
                <dd className="mt-1">Meals &amp; local transport within Ilorin covered</dd>
              </div>
              {extras.map((e) => (
                <div key={e.label}>
                  <dt className="text-[11px] font-semibold uppercase tracking-wider text-[#0f172a]/60">{e.label}</dt>
                  <dd className="mt-1">{e.value}</dd>
                </div>
              ))}
            </dl>

            <p>
              Our coordinator will contact you on the phone number you provided to confirm subjects, timetable and orientation date.
            </p>
            <p>
              For questions, contact us on WhatsApp at <b>+44 7350 890668</b> or by email at{" "}
              <b>Catchuptutors01@gmail.com</b>.
            </p>

            <div className="mt-10 flex flex-wrap items-end justify-between gap-6 border-t border-dashed border-[#0f172a]/15 pt-6">
              <div>
                <p className="font-display text-lg font-semibold text-[#000E2E]">With appreciation,</p>
                <p className="mt-1 text-sm font-semibold">Management</p>
                <p className="text-xs text-[#0f172a]/60">Catch-Up Tutors</p>
              </div>
              <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-[#FF6B12] bg-white p-2">
                <img src={logoUrl} alt="Catch-Up Tutors" className="h-full w-full object-contain" crossOrigin="anonymous" />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
});
