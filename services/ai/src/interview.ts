import { interviewSummary, interviewTurns, resumeSuggestions } from "@xhs/domain";
import type { InterviewSummary, InterviewTurn, JobLead, ResumeSuggestion } from "@xhs/domain";

export type InterviewAnswerRecord = {
  turnId: string;
  question: string;
  answer: string;
  feedback: string;
  dimension: string;
  coachingFocus: string;
};

export type InterviewProgress = {
  current: number;
  total: number;
};

export type InterviewSession = {
  jobId: string;
  jobTitle: string;
  companyName: string;
  phase: "manager" | "hr" | "summary";
  roleLabel: string;
  currentTurn: InterviewTurn | null;
  progress: InterviewProgress;
  answers: InterviewAnswerRecord[];
  summary: InterviewSummary | null;
};

export type InterviewSubmitResult = {
  feedback: string;
  session: InterviewSession;
};

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

function getRoleLabel(phase: "manager" | "hr" | "summary") {
  if (phase === "manager") {
    return "招聘经理（产品副总裁） Hiring Manager (VP of Product)";
  }

  if (phase === "hr") {
    return "HR 面试官 HR Interviewer";
  }

  return "面试总结 Interview Summary";
}

function getTurnByIndex(index: number) {
  return interviewTurns[index] ?? null;
}

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
  const hasSignalWord = ["指标", "用户", "实验", "价值", "闭环", "场景"].some((keyword) =>
    answer.includes(keyword)
  );
  const lengthEnough = answer.trim().length >= 28;

  const praise = hasSignalWord
    ? "你抓到了这一轮最关键的判断变量。"
    : "你的回答方向是对的，但信号还不够集中。";

  const improve = lengthEnough
    ? "下一句可以再补一个结果指标或权衡逻辑，会更像真实面试答法。"
    : "这一轮稍微短了一点，建议补上“为什么”和“怎么证明”。";

  return `${praise} ${improve} 当前重点仍然是：${turn.coachingFocus}`;
}

export function getNextPhase(turnIndex: number): InterviewSession["phase"] {
  if (turnIndex >= interviewTurns.length) return "summary";
  return turnIndex >= 6 ? "hr" : "manager";
}

export function getInterviewSummary(): InterviewSummary {
  return interviewSummary;
}

export function getResumeSuggestions(): ResumeSuggestion[] {
  return resumeSuggestions;
}

export function createInterviewSession(lead: JobLead): InterviewSession {
  const currentTurn = getTurnByIndex(0);

  return {
    jobId: lead.id,
    jobTitle: lead.title,
    companyName: lead.companyId,
    phase: "manager",
    roleLabel: getRoleLabel("manager"),
    currentTurn,
    progress: {
      current: 1,
      total: interviewTurns.length
    },
    answers: [],
    summary: null
  };
}

export function submitInterviewAnswer(
  session: InterviewSession,
  answer: string
): InterviewSubmitResult {
  const currentTurn = session.currentTurn;

  if (!currentTurn) {
    throw new Error("Interview session has already finished.");
  }

  const normalizedAnswer = answer.trim();
  if (!normalizedAnswer) {
    throw new Error("Answer cannot be empty.");
  }

  const feedback = evaluateAnswer(normalizedAnswer, currentTurn);
  const nextAnswers: InterviewAnswerRecord[] = [
    ...session.answers,
    {
      turnId: currentTurn.id,
      question: currentTurn.question,
      answer: normalizedAnswer,
      feedback,
      dimension: currentTurn.dimension,
      coachingFocus: currentTurn.coachingFocus
    }
  ];

  const nextTurn = getTurnByIndex(nextAnswers.length);
  const nextPhase = getNextPhase(nextAnswers.length);

  return {
    feedback,
    session: {
      ...session,
      phase: nextPhase,
      roleLabel: getRoleLabel(nextPhase),
      currentTurn: nextTurn,
      progress: {
        current: Math.min(nextAnswers.length + 1, interviewTurns.length),
        total: interviewTurns.length
      },
      answers: nextAnswers,
      summary: nextTurn ? null : getInterviewSummary()
    }
  };
}
