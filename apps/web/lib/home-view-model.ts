import type { ConsultationState } from "@xhs/ai";

export type HomeProfileCard = {
  label: string;
  value: string;
};

export type HomeViewModel = {
  stage: "idle" | "consulting" | "completed";
  primaryActionLabel: string;
  progressLabel: string;
  statusText: string;
  profileCards: HomeProfileCard[];
};

const focusLabels: Record<string, string> = {
  city_preference: "城市偏好",
  company_preference: "公司偏好",
  project_depth: "项目深挖",
  ai_understanding: "AI / LLM 理解",
  product_method: "产品方法",
  data_analysis: "数据分析",
  user_research: "用户研究",
  role_concern: "求职顾虑"
};

function joinPreview(items: string[], fallback: string) {
  const preview = items.filter(Boolean).slice(0, 2).join(" / ");
  return preview || fallback;
}

export function buildHomeViewModel(session: ConsultationState | null): HomeViewModel {
  if (!session) {
    return {
      stage: "idle",
      primaryActionLabel: "开始第 1 轮追问",
      progressLabel: "第 0 / 3 轮",
      statusText: "上传简历或输入背景后，系统会先启动第 1 轮咨询，再逐步补齐候选人画像。",
      profileCards: [
        { label: "候选人画像", value: "等待上传简历或输入职业目标" },
        { label: "重点补充", value: "城市偏好 / 公司偏好 / 代表项目" },
        { label: "咨询节奏", value: "3 轮澄清后进入岗位推荐" }
      ]
    };
  }

  if (session.done) {
    return {
      stage: "completed",
      primaryActionLabel: "查看推荐岗位",
      progressLabel: `第 ${session.maxRounds} / ${session.maxRounds} 轮`,
      statusText:
        session.finalSummary ?? "三轮咨询已完成，画像已锁定，可以继续进入岗位推荐与匹配分析。",
      profileCards: [
        { label: "咨询结论", value: session.profileSummary },
        { label: "已确认优势", value: joinPreview(session.strengths, "已完成三轮澄清") },
        { label: "待继续验证", value: joinPreview(session.gaps, "进入岗位分析后继续验证") }
      ]
    };
  }

  return {
    stage: "consulting",
    primaryActionLabel: `提交第 ${session.round} 轮回答`,
    progressLabel: `第 ${session.round} / ${session.maxRounds} 轮`,
    statusText: session.currentQuestion || "正在生成本轮问题，请稍候。",
    profileCards: [
      { label: "候选人摘要", value: session.profileSummary },
      { label: "当前焦点", value: focusLabels[session.currentFocus] ?? session.currentFocus },
      { label: "已确认信号", value: joinPreview(session.strengths, "正在整理当前材料") }
    ]
  };
}
