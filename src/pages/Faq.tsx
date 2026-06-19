import { Seo } from "@/components/site-shell";
import { ContentPage } from "@/components/content-page";

const FAQS = [
  ["What can I access for free?", "Selected lesson videos, tutor discovery, and selected past-question resources."],
  ["How does premium access work?", "An active monthly, quarterly, or annual subscription unlocks premium video lessons and resources."],
  ["Are tutoring sessions included?", "No. One-to-one sessions are priced separately by each approved tutor."],
  ["How are tutors approved?", "Applications, qualifications, identity details, and teaching information are reviewed before profiles become public."],
];

export default function Faq() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map(([q, a]) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };
  return (
    <>
      <Seo
        title="Frequently Asked Questions | CatchUp Tutors"
        description="Answers about CatchUp resources, premium access, tutors, and bookings."
        path="/faq"
        jsonLd={jsonLd}
      />
      <ContentPage kind="faq" />
    </>
  );
}
