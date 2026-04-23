import { describe, expect, it } from "vitest";
import type { ConsultationState } from "@xhs/ai";
import { buildHomeViewModel } from "./home-view-model";

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
    expect(viewModel.profileCards[0]?.value).toContain("等待上传简历");
  });

  it("returns in-progress state for an active three-round consultation", () => {
    const viewModel = buildHomeViewModel(createState());

    expect(viewModel.stage).toBe("consulting");
    expect(viewModel.primaryActionLabel).toBe("提交第 2 轮回答");
    expect(viewModel.progressLabel).toBe("第 2 / 3 轮");
    expect(viewModel.profileCards.some((card) => card.label === "当前焦点")).toBe(true);
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
    expect(viewModel.primaryActionLabel).toBe("查看推荐岗位");
    expect(viewModel.statusText).toContain("三轮");
    expect(viewModel.profileCards.some((card) => card.label === "咨询结论")).toBe(true);
  });
});
