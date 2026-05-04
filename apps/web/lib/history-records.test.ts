import { describe, expect, it } from "vitest";
import type { InterviewSession } from "@xhs/ai";
import {
  addInterviewHistoryRecord,
  addResumeOptimizationHistoryRecord,
  buildHistoryOverview,
  getHistoryRecords
} from "./history-records";

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

function createSession(overrides?: Partial<InterviewSession>): InterviewSession {
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
    },
    ...overrides
  };
}

describe("history records", () => {
  it("stores one interview history record per interview session", () => {
    const storage = createMemoryStorage();
    const session = createSession();

    addInterviewHistoryRecord(session, storage, "2026-04-29T10:00:00.000Z", "resume-lab");
    addInterviewHistoryRecord(session, storage, "2026-04-29T10:01:00.000Z", "plaza");

    const history = getHistoryRecords(storage);

    expect(history.interviews).toHaveLength(1);
    expect(history.interviews[0]).toMatchObject({
      jobId: "lead-bytedance-strategy",
      jobTitle: "AI 产品经理, 内容智能策略",
      roundLabel: "1 / 10 轮",
      destination: "plaza"
    });
    expect(history.interviews[0]?.takeaway).toContain("业务证据");
    expect(history.interviews[0]?.updatedAt).toBe("2026-04-29T10:01:00.000Z");
  });

  it("stores resume optimization history separately from interview history", () => {
    const storage = createMemoryStorage();
    const session = createSession();

    addInterviewHistoryRecord(session, storage, "2026-04-29T10:00:00.000Z", "resume-lab");
    addResumeOptimizationHistoryRecord(session, storage, "2026-04-29T10:02:00.000Z");

    const history = getHistoryRecords(storage);

    expect(history.interviews).toHaveLength(1);
    expect(history.resumeOptimizations).toHaveLength(1);
    expect(history.resumeOptimizations[0]).toMatchObject({
      sourceInterviewId: history.interviews[0]?.id,
      jobTitle: "AI 产品经理, 内容智能策略",
      status: "由模拟面试生成"
    });
  });

  it("returns empty sections and clears corrupted history data", () => {
    const storage = createMemoryStorage();
    storage.setItem("xhs:history-records", "{broken-json");

    const history = getHistoryRecords(storage);

    expect(history.interviews).toEqual([]);
    expect(history.resumeOptimizations).toEqual([]);
    expect(storage.getItem("xhs:history-records")).toBeNull();
  });

  it("builds an overview for the history dashboard", () => {
    const history = {
      interviews: [
        {
          id: "interview:old",
          jobId: "old",
          jobTitle: "AI 产品经理",
          companyName: "小红书",
          roundLabel: "10 / 10 轮",
          takeaway: "表达结构清晰。",
          destination: "resume-lab" as const,
          createdAt: "2026-04-28T08:00:00.000Z",
          updatedAt: "2026-04-28T08:30:00.000Z"
        }
      ],
      resumeOptimizations: [
        {
          id: "resume:latest",
          sourceInterviewId: "interview:old",
          jobId: "old",
          jobTitle: "AI 产品经理",
          status: "由模拟面试生成",
          createdAt: "2026-04-29T09:00:00.000Z",
          updatedAt: "2026-04-29T09:10:00.000Z"
        }
      ]
    };

    expect(buildHistoryOverview(history)).toEqual({
      interviewCount: 1,
      resumeOptimizationCount: 1,
      totalCount: 2,
      latestUpdatedAt: "2026-04-29T09:10:00.000Z",
      nextAction: "继续打磨 AI 产品经理 的简历表达"
    });
  });
});
