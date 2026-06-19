import { Seo } from "@/components/site-shell";
import { ContentPage } from "@/components/content-page";
export default function About() {
  const jsonLd = { "@context": "https://schema.org", "@type": "AboutPage", name: "About CatchUp Tutors", about: { "@type": "EducationalOrganization", name: "CatchUp Tutors", founder: { "@type": "Person", name: "Ahmed Thaoban" } } };
  return <><Seo title="About CatchUp Tutors" description="Meet founder Ahmed Thaoban and discover the mission behind CatchUp Tutors." path="/about" jsonLd={jsonLd} /><ContentPage kind="about" /></>;
}
