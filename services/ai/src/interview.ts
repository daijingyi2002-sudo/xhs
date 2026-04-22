import { interviewSummary, interviewTurns, resumeSuggestions } from "@xhs/domain";
import type { InterviewSummary, InterviewTurn, ResumeSuggestion } from "@xhs/domain";

export type InterviewState = {
  currentTurn: number;
  phase: "manager" | "hr" | "summary";
  answers: Array<{ turnId: string; answer: string; feedback: string }>;
};

export const interviewGraphDefinition = {
  nodes: ["load_context", "manager_rounds", "hr_rounds", "summarize", "resume_optimize"],
  edges: [
    ["load_context", "manager_rounds"],
    ["manager_rounds", "hr_rounds"],
    ["hr_rounds", "summarize"],
    ["summarize", "resume_optimize"]
  ]
} as const;

export function createInterviewState(): InterviewState {
  return {
    currentTurn: 0,
    phase: "manager",
    answers: []
  };
}

export function getInterviewTurns(): InterviewTurn[] {
  return interviewTurns;
}

export function evaluateAnswer(answer: string, turn: InterviewTurn) {
  const hasSignalWord = ["指标", "用户", "实验", "价值", "闭环", "场景"].some((keyword) => answer.includes(keyword));
  const lengthEnough = answer.trim().length >= 28;

  const praise = hasSignalWord
    ? "你抓到了这一轮最关键的判断变量。"
    : "你的回答方向是对的，但信号还不够集中。";

  const improve = lengthEnough
    ? "下一句可以再补一个结果指标或权衡逻辑，会更像真实面试答法。"
    : "这轮稍微短了一点，建议补上“为什么”和“怎么证明”。";

  return `${praise} ${improve} 当前重点仍然是${turn.coachingFocus}`;
}

export function getNextPhase(turnIndex: number): InterviewState["phase"] {
  if (turnIndex >= 10) return "summary";
  return turnIndex >= 6 ? "hr" : "manager";
}

export function getInterviewSummary(): InterviewSummary {
  return interviewSummary;
}

export function getResumeSuggestions(): ResumeSuggestion[] {
  return resumeSuggestions;
}
