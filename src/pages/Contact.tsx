import { Seo } from "@/components/site-shell";
import { ContentPage } from "@/components/content-page";
export default function Contact() {
  return <><Seo title="Contact CatchUp Tutors" description="Contact CatchUp Tutors about programs, tutoring, resources, and premium learning." path="/contact" jsonLd={{ "@context": "https://schema.org", "@type": "ContactPage", name: "Contact CatchUp Tutors" }} /><ContentPage kind="contact" /></>;
}
