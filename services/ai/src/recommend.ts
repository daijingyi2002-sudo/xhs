import { fitAnalyses, jobLeads, phase1RecommendationJobSeeds } from "@xhs/domain";
import type {
  FitAnalysis,
  FitAnalysisAbilityItem,
  FitAnalysisIntentSummary,
  FitAnalysisReason,
  FitAnalysisResponse,
  JobLead,
  RecommendationAnalysisPreview,
  RecommendationCandidateProfileInput,
  RecommendationDimension,
  RecommendationEvidencePoint,
  RecommendationIntentDirection,
  RecommendationJobSeed,
  RecommendationResultCard,
  RecommendationScoreBreakdown,
  RecommendationWorkStyle,
  TopRecommendationResponse
} from "@xhs/domain";

type RetrievalMatch = {
  jobId: string;
  score: number;
};

type DimensionEvidenceSelection = {
  dimension: RecommendationDimension;
  points: RecommendationEvidencePoint[];
};

export type RecommendationRetrievalAdapter = {
  name: string;
  available: boolean;
  rank: (query: RecommendationCandidateProfileInput, jobs: RecommendationJobSeed[]) => Promise<RetrievalMatch[]>;
};

const dimensionLabels: Record<RecommendationDimension, string> = {
  ai_llm_understanding: "AI / LLM 理解",
  project_experience: "项目经历",
  product_methodology: "产品方法论",
  data_analysis: "数据分析",
  user_research: "用户研究"
};

const dimensionJudgements: Record<
  RecommendationDimension,
  { strong: string; medium: string; missing: string }
> = {
  ai_llm_understanding: {
    strong: "有 AI 应用相关经历，方向贴近岗位要求。",
    medium: "有 AI 相关接触，但落地深度还需后续验证。",
    missing: "暂未看到明确的 AI 应用落地经历。"
  },
  project_experience: {
    strong: "有项目推进与落地经历，能支撑岗位基本要求。",
    medium: "有项目参与经历，但完整度还需要进一步确认。",
    missing: "暂未看到完整的项目推进或落地案例。"
  },
  product_methodology: {
    strong: "有需求分析和产品推进经历，体现基础产品方法。",
    medium: "有产品相关参与，但方法论证据还不够完整。",
    missing: "暂未看到明确的需求分析或产品优化经历。"
  },
  data_analysis: {
    strong: "有数据处理或分析经历，能支撑岗位基础判断。",
    medium: "有数据相关经历，但量化结果还不够明确。",
    missing: "暂未看到明确的数据采集、处理或指标分析经历。"
  },
  user_research: {
    strong: "有用户反馈或调研经历，体现用户理解能力。",
    medium: "有用户相关经历，但反馈闭环还不够明确。",
    missing: "暂未看到明确的用户访谈、反馈整理或研究经历。"
  }
};

const dimensionKeywords: Record<RecommendationDimension, string[]> = {
  ai_llm_understanding: ["AI", "LLM", "大模型", "模型", "Agent", "RAG", "提示词", "智能体", "问答", "检索"],
  project_experience: ["项目", "负责", "推进", "上线", "落地", "协作", "计划", "跟进", "主导", "结果"],
  product_methodology: ["需求", "分析", "优化", "反馈", "产品", "方案", "取舍", "优先级", "迭代", "流程"],
  data_analysis: ["数据", "SQL", "分析", "指标", "实验", "转化", "留存", "处理", "报表", "漏斗"],
  user_research: ["访谈", "调研", "问卷", "反馈", "洞察", "用户", "画像", "痛点"]
};

const noisePatterns = [
  /@/,
  /\b1\d{10}\b/,
  /\b\d{5,}\b/,
  /ISSN/i,
  /doi/i,
  /论文/i,
  /排名/i,
  /GPA/i,
  /邮箱/i,
  /电话/i,
  /手机号/i,
  /学校官网/i
];

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function unique(items: string[]) {
  return Array.from(new Set(items.map((item) => normalizeWhitespace(item)).filter(Boolean)));
}

function tokenize(value: string) {
  const normalized = normalizeWhitespace(value.toLowerCase());
  const words = normalized.match(/[a-z0-9+/.-]+/g) ?? [];
  const cjkSegments = normalized.match(/[\u4e00-\u9fff]{2,}/g) ?? [];
  const cjkBigrams = cjkSegments.flatMap((segment) => {
    const parts: string[] = [];
    for (let index = 0; index < segment.length - 1; index += 1) {
      parts.push(segment.slice(index, index + 2));
    }
    return parts;
  });

  return unique([...words, ...cjkBigrams]);
}

