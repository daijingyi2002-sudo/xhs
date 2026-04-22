import { describe, expect, it } from "vitest";
import { defaultCandidateProfile, jobLeads } from "./mock-data";
import { rankRecommendations } from "./scoring";

describe("rankRecommendations", () => {
  it("returns descending scores for the top role leads", () => {
    const results = rankRecommendations(defaultCandidateProfile, jobLeads);

    expect(results).toHaveLength(jobLeads.length);
    expect(results[0].score).toBeGreaterThanOrEqual(results[1].score);
    expect(results.every((result) => result.score <= 98 && result.score >= 0)).toBe(true);
  });
});

