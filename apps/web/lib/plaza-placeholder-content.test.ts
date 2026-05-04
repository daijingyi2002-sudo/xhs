import { describe, expect, it } from "vitest";
import { plazaJobPlaceholders } from "./plaza-placeholder-content";

describe("plaza placeholder job content", () => {
  it("keeps 50 replaceable placeholder jobs for the resume plaza", () => {
    expect(plazaJobPlaceholders).toHaveLength(50);
    expect(new Set(plazaJobPlaceholders.map((job) => job.id)).size).toBe(50);

    for (const job of plazaJobPlaceholders) {
      expect(job.isPlaceholder).toBe(true);
      expect(job.title).toBeTruthy();
      expect(job.company).toBeTruthy();
      expect(job.role).toBe("AI 产品经理");
      expect(job.matchReasons).toHaveLength(3);
      expect(job.riskReminder).toBeTruthy();
      expect(job.analysisHref).toMatch(/^\/jobs\//);
      expect(job.interviewHref).toMatch(/^\/interview\//);
    }
  });
});
