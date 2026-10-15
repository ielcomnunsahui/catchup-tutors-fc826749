import { describe, expect, test } from "bun:test";
import { applicantCsv } from "./tutor-applicant-export";

describe("applicant CSV", () => {
  test("exports every applicant and every teaching subject with contact details", () => {
    const csv = applicantCsv([
      { id: "1", full_name: 'Amina, "Teacher"', phone: "08012345678", email: "amina@example.test", subjects: ["Maths", "Physics", "Chemistry", "Biology", "English"], qualifications: "BSc" },
      { id: "2", full_name: "Bayo", phone: "+2348012345678", email: "bayo@example.test", subjects: ["English"] },
    ]);
    expect(csv).toContain('"Name","Phone","Email","Subjects"');
    expect(csv).toContain('"Amina, ""Teacher"""');
    expect(csv).toContain('"\'08012345678"');
    expect(csv).toContain('"\'+2348012345678"');
    expect(csv).toContain('"Maths; Physics; Chemistry; Biology; English"');
    expect(csv).toContain('"bayo@example.test"');
    expect(csv.split("\r\n")).toHaveLength(3);
  });
  test("neutralizes spreadsheet formulas in applicant-controlled fields", () => {
    expect(applicantCsv([{ id: "1", full_name: "=HYPERLINK(1)", phone: "01", email: "a@example.test", subjects: ["@SUM(1)"] }])).toContain('"\'=HYPERLINK(1)"');
  });
});