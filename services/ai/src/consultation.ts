import mammoth from "mammoth";
import OpenAI from "openai";
import { getData } from "pdf-parse/worker";
import { PDFParse } from "pdf-parse";
import { getServerEnv } from "@xhs/config";
import { z } from "zod";

const MAX_ROUNDS = 3;

const focusEnum = z.enum([
  "city_preference",
  "role_preference",
  "company_preference",
  "project_depth",
  "ai_understanding",
  "product_method",
  "data_analysis",
  "user_research",
  "role_concern"
]);

const resumeIntelligenceSchema = z.object({
  profileSummary: z.string(),
  backgroundHighlights: z.array(z.string()).max(6),
  strengths: z.array(z.string()).max(5),
  gaps: z.array(z.string()).max(5),
  pendingFocuses: z.array(focusEnum).max(MAX_ROUNDS),
  evidencePoints: z.array(z.string()).max(6)
});

const answerUpdateSchema = z.object({
  answerSummary: z.string(),
  learnedSignals: z.array(z.string()).max(6),
  strengths: z.array(z.string()).max(5),
  gaps: z.array(z.string()).max(5),
  pendingFocuses: z.array(focusEnum).max(MAX_ROUNDS),
  nextFocus: focusEnum.optional(),
  confidenceNote: z.string()
});

export type ConsultationFocus = z.infer<typeof focusEnum>;

export type ConsultationTurn = {
  round: number;
  focus: ConsultationFocus;
  question: string;
  answer: string;
  answerSummary: string;
  learnedSignals: string[];
  confidenceNote: string;
};

export type ConsultationState = {
  version: 1;
  source: "openai" | "fallback";
  round: number;
  maxRounds: number;
  resumeName: string | null;
  resumeExcerpt: string;
  profileSummary: string;
  backgroundHighlights: string[];
  strengths: string[];
  gaps: string[];
  evidencePoints: string[];
  pendingFocuses: ConsultationFocus[];
  currentFocus: ConsultationFocus;
  currentQuestion: string;
  turns: ConsultationTurn[];
  finalSummary: string | null;
  done: boolean;
};

export type StartConsultationInput = {
  resumeName: string | null;
  resumeText: string;
  userNote?: string;
};

export type AdvanceConsultationInput = {
  state: ConsultationState;
  answer: string;
};

type StreamChunk = {
  source: "openai" | "fallback";
  stream: AsyncIterable<string>;
};

type ResumeAnalysis = z.infer<typeof resumeIntelligenceSchema>;
type AnswerUpdate = z.infer<typeof answerUpdateSchema>;

const focusDescriptions: Record<ConsultationFocus, string> = {
  city_preference: "城市偏好与地点限制",
  role_preference: "目标岗位与方向偏好",
  company_preference: "公司偏好与业务方向",
  project_depth: "项目经历与结果证据",
  ai_understanding: "AI / LLM 相关理解",
  product_method: "产品判断与决策方法",
  data_analysis: "数据分析经历",
  user_research: "用户研究经历",
  role_concern: "当前求职顾虑"
};

const focusKeywords: Record<ConsultationFocus, string[]> = {
  city_preference: ["beijing", "shanghai", "hangzhou", "shenzhen", "guangzhou", "chengdu", "city", "base", "location", "北京", "上海", "杭州", "深圳", "广州", "成都", "城市", "地点", "base"],
  role_preference: ["role", "job", "position", "product manager", "pm", "career", "direction", "岗位", "职位", "产品经理", "AI 产品", "方向", "求职", "职业", "转型", "校招", "实习"],
  company_preference: ["bytedance", "tencent", "alibaba", "meituan", "baidu", "xiaohongshu", "ant", "company", "platform", "startup", "字节", "腾讯", "阿里", "美团", "百度", "小红书", "蚂蚁", "公司", "平台", "行业", "赛道"],
  project_depth: ["project", "launch", "requirement", "prd", "iteration", "owner", "metric", "result", "experiment", "项目", "上线", "需求", "负责", "迭代", "指标", "结果", "实验", "落地"],
  ai_understanding: ["ai", "llm", "agent", "rag", "prompt", "model", "reasoning", "retrieval", "vector", "人工智能", "大模型", "模型", "智能体", "提示词", "检索", "向量"],
  product_method: ["user", "problem", "solution", "tradeoff", "priority", "roadmap", "framework", "loop", "产品", "用户", "问题", "方案", "优先级", "取舍", "路线图", "框架"],
  data_analysis: ["data", "sql", "retention", "conversion", "a/b", "experiment", "metric", "funnel", "analysis", "数据", "sql", "留存", "转化", "实验", "指标", "漏斗", "分析"],
  user_research: ["interview", "research", "survey", "feedback", "insight", "persona", "pain point", "study", "访谈", "调研", "问卷", "反馈", "洞察", "画像", "痛点"],
  role_concern: ["concern", "risk", "weakness", "interview", "shortcoming", "lack", "gap", "improve", "担心", "顾虑", "不足", "短板", "问题", "风险", "改进"]
};

