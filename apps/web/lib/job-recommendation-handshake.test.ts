import { describe, expect, it } from "vitest";
import { createDemoRecommendationProfile, getFitAnalysisForJob, getTopRecommendations } from "@xhs/ai";
import type { ConsultationState } from "@xhs/ai";
import {
  buildFitAnalysisRequest,
  buildJobAnalysisHref,
  buildRecommendationRequest,
  canRequestRecommendations,
  parseFitAnalysisResponse,
  parseTopRecommendationsResponse
} from "./job-recommendation-handshake";

const completeConsultationState = {
  version: 1,
  source: "fallback",
  round: 3,
  maxRounds: 3,
  resumeName: "resume.md",
  resumeExcerpt: "做过 AI 产品原型、用户访谈和数据分析。",
  profileSummary: "候选人具备 AI 产品项目和基础数据分析经历。",
  backgroundHighlights: ["AI 产品原型", "用户访谈", "数据分析"],
  strengths: ["有 AI 产品项目经历"],
  gaps: ["需要补充指标结果"],
  evidencePoints: ["做过 AI 产品原型、用户访谈和数据分析。"],
  pendingFocuses: [],
  currentFocus: "role_concern",
  currentQuestion: "",
  turns: [],
  finalSummary: "适合先看 AI 产品经理方向。",
  done: true
} satisfies ConsultationState;

describe("job recommendation front/back handshake", () => {
  it("only requests recommendations after consultation is complete", () => {
    expect(canRequestRecommendations(completeConsultationState)).toBe(true);
    expect(canRequestRecommendations({ ...completeConsultationState, done: false })).toBe(false);
    expect(canRequestRecommendations(null)).toBe(false);
  });

  it("builds recommendation and fit-analysis requests from the same consultation state", () => {
    expect(buildRecommendationRequest(completeConsultationState)).toEqual({
      consultationState: completeConsultationState
    });
    expect(buildRecommendationRequest(null)).toBeNull();

    expect(buildFitAnalysisRequest("seed-bytedance-ai-content", completeConsultationState)).toEqual({
      jobId: "seed-bytedance-ai-content",
      consultationState: completeConsultationState
    });
    expect(buildFitAnalysisRequest("", completeConsultationState)).toBeNull();
  });

  it("builds a stable detail page URL for a recommendation card", () => {
    expect(buildJobAnalysisHref("seed-bytedance-ai-content")).toBe("/jobs/seed-bytedance-ai-content");
    expect(buildJobAnalysisHref("seed/company role")).toBe("/jobs/seed%2Fcompany%20role");
  });

  it("validates recommendation and detail payloads against the shared domain contract", async () => {
    const profile = createDemoRecommendationProfile();
    const recommendations = parseTopRecommendationsResponse(await getTopRecommendations(profile));
    const firstJobId = recommendations.recommendations[0]?.jobId;

    expect(recommendations.recommendations).toHaveLength(5);
    expect(firstJobId).toBeTruthy();

    const detail = await getFitAnalysisForJob(profile, firstJobId!);

    expect(parseFitAnalysisResponse(detail).jobId).toBe(firstJobId);
    expect(() => parseTopRecommendationsResponse({ recommendations: [] })).toThrow();
  });
});
