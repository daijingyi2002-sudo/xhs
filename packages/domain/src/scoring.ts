import type { CandidateProfile, JobLead, RecommendationResult } from "./schemas";

const WEIGHTS = {
  aiUnderstanding: 0.32,
  projectStrength: 0.24,
  productMethod: 0.18,
  dataAnalysis: 0.14,
  userResearch: 0.12
};

const keywordMatch = (haystack: string[], needles: string[]) =>
  needles.reduce((score, needle) => score + (haystack.some((item) => item.includes(needle)) ? 1 : 0), 0);

export function scoreJobLead(profile: CandidateProfile, lead: JobLead): number {
  const requirements = lead.extractedRequirements;
  const tags = profile.capabilityTags;

  const aiUnderstanding = keywordMatch(tags, ["AI", "LLM", "模型"]) / 2;
  const projectStrength = keywordMatch(profile.baseProfile.projects, ["Agent", "产品", "知识库"]) / 3;
  const productMethod = keywordMatch(tags, ["产品", "结构化"]) / 2;
  const dataAnalysis = keywordMatch(tags, ["数据"]) / 1;
  const userResearch = keywordMatch(tags, ["用户洞察", "用户研究"]) / 1;

  const weighted =
    aiUnderstanding * WEIGHTS.aiUnderstanding +
    projectStrength * WEIGHTS.projectStrength +
    productMethod * WEIGHTS.productMethod +
    dataAnalysis * WEIGHTS.dataAnalysis +
    userResearch * WEIGHTS.userResearch;

  const evidenceBoost = lead.sourceConfidence / 1000;
  const cityBoost = profile.baseProfile.targetCities.includes(lead.city) ? 0.05 : 0;
  const requirementBoost = Math.min(requirements.length / 20, 0.08);

  return Math.round(Math.min((weighted + evidenceBoost + cityBoost + requirementBoost) * 100, 98));
}

export function rankRecommendations(profile: CandidateProfile, leads: JobLead[]): RecommendationResult[] {
  return leads
    .map((lead) => ({
      id: `rec-${lead.id}`,
      jobLeadId: lead.id,
      score: scoreJobLead(profile, lead),
      reasons: lead.recommendationReasons,
      riskReminder: lead.riskReminder
    }))
    .sort((a, b) => b.score - a.score);
}