const neutralFallbackFocusOrder: ConsultationFocus[] = [
  "city_preference",
  "role_preference",
  "company_preference"
];

const preferenceFocusOrder = ["city_preference", "role_preference", "company_preference"] as const;
type PreferenceFocus = (typeof preferenceFocusOrder)[number];

// pdf-parse recommends explicitly wiring the worker in Next.js/serverless environments.
PDFParse.setWorker(getData());

function getModelConfig() {
  const env = getServerEnv();

  return {
    apiKey: env.OPENAI_API_KEY,
    baseURL: env.OPENAI_BASE_URL,
    model: env.OPENAI_MODEL ?? "gpt-5.4",
    questionModel: env.OPENAI_MODEL ?? "gpt-5.4"
  };
}

function getOpenAIClient() {
  const config = getModelConfig();

  if (!config.apiKey) {
    return null;
  }

  return new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseURL
  });
}

function logConsultationPerf(stage: string, meta?: Record<string, unknown>) {
  const suffix = meta ? ` ${JSON.stringify(meta)}` : "";
  console.info(`[consultation-perf] ${stage}${suffix}`);
}

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function clampList(items: string[], maxItems = 5) {
  return Array.from(new Set(items.map((item) => normalizeWhitespace(item)).filter(Boolean))).slice(0, maxItems);
}

function firstNonEmpty(items: string[], fallback: string) {
  const hit = items.find((item) => normalizeWhitespace(item).length > 0);
  return hit ? normalizeWhitespace(hit) : fallback;
}

function extractJsonBlock(raw: string) {
  const normalized = raw.trim();
  const fenced = normalized.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);

  if (fenced?.[1]) {
    return fenced[1].trim();
  }

  const firstBrace = normalized.indexOf("{");
  const lastBrace = normalized.lastIndexOf("}");

  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return normalized.slice(firstBrace, lastBrace + 1);
  }

  return normalized;
}

function extractHighlights(text: string) {
  return clampList(
    text
      .split(/(?<=[.!?;。！？；])\s*/)
      .map((sentence) => sentence.trim())
      .filter((sentence) => sentence.length >= 12),
    6
  );
}

function rankFocuses(text: string) {
  const lowered = text.toLowerCase();

  return focusEnum.options
    .map((focus) => ({
      focus,
      score: focusKeywords[focus].reduce(
        (total, keyword) => total + (lowered.includes(keyword.toLowerCase()) ? 1 : 0),
        0
      )
    }))
    .sort((left, right) => right.score - left.score);
}

function isPreferenceFocus(focus: ConsultationFocus): focus is PreferenceFocus {
  return (preferenceFocusOrder as readonly ConsultationFocus[]).includes(focus);
}

function getQuestionFocus(focus: ConsultationFocus): PreferenceFocus {
  return isPreferenceFocus(focus) ? focus : "role_preference";
}

function pickPendingFocuses(text: string) {
  const ranked = rankFocuses(text).filter((entry) => isPreferenceFocus(entry.focus));
  const missing = ranked.filter((entry) => entry.score === 0).map((entry) => entry.focus);
  const alreadyMentioned = ranked
    .filter((entry) => entry.score > 0)
    .sort((left, right) => left.score - right.score)
    .map((entry) => entry.focus);

  return clampList([...missing, ...alreadyMentioned, ...neutralFallbackFocusOrder], MAX_ROUNDS) as ConsultationFocus[];
}

function buildGapLabels(focuses: ConsultationFocus[]) {
  return clampList(
    focuses.map((focus) => `仍需补充求职偏好：${focusDescriptions[getQuestionFocus(focus)]}。后续对话可继续澄清。`),
    5
  );
}

