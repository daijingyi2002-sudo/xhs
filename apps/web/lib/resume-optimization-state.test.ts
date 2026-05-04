import { describe, expect, it } from "vitest";
import type { ResumeOptimizationResult } from "@xhs/ai";
import {
  applyResumeSuggestion,
  buildResumeDraft,
  createResumeSuggestionStates,
  removeResumeSuggestion
} from "./resume-optimization-state";

const result: ResumeOptimizationResult = {
  target_position: "AI产品经理",
  resume_match_score: {
    before_score: 68,
    after_score: 86,
    score_reason: "关键词和项目结构提升。",
    missing_keywords: ["AI能力设计"],
    added_keywords: ["AI能力设计"],
    strongest_sections: ["项目经历"],
    weakest_sections: ["技能能力"]
  },
  section_suggestions: [
    {
      section: "项目经历",
      original_text: "项目经历：做过求职Agent项目。",
      problem: "缺少项目背景。",
      suggestion: "补充项目背景。",
      revised_text: "项目经历：面向校招用户设计求职Agent，串联简历解析、岗位推荐和模拟面试。",
      reason: "匹配AI产品经理。",
      related_job_requirement: "AI能力设计",
      confidence: 0.82,
      risk_warning: "不编造数据。",
      applied: true
    },
    {
      section: "技能能力",
      original_text: "技能能力：SQL。",
      problem: "技能不完整。",
      suggestion: "补充岗位关键词。",
      revised_text: "技能能力：SQL、AI能力设计、用户需求分析。",
      reason: "匹配JD关键词。",
      related_job_requirement: "用户需求分析",
      confidence: 0.8,
      risk_warning: "只保留真实技能。",
      applied: true
    }
  ],
  interview_based_improvements: [],
  keyword_optimization: {
    missing_keywords: ["AI能力设计"],
    added_keywords: ["AI能力设计"],
    keyword_coverage_before: "50%",
    keyword_coverage_after: "90%"
  },
  final_resume: {
    basic_info: "张三",
    job_intention: "求职意向：AI产品经理",
    education: "某大学",
    experience: "未提供实习经历。",
    projects: "项目经历：面向校招用户设计求职Agent，串联简历解析、岗位推荐和模拟面试。",
    skills: "技能能力：SQL、AI能力设计、用户需求分析。",
    awards: "未提供奖项。",
    self_evaluation: "具备产品拆解能力。"
  }
};

describe("resume optimization interaction state", () => {
  it("starts every section suggestion as pending and highlighted", () => {
    const states = createResumeSuggestionStates(result);

    expect(states).toHaveLength(2);
    expect(states.every((item) => item.status === "pending")).toBe(true);
  });

  it("marks an applied suggestion as accepted without changing the revised resume text", () => {
    const states = applyResumeSuggestion(createResumeSuggestionStates(result), "项目经历");
    const draft = buildResumeDraft(result, states);

    expect(states.find((item) => item.section === "项目经历")?.status).toBe("accepted");
    expect(draft.projects).toContain("面向校招用户设计求职Agent");
  });

  it("removes a rejected suggestion from the resume draft and restores original section text", () => {
    const states = removeResumeSuggestion(createResumeSuggestionStates(result), "技能能力");
    const draft = buildResumeDraft(result, states);

    expect(states.some((item) => item.section === "技能能力")).toBe(false);
    expect(draft.skills).toBe("技能能力：SQL。");
    expect(draft.skills).not.toContain("AI能力设计");
  });
});
