import { describe, expect, it } from "vitest";
import { getJobLead } from "./recommend";
import { createInterviewSession, submitInterviewAnswer } from "./interview";

describe("interview session flow", () => {
  it("starts a mock interview with the first question and manager role", () => {
    const lead = getJobLead("lead-bytedance-strategy");

    if (!lead) {
      throw new Error("expected seeded job lead");
    }

    const session = createInterviewSession(lead);

    expect(session.jobId).toBe(lead.id);
    expect(session.currentTurn.id).toBe("turn-1");
    expect(session.phase).toBe("manager");
    expect(session.roleLabel).toContain("Hiring Manager");
    expect(session.progress.current).toBe(1);
    expect(session.answers).toHaveLength(0);
  });

  it("records the answer, returns feedback, and advances to the next question", () => {
    const lead = getJobLead("lead-bytedance-strategy");

    if (!lead) {
      throw new Error("expected seeded job lead");
    }

    const session = createInterviewSession(lead);
    const result = submitInterviewAnswer(session, "我会先看推荐点击率、转化率和留存变化，并结合实验分层判断。");

    expect(result.feedback).toContain("当前重点");
    expect(result.session.answers).toHaveLength(1);
    expect(result.session.currentTurn.id).toBe("turn-2");
    expect(result.session.progress.current).toBe(2);
    expect(result.session.summary).toBeNull();
  });

  it("returns a final summary after the last interview turn", () => {
    const lead = getJobLead("lead-bytedance-strategy");

    if (!lead) {
      throw new Error("expected seeded job lead");
    }

    let session = createInterviewSession(lead);
    let lastFeedback = "";

    for (let index = 0; index < 10; index += 1) {
      const result = submitInterviewAnswer(
        session,
        `第 ${index + 1} 轮回答：我会补充场景、指标、用户价值和结果闭环。`
      );
      session = result.session;
      lastFeedback = result.feedback;
    }

    expect(lastFeedback).toContain("当前重点");
    expect(session.phase).toBe("summary");
    expect(session.currentTurn).toBeNull();
    expect(session.summary?.overallTakeaway).toBeTruthy();
    expect(session.answers).toHaveLength(10);
  });
});