function normalizePendingPreferenceFocuses(focuses: ConsultationFocus[], corpus: string) {
  const preferenceFocuses = focuses.filter(isPreferenceFocus);
  const fallback = pickPendingFocuses(corpus);

  return clampList([...preferenceFocuses, ...fallback], MAX_ROUNDS) as ConsultationFocus[];
}

async function createStructuredResponse<T>(input: {
  model: string;
  system: string;
  user: string;
  schema: z.ZodType<T>;
  fallback: T;
}) {
  const client = getOpenAIClient();

  if (!client) {
    return input.fallback;
  }

  try {
    const startedAt = Date.now();
    logConsultationPerf("prompt build done", {
      scope: "structured",
      model: input.model
    });
    logConsultationPerf("llm request start", {
      scope: "structured",
      model: input.model
    });
    const response = await client.responses.create({
      model: input.model,
      input: [
        {
          role: "system",
          content: `${input.system}\n\nReturn exactly one JSON object. Do not use markdown fences. Do not add any extra explanation.`
        },
        {
          role: "user",
          content: input.user
        }
      ]
    });

    const outputText = typeof response.output_text === "string" ? response.output_text : "";
    const parsed = JSON.parse(extractJsonBlock(outputText));
    logConsultationPerf("llm response done", {
      scope: "structured",
      model: input.model,
      durationMs: Date.now() - startedAt
    });
    return input.schema.parse(parsed);
  } catch {
    return input.fallback;
  }
}

function heuristicResumeAnalysis(input: StartConsultationInput): ResumeAnalysis {
  const merged = normalizeWhitespace(`${input.resumeText}\n${input.userNote ?? ""}`);
  const highlights = extractHighlights(merged);
  const focuses = pickPendingFocuses(merged);
  const evidenceLabels = highlights.slice(0, 3).map((highlight) => `材料明确提到：${highlight}`);
  const gapLabels = buildGapLabels(focuses);

  return {
    profileSummary: firstNonEmpty(
      [
        input.userNote ? `补充说明中明确提到：${normalizeWhitespace(input.userNote)}` : "",
        highlights[0] ? `上传材料中最明确的一段内容是：${highlights[0]}` : ""
      ],
      "当前上传材料信息有限，系统仅确认已收到文件，后续问题会围绕材料中尚未说清的部分继续澄清，不做额外推断。"
    ),
    backgroundHighlights: clampList(
      highlights.length ? highlights : [input.resumeName ? `已收到文件：${input.resumeName}` : "已收到用户补充说明。"]
    ),
    strengths: clampList(evidenceLabels.length ? evidenceLabels : ["当前只确认已收到材料，暂未抽取出足够的明确事实。"]),
    gaps: clampList(gapLabels.length ? gapLabels : ["材料信息较少，后续对话需要继续补充具体经历。"]),
    pendingFocuses: focuses,
    evidencePoints: clampList(highlights.length ? highlights : [merged.slice(0, 120) || "当前材料没有可直接引用的完整句子。"], 6)
  };
}

async function analyzeResumeWithOpenAI(input: StartConsultationInput): Promise<ResumeAnalysis> {
  const config = getModelConfig();
  const merged = normalizeWhitespace(`${input.resumeText}\n${input.userNote ?? ""}`);
  const fallback = heuristicResumeAnalysis(input);

  return createStructuredResponse({
    model: config.model,
    schema: resumeIntelligenceSchema,
    fallback,
    system:
      "You are a resume evidence extractor. You may only use information that is explicitly present in the uploaded material. Do not infer a target role, capability level, or career direction beyond the text. If the material does not mention something, say that the material does not show it. The result will only be used to drive neutral follow-up questions.",
    user: [
      `Resume file: ${input.resumeName ?? "No file uploaded, text background only"}`,
      `Candidate material: ${merged}`,
      "Return profileSummary, backgroundHighlights, strengths, gaps, pendingFocuses, and evidencePoints.",
      "Requirements:",
      "1. profileSummary must be a neutral summary of explicit material only.",
      "2. strengths means 'already evidenced in the material', not capability praise.",
      "3. gaps means 'still not explicitly shown in the material', not weakness judgment.",
      "4. pendingFocuses must only include career preference focuses: city_preference, role_preference, company_preference.",
      "5. Never mention any target role unless it is explicitly written in the uploaded material."
    ].join("\n\n")
  });
}

