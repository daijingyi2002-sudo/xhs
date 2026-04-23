import type { ConsultationState } from "./consultation";
import type {
  RecommendationAbilityProfile,
  RecommendationCandidateProfileInput,
  RecommendationDimension,
  RecommendationDimensionSignal,
  RecommendationEvidenceBucket,
  RecommendationEvidencePoint,
  RecommendationIntentDirection,
  RecommendationIntentProfile,
  RecommendationWorkStyle
} from "@xhs/domain";

const dimensionLabels: Record<RecommendationDimension, string> = {
  ai_llm_understanding: "AI / LLM 理解",
  project_experience: "项目经历",
  product_methodology: "产品方法论",
  data_analysis: "数据分析",
  user_research: "用户研究"
};

const cityKeywords = ["北京", "上海", "杭州", "深圳", "广州", "成都", "合肥"];
const companyKeywords = [
  "字节跳动",
  "腾讯",
  "阿里巴巴",
  "美团",
  "拼多多",
  "百度",
  "快手",
  "小米",
  "小红书",
  "京东",
  "蚂蚁集团",
  "华为",
  "商汤科技",
  "科大讯飞",
  "寒武纪"
];

const dimensionKeywords: Record<RecommendationDimension, string[]> = {
  ai_llm_understanding: ["AI", "LLM", "大模型", "模型", "Agent", "RAG", "检索", "问答", "智能体", "prompt"],
  project_experience: ["项目", "负责", "推进", "上线", "落地", "结果", "复盘", "案例", "主导"],
  product_methodology: ["需求", "分析", "优化", "反馈", "产品", "方案", "取舍", "优先级", "迭代", "流程"],
  data_analysis: ["数据", "SQL", "漏斗", "转化", "留存", "分析", "实验", "A/B", "指标"],
  user_research: ["访谈", "调研", "反馈", "洞察", "用户研究", "问卷", "画像", "痛点"]
};

const intentDirectionMatchers: Array<{ direction: RecommendationIntentDirection; keywords: string[] }> = [
  { direction: "ai", keywords: ["AI", "大模型", "Agent", "RAG", "AI 产品"] },
  { direction: "tool", keywords: ["工具", "效率", "助手", "平台"] },
  { direction: "content", keywords: ["内容", "创作", "内容工具"] },
  { direction: "commerce", keywords: ["电商", "商家", "经营"] },
  { direction: "community", keywords: ["社区", "内容社区", "创作者"] }
];

const workStyleMatchers: Array<{ style: RecommendationWorkStyle; keywords: string[] }> = [
  { style: "big-tech", keywords: ["大厂", "平台", "头部"] },
  { style: "growth-stage", keywords: ["创业", "成长", "成长型"] },
  { style: "high-intensity", keywords: ["强度", "节奏快", "高强度"] },
  { style: "stability", keywords: ["稳定", "平衡", "节奏稳"] }
];

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function uniqueStrings(items: string[]) {
  return Array.from(new Set(items.map((item) => normalizeWhitespace(item)).filter(Boolean)));
}

function uniqueEvidence(items: RecommendationEvidencePoint[]) {
  const seen = new Set<string>();
  const result: RecommendationEvidencePoint[] = [];

  for (const item of items) {
    const key = `${item.source}:${normalizeWhitespace(item.text)}`;
    if (!item.text.trim() || seen.has(key)) continue;
    seen.add(key);
    result.push({
      text: normalizeWhitespace(item.text),
      source: item.source,
      weak: item.weak
    });
  }

  return result;
}

function extractNamedMatches(corpus: string, dictionary: string[]) {
  return uniqueStrings(dictionary.filter((item) => corpus.includes(item)));
}

function buildDimensionSignalFromResume(
  dimension: RecommendationDimension,
  evidencePoints: RecommendationEvidencePoint[]
): RecommendationDimensionSignal {
  const keywords = dimensionKeywords[dimension];
  const matchedEvidence = evidencePoints.filter((item) =>
    item.source === "resume" && keywords.some((keyword) => item.text.includes(keyword))
  );
  const resumeKeywordHits = matchedEvidence.reduce(
    (count, item) => count + keywords.filter((keyword) => item.text.includes(keyword)).length,
    0
  );

  const resumeScore = Math.min(100, matchedEvidence.length * 28 + resumeKeywordHits * 8);

  return {
    dimension,
    score: resumeScore,
    resumeScore,
    qaScore: 0,
    evidence: matchedEvidence.slice(0, 6),
    weakEvidence: false,
    note:
      matchedEvidence.length > 0
        ? `当前${dimensionLabels[dimension]}判断仅由简历与解析结果支撑。`
        : `当前材料里还没有足够的${dimensionLabels[dimension]}证据。`
  };
}

