import { describe, expect, test } from "bun:test";
import { parseChoiceRationales } from "./quiz-explanations";

describe("parseChoiceRationales", () => {
  test("splits and orders labelled SAT explanations by choice", () => {
    const result = parseChoiceRationales(
      "Choice C is the best answer because it matches the passage. Choice A is incorrect because it adds unsupported information. Choice B is incorrect because it reverses the claim. Choice D is incorrect because it is too broad.",
    );

    expect(result.rationales.map((item) => item.optionIndex)).toEqual([0, 1, 2, 3]);
    expect(result.rationales[0]?.text).toContain("adds unsupported information");
    expect(result.rationales[2]?.text).toContain("matches the passage");
  });

  test("keeps unlabelled worked explanations intact", () => {
    const explanation = "First isolate x, then substitute the value into the original equation.";
    expect(parseChoiceRationales(explanation)).toEqual({ intro: explanation, rationales: [] });
  });
});