function heuristicAnswerUpdate(state: ConsultationState, answer: string): AnswerUpdate {
  const normalized = normalizeWhitespace(answer);
  const learnedSignals = clampList(extractHighlights(normalized).slice(0, 3), 6);
  const remaining = state.pendingFocuses.filter((focus) => focus !== state.currentFocus);
  const promotedStrength =
    normalized.length >= 20 ? [`已补充说明：${focusDescriptions[state.currentFocus]}。`] : [];
  const nextGaps = remaining.length ? buildGapLabels(remaining) : ["三轮澄清已完成，后续分析应继续仅基于已提供证据。"];

  return {
    answerSummary: normalized.slice(0, 140),
    learnedSignals,
    strengths: clampList([...state.strengths, ...promotedStrength]),
    gaps: clampList(nextGaps),
    pendingFocuses: remaining,
    nextFocus: remaining[0],
    confidenceNote:
      normalized.length >= 20
        ? "这一轮回答提供了新的可引用信息，可以进入下一轮澄清。"
        : "这一轮信息仍然偏少，下一轮需要继续追问具体事实。"
  };
}

async function analyzeAnswerWithOpenAI(input: AdvanceConsultationInput): Promise<AnswerUpdate> {
  const config = getModelConfig();
  const fallback = heuristicAnswerUpdate(input.state, input.answer);

  return createStructuredResponse({
    model: config.model,
    schema: answerUpdateSchema,
    fallback,
    system:
      "You are a neutral consultation state updater. Only use the latest answer and the existing state. Do not infer a target role or hidden capability. Convert the latest answer into evidence-backed updates and identify what still needs clarification.",
    user: [
      `Profile summary: ${input.state.profileSummary}`,
      `Background highlights: ${input.state.backgroundHighlights.join(" | ")}`,
      `Current strengths: ${input.state.strengths.join(" | ")}`,
      `Current gaps: ${input.state.gaps.join(" | ")}`,
      `Pending focuses: ${input.state.pendingFocuses.join(", ")}`,
      `Previous question: ${input.state.currentQuestion}`,
      `Latest answer: ${input.answer}`,
      "Return answerSummary, learnedSignals, strengths, gaps, pendingFocuses, nextFocus, and confidenceNote.",
      "Requirements:",
      "1. strengths means newly confirmed facts, not praise.",
      "2. gaps means still-unconfirmed information, not weaknesses.",
      "3. Keep only career preference clarification directions that are still useful in the remaining rounds: city_preference, role_preference, company_preference.",
      "4. Do not add any information that is not stated in the user's answer or the existing state."
    ].join("\n\n")
  });
}

function buildFallbackQuestion(state: ConsultationState) {
  const questionFocus = getQuestionFocus(state.currentFocus);
  const questions: Record<PreferenceFocus, string> = {
    city_preference:
      "你更希望在哪个城市工作？是否接受异地、远程或通勤成本较高的机会？",
    role_preference:
      "下一份工作你更想投什么岗位或业务方向？希望日常工作更偏增长、工具、内容、商业化，还是 AI 应用落地？",
    company_preference:
      "你更偏好什么类型的公司和团队环境？例如大厂、成长型公司、AI 公司、平台型业务，或有哪些明确不想去的类型？"
  };

  return questions[questionFocus];
}

function buildQuestionPrompt(state: ConsultationState) {
  const questionFocus = getQuestionFocus(state.currentFocus);

  return [
    `Current round: ${state.round} / ${state.maxRounds}`,
    `Profile summary: ${state.profileSummary}`,
    `Background highlights: ${state.backgroundHighlights.join(" | ")}`,
    `Strengths: ${state.strengths.join(" | ")}`,
    `Gaps: ${state.gaps.join(" | ")}`,
    `Pending focuses: ${state.pendingFocuses.join(", ") || "none"}`,
    state.turns.length
      ? `Conversation history: ${state.turns
          .map(
            (turn) =>
              `Round ${turn.round} [focus=${turn.focus}] Q: ${turn.question} A: ${turn.answer} Summary: ${turn.answerSummary}`
          )
          .join(" || ")}`
      : "Conversation history: none",
    `Must focus on: ${questionFocus} / ${focusDescriptions[questionFocus]}`,
    "Reply in Simplified Chinese. Generate exactly one job-search preference question. Only ask about target city, target role/direction, company type, industry preference, team preference, or constraints. Do not ask professional knowledge questions, skill-gap questions, project-detail questions, technical questions, or interview-style questions. Do not explain your reasoning."
  ].join("\n\n");
}