function cosineSimilarity(left: string[], right: string[]) {
  if (!left.length || !right.length) return 0;

  const leftMap = new Map<string, number>();
  const rightMap = new Map<string, number>();

  for (const token of left) {
    leftMap.set(token, (leftMap.get(token) ?? 0) + 1);
  }

  for (const token of right) {
    rightMap.set(token, (rightMap.get(token) ?? 0) + 1);
  }

  const allTokens = unique([...left, ...right]);
  let dot = 0;
  let leftNorm = 0;
  let rightNorm = 0;

  for (const token of allTokens) {
    const leftValue = leftMap.get(token) ?? 0;
    const rightValue = rightMap.get(token) ?? 0;
    dot += leftValue * rightValue;
    leftNorm += leftValue * leftValue;
    rightNorm += rightValue * rightValue;
  }

  if (!leftNorm || !rightNorm) return 0;
  return dot / (Math.sqrt(leftNorm) * Math.sqrt(rightNorm));
}

export function createLexicalEmbeddingAdapter(): RecommendationRetrievalAdapter {
  return {
    name: "lexical-embedding-v1",
    available: true,
    async rank(query, jobs) {
      const queryText = [
        query.abilityProfile.summary,
        ...query.abilityProfile.evidencePoints.map((item) => item.text),
        ...query.intentProfile.evidencePoints.map((item) => item.text),
        ...query.intentProfile.targetCities,
        ...query.intentProfile.preferredCompanies,
        ...query.intentProfile.preferredDirections,
        ...query.intentProfile.workStylePreferences
      ].join(" ");
      const queryTokens = tokenize(queryText);

      return jobs
        .map((job) => ({
          jobId: job.id,
          score: Math.round(cosineSimilarity(queryTokens, tokenize(job.retrievalText)) * 100)
        }))
        .sort((left, right) => right.score - left.score);
    }
  };
}

export function createUnavailableRetrievalAdapter(): RecommendationRetrievalAdapter {
  return {
    name: "unavailable",
    available: false,
    async rank() {
      return [];
    }
  };
}

function getAbilitySignal(profile: RecommendationCandidateProfileInput, dimension: RecommendationDimension) {
  return profile.abilityProfile.dimensions.find((item) => item.dimension === dimension);
}

function inferJobDirections(job: RecommendationJobSeed): RecommendationIntentDirection[] {
  const corpus = `${job.jobTitle} ${job.summary} ${job.requirements.join(" ")} ${job.preferredSignals.join(" ")}`;
  const directions: RecommendationIntentDirection[] = [];

  if (/AI|大模型|Agent|RAG/.test(corpus)) directions.push("ai");
  if (/工具|效率|助手|平台/.test(corpus)) directions.push("tool");
  if (/内容|创作/.test(corpus)) directions.push("content");
  if (/电商|商家|经营/.test(corpus)) directions.push("commerce");
  if (/社区|创作者/.test(corpus)) directions.push("community");

  return directions.length > 0 ? directions : ["general"];
}

function inferJobWorkStyles(job: RecommendationJobSeed): RecommendationWorkStyle[] {
  const corpus = `${job.companyName} ${job.jobTitle} ${job.summary}`;
  const styles: RecommendationWorkStyle[] = [];

  if (/字节|腾讯|阿里|美团|百度|京东|华为|蚂蚁/.test(corpus)) styles.push("big-tech");
  if (/节奏|增长|策略/.test(corpus)) styles.push("high-intensity");
  if (/平台|企业|稳定/.test(corpus)) styles.push("stability");

  return styles;
}

