import { describe, expect, it } from "vitest";
import type { InterviewSession } from "@xhs/ai";
import { loadPersistedInterviewSession, savePersistedInterviewSession } from "./interview-session-persistence";
import { completeInterviewForResumeOptimization, completeInterviewToPlaza } from "./interview-completion";
import { getHistoryRecords } from "./history-records";

function createMemoryStorage() {
  const records = new Map<string, string>();

  return {
    getItem: (key: string) => records.get(key) ?? null,
    setItem: (key: string, value: string) => {
      records.set(key, value);
    },
    removeItem: (key: string) => {
      records.delete(key);
    }
  };
}

function createSession(): InterviewSession {
  return {
    jobId: "lead-bytedance-strategy",
    jobLead: {
      id: "lead-bytedance-strategy",
      companyId: "bytedance",
      roleName: "AI 产品经理",
      title: "AI 产品经理, 内容智能策略",
      city: "北京",
      seniority: "校招 / 应届",
      sourceConfidence: 94,
      summary: "聚焦内容智能策略。",
      extractedRequirements: ["AI/LLM 应用理解"],
      recommendationReasons: ["匹配 AI 产品项目", "匹配用户研究", "匹配北京"],
      riskReminder: "需要补齐指标闭环。",
      salaryBand: "20k-28k"
    },
    jobTitle: "AI 产品经理, 内容智能策略",
    companyName: "bytedance",
    phase: "summary",
    roleLabel: "面试总结",
    currentTurn: null,
    progress: {
      current: 10,
      total: 10
    },
    answers: [
      {
        turnId: "turn-1",
        question: "第一轮问题",
        answer: "第一轮回答",
        feedback: "第一轮反馈",
        dimension: "产品结构化思考",
        coachingFocus: "补充证据链"
      }
    ],
    summary: {
      overallTakeaway: "候选人优势清晰，但业务证据还需要加强。",
      strengths: [
        {
          title: "产品闭环意识清楚",
          evidence: "能围绕用户和指标回答。",
          amplification: "放到简历项目第一句。"
        }
      ],
      gaps: [
        {
          title: "业务证据密度不足",
          evidence: "缺少基线和结果变化。",
          improvement: "补两个项目案例。",
          detail: {
            whyItMatters: "面试官会追问如何证明有效。",
            practiceSteps: ["补指标", "补结果"],
            exampleUpgrade: "讲清哪个人群和哪个指标。"
          }
        }
      ],
      starReplay: {
        interviewerPersona: "Hiring Manager",
        personaDefinition: "关注可验证产品结果。",
        perfectReplay: "明星候选人会讲清用户、模型边界、指标和风险。",
        highlights: ["用户", "边界", "指标"]
      },
      resumeOptimizationCta: {
        label: "去简历优化",
        href: "/resume-lab",
        reason: "沉淀面试反馈。"
      }
    }
  };
}

describe("interview completion actions", () => {
  it("saves interview and resume histories, then clears current progress for resume optimization", () => {
    const storage = createMemoryStorage();
    const session = createSession();
    savePersistedInterviewSession(session, storage);

    completeInterviewForResumeOptimization(session, storage, "2026-04-29T10:00:00.000Z");

    const history = getHistoryRecords(storage);
    expect(history.interviews).toHaveLength(1);
    expect(history.interviews[0]?.destination).toBe("resume-lab");
    expect(history.resumeOptimizations).toHaveLength(1);
    expect(loadPersistedInterviewSession(session.jobId, storage)).toBeNull();
  });

  it("saves only interview history, then clears current progress for plaza exit", () => {
    const storage = createMemoryStorage();
    const session = createSession();
    savePersistedInterviewSession(session, storage);

    completeInterviewToPlaza(session, storage, "2026-04-29T10:00:00.000Z");

    const history = getHistoryRecords(storage);
    expect(history.interviews).toHaveLength(1);
    expect(history.interviews[0]?.destination).toBe("plaza");
    expect(history.resumeOptimizations).toHaveLength(0);
    expect(loadPersistedInterviewSession(session.jobId, storage)).toBeNull();
  });
});