async function generateQuestionWithOpenAI(state: ConsultationState) {
  const client = getOpenAIClient();
  const config = getModelConfig();

  if (!client) {
    return null;
  }

  try {
    const startedAt = Date.now();
    logConsultationPerf("prompt build done", {
      scope: "question-single",
      round: state.round,
      focus: state.currentFocus,
      model: config.questionModel
    });
    logConsultationPerf("llm request start", {
      scope: "question-single",
      round: state.round,
      focus: state.currentFocus,
      model: config.questionModel
    });
    const response = await client.responses.create({
      model: config.questionModel,
      input: [
        {
          role: "system",
          content:
            "You are a job-search preference consultation agent. You only ask one question per round. Ask about the candidate's intended city, target role/direction, preferred company type, industry, team environment, or hard constraints. Never ask professional knowledge, skill gap, project detail, technical, or interview-style questions. Reply in Simplified Chinese and output only the question itself."
        },
        {
          role: "user",
          content: buildQuestionPrompt(state)
        }
      ]
    });

    logConsultationPerf("llm response done", {
      scope: "question-single",
      round: state.round,
      focus: state.currentFocus,
      model: config.questionModel,
      durationMs: Date.now() - startedAt
    });

    return normalizeWhitespace(response.output_text ?? "");
  } catch {
    return null;
  }
}

async function streamQuestionWithOpenAI(state: ConsultationState): Promise<StreamChunk> {
  const client = getOpenAIClient();
  const config = getModelConfig();

  if (!client) {
    return {
      source: "fallback",
      stream: streamString(buildFallbackQuestion(state))
    };
  }

  try {
    const startedAt = Date.now();
    logConsultationPerf("prompt build done", {
      scope: "question-stream",
      round: state.round,
      focus: state.currentFocus,
      model: config.questionModel
    });
    logConsultationPerf("llm request start", {
      scope: "question-stream",
      round: state.round,
      focus: state.currentFocus,
      model: config.questionModel
    });
    const stream = await client.responses.create({
      model: config.questionModel,
      stream: true,
      input: [
        {
          role: "system",
          content:
            "You are a job-search preference consultation agent. You only ask one question per round. Ask about the candidate's intended city, target role/direction, preferred company type, industry, team environment, or hard constraints. Never ask professional knowledge, skill gap, project detail, technical, or interview-style questions. Reply in Simplified Chinese and output only the question itself."
        },
        {
          role: "user",
          content: buildQuestionPrompt(state)
        }
      ]
    });

    return {
      source: "openai",
      stream: (async function* () {
        let emitted = false;

        for await (const event of stream) {
          if (event.type === "response.output_text.delta" && typeof event.delta === "string") {
            if (!emitted) {
              logConsultationPerf("llm response done", {
                scope: "question-stream",
                round: state.round,
                focus: state.currentFocus,
                model: config.questionModel,
                durationMs: Date.now() - startedAt,
                firstDelta: true
              });
            }
            emitted = true;
            yield event.delta;
          }
        }

        if (!emitted) {
          const backup = (await generateQuestionWithOpenAI(state)) ?? buildFallbackQuestion(state);
          for await (const chunk of streamString(backup)) {
            yield chunk;
          }
        }
      })()
    };
  } catch {
    return {
      source: "fallback",
      stream: streamString(buildFallbackQuestion(state))
    };
  }
}

async function collectStream(stream: AsyncIterable<string>) {
  let result = "";

  for await (const delta of stream) {
    result += delta;
  }

  return normalizeWhitespace(result);
}

function streamString(value: string): AsyncIterable<string> {
  return (async function* () {
    const chunks = Array.from(value);

    for (const chunk of chunks) {
      yield chunk;
    }
  })();
}

function buildFinalSummary(state: ConsultationState) {
  return [
    `三轮澄清后，当前已确认的信息包括：${firstNonEmpty(state.strengths, "仍缺少足够的明确事实")}。`,
    `仍需谨慎对待的未确认部分包括：${firstNonEmpty(state.gaps, "当前材料已经没有明显缺口")}。`,
    "后续分析应继续只基于这些已确认信息与原始材料，不应补充材料之外的人设判断。"
  ].join("");
}

