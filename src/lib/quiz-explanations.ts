export type ChoiceRationale = { optionIndex: number; text: string };

export type ParsedQuizExplanation = {
  intro: string;
  rationales: ChoiceRationale[];
};

const CHOICE_MARKER = /\b(?:choice|option)\s+([A-H])\b/gi;

function cleanLeadIn(text: string) {
  return text.replace(
    /^\s*(?:is|was)\s+(?:the\s+)?(?:best|correct|right|incorrect|not\s+correct)(?:\s+answer)?(?:\s+because)?\s*[:,—–-]?\s*/i,
    "",
  ).trim();
}

/** Splits College Board-style "Choice A... Choice B..." rationales when labels exist. */
export function parseChoiceRationales(explanation: string): ParsedQuizExplanation {
  const markers = [...explanation.matchAll(CHOICE_MARKER)];
  if (!markers.length) return { intro: explanation.trim(), rationales: [] };

  const first = markers[0];
  if (!first || first.index === undefined) return { intro: explanation.trim(), rationales: [] };

  const intro = explanation.slice(0, first.index).trim();
  const rationales = markers.flatMap((marker, index) => {
    if (marker.index === undefined) return [];
    const start = marker.index + marker[0].length;
    const end = markers[index + 1]?.index ?? explanation.length;
    const text = cleanLeadIn(explanation.slice(start, end));
    const optionIndex = marker[1].toUpperCase().charCodeAt(0) - 65;
    return text ? [{ optionIndex, text }] : [];
  }).sort((a, b) => a.optionIndex - b.optionIndex);

  return { intro, rationales };
}