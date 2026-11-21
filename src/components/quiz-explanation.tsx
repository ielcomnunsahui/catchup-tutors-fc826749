import { MathText } from "@/components/math-text";
import { parseChoiceRationales } from "@/lib/quiz-explanations";

export function QuizExplanation({
  explanation,
  correctIndex,
  compact = false,
}: {
  explanation: string;
  correctIndex: number;
  compact?: boolean;
}) {
  const parsed = parseChoiceRationales(explanation);
  const hasBreakdown = parsed.rationales.length > 0;

  return (
    <section className={compact ? "space-y-2" : "mt-3 space-y-2"} aria-label="Answer explanation">
      <p className="font-semibold">Explanation</p>
      {hasBreakdown ? (
        <>
          {parsed.intro && <MathText block className="text-muted-foreground">{parsed.intro}</MathText>}
          <ol className="space-y-2">
            {parsed.rationales.map(({ optionIndex, text }) => {
              const isCorrect = optionIndex === correctIndex;
              return (
                <li
                  key={optionIndex}
                  className={`border-l-2 pl-3 ${isCorrect ? "border-brand-green text-brand-green" : "border-destructive text-destructive"}`}
                >
                  <p className="font-semibold">
                    Choice {String.fromCharCode(65 + optionIndex)} · {isCorrect ? "Correct answer" : "Incorrect option"}
                  </p>
                  <MathText block className="mt-0.5 leading-6 text-foreground">{text}</MathText>
                </li>
              );
            })}
          </ol>
        </>
      ) : (
        <MathText block className="leading-6 text-muted-foreground">{explanation}</MathText>
      )}
    </section>
  );
}