import OpenAI from "openai";
import { z } from "zod";
import {
  defaultCandidateProfile,
  interviewSummary,
  interviewSummarySchema,
  interviewTurnSchema,
  interviewTurns,
  resumeSuggestions
} from "@xhs/domain";
import type { CandidateProfile, InterviewSummary, InterviewTurn, JobLead, ResumeSuggestion } from "@xhs/domain";

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
  jobLead: JobLead;
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

export type InterviewGenerationInput = {
  jobLead: JobLead;
  profile: CandidateProfile;
  currentTurn: InterviewTurn;
  answer: string | null;
  state: InterviewState;
  recentHistory: InterviewAnswerRecord[];
  compressedHistory: string;
};

export type InterviewGenerationOutput = {
  feedback: string;
  nextQuestion: InterviewTurn | null;
  signals: string[];
  risks: string[];
  summary?: InterviewSummary | string | null;
};

export type InterviewGenerator = (input: InterviewGenerationInput) => Promise<InterviewGenerationOutput>;

type InterviewEngineOptions = {
  generator?: InterviewGenerator;
  profile?: CandidateProfile;
};

const TOTAL_TURNS = 10;
const MANAGER_TURNS = 6;

const REALTIME_FEEDBACK_REVIEWER_PROMPT = `
你是“岗位专业面试官 + HR 面试官”联合反馈官，负责对候选人每一轮模拟面试回答给出实时反馈。

反馈必须基于：当前岗位 JD、当前轮问题、候选人当前回答、历史问答、当前阶段、候选人画像与简历信息。
只基于候选人已经说出的内容判断，不要脑补经历、数据、学校、公司、项目结果。
不要因为回答流畅就给好评，要看证据密度、业务理解、岗位相关性和表达可信度。

feedback 字段必须输出 4 个短段落，段落标签固定为：
问题诊断：
面试官意图：
具体改法：
下轮可这样说：

要求：
- “问题诊断”说明本轮回答缺了什么证据、行为细节、判断链路或表达结构。
- “面试官意图”解释这道题真实想验证什么能力，尤其是岗位专业面试官和 HR 各自在看什么。
- “具体改法”给出 2-3 个可执行补强动作，必须点名应补哪类用户行为、业务指标、决策依据、取舍逻辑或结果证据。
- “下轮可这样说”给出一句候选人可直接模仿的回答骨架。
- 不要只说“缺少细节”“准备不足”；必须告诉候选人下一轮具体怎么改。
`.trim();

const FINAL_SUMMARY_REVIEWER_PROMPT = `
你是“目标岗位面试官 + 求职成功教练”组成的终面复盘小组，负责在 10 轮模拟面试结束后帮助候选人接近真实面试成功。
所有结论必须来自候选人的实际回答证据；不要编造候选人没有提到的经历、数据或项目结果。
不要输出五维度打分，不要输出 scoreByDimension，不要用分数替代行动建议。
summary 必须是对象，包含 overallTakeaway、strengths、gaps、starReplay、resumeOptimizationCta。
`.trim();

const generationOutputSchema = z.object({
  feedback: z.string().min(12),
  nextQuestion: interviewTurnSchema.nullable(),
  signals: z.array(z.string()).default([]),
  risks: z.array(z.string()).default([]),
  summary: z.unknown().nullable().optional()
});

export const interviewGraphDefinition = {
  nodes: ["load_context", "generate_turn", "evaluate_answer", "update_state", "summarize", "resume_optimize"],
  edges: [
    ["load_context", "generate_turn"],
    ["generate_turn", "evaluate_answer"],
    ["evaluate_answer", "update_state"],
    ["update_state", "generate_turn"],
    ["update_state", "summarize"],
    ["summarize", "resume_optimize"]
  ]
} as const;

function getRoleLabel(phase: InterviewSession["phase"]) {
  if (phase === "manager") {
    return "招聘经理（产品副总裁） Hiring Manager (VP of Product)";
  }

  if (phase === "hr") {
    return "HR 面试官 HR Interviewer";
  }

  return "面试总结 Interview Summary";
}

function getOpeningContextTurn(): InterviewTurn {
  return {
    id: "opening-context",
    phase: "manager",
    question: "根据候选人背景和岗位线索生成第一轮真实面试问题。",
    coachingFocus: "从项目价值、用户痛点和岗位匹配切入。",
    dimension: "产品结构化思考"
  };
}

