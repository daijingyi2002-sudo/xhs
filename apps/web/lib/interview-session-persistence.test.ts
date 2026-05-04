import { describe, expect, it } from "vitest";
import type { InterviewSession } from "@xhs/ai";
import {
  clearPersistedInterviewSession,
  findLatestCompletedInterviewSession,
  getInterviewSessionStorageKey,
  loadPersistedInterviewSession,
  savePersistedInterviewSession
} from "./interview-session-persistence";

function createMemoryStorage() {
  const records = new Map<string, string>();

  return {
    get length() {
      return records.size;
    },
    key: (index: number) => Array.from(records.keys())[index] ?? null,
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
    phase: "manager",
    roleLabel: "Hiring Manager",
    currentTurn: {
      id: "turn-3",
      phase: "manager",
      question: "第三轮问题",
      coachingFocus: "补充证据链",
      dimension: "产品结构化思考"
    },
    progress: {
      current: 3,
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
      },
      {
        turnId: "turn-2",
        question: "第二轮问题",
        answer: "第二轮回答",
        feedback: "第二轮反馈",
        dimension: "AI / LLM 理解",
        coachingFocus: "补充模型边界"
      }
    ],
    summary: null,
    ...overrides
  };
}

describe("interview session persistence", () => {
  it("saves and restores the same job interview progress", () => {
    const storage = createMemoryStorage();
    const session = createSession();

    savePersistedInterviewSession(session, storage);

    const restored = loadPersistedInterviewSession(session.jobId, storage);

    expect(restored?.progress.current).toBe(3);
    expect(restored?.answers).toHaveLength(2);
    expect(restored?.currentTurn?.id).toBe("turn-3");
  });

  it("does not restore a session for a different job", () => {
    const storage = createMemoryStorage();

    savePersistedInterviewSession(createSession(), storage);

    expect(loadPersistedInterviewSession("lead-ant-copilot", storage)).toBeNull();
  });

  it("removes corrupted persisted data so the page can start a fresh interview", () => {
    const storage = createMemoryStorage();
    const key = getInterviewSessionStorageKey("lead-bytedance-strategy");
    storage.setItem(key, "{broken-json");

    expect(loadPersistedInterviewSession("lead-bytedance-strategy", storage)).toBeNull();
    expect(storage.getItem(key)).toBeNull();
  });

  it("clears a finished interview session so the next visit starts blank", () => {
    const storage = createMemoryStorage();
    const session = createSession();

    savePersistedInterviewSession(session, storage);
    clearPersistedInterviewSession(session.jobId, storage);

    expect(loadPersistedInterviewSession(session.jobId, storage)).toBeNull();
  });

  it("finds the latest completed interview session for resume optimization", () => {
    const storage = createMemoryStorage();

    savePersistedInterviewSession(createSession(), storage);
    savePersistedInterviewSession(
      createSession({
        jobId: "lead-ant-copilot",
        progress: {
          current: 10,
          total: 10
        },
        answers: Array.from({ length: 10 }, (_, index) => ({
          turnId: `turn-${index + 1}`,
          question: "question",
          answer: "answer",
          feedback: "feedback",
          dimension: "dimension",
          coachingFocus: "focus"
        })),
        summary: {
          overallTakeaway: "面试已完成",
          strengths: [],
          gaps: [],
          starReplay: {
            interviewerPersona: "Hiring Manager",
            personaDefinition: "AI 产品负责人",
            perfectReplay: "完整复盘",
            highlights: []
          },
          resumeOptimizationCta: {
            label: "去简历优化",
            href: "/resume-lab",
            reason: "沉淀面试证据"
          }
        }
      }),
      storage
    );

    expect(findLatestCompletedInterviewSession(storage)?.jobId).toBe("lead-ant-copilot");
  });
});
