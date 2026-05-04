import { describe, expect, it } from "vitest";
import type { ConsultationState } from "@xhs/ai";
import { buildConsultationDialogTurns, buildHomeViewModel } from "./home-view-model";

function createState(overrides?: Partial<ConsultationState>): ConsultationState {
  return {
    version: 1,
    source: "fallback",
    round: 2,
    maxRounds: 3,
    resumeName: "resume.pdf",
    resumeExcerpt: "负责 AI 产品项目推进与用户研究。",
    profileSummary: "候选人有 AI 产品与数据分析相关经历。",
    backgroundHighlights: ["负责一个 AI 助手项目", "做过用户访谈与分析"],
    strengths: ["有 AI 项目经历", "做过用户研究"],
    gaps: ["仍需补充目标城市", "仍需补充公司偏好"],
    evidencePoints: ["AI 助手项目", "用户访谈"],
    pendingFocuses: ["city_preference", "company_preference"],
    currentFocus: "city_preference",
    currentQuestion: "你更希望在哪个城市发展？",
    turns: [
      {
        round: 1,
        focus: "project_depth",
        question: "你做过什么最有代表性的项目？",
        answer: "我做过 AI 助手项目。",
        answerSummary: "候选人有 AI 助手项目经验。",
        learnedSignals: ["AI 助手项目"],
        confidenceNote: "已有可引用项目经历。"
      }
    ],
    finalSummary: null,
    done: false,
    ...overrides
  };
}

describe("buildHomeViewModel", () => {
  it("returns the waiting-to-start state when there is no consultation session", () => {
    const viewModel = buildHomeViewModel(null);

    expect(viewModel.stage).toBe("idle");
    expect(viewModel.primaryActionLabel).toBe("开始第 1 轮追问");
    expect(viewModel.progressLabel).toBe("第 0 / 3 轮");
  });

  it("returns in-progress state for an active three-round consultation", () => {
    const viewModel = buildHomeViewModel(createState());

    expect(viewModel.stage).toBe("consulting");
    expect(viewModel.recommendationCta).toBeNull();
    expect(viewModel.primaryActionLabel).toBe("提交第 2 轮回答");
    expect(viewModel.progressLabel).toBe("第 2 / 3 轮");
  });

  it("returns completed state with recommendation CTA when consultation is done", () => {
    const viewModel = buildHomeViewModel(
      createState({
        round: 3,
        done: true,
        finalSummary: "三轮澄清已完成，可进入岗位推荐。"
      })
    );

    expect(viewModel.stage).toBe("completed");
    expect(viewModel.recommendationCta).toEqual({
      href: "/jobs",
      label: "查看推荐职位 Recommended Jobs"
    });
    expect(viewModel.primaryActionLabel).toBe("查看推荐岗位");
    expect(viewModel.statusText).toContain("三轮");
  });
});

describe("buildConsultationDialogTurns", () => {
  it("keeps prior questions and answers as one-on-one chat turns", () => {
    const turns = buildConsultationDialogTurns([
      { id: "assistant-round-1", role: "assistant", content: "你更希望在哪个城市工作？" },
      { id: "user-round-1", role: "user", content: "上海或杭州都可以，优先上海。" },
      { id: "assistant-round-2", role: "assistant", content: "你更想投什么类型的岗位？" }
    ]);

    expect(turns).toEqual([
      {
        id: "assistant-round-1",
        kind: "exchange",
        label: "第 1 轮",
        question: "你更希望在哪个城市工作？",
        answer: "上海或杭州都可以，优先上海。"
      },
      {
        id: "assistant-round-2",
        kind: "exchange",
        label: "第 2 轮",
        question: "你更想投什么类型的岗位？",
        answer: null
      }
    ]);
  });

  it("keeps the consultation summary as its own assistant note", () => {
    const turns = buildConsultationDialogTurns([
      { id: "assistant-round-1", role: "assistant", content: "你想去哪个城市？" },
      { id: "user-round-1", role: "user", content: "深圳。" },
      { id: "consultation-summary", role: "assistant", content: "三轮咨询完成，可以进入推荐。" }
    ]);

    expect(turns[1]).toEqual({
      id: "consultation-summary",
      kind: "summary",
      label: "咨询总结",
      question: "三轮咨询完成，可以进入推荐。",
      answer: null
    });
  });
});