function resolveGenerator(options?: InterviewEngineOptions): InterviewGenerator {
  if (options?.generator) {
    return options.generator;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const model = resolveInterviewModel({
    interviewModel: process.env.OPENAI_INTERVIEW_MODEL,
    sharedModel: process.env.OPENAI_MODEL
  });

  if (!apiKey) {
    throw new Error("Interview generation provider is not configured.");
  }

  return createOpenAIInterviewGenerator({ apiKey, model, baseURL: process.env.OPENAI_BASE_URL });
}

export function resolveInterviewModel(input: { interviewModel?: string; sharedModel?: string }) {
  const configuredModel = [input.interviewModel, input.sharedModel]
    .map((value) => value?.trim())
    .find((value): value is string => Boolean(value));
  return (configuredModel || "qwen-turbo-latest").split(/\s+/)[0];
}

function createFallbackSummary(overallTakeaway: string): InterviewSummary {
  return {
    overallTakeaway,
    strengths: [
      {
        title: "已有可复盘的面试材料",
        evidence: "系统收到了完整面试回答，但模型未返回结构化优势列表。",
        amplification: "先回看回答中最有证据的项目表达，把它沉淀为简历 bullet 和下次面试开场。"
      }
    ],
    gaps: [
      {
        title: "总结结构不完整",
        evidence: "模型没有按要求返回不足项、提升动作和详情指引。",
        improvement: "从每轮反馈中提取最高频短板，为每个短板写一个可训练动作。",
        detail: {
          whyItMatters: "缺少可执行指引时，候选人很难把反馈转成下一次面试动作。",
          practiceSteps: ["标记每轮反馈中的重复短板", "为每个短板写一个可训练动作", "同步到简历优化"],
          exampleUpgrade: "从“表达还可以”升级为“补充业务基线、指标结果和模型边界”。"
        }
      }
    ],
    starReplay: {
      interviewerPersona: "AI 产品负责人 / Hiring Manager",
      personaDefinition: "关注候选人能否把 AI 能力转成可验证、可落地、可复盘的产品结果。",
      perfectReplay:
        "明星候选人会先界定用户场景和岗位目标，再说明 AI 能力边界、产品取舍、指标验收和风险兜底，最后把复盘动作沉淀进简历与下一轮面试表达。",
      highlights: ["用户场景清晰", "模型边界清晰", "指标验收清晰"]
    },
    resumeOptimizationCta: {
      label: "去简历优化，沉淀本次面试反馈",
      href: "/resume-lab",
      reason: "把面试中的优势和不足转成更有证据的项目 bullet。"
    }
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function normalizeStringArray(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const items = value.filter((item): item is string => typeof item === "string" && Boolean(item.trim()));
  return items.length > 0 ? items : fallback;
}

function normalizeStrengths(value: unknown, fallback: InterviewSummary["strengths"]) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const strengths = value
    .map((item) => {
      if (!isRecord(item)) return null;
      return {
        title: readString(item.title, "可放大的优势"),
        evidence: readString(item.evidence, "需要回看对应回答补齐证据。"),
        amplification: readString(item.amplification, "把该优势沉淀进下次面试开场和简历 bullet。")
      };
    })
    .filter((item): item is InterviewSummary["strengths"][number] => Boolean(item));

  return strengths.length > 0 ? strengths : fallback;
}

function normalizeGaps(value: unknown, fallback: InterviewSummary["gaps"]) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const gaps = value
    .map((item) => {
      if (!isRecord(item)) return null;
      const detail = isRecord(item.detail) ? item.detail : {};
      return {
        title: readString(item.title, "需要补强的短板"),
        evidence: readString(item.evidence, "需要回看对应回答补齐证据。"),
        improvement: readString(item.improvement, "补充真实项目证据并形成可复述案例。"),
        detail: {
          whyItMatters: readString(detail.whyItMatters, "这个短板会影响面试官对岗位匹配度的判断。"),
          practiceSteps: normalizeStringArray(detail.practiceSteps, [
            "回看对应轮次回答",
            "补充业务指标和用户场景",
            "整理成下一次面试可直接复述的版本"
          ]),
          exampleUpgrade: readString(detail.exampleUpgrade, "把抽象判断升级为包含场景、依据和指标的表达。")
        }
      };
    })
    .filter((item): item is InterviewSummary["gaps"][number] => Boolean(item));

  return gaps.length > 0 ? gaps : fallback;
}

function normalizeStarReplay(value: unknown, fallback: InterviewSummary["starReplay"]) {
  if (!isRecord(value)) {
    return fallback;
  }

  return {
    interviewerPersona: readString(value.interviewerPersona, fallback.interviewerPersona),
    personaDefinition: readString(value.personaDefinition, fallback.personaDefinition),
    perfectReplay: readString(value.perfectReplay, fallback.perfectReplay),
    highlights: normalizeStringArray(value.highlights, fallback.highlights)
  };
}

function normalizeResumeOptimizationCta(value: unknown, fallback: InterviewSummary["resumeOptimizationCta"]) {
  if (!isRecord(value)) {
    return fallback;
  }

  const href = readString(value.href, fallback.href);
  return {
    label: readString(value.label, fallback.label),
    href: href.startsWith("/") ? href : "/resume-lab",
    reason: readString(value.reason, fallback.reason)
  };
}

function normalizeSummary(summary: unknown): InterviewSummary | null {
  if (summary == null) {
    return null;
  }

  if (typeof summary === "string") {
    return createFallbackSummary(summary);
  }

  const directSummary = interviewSummarySchema.safeParse(summary);
  if (directSummary.success) {
    return directSummary.data;
  }

  if (!isRecord(summary)) {
    return createFallbackSummary("模型返回了总结内容，但结构不完整，系统已转成可行动复盘格式。");
  }

  const fallback = createFallbackSummary(readString(summary.overallTakeaway, "系统已生成面试复盘，但模型返回结构不完整。"));

  return {
    overallTakeaway: fallback.overallTakeaway,
    strengths: normalizeStrengths(summary.strengths, fallback.strengths),
    gaps: normalizeGaps(summary.gaps, fallback.gaps),
    starReplay: normalizeStarReplay(summary.starReplay, fallback.starReplay),
    resumeOptimizationCta: normalizeResumeOptimizationCta(summary.resumeOptimizationCta, fallback.resumeOptimizationCta)
  };
}

function validateGenerationOutput(output: InterviewGenerationOutput): Omit<InterviewGenerationOutput, "summary"> & {
  summary?: InterviewSummary | null;
} {
  const parsed = generationOutputSchema.parse(output);
  return {
    ...parsed,
    summary: normalizeSummary(parsed.summary)
  };
}

function buildCompressedHistory(answers: InterviewAnswerRecord[]) {
  if (answers.length === 0) {
    return "No prior answers yet.";
  }

  return answers
    .slice(0, Math.max(0, answers.length - 3))
    .map((record, index) => {
      return `Round ${index + 1}: dimension=${record.dimension}; answer=${record.answer}; feedback=${record.feedback}`;
    })
    .join("\n");
}

function toState(phase: InterviewSession["phase"], answers: InterviewAnswerRecord[]): InterviewState {
  return {
    currentTurn: answers.length,
    phase,
    answers: answers.map((record) => ({
      turnId: record.turnId,
      answer: record.answer,
      feedback: record.feedback
    }))
  };
}

function validateNextQuestion(nextQuestion: InterviewTurn | null, answeredCount: number) {
  if (answeredCount < TOTAL_TURNS && !nextQuestion) {
    throw new Error("Interview generation failed validation: next question is missing.");
  }

  if (answeredCount >= TOTAL_TURNS && nextQuestion) {
    throw new Error("Interview generation failed validation: interview should already be complete.");
  }

  if (!nextQuestion) {
    return;
  }

  const expectedPhase = getNextPhase(answeredCount);

  if (expectedPhase === "summary" || nextQuestion.phase !== expectedPhase) {
    throw new Error("Interview generation failed validation: interviewer phase mismatch.");
  }

  if (!nextQuestion.question.trim() || !nextQuestion.coachingFocus.trim() || !nextQuestion.dimension.trim()) {
    throw new Error("Interview generation failed validation: question fields are incomplete.");
  }
}

function normalizeNextQuestionPhase(nextQuestion: InterviewTurn | null, answeredCount: number) {
  if (!nextQuestion) {
    return null;
  }

  const expectedPhase = getNextPhase(answeredCount);
  if (expectedPhase === "summary") {
    return null;
  }

  return nextQuestion.phase === expectedPhase ? nextQuestion : { ...nextQuestion, phase: expectedPhase };
}

function validateFinalSummary(output: InterviewGenerationOutput, answeredCount: number) {
  if (answeredCount >= TOTAL_TURNS && !output.summary) {
    throw new Error("Interview generation failed validation: final summary is missing.");
  }
}

function buildGenerationInput(
  session: InterviewSession,
  currentTurn: InterviewTurn,
  answer: string | null,
  nextAnswers: InterviewAnswerRecord[],
  profile: CandidateProfile
): InterviewGenerationInput {
  return {
    jobLead: session.jobLead,
    profile,
    currentTurn,
    answer,
    state: toState(getNextPhase(nextAnswers.length), nextAnswers),
    recentHistory: nextAnswers.slice(-3),
    compressedHistory: buildCompressedHistory(nextAnswers)
  };
}

function buildStartGenerationInput(lead: JobLead, profile: CandidateProfile): InterviewGenerationInput {
  return {
    jobLead: lead,
    profile,
    currentTurn: getOpeningContextTurn(),
    answer: null,
    state: createInterviewState(),
    recentHistory: [],
    compressedHistory: "No prior answers yet."
  };
}

function buildOpenAIMessages(input: InterviewGenerationInput) {
  const answeredCount = input.state.answers.length;
  const nextRound = Math.min(answeredCount + 1, TOTAL_TURNS);
  const expectedPhase = getNextPhase(answeredCount);
  const shouldSummarize = answeredCount >= TOTAL_TURNS;
  const reviewerPrompt = shouldSummarize ? FINAL_SUMMARY_REVIEWER_PROMPT : REALTIME_FEEDBACK_REVIEWER_PROMPT;

  return [
    {
      role: "system" as const,
      content:
        "你是中文 AI 产品经理模拟面试官。禁止使用固定题库、mock 兜底、占位反馈。必须基于候选人画像、岗位线索、最近回答和历史摘要生成真实连续追问。只输出 JSON，且必须包含 feedback、nextQuestion、signals、risks、summary 五个顶层字段。"
    },
    {
      role: "user" as const,
      content: JSON.stringify(
        {
          task: shouldSummarize ? "finish_interview" : "generate_next_interview_turn",
          requiredRound: shouldSummarize ? null : nextRound,
          requiredPhase: shouldSummarize ? "summary" : expectedPhase,
          rule: {
            totalTurns: TOTAL_TURNS,
            managerTurns: MANAGER_TURNS,
            hrTurns: TOTAL_TURNS - MANAGER_TURNS,
            noMockFallback: true,
            summaryMustBeNullUnlessTaskIsFinishInterview: true,
            feedbackStyle: "actionable_intent_aware_feedback",
            finalSummaryStyle: "jd_expert_and_senior_practitioner_review"
          },
          outputContract: {
            feedback:
              "string. For normal turns, use exactly four labeled short paragraphs: 问题诊断：..., 面试官意图：..., 具体改法：..., 下轮可这样说：... Include concrete coaching, not generic criticism.",
            nextQuestion:
              "object unless task is finish_interview. Required object fields: id, phase, question, coachingFocus, dimension",
            signals: "string[]",
            risks: "string[]",
            summary:
              "null unless task is finish_interview. When task is finish_interview, summary must be exactly: { overallTakeaway: string, strengths: [{ title: string, evidence: string, amplification: string }], gaps: [{ title: string, evidence: string, improvement: string, detail: { whyItMatters: string, practiceSteps: string[], exampleUpgrade: string } }], starReplay: { interviewerPersona: string, personaDefinition: string, perfectReplay: string, highlights: string[] }, resumeOptimizationCta: { label: string, href: '/resume-lab', reason: string } }. Do not return scoreByDimension, scores, ratings, or summary as a plain string."
          },
          reviewerPersona: reviewerPrompt,
          jobLead: {
            title: input.jobLead.title,
            companyId: input.jobLead.companyId,
            city: input.jobLead.city,
            summary: input.jobLead.summary,
            requirements: input.jobLead.extractedRequirements,
            riskReminder: input.jobLead.riskReminder
          },
          candidateProfile: {
            projects: input.profile.baseProfile.projects,
            internships: input.profile.baseProfile.internships,
            skills: input.profile.baseProfile.skills,
            capabilityTags: input.profile.capabilityTags,
            strengths: input.profile.aiPmFit.strengths,
            gaps: input.profile.aiPmFit.gaps
          },
          currentTurn: input.currentTurn,
          answer: input.answer,
          state: input.state,
          recentHistory: input.recentHistory,
          compressedHistory: input.compressedHistory
        },
        null,
        2
      )
    }
  ];
}

function createOpenAIInterviewGenerator(config: { apiKey: string; model: string; baseURL?: string }): InterviewGenerator {
  const client = new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseURL || undefined,
    timeout: Number(process.env.OPENAI_INTERVIEW_TIMEOUT_MS ?? 20000)
  });

  return async (input) => {
    const completion = await client.chat.completions.create({
      model: config.model,
      messages: buildOpenAIMessages(input),
      max_tokens: input.state.answers.length >= TOTAL_TURNS ? 1600 : 900,
      response_format: { type: "json_object" }
    });

    const rawContent = completion.choices[0]?.message.content;

    if (!rawContent) {
      throw new Error("Interview generation returned empty content.");
    }

    return validateGenerationOutput(JSON.parse(rawContent) as InterviewGenerationOutput);
  };
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
  const hasSignalWord = ["指标", "用户", "实验", "价值", "闭环", "场景", "数据", "取舍"].some((keyword) =>
    answer.includes(keyword)
  );
  const lengthEnough = answer.trim().length >= 28;

  const diagnosis = hasSignalWord
    ? "回答已经触碰到关键判断变量，但还需要把证据链讲完整。"
    : "回答方向可以，但目前停留在抽象判断，缺少能验证岗位能力的具体证据。";
  const concreteFix = lengthEnough
    ? "补一个真实用户场景、一个判断指标，再说明你为什么选择这个方案而不是另一个方案。"
    : "先把回答扩成“场景-动作-依据-结果”四步，每一步至少补一个具体名词或指标。";

  return [
    `问题诊断：${diagnosis}`,
    `面试官意图：这轮问题不是看你是否知道概念，而是验证你能否围绕「${turn.dimension}」讲清用户行为、业务目标和决策依据。`,
    `具体改法：${concreteFix} 同时把重点扣回「${turn.coachingFocus}」。`,
    "下轮可这样说：我会先界定目标用户和触发场景，再用一个核心指标判断问题是否真实，接着说明方案取舍，最后用结果或复盘验证判断。"
  ].join("\n");
}

