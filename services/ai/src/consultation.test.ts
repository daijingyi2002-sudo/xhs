import { describe, expect, it } from "vitest";
import { advanceConsultation, materializeQuestion, startConsultation } from "./consultation";

describe("consultation", () => {
  it("keeps the three-round consultation loop dynamic without preset question ids", async () => {
    process.env.OPENAI_API_KEY = "";

    const initial = await startConsultation({
      resumeName: "candidate.txt",
      resumeText: "我做过一个基于 RAG 的求职 Agent，也做过用户访谈和 SQL 分析。",
      userNote: "我更想去上海，希望后续问题围绕方向和选择展开。"
    });

    const firstQuestionState = await materializeQuestion(initial);
    expect(firstQuestionState.state.currentQuestion.length).toBeGreaterThan(12);
    expect(firstQuestionState.state.currentQuestion.includes("提示：")).toBe(true);
    expect(firstQuestionState.state.round).toBe(1);
    expect(firstQuestionState.state.done).toBe(false);

    const secondStateBase = await advanceConsultation({
      state: firstQuestionState.state,
      answer: "如果看城市的话我更偏上海，如果看方向的话我希望继续做 AI 应用相关产品。"
    });
    const secondQuestionState = await materializeQuestion(secondStateBase);

    expect(secondQuestionState.state.round).toBe(2);
    expect(secondQuestionState.state.currentQuestion.length).toBeGreaterThan(12);
    expect(secondQuestionState.state.currentQuestion).not.toEqual(firstQuestionState.state.currentQuestion);

    const thirdStateBase = await advanceConsultation({
      state: secondQuestionState.state,
      answer: "我更想继续做和用户真实问题接近的产品，而不是太偏底层技术的方向。"
    });
    const thirdQuestionState = await materializeQuestion(thirdStateBase);

    expect(thirdQuestionState.state.round).toBe(3);
    expect(thirdQuestionState.state.currentQuestion.length).toBeGreaterThan(12);
    expect(thirdQuestionState.state.currentQuestion).not.toEqual(secondQuestionState.state.currentQuestion);

    const completed = await advanceConsultation({
      state: thirdQuestionState.state,
      answer: "我现在最担心的是方向讲不清楚，所以想先把偏好和限制梳理清楚。"
    });

    expect(completed.done).toBe(true);
    expect(completed.finalSummary).toBeTruthy();
    expect(completed.turns).toHaveLength(3);
  });

  it("does not inject AI product manager framing when the uploaded material does not contain it", async () => {
    process.env.OPENAI_API_KEY = "";

    const state = await startConsultation({
      resumeName: "teacher.txt",
      resumeText: "曾在中学担任历史老师，负责课堂教学、备课、班级管理与家校沟通。组织校内读书活动，撰写教学总结。",
      userNote: "111"
    });

    expect(state.profileSummary).not.toContain("AI product manager");
    expect(state.profileSummary).not.toContain("AI 产品经理");
    expect(state.strengths.join(" ")).not.toContain("data analysis ability");
    expect(state.strengths.join(" ")).not.toContain("AI / LLM");
    expect(state.gaps.join(" ")).not.toContain("role fit");
  });

  it("produces materially different summaries for clearly different uploads", async () => {
    process.env.OPENAI_API_KEY = "";

    const analyticsState = await startConsultation({
      resumeName: "analytics.txt",
      resumeText: "在电商团队做数据分析实习，主要负责留存、转化和漏斗分析，使用 SQL 和 Excel 输出周报。"
    });

    const teachingState = await startConsultation({
      resumeName: "teaching.txt",
      resumeText: "有三年线下教学经验，负责课程设计、课堂执行、学生反馈整理和家长沟通。"
    });

    expect(analyticsState.profileSummary).not.toEqual(teachingState.profileSummary);
    expect(analyticsState.strengths.join(" | ")).not.toEqual(teachingState.strengths.join(" | "));
  });

  it("keeps consultation questions away from interview-style deep technical probing", async () => {
    process.env.OPENAI_API_KEY = "";

    const initial = await startConsultation({
      resumeName: "candidate.txt",
      resumeText: "我做过一个 AI 应用项目，也有一些 SQL 和用户访谈经历。"
    });

    const questionState = await materializeQuestion(initial);

    expect(questionState.state.currentQuestion).not.toContain("系统设计");
    expect(questionState.state.currentQuestion).not.toContain("算法");
    expect(questionState.state.currentQuestion).not.toContain("模型原理");
    expect(questionState.state.currentQuestion).not.toContain("指标口径");
  });
});
