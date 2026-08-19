import musa from "@/assets/Musa_Salami.jpg";
import abduljamal from "@/assets/Abduljamal_Ololade_Raji.jpg";
import ameerah from "@/assets/IMG-20260815-WA0051.jpg";
import abdulahi from "@/assets/Abdullahi_Oyebanji.jpg";

export type Testimonial = { quote: string; name: string; role: string; image?: string };

export const TESTIMONIALS: Testimonial[] = [
  {
    name: "Musa Salami",
    role: "University of Ibadan",
    image: musa,
    quote:
      "Being under the tutelage of Mr. Thaoban made my mathematics coursework during my A Levels very easy. He breaks down complex concepts with ease, building both confidence and a robust foundation for my examination. He is an exceptional tutor, and I cannot recommend him highly enough.",
  },
  {
    name: "Abduljamal Ololade Raji Afolabi",
    role: "Capital University of Egypt 🇪🇬",
    image: abduljamal.url,
    quote:
      "Mr. Thaoban made Cambridge A Level Mathematics easy to understand. His clear, step by step teaching, patience, and genuine commitment transformed my confidence and understanding of the subject. By the end of the course, I was not just passing, I truly understood the material. I highly recommend him to anyone seeking an exceptional Mathematics teacher.",
  },
  {
    name: "Alabi Ameerah",
    role: "Al-Hikmah University, Ilorin — MBBS",
    image: ameerah.url,
    quote:
      "Being a student of Mr. Thaoban in secondary school gave me one of the strongest academic foundations I could have asked for. He simplifies difficult mathematical concepts and ensures one truly understands them, making a lasting impact on my learning. Thanks to that foundation, I passed my GCE Further Mathematics with an excellent grade, and Mathematics in my first year at university felt much easier to navigate. He taught me how to think logically and approach mathematical problems confidently. I'm sincerely grateful for his dedication and would highly recommend him to any student looking for an exceptional mathematics teacher.",
  },
  {
    name: "Abdulahi Oyebanji",
    role: "University of Southern Mississippi, USA 🇺🇸",
    image: abdulahi.url,
    quote:
      "Learning from Mr. Thaoban was one of the best things that happened during my A Levels. He explained concepts clearly and passionately, which gave me more confidence to perform really well in my Cambridge A Level Mathematics exam and laid the foundation for how I tackle technical problems today. He's one of the best math tutors I've ever met, and I'd always recommend him.",
  },
];