function buildIntentMatch(job: RecommendationJobSeed, profile: RecommendationCandidateProfileInput) {
  const targetCities = profile.intentProfile.targetCities;
  const preferredCompanies = profile.intentProfile.preferredCompanies;
  const preferredDirections = profile.intentProfile.preferredDirections;
  const workStyles = profile.intentProfile.workStylePreferences;

  const jobDirections = inferJobDirections(job);
  const jobWorkStyles = inferJobWorkStyles(job);

  let score = 55;
  let weight = 1;

  if (targetCities.length > 0) {
    score += targetCities.includes(job.city) ? 18 : -12;
    weight *= targetCities.includes(job.city) ? 1.08 : 0.92;
  }

  if (preferredCompanies.length > 0) {
    const companyMatched = preferredCompanies.includes(job.companyName);
    score += companyMatched ? 12 : 0;
    weight *= companyMatched ? 1.06 : 1;
  }

  if (preferredDirections.length > 0) {
    const directionMatched = preferredDirections.some((item) => jobDirections.includes(item));
    score += directionMatched ? 12 : -8;
    weight *= directionMatched ? 1.08 : 0.9;
  }

  if (workStyles.length > 0) {
    const styleMatched = workStyles.some((item) => jobWorkStyles.includes(item));
    score += styleMatched ? 8 : 0;
    weight *= styleMatched ? 1.04 : 1;
  }

  return {
    intentMatchScore: Math.max(0, Math.min(100, Math.round(score))),
    intentMatchWeight: Math.max(0.72, Math.min(1.22, Number(weight.toFixed(2)))),
    cityScore: targetCities.length > 0 ? (targetCities.includes(job.city) ? 100 : 35) : 55
  };
}

function buildScoreBreakdown(
  profile: RecommendationCandidateProfileInput,
  job: RecommendationJobSeed,
  retrievalScore: number
): RecommendationScoreBreakdown {
  const dimensions = (Object.keys(job.dimensionWeights) as RecommendationDimension[]).map((dimension) => {
    const signal = getAbilitySignal(profile, dimension);
    const candidateScore = signal?.score ?? 0;
    const resumeScore = signal?.resumeScore ?? 0;
    const weight = job.dimensionWeights[dimension];

    return {
      dimension,
      candidateScore,
      resumeScore,
      qaScore: 0,
      weight,
      weightedScore: Math.round(candidateScore * weight),
      matchedEvidence: (signal?.evidence ?? []).slice(0, 3),
      weakEvidence: false
    };
  });

  const abilityScore = Math.round(dimensions.reduce((sum, item) => sum + item.weightedScore, 0));
  const intent = buildIntentMatch(job, profile);
  const sourceConfidenceScore = job.sourceConfidence;
  const boostedAbility = Math.round(abilityScore * intent.intentMatchWeight);
  const totalScore = Math.round(
    boostedAbility * 0.78 + retrievalScore * 0.12 + sourceConfidenceScore * 0.1
  );

  return {
    totalScore: Math.min(100, totalScore),
    abilityScore,
    intentMatchWeight: intent.intentMatchWeight,
    intentMatchScore: intent.intentMatchScore,
    retrievalScore,
    cityScore: intent.cityScore,
    sourceConfidenceScore,
    dimensions
  };
}

function cleanEvidenceText(text: string) {
  let cleaned = normalizeWhitespace(text)
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "")
    .replace(/\b1\d{10}\b/g, "")
    .replace(/[（）()【】\[\]]/g, " ");

  cleaned = cleaned.replace(/[，。；、]+/g, "，");
  cleaned = cleaned.replace(/\s+/g, " ").trim();
  if (cleaned.length > 34) {
    cleaned = `${cleaned.slice(0, 34)}…`;
  }

  return cleaned;
}

function isNoiseEvidence(text: string) {
  const normalized = normalizeWhitespace(text);
  if (!normalized || normalized.length < 4) return true;
  return noisePatterns.some((pattern) => pattern.test(normalized));
}

function scoreEvidenceForDimension(
  point: RecommendationEvidencePoint,
  dimension: RecommendationDimension,
  job: RecommendationJobSeed
) {
  if (isNoiseEvidence(point.text)) return -100;

  const cleaned = cleanEvidenceText(point.text);
  const keywords = dimensionKeywords[dimension];
  const keywordHits = keywords.filter((keyword) => cleaned.includes(keyword)).length;
  const requirementHits = job.requirements.filter((item) => cleaned.includes(item)).length;
  const preferredHits = job.preferredSignals.filter((item) => cleaned.includes(item)).length;

  return keywordHits * 10 + requirementHits * 14 + preferredHits * 8 + 12;
}