function buildResumeEvidence(state: ConsultationState): RecommendationEvidenceBucket {
  const evidencePoints = uniqueEvidence([
    { text: state.resumeExcerpt, source: "resume", weak: false },
    ...state.backgroundHighlights.map((item) => ({ text: item, source: "resume" as const, weak: false })),
    ...state.evidencePoints.map((item) => ({ text: item, source: "resume" as const, weak: false }))
  ]).slice(0, 12);
  const corpus = [state.resumeExcerpt, ...state.backgroundHighlights, ...state.evidencePoints].join(" ");
  const dimensions: RecommendationDimensionSignal[] = [
    buildDimensionSignalFromResume("ai_llm_understanding", evidencePoints),
    buildDimensionSignalFromResume("project_experience", evidencePoints),
    buildDimensionSignalFromResume("product_methodology", evidencePoints),
    buildDimensionSignalFromResume("data_analysis", evidencePoints),
    buildDimensionSignalFromResume("user_research", evidencePoints)
  ];

  return {
    summary:
      state.backgroundHighlights[0] ??
      state.resumeExcerpt.slice(0, 120) ??
      "简历中暂未提取到足够的明确信息。",
    evidencePoints,
    targetCities: extractNamedMatches(corpus, cityKeywords),
    preferredCompanies: extractNamedMatches(corpus, companyKeywords),
    dimensions
  };
}

function buildQaEvidence(state: ConsultationState): RecommendationEvidenceBucket {
  const qaPoints = uniqueEvidence([
    ...(state.turns.map((turn) => turn.answer).filter(Boolean).map((item) => ({
      text: item,
      source: "qa" as const,
      weak: true
    })) as RecommendationEvidencePoint[]),
    ...(state.turns.map((turn) => turn.answerSummary).filter(Boolean).map((item) => ({
      text: item,
      source: "qa" as const,
      weak: true
    })) as RecommendationEvidencePoint[]),
    ...(state.finalSummary ? [{ text: state.finalSummary, source: "qa" as const, weak: true }] : [])
  ]).slice(0, 12);
  const corpus = [
    ...state.turns.map((turn) => turn.answer),
    ...state.turns.map((turn) => turn.answerSummary),
    state.finalSummary ?? ""
  ].join(" ");

  return {
    summary: state.finalSummary ?? "对话暂未补充出足够的新信息。",
    evidencePoints: qaPoints,
    targetCities: extractNamedMatches(corpus, cityKeywords),
    preferredCompanies: extractNamedMatches(corpus, companyKeywords),
    dimensions: [
      {
        dimension: "ai_llm_understanding",
        score: 0,
        resumeScore: 0,
        qaScore: 0,
        evidence: [],
        weakEvidence: false,
        note: "QA 不参与能力评分。"
      },
      {
        dimension: "project_experience",
        score: 0,
        resumeScore: 0,
        qaScore: 0,
        evidence: [],
        weakEvidence: false,
        note: "QA 不参与能力评分。"
      },
      {
        dimension: "product_methodology",
        score: 0,
        resumeScore: 0,
        qaScore: 0,
        evidence: [],
        weakEvidence: false,
        note: "QA 不参与能力评分。"
      },
      {
        dimension: "data_analysis",
        score: 0,
        resumeScore: 0,
        qaScore: 0,
        evidence: [],
        weakEvidence: false,
        note: "QA 不参与能力评分。"
      },
      {
        dimension: "user_research",
        score: 0,
        resumeScore: 0,
        qaScore: 0,
        evidence: [],
        weakEvidence: false,
        note: "QA 不参与能力评分。"
      }
    ]
  };
}

function buildAbilityProfile(resumeEvidence: RecommendationEvidenceBucket): RecommendationAbilityProfile {
  return {
    summary: resumeEvidence.summary,
    evidencePoints: resumeEvidence.evidencePoints,
    dimensions: resumeEvidence.dimensions
  };
}

function extractIntentDirections(corpus: string) {
  const hits = intentDirectionMatchers
    .filter((item) => item.keywords.some((keyword) => corpus.includes(keyword)))
    .map((item) => item.direction);
  return hits.length > 0 ? Array.from(new Set(hits)) : (["general"] as RecommendationIntentDirection[]);
}

function extractWorkStylePreferences(corpus: string) {
  const hits = workStyleMatchers
    .filter((item) => item.keywords.some((keyword) => corpus.includes(keyword)))
    .map((item) => item.style);
  return uniqueStrings(hits) as RecommendationWorkStyle[];
}

function buildIntentProfile(qaEvidence: RecommendationEvidenceBucket): RecommendationIntentProfile {
  const corpus = qaEvidence.evidencePoints.map((item) => item.text).join(" ");

  return {
    summary: qaEvidence.summary,
    evidencePoints: qaEvidence.evidencePoints,
    targetCities: qaEvidence.targetCities,
    preferredCompanies: qaEvidence.preferredCompanies,
    preferredDirections: extractIntentDirections(corpus),
    workStylePreferences: extractWorkStylePreferences(corpus)
  };
}

