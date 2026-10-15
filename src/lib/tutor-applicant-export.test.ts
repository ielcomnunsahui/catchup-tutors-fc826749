import { describe, it as test } from "node:test";
import { strict as assert } from "node:assert";
import { applicantCsv } from "./tutor-applicant-export";

describe("applicant CSV", () => {
  test("exports every applicant and every teaching subject with contact details", () => {
    const csv = applicantCsv([
      { id: "1", full_name: 'Amina, "Teacher"', phone: "08012345678", email: "amina@example.test", subjects: ["Maths", "Physics", "Chemistry", "Biology", "English"], qualifications: "BSc" },
      { id: "2", full_name: "Bayo", phone: "+2348012345678", email: "bayo@example.test", subjects: ["English"] },
    ]);
    assert.ok(csv.includes('"Name","Phone","Email","Subjects"'));
    assert.ok(csv.includes('"Amina, ""Teacher"""'));
    assert.ok(csv.includes('"\'08012345678"'));
    assert.ok(csv.includes('"\'+2348012345678"'));
    assert.ok(csv.includes('"Maths; Physics; Chemistry; Biology; English"'));
    assert.ok(csv.includes('"bayo@example.test"'));
    assert.equal(csv.split("\r\n").length, 3);
  });
  test("neutralizes spreadsheet formulas in applicant-controlled fields", () => {
    assert.ok(applicantCsv([{ id: "1", full_name: "=HYPERLINK(1)", phone: "01", email: "a@example.test", subjects: ["@SUM(1)"] }]).includes('"\'=HYPERLINK(1)"'));
  });
});