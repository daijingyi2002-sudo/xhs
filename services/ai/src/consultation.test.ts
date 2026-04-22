import { describe, expect, it } from "vitest";
import { advanceConsultation, materializeQuestion, startConsultation } from "./consultation";

describe("consultation", () => {
  it("keeps the three-round consultation loop dynamic without preset question ids", async () => {
    process.env.OPENAI_API_KEY = "";

    const initial = await startConsultation({
      resumeName: "candidate.txt",
      resumeText:
        "我做过一个基于 RAG 的求职 Agent，负责定义需求、拆解流程、设计指标，并做过用户访谈和 SQL 分析。",
      userNote: "我更想去上海，希望后续问题围绕我做过的项目展开。"
    });

    const firstQuestionState = await materializeQuestion(initial);
    expect(firstQuestionState.state.currentQuestion.length).toBeGreaterThan(20);
    expect(firstQuestionState.state.round).toBe(1);
    expect(firstQuestionState.state.done).toBe(false);

    const secondStateBase = await advanceConsultation({
      state: firstQuestionState.state,
      answer:
        "这个项目最初要解决的是应届生在不同平台搜集面经效率低的问题，我先梳理了求职漏斗，再结合 SQL 看点击到投递的转化。"
    });
    const secondQuestionState = await materializeQuestion(secondStateBase);

    expect(secondQuestionState.state.round).toBe(2);
    expect(secondQuestionState.state.currentQuestion.length).toBeGreaterThan(20);
    expect(secondQuestionState.state.currentQuestion).not.toEqual(firstQuestionState.state.currentQuestion);

    const thirdStateBase = await advanceConsultation({
      state: secondQuestionState.state,
      answer:
        "为了判断方案是否成立，我看了不同岗位的转化率差异，也做了几次用户访谈，最后把追问逻辑放到 Agent 对话里。"
    });
    const thirdQuestionState = await materializeQuestion(thirdStateBase);

    expect(thirdQuestionState.state.round).toBe(3);
    expect(thirdQuestionState.state.currentQuestion.length).toBeGreaterThan(20);
    expect(thirdQuestionState.state.currentQuestion).not.toEqual(secondQuestionState.state.currentQuestion);

    const completed = await advanceConsultation({
      state: thirdQuestionState.state,
      answer:
        "我现在最担心的是商业表达还不够强，所以也在补充这个产品为什么能提高求职准备效率，以及哪些指标可以证明它有效。"
    });

    expect(completed.done).toBe(true);
    expect(completed.finalSummary).toBeTruthy();
    expect(completed.turns).toHaveLength(3);
  });

  it("does not inject AI product manager framing when the uploaded material does not contain it", async () => {
    process.env.OPENAI_API_KEY = "";

    const state = await startConsultation({
      resumeName: "teacher.txt",
      resumeText:
        "曾在中学担任历史老师，负责课堂教学、备课、班级管理与家校沟通。组织校内读书活动，撰写教学总结。",
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
      resumeText:
        "在电商团队做数据分析实习，主要负责留存、转化和漏斗分析，使用 SQL 和 Excel 输出周报，并支持 A/B 实验复盘。"
    });

    const teachingState = await startConsultation({
      resumeName: "teaching.txt",
      resumeText:
        "有三年线下教学经验，负责课程设计、课堂执行、学生反馈整理和家长沟通，也参与校内活动组织。"
    });

    expect(analyticsState.profileSummary).not.toEqual(teachingState.profileSummary);
    expect(analyticsState.strengths.join(" | ")).not.toEqual(teachingState.strengths.join(" | "));
  });
});