export async function extractResumeText(file: {
  name: string;
  type: string;
  bytes: ArrayBuffer;
}) {
  const buffer = Buffer.from(file.bytes);
  const lowerName = file.name.toLowerCase();

  if (file.type === "application/pdf" || lowerName.endsWith(".pdf")) {
    const parser = new PDFParse({ data: buffer });

    try {
      const parsed = await parser.getText();
      return normalizeWhitespace(parsed.text);
    } finally {
      await parser.destroy();
    }
  }

  if (
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    lowerName.endsWith(".docx")
  ) {
    const parsed = await mammoth.extractRawText({ buffer });
    return normalizeWhitespace(parsed.value);
  }

  if (file.type.startsWith("text/") || lowerName.endsWith(".txt") || lowerName.endsWith(".md")) {
    return normalizeWhitespace(buffer.toString("utf8"));
  }

  if (lowerName.endsWith(".doc")) {
    throw new Error("Only PDF, DOCX, TXT, and MD resumes are supported right now. Please convert old DOC files to DOCX or PDF first.");
  }

  return normalizeWhitespace(buffer.toString("utf8"));
}

export async function startConsultation(input: StartConsultationInput): Promise<ConsultationState> {
  const analysis = await analyzeResumeWithOpenAI(input);
  const corpus = `${input.resumeText}\n${input.userNote ?? ""}`;
  const pendingFocuses = normalizePendingPreferenceFocuses(analysis.pendingFocuses, corpus);
  const currentFocus = pendingFocuses[0] ?? "city_preference";

  return {
    version: 1,
    source: getOpenAIClient() ? "openai" : "fallback",
    round: 1,
    maxRounds: MAX_ROUNDS,
    resumeName: input.resumeName,
    resumeExcerpt: normalizeWhitespace(input.resumeText).slice(0, 600),
    profileSummary: analysis.profileSummary,
    backgroundHighlights: clampList(analysis.backgroundHighlights, 6),
    strengths: clampList(analysis.strengths),
    gaps: clampList(analysis.gaps),
    evidencePoints: clampList(analysis.evidencePoints, 6),
    pendingFocuses,
    currentFocus,
    currentQuestion: "",
    turns: [],
    finalSummary: null,
    done: false
  };
}

export async function advanceConsultation(input: AdvanceConsultationInput): Promise<ConsultationState> {
  const normalizedAnswer = normalizeWhitespace(input.answer);

  if (!normalizedAnswer) {
    throw new Error("Answer cannot be empty.");
  }

  const update = await analyzeAnswerWithOpenAI(input);
  const nextTurns: ConsultationTurn[] = [
    ...input.state.turns,
    {
      round: input.state.round,
      focus: input.state.currentFocus,
      question: input.state.currentQuestion,
      answer: normalizedAnswer,
      answerSummary: update.answerSummary,
      learnedSignals: clampList(update.learnedSignals, 6),
      confidenceNote: update.confidenceNote
    }
  ];
  const done = input.state.round >= input.state.maxRounds;
  const pendingFocuses = normalizePendingPreferenceFocuses(
    update.pendingFocuses.length
      ? update.pendingFocuses
      : input.state.pendingFocuses.filter((focus) => focus !== input.state.currentFocus),
    `${input.state.resumeExcerpt}\n${input.answer}`
  ).filter((focus) => focus !== input.state.currentFocus);
  const currentFocus = (isPreferenceFocus(update.nextFocus as ConsultationFocus)
    ? update.nextFocus
    : pendingFocuses[0] ?? "role_preference") as ConsultationFocus;
  const strengths = clampList(update.strengths.length ? update.strengths : input.state.strengths);
  const gaps = clampList(update.gaps.length ? update.gaps : input.state.gaps);

  return {
    ...input.state,
    source: getOpenAIClient() ? "openai" : "fallback",
    round: done ? input.state.round : input.state.round + 1,
    strengths,
    gaps,
    pendingFocuses,
    currentFocus,
    currentQuestion: "",
    turns: nextTurns,
    finalSummary: done
      ? buildFinalSummary({
          ...input.state,
          turns: nextTurns,
          strengths,
          gaps
        })
      : null,
    done
  };
}

export async function createQuestionStream(state: ConsultationState): Promise<StreamChunk> {
  return streamQuestionWithOpenAI(state);
}

export async function materializeQuestion(state: ConsultationState) {
  const { source, stream } = await createQuestionStream(state);
  const question = await collectStream(stream);

  return {
    source,
    state: {
      ...state,
      source,
      currentQuestion: question
    }
  };
}
