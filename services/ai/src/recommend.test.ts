import { describe, expect, it } from "vitest";
import type { ConsultationState } from "./consultation";
import { buildRecommendationProfileFromConsultation, createDemoRecommendationProfile } from "./profile";
import { createUnavailableRetrievalAdapter, getFitAnalysisForJob, getTopRecommendations } from "./recommend";

describe("recommendation engine", () => {
  it("returns top 5 recommendations for a candidate profile", async () => {
    const response = await getTopRecommendations(createDemoRecommendationProfile());

    expect(response.recommendations).toHaveLength(5);
  });

  it("sorts recommendations by score in descending order", async () => {
    const response = await getTopRecommendations(createDemoRecommendationProfile());
    const scores = response.recommendations.map((item) => item.matchScore);
    const sorted = [...scores].sort((left, right) => right - left);

    expect(scores).toEqual(sorted);
  });

  it("includes score, reasons, and risk reminder on every card", async () => {
    const response = await getTopRecommendations(createDemoRecommendationProfile());

    for (const card of response.recommendations) {
      expect(typeof card.matchScore).toBe("number");
      expect(card.matchReasons).toHaveLength(3);
      expect(new Set(card.matchReasons).size).toBe(3);
      expect(card.matchReasons.every((item) => item.length <= 60)).toBe(true);
      expect(card.riskReminder.length).toBeGreaterThan(0);
      expect(card.analysisPreview.score).toBe(card.matchScore);
    }
  });

  it("falls back to rule scoring when retrieval adapter is unavailable", async () => {
    const response = await getTopRecommendations(createDemoRecommendationProfile(), {
      retrievalAdapter: createUnavailableRetrievalAdapter()
    });

    expect(response.recommendations).toHaveLength(5);
    expect(response.recommendations.every((item) => item.scoreBreakdown.retrievalScore === 0)).toBe(true);
  });

  it("keeps abilityProfile on resume evidence only and intentProfile on QA intent only", () => {
    const state: ConsultationState = {
      version: 1,
      source: "fallback",
      round: 3,
      maxRounds: 3,
      resumeName: "resume.txt",
      resumeExcerpt: "在内容平台实习，负责数据分析、用户反馈整理和需求跟进。",
      profileSummary: "简历显示有数据分析和产品配合经历。",
      backgroundHighlights: ["负责数据分析、用户反馈整理和需求跟进。"],
      strengths: ["材料明确提到：负责数据分析、用户反馈整理和需求跟进。"],
      gaps: ["仍需补充细节：目标方向。"],
      evidencePoints: ["负责数据分析、用户反馈整理和需求跟进。"],
      pendingFocuses: ["company_preference"],
      currentFocus: "company_preference",
      currentQuestion: "",
      turns: [
        {
          round: 1,
          focus: "company_preference",
          question: "你更想去哪类公司？",
          answer: "我更想去上海，优先看 AI 工具方向，也更偏大厂。",
          answerSummary: "补充了城市、方向和公司偏好。",
          learnedSignals: ["职业意图已补充。"],
          confidenceNote: "对话补充。"
        }
      ],
      finalSummary: "对话补充了上海、AI 工具方向和大厂偏好。",
      done: true
    };

    const profile = buildRecommendationProfileFromConsultation(state);

    expect(profile.abilityProfile.dimensions.find((item) => item.dimension === "ai_llm_understanding")?.score).toBe(0);
    expect(profile.intentProfile.targetCities).toContain("上海");
    expect(profile.intentProfile.preferredDirections).toContain("ai");
    expect(profile.intentProfile.workStylePreferences).toContain("big-tech");
  });

  it("does not raise AI ability score just because QA says the user wants AI product", () => {
    const state: ConsultationState = {
      version: 1,
      source: "fallback",
      round: 3,
      maxRounds: 3,
      resumeName: "resume.txt",
      resumeExcerpt: "做过基础产品实习，负责需求整理、排期跟进和会议纪要。",
      profileSummary: "简历里主要是基础产品实习经历。",
      backgroundHighlights: ["负责需求整理、排期跟进和会议纪要。"],
      strengths: ["材料明确提到：负责需求整理、排期跟进和会议纪要。"],
      gaps: ["仍需补充细节：职业方向。"],
      evidencePoints: ["负责需求整理、排期跟进和会议纪要。"],
      pendingFocuses: ["role_concern"],
      currentFocus: "role_concern",
      currentQuestion: "",
      turns: [
        {
          round: 1,
          focus: "role_concern",
          question: "你现在更想做哪类岗位？",
          answer: "我很想做 AI 产品经理。",
          answerSummary: "对话里表达了强烈的 AI 产品职业意图。",
          learnedSignals: ["职业意图偏 AI。"],
          confidenceNote: "对话补充。"
        }
      ],
      finalSummary: "对话里表达了强烈的 AI 产品职业意图。",
      done: true
    };

    const profile = buildRecommendationProfileFromConsultation(state);

    expect(profile.abilityProfile.dimensions.find((item) => item.dimension === "ai_llm_understanding")?.score).toBe(0);
    expect(profile.intentProfile.preferredDirections).toContain("ai");
  });

  it("keeps AI-oriented jobs in the list through intent weighting but surfaces the risk", async () => {
    const state: ConsultationState = {
      version: 1,
      source: "fallback",
      round: 3,
      maxRounds: 3,
      resumeName: "resume.txt",
      resumeExcerpt: "做过基础产品实习，负责需求整理、排期跟进和反馈同步。",
      profileSummary: "简历里主要是基础产品实习经历。",
      backgroundHighlights: ["负责需求整理、排期跟进和反馈同步。"],
      strengths: ["材料明确提到：负责需求整理、排期跟进和反馈同步。"],
      gaps: ["仍需补充细节：职业方向。"],
      evidencePoints: ["负责需求整理、排期跟进和反馈同步。"],
      pendingFocuses: ["role_concern"],
      currentFocus: "role_concern",
      currentQuestion: "",
      turns: [
        {
          round: 1,
          focus: "role_concern",
          question: "你更想做哪类方向？",
          answer: "我更想做 AI 产品，也希望去上海。",
          answerSummary: "表达了 AI 产品方向和上海偏好。",
          learnedSignals: ["职业意图偏 AI 和上海。"],
          confidenceNote: "对话补充。"
        }
      ],
      finalSummary: "表达了 AI 产品方向和上海偏好。",
      done: true
    };

    const profile = buildRecommendationProfileFromConsultation(state);
    const response = await getTopRecommendations(profile, {
      retrievalAdapter: createUnavailableRetrievalAdapter()
    });

    expect(response.recommendations.length).toBeGreaterThan(0);
    expect(response.recommendations.some((item) => item.roleTitle.includes("AI 产品经理"))).toBe(true);
    expect(
      response.recommendations.some((item) => item.riskReminder.includes("当前判断主要基于职业意图"))
    ).toBe(true);
    expect(response.recommendations[0].scoreBreakdown.intentMatchWeight).not.toBe(1);
  });

  it("does not paste long raw resume text into card reasons", async () => {
    const response = await getTopRecommendations(createDemoRecommendationProfile(), {
      retrievalAdapter: createUnavailableRetrievalAdapter()
    });

    for (const card of response.recommendations) {
      expect(card.matchReasons.every((item) => !item.includes("ISSN"))).toBe(true);
      expect(card.matchReasons.every((item) => !item.includes("@"))).toBe(true);
      expect(card.matchReasons.every((item) => !item.includes("论文"))).toBe(true);
    }
  });
  it("builds fit analysis for a specific jobId with required sections", async () => {
    const profile = createDemoRecommendationProfile();
    const recommendations = await getTopRecommendations(profile, {
      retrievalAdapter: createUnavailableRetrievalAdapter()
    });
    const targetJobId = recommendations.recommendations[0]?.jobId;

    expect(targetJobId).toBeTruthy();

    const analysis = await getFitAnalysisForJob(profile, targetJobId!, {
      retrievalAdapter: createUnavailableRetrievalAdapter()
    });

    expect(analysis).not.toBeNull();
    expect(analysis?.strengths.length).toBeGreaterThan(0);
    expect(analysis?.gaps.length).toBeGreaterThan(0);
    expect(analysis?.jdGapMap.length).toBeGreaterThan(0);
    expect(analysis?.scoreBreakdown.totalScore).toBeGreaterThan(0);
    expect(analysis?.interviewCta.length).toBeGreaterThan(0);
  });

  it("keeps ability evidence on resume and intent evidence on QA inside fit analysis", async () => {
    const profile = createDemoRecommendationProfile();
    const recommendations = await getTopRecommendations(profile, {
      retrievalAdapter: createUnavailableRetrievalAdapter()
    });
    const analysis = await getFitAnalysisForJob(profile, recommendations.recommendations[0]!.jobId, {
      retrievalAdapter: createUnavailableRetrievalAdapter()
    });

    expect(analysis).not.toBeNull();
    expect(analysis?.abilityMatch.every((item) => item.evidenceSource === "resume")).toBe(true);
    expect(analysis?.whyRecommended.some((item) => item.source === "resume")).toBe(true);
    expect(analysis?.whyRecommended.some((item) => item.source === "qa")).toBe(true);
  });
});