function selectRelevantEvidenceForDimension(
  profile: RecommendationCandidateProfileInput,
  dimension: RecommendationDimension,
  job: RecommendationJobSeed,
  usedEvidence: Set<string>
): DimensionEvidenceSelection {
  const pool = profile.abilityProfile.evidencePoints;

  const ranked = pool
    .filter((point) => !usedEvidence.has(`${point.source}:${normalizeWhitespace(point.text)}`))
    .map((point) => ({
      point: {
        ...point,
        text: cleanEvidenceText(point.text)
      },
      score: scoreEvidenceForDimension(point, dimension, job)
    }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, 2)
    .map((item) => item.point);

  for (const point of ranked) {
    usedEvidence.add(`${point.source}:${normalizeWhitespace(point.text)}`);
  }

  return {
    dimension,
    points: ranked
  };
}

function truncateReason(text: string) {
  const normalized = normalizeWhitespace(text);
  return normalized.length <= 60 ? normalized : `${normalized.slice(0, 58)}…`;
}

function buildDimensionReason(
  selection: DimensionEvidenceSelection,
  breakdown: RecommendationScoreBreakdown
) {
  const dimensionBreakdown = breakdown.dimensions.find((item) => item.dimension === selection.dimension);
  const score = dimensionBreakdown?.candidateScore ?? 0;
  const label = dimensionLabels[selection.dimension];
  const judgement = dimensionJudgements[selection.dimension];

  if (selection.points.length === 0) {
    return truncateReason(`${label}：${judgement.missing}`);
  }

  const evidenceShort = selection.points.map((item) => item.text).join("；");

  if (score >= 70) {
    return truncateReason(`${label}：${judgement.strong} 证据：${evidenceShort}`);
  }

  return truncateReason(`${label}：${judgement.medium} 证据：${evidenceShort}`);
}

function buildIntentReason(profile: RecommendationCandidateProfileInput, job: RecommendationJobSeed) {
  const reasons: string[] = [];

  if (profile.intentProfile.targetCities.includes(job.city)) {
    reasons.push(`职业意图：对话里明确更倾向${job.city}岗位。`);
  }

  if (profile.intentProfile.preferredCompanies.includes(job.companyName)) {
    reasons.push(`职业意图：对话里提到优先考虑${job.companyName}。`);
  }

  const jobDirections = inferJobDirections(job);
  const matchedDirection = profile.intentProfile.preferredDirections.find((item) => jobDirections.includes(item));
  if (matchedDirection && matchedDirection !== "general") {
    reasons.push(`职业意图：对话里表达了更想做${matchedDirection === "ai" ? "AI" : matchedDirection === "tool" ? "工具" : matchedDirection === "content" ? "内容" : matchedDirection === "commerce" ? "电商" : "社区"}方向。`);
  }

  return reasons[0] ? truncateReason(reasons[0]) : null;
}

function buildMatchReasons(
  profile: RecommendationCandidateProfileInput,
  job: RecommendationJobSeed,
  breakdown: RecommendationScoreBreakdown
) {
  const usedEvidence = new Set<string>();
  const topDimensions = [...breakdown.dimensions]
    .sort((left, right) => right.weightedScore - left.weightedScore)
    .slice(0, 2);

  const reasons = topDimensions.map((item) =>
    buildDimensionReason(selectRelevantEvidenceForDimension(profile, item.dimension, job, usedEvidence), breakdown)
  );

  const intentReason = buildIntentReason(profile, job);
  if (intentReason) {
    reasons.push(intentReason);
  } else if (breakdown.intentMatchWeight > 1.03) {
    reasons.push("职业意图：当前岗位方向与对话里表达的求职倾向较一致。");
  } else {
    reasons.push("职业意图：该岗位与当前偏好部分一致，可进入下一步验证。");
  }

  return unique(reasons).slice(0, 3);
}

function buildRiskReminder(
  profile: RecommendationCandidateProfileInput,
  breakdown: RecommendationScoreBreakdown
) {
  const weakest = [...breakdown.dimensions].sort((left, right) => left.candidateScore - right.candidateScore)[0];
  const weakestLabel = dimensionLabels[weakest.dimension];
  const intentStrong =
    profile.intentProfile.preferredDirections.length > 0 ||
    profile.intentProfile.preferredCompanies.length > 0 ||
    profile.intentProfile.targetCities.length > 0;
  const abilityWeak = weakest.candidateScore < 25;

  if (intentStrong && abilityWeak) {
    return `当前判断主要基于职业意图，但简历中未体现相关能力，尤其是${weakestLabel}。`;
  }

  if (weakest.dimension === "ai_llm_understanding") {
    return "暂未看到明确的 AI 应用落地经历。";
  }

  if (weakest.dimension === "data_analysis") {
    return "暂未看到量化指标结果或实验优化证据。";
  }

  if (weakest.dimension === "project_experience") {
    return "暂未看到完整的项目推进与协作案例。";
  }

  if (weakest.dimension === "product_methodology") {
    return "暂未看到明确的需求分析或产品优化证据。";
  }

  return "暂未看到明确的用户反馈或调研闭环。";
}

function buildAnalysisPreview(
  profile: RecommendationCandidateProfileInput,
  job: RecommendationJobSeed,
  breakdown: RecommendationScoreBreakdown,
  matchReasons: string[]
): RecommendationAnalysisPreview {
  const weakestDimensions = [...breakdown.dimensions]
    .sort((left, right) => left.weightedScore - right.weightedScore)
    .slice(0, 3);

  return {
    strengths: matchReasons.slice(0, 3),
    gaps: weakestDimensions.map((item) => `${dimensionLabels[item.dimension]}还缺少更完整的岗位相关证据。`),
    jdGapMap: weakestDimensions.map((item, index) => ({
      label: job.requirements[index] ?? dimensionLabels[item.dimension],
      current:
        item.matchedEvidence[0]?.text !== undefined
          ? cleanEvidenceText(item.matchedEvidence[0].text)
          : `暂未看到可直接支撑${dimensionLabels[item.dimension]}的证据。`,
      target: `补充能支撑“${job.requirements[index] ?? dimensionLabels[item.dimension]}”的短案例和结果。`
    })),
    interviewCta: `进入 ${job.companyName} / ${job.jobTitle} 的匹配分析与模拟面试`,
    score: breakdown.totalScore
  };
}

function toAbilityStatus(score: number): FitAnalysisAbilityItem["status"] {
  if (score >= 70) return "strong";
  if (score >= 40) return "medium";
  return "weak";
}

function buildAbilityMatch(
  profile: RecommendationCandidateProfileInput,
  job: RecommendationJobSeed,
  breakdown: RecommendationScoreBreakdown
): FitAnalysisAbilityItem[] {
  const usedEvidence = new Set<string>();

  return [...breakdown.dimensions]
    .sort((left, right) => right.weightedScore - left.weightedScore)
    .slice(0, 5)
    .map((item) => {
      const selection = selectRelevantEvidenceForDimension(profile, item.dimension, job, usedEvidence);
      const status = toAbilityStatus(item.candidateScore);
      const judgement = dimensionJudgements[item.dimension];
      const explanation =
        status === "strong" ? judgement.strong : status === "medium" ? judgement.medium : judgement.missing;

      return {
        dimension: item.dimension,
        label: dimensionLabels[item.dimension],
        status,
        score: item.candidateScore,
        explanation: truncateReason(explanation),
        evidenceSource: "resume",
        evidence: selection.points.map((point) => point.text).slice(0, 2),
        weakEvidence: selection.points.length === 0 || item.candidateScore < 40
      };
    });
}

function formatDirectionLabel(direction: RecommendationIntentDirection) {
  switch (direction) {
    case "ai":
      return "AI";
    case "tool":
      return "工具";
    case "content":
      return "内容";
    case "commerce":
      return "电商";
    case "community":
      return "社区";
    default:
      return "通用产品";
  }
}

function formatWorkStyleLabel(style: RecommendationWorkStyle) {
  switch (style) {
    case "big-tech":
      return "大厂";
    case "growth-stage":
      return "成长型团队";
    case "high-intensity":
      return "高节奏";
    default:
      return "稳定交付";
  }
}

function buildIntentSummary(
  profile: RecommendationCandidateProfileInput,
  job: RecommendationJobSeed
): FitAnalysisIntentSummary {
  const reasons: string[] = [];

  if (profile.intentProfile.targetCities.includes(job.city)) {
    reasons.push(`职业意图来源：你在对话里明确更倾向 ${job.city}。`);
  }

  if (profile.intentProfile.preferredCompanies.includes(job.companyName)) {
    reasons.push(`职业意图来源：你提到会优先考虑 ${job.companyName}。`);
  }

  const matchedDirection = profile.intentProfile.preferredDirections.find((item) =>
    inferJobDirections(job).includes(item)
  );
  if (matchedDirection) {
    reasons.push(`职业意图来源：你当前更想走 ${formatDirectionLabel(matchedDirection)} 方向。`);
  }

  if (reasons.length === 0) {
    reasons.push("当前对话里还没有特别强的岗位偏好，这条岗位更多是基于能力匹配进入推荐。");
  }

  return {
    targetCities: profile.intentProfile.targetCities,
    preferredDirections: profile.intentProfile.preferredDirections,
    preferredCompanies: profile.intentProfile.preferredCompanies,
    workStylePreferences: profile.intentProfile.workStylePreferences,
    reasons: reasons.slice(0, 3)
  };
}

function buildWhyRecommended(
  profile: RecommendationCandidateProfileInput,
  job: RecommendationJobSeed,
  breakdown: RecommendationScoreBreakdown
): FitAnalysisReason[] {
  const abilityMatch = buildAbilityMatch(profile, job, breakdown)
    .filter((item) => item.status !== "weak")
    .slice(0, 2)
    .map<FitAnalysisReason>((item) => ({
      title: `${item.label}能支撑当前岗位`,
      detail:
        item.evidence[0] !== undefined
          ? truncateReason(`${item.explanation} 证据：${item.evidence[0]}`)
          : truncateReason(item.explanation),
      source: "resume",
      weakEvidence: item.weakEvidence
    }));

  const intentSummary = buildIntentSummary(profile, job);
  const intentReason = intentSummary.reasons[0]
    ? {
        title: "当前职业意图与岗位方向相符",
        detail: truncateReason(intentSummary.reasons[0]),
        source: "qa" as const,
        weakEvidence: false
      }
    : null;

  return [...abilityMatch, ...(intentReason ? [intentReason] : [])].slice(0, 3);
}

function buildDetailedGaps(job: RecommendationJobSeed, breakdown: RecommendationScoreBreakdown) {
  return [...breakdown.dimensions]
    .sort((left, right) => left.candidateScore - right.candidateScore)
    .slice(0, 3)
    .map((item) => {
      if (item.dimension === "ai_llm_understanding") {
        return "暂未看到 AI / LLM 应用落地证据，后续很可能会被追问方案边界和实际判断。";
      }

      if (item.dimension === "data_analysis") {
        return "暂未看到量化指标分析或实验优化案例，数据判断链路还不够扎实。";
      }

      if (item.dimension === "project_experience") {
        return "暂未看到完整的项目推进与协作案例，岗位需要更清楚的推进闭环证据。";
      }

      if (item.dimension === "product_methodology") {
        return "暂未看到需求分析、方案取舍或产品优化证据，方法论表达还偏弱。";
      }

      const commerceHint = job.requirements.find((requirement) => /商家|经营|电商/.test(requirement));
      if (commerceHint) {
        return "暂未看到商家经营场景经验，若投递该方向岗位需要补更贴近业务的案例。";
      }

      return "暂未看到明确的用户研究或反馈闭环证据，用户洞察相关支撑还不够完整。";
    });
}

function buildNextSteps(
  profile: RecommendationCandidateProfileInput,
  job: RecommendationJobSeed,
  breakdown: RecommendationScoreBreakdown
) {
  const steps = [
    `先进入 ${job.companyName} / ${job.jobTitle} 的模拟面试，优先验证 ${dimensionLabels[[...breakdown.dimensions].sort((left, right) => left.candidateScore - right.candidateScore)[0].dimension]} 相关回答。`
  ];

  const weakest = [...breakdown.dimensions].sort((left, right) => left.candidateScore - right.candidateScore)[0];
  if (weakest.dimension === "data_analysis") {
    steps.push("把简历里和指标、转化、留存或实验结果相关的证据补成一段更完整的项目表述。");
  } else if (weakest.dimension === "ai_llm_understanding") {
    steps.push("补一段 AI / LLM 应用案例，至少讲清场景、方案取舍和最终结果。");
  } else {
    steps.push(`补一段能支撑 ${dimensionLabels[weakest.dimension]} 的短案例，并放进简历和后续面试回答里。`);
  }

  if (profile.intentProfile.preferredDirections.length > 0 && weakest.candidateScore < 30) {
    steps.push("方向匹配，但当前简历证据还不够，建议先做一轮简历优化再投递。");
  } else {
    steps.push("如果你准备继续推进，可以在完成模拟面试后再回到简历优化页补强短板。");
  }

  return steps.slice(0, 3);
}

async function buildRecommendationCards(
  profile: RecommendationCandidateProfileInput,
  options?: {
    retrievalAdapter?: RecommendationRetrievalAdapter;
  }
) {
  const retrievalAdapter = options?.retrievalAdapter ?? createLexicalEmbeddingAdapter();
  const retrievalMatches = retrievalAdapter.available
    ? await retrievalAdapter.rank(profile, phase1RecommendationJobSeeds)
    : [];
  const retrievalMap = new Map(retrievalMatches.map((item) => [item.jobId, item.score]));

  const recommendations: RecommendationResultCard[] = phase1RecommendationJobSeeds
    .map((job) => {
      const retrievalScore = retrievalMap.get(job.id) ?? 0;
      const scoreBreakdown = buildScoreBreakdown(profile, job, retrievalScore);
      const matchReasons = buildMatchReasons(profile, job, scoreBreakdown);

      return {
        id: `rec-${job.id}`,
        jobId: job.id,
        company: job.companyName,
        roleTitle: job.jobTitle,
        city: job.city,
        sourceType: job.sourceType,
        matchScore: scoreBreakdown.totalScore,
        matchReasons,
        riskReminder: buildRiskReminder(profile, scoreBreakdown),
        summary: job.summary,
        scoreBreakdown,
        analysisPreview: buildAnalysisPreview(profile, job, scoreBreakdown, matchReasons)
      };
    })
    .filter((item) => item.scoreBreakdown.intentMatchWeight >= 0.8)
    .sort((left, right) => right.matchScore - left.matchScore)
    .slice(0, 5);

  return recommendations;
}

export async function getTopRecommendations(
  profile: RecommendationCandidateProfileInput,
  options?: {
    retrievalAdapter?: RecommendationRetrievalAdapter;
  }
): Promise<TopRecommendationResponse> {
  const recommendations = await buildRecommendationCards(profile, options);

  return {
    profileId: profile.id,
    generatedAt: new Date().toISOString(),
    recommendations
  };
}

export async function getFitAnalysisForJob(
  profile: RecommendationCandidateProfileInput,
  jobId: string,
  options?: {
    retrievalAdapter?: RecommendationRetrievalAdapter;
  }
): Promise<FitAnalysisResponse | null> {
  const recommendations = await buildRecommendationCards(profile, options);
  const match = recommendations.find((item) => item.jobId === jobId);

  if (!match) {
    return null;
  }

  const job = phase1RecommendationJobSeeds.find((item) => item.id === jobId);
  if (!job) {
    return null;
  }

  return {
    jobId: match.jobId,
    company: match.company,
    roleTitle: match.roleTitle,
    city: match.city,
    sourceType: match.sourceType,
    overallScore: match.matchScore,
    whyRecommended: buildWhyRecommended(profile, job, match.scoreBreakdown),
    abilityMatch: buildAbilityMatch(profile, job, match.scoreBreakdown),
    intentSummary: buildIntentSummary(profile, job),
    strengths: match.analysisPreview.strengths,
    gaps: buildDetailedGaps(job, match.scoreBreakdown),
    jdGapMap: match.analysisPreview.jdGapMap,
    nextSteps: buildNextSteps(profile, job, match.scoreBreakdown),
    interviewCta: match.analysisPreview.interviewCta,
    scoreBreakdown: match.scoreBreakdown
  };
}

function mapSeedToLegacyJobLead(job: RecommendationJobSeed): JobLead {
  return {
    id: job.id,
    companyId: job.companyId,
    roleName: "AI 产品经理" as JobLead["roleName"],
    title: job.jobTitle,
    city: job.city,
    seniority: "校招 / 应届",
    sourceConfidence: job.sourceConfidence,
    summary: job.summary,
    extractedRequirements: job.requirements,
    recommendationReasons: buildLegacyRecommendationReasons(job),
    riskReminder: job.riskHints[0] ?? "需要补充更扎实的项目案例。",
    salaryBand: "面议"
  };
}

function buildLegacyRecommendationReasons(job: RecommendationJobSeed) {
  return [
    `该线索更看重${job.preferredSignals[0] ?? "AI 产品理解"}。`,
    `当前方向与${job.companyName}的 ${job.jobTitle} 线索存在直接关联。`,
    "适合进入下一步匹配分析与模拟面试验证。"
  ] as [string, string, string];
}

export function getJobLead(jobLeadId: string): JobLead | undefined {
  const seeded = phase1RecommendationJobSeeds.find((item) => item.id === jobLeadId);
  if (seeded) {
    return mapSeedToLegacyJobLead(seeded);
  }

  return jobLeads.find((lead) => lead.id === jobLeadId);
}

export function getFitAnalysis(jobLeadId: string): FitAnalysis {
  const seeded = phase1RecommendationJobSeeds.find((item) => item.id === jobLeadId);
  if (seeded) {
    const previewProfile: RecommendationCandidateProfileInput = {
      id: "preview",
      source: "consultation",
      summary: seeded.summary,
      consultationSummary: seeded.summary,
      evidencePoints: seeded.preferredSignals.map((item) => ({ text: item, source: "resume", weak: false })),
      strengths: seeded.preferredSignals,
      gaps: seeded.riskHints,
      targetCities: [],
      preferredCompanies: [],
      dimensions: (Object.keys(seeded.dimensionWeights) as RecommendationDimension[]).map((dimension) => ({
        dimension,
        score: Math.round(seeded.dimensionWeights[dimension] * 100),
        resumeScore: Math.round(seeded.dimensionWeights[dimension] * 100),
        qaScore: 0,
        evidence: [],
        weakEvidence: false,
        note: ""
      })),
      resumeEvidence: {
        summary: seeded.summary,
        evidencePoints: seeded.preferredSignals.map((item) => ({ text: item, source: "resume", weak: false })),
        targetCities: [],
        preferredCompanies: [],
        dimensions: (Object.keys(seeded.dimensionWeights) as RecommendationDimension[]).map((dimension) => ({
          dimension,
          score: Math.round(seeded.dimensionWeights[dimension] * 100),
          resumeScore: Math.round(seeded.dimensionWeights[dimension] * 100),
          qaScore: 0,
          evidence: [],
          weakEvidence: false,
          note: ""
        }))
      },
      qaEvidence: {
        summary: "",
        evidencePoints: [],
        targetCities: [],
        preferredCompanies: [],
        dimensions: (Object.keys(seeded.dimensionWeights) as RecommendationDimension[]).map((dimension) => ({
          dimension,
          score: 0,
          resumeScore: 0,
          qaScore: 0,
          evidence: [],
          weakEvidence: false,
          note: "QA 不参与能力评分。"
        }))
      },
      abilityProfile: {
        summary: seeded.summary,
        evidencePoints: seeded.preferredSignals.map((item) => ({ text: item, source: "resume", weak: false })),
        dimensions: (Object.keys(seeded.dimensionWeights) as RecommendationDimension[]).map((dimension) => ({
          dimension,
          score: Math.round(seeded.dimensionWeights[dimension] * 100),
          resumeScore: Math.round(seeded.dimensionWeights[dimension] * 100),
          qaScore: 0,
          evidence: [],
          weakEvidence: false,
          note: ""
        }))
      },
      intentProfile: {
        summary: "",
        evidencePoints: [],
        targetCities: [],
        preferredCompanies: [],
        preferredDirections: ["general"],
        workStylePreferences: []
      },
      mergedProfile: {
        summary: seeded.summary,
        evidencePoints: seeded.preferredSignals.map((item) => ({ text: item, source: "resume", weak: false })),
        targetCities: [],
        preferredCompanies: [],
        preferredDirections: ["general"],
        workStylePreferences: [],
        dimensions: (Object.keys(seeded.dimensionWeights) as RecommendationDimension[]).map((dimension) => ({
          dimension,
          score: Math.round(seeded.dimensionWeights[dimension] * 100),
          resumeScore: Math.round(seeded.dimensionWeights[dimension] * 100),
          qaScore: 0,
          evidence: [],
          weakEvidence: false,
          note: ""
        })),
        conflictNotes: []
      },
      trace: {
        resumeExcerpt: "",
        turnSummaries: []
      }
    };

    const breakdown = buildScoreBreakdown(previewProfile, seeded, 0);
    const reasons = buildMatchReasons(previewProfile, seeded, breakdown);
    const preview = buildAnalysisPreview(previewProfile, seeded, breakdown, reasons);

    return {
      jobLeadId,
      strengths: preview.strengths,
      gaps: preview.gaps,
      jdGapMap: preview.jdGapMap,
      summary: seeded.summary
    };
  }

  const legacyLead = getJobLead(jobLeadId);
  if (!legacyLead) {
    throw new Error(`Unknown job lead: ${jobLeadId}`);
  }

  return (
    fitAnalyses[jobLeadId] ?? {
      jobLeadId,
      strengths: legacyLead.recommendationReasons,
      gaps: [legacyLead.riskReminder],
      jdGapMap: legacyLead.extractedRequirements.map((requirement) => ({
        label: requirement,
        current: "已有基础信号",
        target: "需要更扎实的项目证据"
      })),
      summary: `${legacyLead.title} 对当前画像有一定匹配度，但仍需要补充更具体的项目结果和取舍判断。`
    }
  );
}
