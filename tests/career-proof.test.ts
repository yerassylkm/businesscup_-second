import { describe, expect, it } from "vitest";
import { buildCareerProof, careerProofShareText } from "@/features/challenges/career-proof";

describe("Career Proof share text", () => {
  it("is neutral and states it is not a certificate", () => {
    const t = careerProofShareText(54, Date.UTC(2026, 10, 14), 81, Date.UTC(2026, 10, 15), ["prioritization", "churn_prevention"]);
    expect(t).toContain("Before: 54/100");
    expect(t).toContain("After, on a new portfolio I hadn't seen: 81/100");
    expect(t).toContain("Prioritization, Churn prevention");
    expect(t).toContain("not a certificate");
  });
  it("is not built until both stages exist", () => {
    expect(buildCareerProof([])).toBeNull();
  });
});
