/** Single source of truth for CatchUp Tutors contact details.
 *  The UK line is the dominant/primary number everywhere. */

export const CONTACT = {
  email: "Catchuptutors01@gmail.com",
  /** Primary (dominant) line — UK */
  primary: { label: "+44 7350 890668", e164: "447350890668", country: "UK" },
  /** Secondary line — Nigeria */
  secondary: { label: "+234 810 180 4411", e164: "2348101804411", country: "NG" },
  locations: "United Kingdom · Nigeria",
} as const;

/** WhatsApp deep link to the primary (UK) number, with optional prefilled text. */
export const waLink = (text?: string) =>
  `https://wa.me/${CONTACT.primary.e164}${text ? `?text=${encodeURIComponent(text)}` : ""}`;

/** WhatsApp deep link to the Nigerian line. */
export const waLinkNG = (text?: string) =>
  `https://wa.me/${CONTACT.secondary.e164}${text ? `?text=${encodeURIComponent(text)}` : ""}`;

/** Social profiles — YouTube first (display order matters). */
export const SOCIAL_LINKS = [
  { key: "youtube", label: "YouTube", handle: "@catch-uptutors2691", url: "https://youtube.com/@catch-uptutors2691?si=9YKS7NsmOUOdU96f" },
  { key: "instagram", label: "Instagram", handle: "@tutors.catchup", url: "https://www.instagram.com/tutors.catchup?igsh=MXB4cmgzdGVucjM0aw==" },
  { key: "facebook", label: "Facebook", handle: "CatchUp Tutors", url: "https://www.facebook.com/share/1BTRMp9BPw/" },
] as const;