function mergeProfiles(
  abilityProfile: RecommendationAbilityProfile,
  intentProfile: RecommendationIntentProfile,
  resumeEvidence: RecommendationEvidenceBucket,
  qaEvidence: RecommendationEvidenceBucket
) {
  const conflictNotes: string[] = [];

  if (
    resumeEvidence.targetCities.length > 0 &&
    intentProfile.targetCities.length > 0 &&
    intentProfile.targetCities.some((item) => !resumeEvidence.targetCities.includes(item))
  ) {
    conflictNotes.push("对话补充了新的城市偏好，但不会覆盖简历中已出现的城市事实。");
  }

  if (
    resumeEvidence.preferredCompanies.length > 0 &&
    intentProfile.preferredCompanies.length > 0 &&
    intentProfile.preferredCompanies.some((item) => !resumeEvidence.preferredCompanies.includes(item))
  ) {
    conflictNotes.push("对话补充了新的公司偏好，但不会覆盖简历中已出现的公司信息。");
  }

  return {
    summary: abilityProfile.summary,
    evidencePoints: uniqueEvidence([...resumeEvidence.evidencePoints, ...intentProfile.evidencePoints]).slice(0, 12),
    targetCities: intentProfile.targetCities.length > 0 ? intentProfile.targetCities : resumeEvidence.targetCities,
    preferredCompanies:
      intentProfile.preferredCompanies.length > 0
        ? uniqueStrings([...resumeEvidence.preferredCompanies, ...intentProfile.preferredCompanies]).slice(0, 15)
        : resumeEvidence.preferredCompanies,
    preferredDirections: intentProfile.preferredDirections,
    workStylePreferences: intentProfile.workStylePreferences,
    dimensions: abilityProfile.dimensions,
    conflictNotes
  };
}

export function buildRecommendationProfileFromConsultation(
  state: ConsultationState
): RecommendationCandidateProfileInput {
  const resumeEvidence = buildResumeEvidence(state);
  const qaEvidence = buildQaEvidence(state);
  const abilityProfile = buildAbilityProfile(resumeEvidence);
  const intentProfile = buildIntentProfile(qaEvidence);
  const mergedProfile = mergeProfiles(abilityProfile, intentProfile, resumeEvidence, qaEvidence);

  return {
    id: `consultation-${state.resumeName ?? "anonymous"}-${state.turns.length}`,
    source: "consultation",
    summary: abilityProfile.summary,
    consultationSummary: state.finalSummary,
    evidencePoints: mergedProfile.evidencePoints,
    strengths: state.strengths.slice(0, 8),
    gaps: state.gaps.slice(0, 8),
    targetCities: mergedProfile.targetCities,
    preferredCompanies: mergedProfile.preferredCompanies,
    dimensions: abilityProfile.dimensions,
    resumeEvidence,
    qaEvidence,
    abilityProfile,
    intentProfile,
    mergedProfile,
    trace: {
      resumeExcerpt: state.resumeExcerpt,
      turnSummaries: state.turns.map((turn) => turn.answerSummary).slice(0, 6)
    }
  };
}

export function createDemoRecommendationProfile(): RecommendationCandidateProfileInput {
  const mockState: ConsultationState = {
    version: 1,
    source: "fallback",
    round: 3,
    maxRounds: 3,
    resumeName: "demo-resume.txt",
    resumeExcerpt:
      "做过面向应届生的求职 Agent，负责简历解析、岗位推荐、RAG 检索、用户访谈与 SQL 指标分析。",
    profileSummary: "材料显示该候选人做过 AI 求职辅导相关项目，并有 SQL、用户访谈和产品拆解经验。",
    backgroundHighlights: [
      "做过求职 Agent 产品原型。",
      "负责过简历解析、岗位推荐、RAG 检索。",
      "有用户访谈和 SQL 指标分析经历。"
    ],
    strengths: [
      "材料明确提到：做过求职 Agent 产品原型。",
      "材料明确提到：有用户访谈和 SQL 指标分析经历。"
    ],
    gaps: ["仍需补充细节：商业表达与指标闭环。后续对话可继续澄清。"],
    evidencePoints: [
      "负责过简历解析、岗位推荐、RAG 检索。",
      "有用户访谈和 SQL 指标分析经历。"
    ],
    pendingFocuses: ["project_depth"],
    currentFocus: "project_depth",
    currentQuestion: "",
    turns: [
      {
        round: 1,
        focus: "project_depth",
        question: "如果看下一份工作方向，你更想靠近哪类产品？",
        answer: "我更想去上海或杭州，也更想找 AI 工具类产品方向，优先看大厂。",
        answerSummary: "补充了城市、方向和公司偏好。",
        learnedSignals: ["对话补充了职业意图。"],
        confidenceNote: "属于职业意图补充。"
      }
    ],
    finalSummary: "对话补充了上海、杭州、AI 工具方向和大厂偏好。",
    done: true
  };

  return buildRecommendationProfileFromConsultation(mockState);
}
