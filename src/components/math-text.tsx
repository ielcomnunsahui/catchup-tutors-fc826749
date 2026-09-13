import type { ReactNode } from "react";
import { InlineMath, BlockMath } from "react-katex";
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

/** Renders ordinary copy and LaTeX equations from imported exam questions together. */
export function MathText({ children, className, block = false }: MathTextProps) {
  const content = decode(children ?? "");
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