export function getNextPhase(answeredCount: number): InterviewSession["phase"] {
  if (answeredCount >= TOTAL_TURNS) return "summary";
  return answeredCount >= MANAGER_TURNS ? "hr" : "manager";
}

export function getInterviewSummary(): InterviewSummary {
  return interviewSummary;
}

export function getResumeSuggestions(): ResumeSuggestion[] {
  return resumeSuggestions;
}

export async function createInterviewSession(
  lead: JobLead,
  options?: InterviewEngineOptions
): Promise<InterviewSession> {
  const generator = resolveGenerator(options);
  const profile = options?.profile ?? defaultCandidateProfile;
  const output = validateGenerationOutput(await generator(buildStartGenerationInput(lead, profile)));
  const nextQuestion = normalizeNextQuestionPhase(output.nextQuestion, 0);

  validateNextQuestion(nextQuestion, 0);

  return {
    jobId: lead.id,
    jobLead: lead,
    jobTitle: lead.title,
    companyName: lead.companyId,
    phase: "manager",
    roleLabel: getRoleLabel("manager"),
    currentTurn: nextQuestion,
    progress: {
      current: 1,
      total: TOTAL_TURNS
    },
    answers: [],
    summary: null
  };
}

export async function submitInterviewAnswer(
  session: InterviewSession,
  answer: string,
  options?: InterviewEngineOptions
): Promise<InterviewSubmitResult> {
  const currentTurn = session.currentTurn;

  if (!currentTurn) {
    throw new Error("Interview session has already finished.");
  }

  const normalizedAnswer = answer.trim();
  if (!normalizedAnswer) {
    throw new Error("Answer cannot be empty.");
  }

  const placeholderRecord: InterviewAnswerRecord = {
    turnId: currentTurn.id,
    question: currentTurn.question,
    answer: normalizedAnswer,
    feedback: "",
    dimension: currentTurn.dimension,
    coachingFocus: currentTurn.coachingFocus
  };
  const contextAnswers = [...session.answers, placeholderRecord];
  const generator = resolveGenerator(options);
  const profile = options?.profile ?? defaultCandidateProfile;
  const input = buildGenerationInput(session, currentTurn, normalizedAnswer, contextAnswers, profile);
  const output = validateGenerationOutput(await generator(input));
  const nextQuestion = normalizeNextQuestionPhase(output.nextQuestion, contextAnswers.length);

  validateNextQuestion(nextQuestion, contextAnswers.length);
  validateFinalSummary(output, contextAnswers.length);

  const nextAnswers: InterviewAnswerRecord[] = [
    ...session.answers,
    {
      ...placeholderRecord,
      feedback: output.feedback
    }
  ];
  const nextPhase = getNextPhase(nextAnswers.length);

  return {
    feedback: output.feedback,
    session: {
      ...session,
      phase: nextPhase,
      roleLabel: getRoleLabel(nextPhase),
      currentTurn: nextQuestion,
      progress: {
        current: Math.min(nextAnswers.length + 1, TOTAL_TURNS),
        total: TOTAL_TURNS
      },
      answers: nextAnswers,
      summary: nextQuestion ? null : output.summary ?? null
    }
  };
}
