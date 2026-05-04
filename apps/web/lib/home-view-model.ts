import type { ConsultationState } from "@xhs/ai";

export type HomeRecommendationCta = {
  href: string;
  label: string;
};

export type HomeDialogMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
};

export type HomeDialogTurn = {
  id: string;
  kind: "exchange" | "summary";
  label: string;
  question: string;
  answer: string | null;
};

export type HomeViewModel = {
  stage: "idle" | "consulting" | "completed";
  primaryActionLabel: string;
  progressLabel: string;
  statusText: string;
  recommendationCta: HomeRecommendationCta | null;
};

export function buildConsultationDialogTurns(messages: HomeDialogMessage[]): HomeDialogTurn[] {
  const turns: HomeDialogTurn[] = [];
  let pendingExchange: HomeDialogTurn | null = null;
  let exchangeCount = 0;

  for (const message of messages) {
    const content = message.content.trim();
    if (!content) continue;

    if (message.role === "assistant") {
      if (pendingExchange) {
        turns.push(pendingExchange);
        pendingExchange = null;
      }

      if (message.id === "consultation-summary") {
        turns.push({
          id: message.id,
          kind: "summary",
          label: "咨询总结",
          question: content,
          answer: null
        });
        continue;
      }

      exchangeCount += 1;
      pendingExchange = {
        id: message.id,
        kind: "exchange",
        label: `第 ${exchangeCount} 轮`,
        question: content,
        answer: null
      };
      continue;
    }

    if (pendingExchange) {
      turns.push({ ...pendingExchange, answer: content });
      pendingExchange = null;
      continue;
    }

    exchangeCount += 1;
    turns.push({
      id: message.id,
      kind: "exchange",
      label: `第 ${exchangeCount} 轮`,
      question: "",
      answer: content
    });
  }

  if (pendingExchange) {
    turns.push(pendingExchange);
  }

  return turns;
}

export function buildHomeViewModel(session: ConsultationState | null): HomeViewModel {
  if (!session) {
    return {
      stage: "idle",
      primaryActionLabel: "开始第 1 轮追问",
      progressLabel: "第 0 / 3 轮",
      statusText: "上传简历或输入背景后，系统会先启动第 1 轮咨询，再逐步补齐候选人画像。",
      recommendationCta: null
    };
  }

  if (session.done) {
    return {
      stage: "completed",
      primaryActionLabel: "查看推荐岗位",
      progressLabel: `第 ${session.maxRounds} / ${session.maxRounds} 轮`,
      statusText:
        session.finalSummary ?? "三轮咨询已完成，画像已锁定，可以继续进入岗位推荐与匹配分析。",
      recommendationCta: {
        href: "/jobs",
        label: "查看推荐职位 Recommended Jobs"
      }
    };
  }

  return {
    stage: "consulting",
    primaryActionLabel: `提交第 ${session.round} 轮回答`,
    progressLabel: `第 ${session.round} / ${session.maxRounds} 轮`,
    statusText: session.currentQuestion || "正在生成本轮问题，请稍候。",
    recommendationCta: null
  };
}
