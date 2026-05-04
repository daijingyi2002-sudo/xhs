import { describe, expect, it } from "vitest";
import {
  analyzeResumeSectionEvidence,
  generateResumeOptimization,
  generateResumeOptimizationWithQwen,
  type ResumeOptimizationResult
} from "./resume-optimization";

const baseInput = {
  original_resume: `
张三
求职意向：AI产品经理
教育背景：某大学 信息管理 本科
项目经历：做过求职Agent项目，负责简历解析和岗位推荐。
技能能力：SQL、Figma、Prompt。
自我评价：学习能力强，沟通能力好。
`,
  target_position: "AI产品经理",
  recommended_jobs: [
    {
      company: "小红书",
      role_title: "AI产品经理",
      match_score: 82,
      requirements: ["AI能力设计", "用户需求分析", "数据指标", "项目复盘"]
    }
  ],
  interview_transcript: [
    {
      question: "你怎么定义这个项目的目标？",
      answer: "帮助用户更快找到岗位，但我没有讲具体指标。",
      feedback: "项目目标表达不够清晰，需要补充用户痛点和验证指标。"
    }
  ],
  interview_summary: "面试暴露出项目目标表达不清、用户需求分析不足、指标意识弱。",
  improvement_suggestions: ["补充项目背景和用户痛点", "补充AI能力边界", "补充验证指标"],
  job_jd_keywords: ["AI能力设计", "用户需求分析", "数据指标", "项目复盘"],
  user_supplement: ""
};

describe("resume optimization", () => {
  it("outputs structured section suggestions with original text, revised text, reasons, and risk warnings", () => {
    const result = generateResumeOptimization(baseInput);

    expect(result.target_position).toBe("AI产品经理");
    expect(result.section_suggestions.length).toBeGreaterThanOrEqual(4);
    expect(result.section_suggestions[0]).toEqual(
      expect.objectContaining({
        section: expect.any(String),
        original_text: expect.any(String),
        problem: expect.any(String),
        suggestion: expect.any(String),
        revised_text: expect.any(String),
        reason: expect.any(String),
        related_job_requirement: expect.any(String),
        confidence: expect.any(Number),
        risk_warning: expect.any(String)
      })
    );
    expect(result.section_suggestions.some((item) => item.section === "项目经历")).toBe(true);
  });

  it("uses interview issues to create reverse resume improvement strategies", () => {
    const result = generateResumeOptimization(baseInput);

    expect(result.interview_based_improvements).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          interview_issue: "项目目标表达不清",
          resume_revision_strategy: expect.stringContaining("项目背景")
        }),
        expect.objectContaining({
          interview_issue: "指标意识弱",
          resume_revision_strategy: expect.stringContaining("数据指标")
        })
      ])
    );
  });

  it("scores before and after match while reporting missing and added keywords", () => {
    const result = generateResumeOptimization(baseInput);

    expect(result.resume_match_score.before_score).toBeLessThan(result.resume_match_score.after_score);
    expect(result.resume_match_score.missing_keywords).toContain("AI能力设计");
    expect(result.keyword_optimization.added_keywords).toEqual(
      expect.arrayContaining(["AI能力设计", "用户需求分析", "数据指标"])
    );
  });

  it("generates a complete final resume without fabricating quantified outcomes", () => {
    const result = generateResumeOptimization(baseInput);
    const serializedResume = Object.values(result.final_resume).join("\n");

    expect(result.final_resume.basic_info).toContain("张三");
    expect(result.final_resume.job_intention).toContain("AI产品经理");
    expect(result.final_resume.projects).toContain("求职Agent");
    expect(result.final_resume.projects).toContain("建议补充具体数据");
    expect(serializedResume).not.toMatch(/\d+%|\d+倍|提升\d|增长\d/);
  });

  it("detects internship content by evidence rather than headings", () => {
    const evidence = analyzeResumeSectionEvidence(`
李同学
2024.06-2024.09 小红书 AI产品运营实习生
参与社区搜索推荐策略需求整理，跟进用户反馈、竞品分析和埋点验收。
校内求职Agent项目：负责简历解析、岗位推荐和模拟面试流程设计。
`);

    expect(evidence["实习经历"].present).toBe(true);
    expect(evidence["实习经历"].original_text).toContain("小红书");
    expect(evidence["实习经历"].detection_reasons.join(" ")).toContain("实习");
  });

  it("guards Qwen output from claiming an evidenced internship section is missing", async () => {
    const input = {
      ...baseInput,
      original_resume: `
李同学
目标岗位：AI产品经理
2024.06-2024.09 小红书 AI产品运营实习生
参与社区搜索推荐策略需求整理，跟进用户反馈、竞品分析和埋点验收。
`
    };

    const qwenResult: ResumeOptimizationResult = {
      ...generateResumeOptimization(input),
      section_suggestions: [
        {
          section: "实习经历",
          original_text: "未提供",
          problem: "没有实习经历，建议增加一段相关实习。",
          suggestion: "补充实习经历。",
          revised_text: "建议增加AI产品相关实习经历。",
          reason: "目标岗位需要实习经历。",
          related_job_requirement: "AI产品实习经验",
          confidence: 0.4,
          risk_warning: "存在虚构风险。",
          applied: true
        }
      ]
    };

    const result = await generateResumeOptimizationWithQwen(input, {
      generate: async () => qwenResult
    });

    const internshipSuggestion = result.section_suggestions.find((item) => item.section === "实习经历");

    expect(internshipSuggestion?.original_text).toContain("小红书");
    expect(internshipSuggestion?.problem).not.toMatch(/没有实习经历|未提供实习经历|缺少实习经历/);
    expect(result.final_resume.experience).toContain("小红书");
  });
});
