import type { ReactNode } from "react";
import { InlineMath, BlockMath } from "react-katex";
import DOMPurify from "dompurify";
import "katex/dist/katex.min.css";
import { cn } from "@/lib/utils";

type MathTextProps = {
  children: string | null | undefined;
  className?: string;
  block?: boolean;
};

const MATH_PARTS = /(\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)|\$\$[\s\S]*?\$\$|\$[^$\n]+\$)/g;

function decode(value: string) {
  if (typeof document === "undefined") return value;
  const textarea = document.createElement("textarea");
  textarea.innerHTML = value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "");
  return textarea.value;
}

function equation(part: string) {
  if (part.startsWith("\\(")) return { value: part.slice(2, -2), display: false };
  if (part.startsWith("\\[")) return { value: part.slice(2, -2), display: true };
  if (part.startsWith("$$")) return { value: part.slice(2, -2), display: true };
  return { value: part.slice(1, -1), display: false };
}

/** Imported College Board questions arrive as HTML with inline MathML. */
const HAS_MARKUP = /<(math|p|span|table|ul|ol|li|sub|sup|em|strong|br|img|div)\b/i;

function RichHtml({ html, className, block }: { html: string; className?: string; block: boolean }) {
  const clean = DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true, mathMl: true },
    FORBID_TAGS: ["script", "style", "iframe", "form", "input"],
    FORBID_ATTR: ["onerror", "onload", "onclick", "style"],
  });
  const Tag = block ? "div" : "span";
  return (
    <Tag
      className={cn("math-text break-words [&_p]:my-1 [&_table]:my-2 [&_table_td]:border [&_table_td]:px-2 [&_table_td]:py-1", className)}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}

/** Renders ordinary copy and LaTeX equations from imported exam questions together. */
export function MathText({ children, className, block = false }: MathTextProps) {
  const raw = children ?? "";
  if (HAS_MARKUP.test(raw)) return <RichHtml html={raw} className={className} block={block} />;
  const content = decode(raw);
  const parts = content.split(MATH_PARTS).filter(Boolean);
  const rendered: ReactNode[] = parts.map((part, index) => {
    if (!MATH_PARTS.test(part)) return <span key={index}>{part}</span>;
    MATH_PARTS.lastIndex = 0;
    const math = equation(part);
    const fallback = <span className="font-mono">{math.value.replace(/\\,/g, " ")}</span>;
    return math.display
      ? <BlockMath key={index} math={math.value} renderError={() => fallback} />
      : <InlineMath key={index} math={math.value} renderError={() => fallback} />;
  });

  return block
    ? <div className={cn("math-text whitespace-pre-wrap break-words", className)}>{rendered}</div>
    : <span className={cn("math-text whitespace-pre-wrap break-words", className)}>{rendered}</span>;
}