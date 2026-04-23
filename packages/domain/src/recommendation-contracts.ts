import { z } from "zod";

export const recommendationDimensionSchema = z.enum([
  "ai_llm_understanding",
  "project_experience",
  "product_methodology",
  "data_analysis",
  "user_research"
]);

export const recommendationEvidenceSourceSchema = z.enum(["resume", "qa"]);
export const recommendationIntentDirectionSchema = z.enum(["ai", "tool", "content", "commerce", "community", "general"]);
export const recommendationWorkStyleSchema = z.enum(["big-tech", "growth-stage", "high-intensity", "stability"]);

export const recommendationEvidencePointSchema = z.object({
  text: z.string(),
  source: recommendationEvidenceSourceSchema,
  weak: z.boolean().default(false)
});

export const recommendationDimensionSignalSchema = z.object({
  dimension: recommendationDimensionSchema,
  score: z.number().min(0).max(100),
  resumeScore: z.number().min(0).max(100),
  qaScore: z.number().min(0).max(100),
  evidence: z.array(recommendationEvidencePointSchema).max(6),
  weakEvidence: z.boolean(),
  note: z.string()
});

export const recommendationEvidenceBucketSchema = z.object({
  summary: z.string(),
  evidencePoints: z.array(recommendationEvidencePointSchema).max(12),
  targetCities: z.array(z.string()).max(6),
  preferredCompanies: z.array(z.string()).max(15),
  dimensions: z.array(recommendationDimensionSignalSchema).length(5)
});

export const recommendationAbilityProfileSchema = z.object({
  summary: z.string(),
  evidencePoints: z.array(recommendationEvidencePointSchema).max(12),
  dimensions: z.array(recommendationDimensionSignalSchema).length(5)
});

export const recommendationIntentProfileSchema = z.object({
  summary: z.string(),
  evidencePoints: z.array(recommendationEvidencePointSchema).max(12),
  targetCities: z.array(z.string()).max(6),
  preferredCompanies: z.array(z.string()).max(15),
  preferredDirections: z.array(recommendationIntentDirectionSchema).max(6),
  workStylePreferences: z.array(recommendationWorkStyleSchema).max(6)
});

export const recommendationMergedProfileSchema = z.object({
  summary: z.string(),
  evidencePoints: z.array(recommendationEvidencePointSchema).max(12),
  targetCities: z.array(z.string()).max(6),
  preferredCompanies: z.array(z.string()).max(15),
  preferredDirections: z.array(recommendationIntentDirectionSchema).max(6),
  workStylePreferences: z.array(recommendationWorkStyleSchema).max(6),
  dimensions: z.array(recommendationDimensionSignalSchema).length(5),
  conflictNotes: z.array(z.string()).max(6)
});

export const recommendationCandidateProfileInputSchema = z.object({
  id: z.string(),
  source: z.literal("consultation"),
  summary: z.string(),
  consultationSummary: z.string().nullable(),
  evidencePoints: z.array(recommendationEvidencePointSchema).max(12),
  strengths: z.array(z.string()).max(8),
  gaps: z.array(z.string()).max(8),
  targetCities: z.array(z.string()).max(6),
  preferredCompanies: z.array(z.string()).max(15),
  dimensions: z.array(recommendationDimensionSignalSchema).length(5),
  resumeEvidence: recommendationEvidenceBucketSchema,
  qaEvidence: recommendationEvidenceBucketSchema,
  abilityProfile: recommendationAbilityProfileSchema,
  intentProfile: recommendationIntentProfileSchema,
  mergedProfile: recommendationMergedProfileSchema,
  trace: z.object({
    resumeExcerpt: z.string(),
    turnSummaries: z.array(z.string()).max(6)
  })
});

export const recommendationJobSeedSchema = z.object({
  id: z.string(),
  companyId: z.string(),
  companyName: z.string(),
  roleTitle: z.literal("AI 产品经理"),
  jobTitle: z.string(),
  city: z.string(),
  summary: z.string(),
  requirements: z.array(z.string()).min(3).max(8),
  preferredSignals: z.array(z.string()).min(3).max(8),
  riskHints: z.array(z.string()).min(1).max(4),
  sourceType: z.literal("高置信岗位线索"),
  sourceConfidence: z.number().min(0).max(100),
  dimensionWeights: z.record(recommendationDimensionSchema, z.number().min(0).max(1)),
  retrievalText: z.string()
});

export const recommendationScoreDimensionSchema = z.object({
  dimension: recommendationDimensionSchema,
  candidateScore: z.number().min(0).max(100),
  resumeScore: z.number().min(0).max(100),
  qaScore: z.number().min(0).max(100),
  weight: z.number().min(0).max(1),
  weightedScore: z.number().min(0).max(100),
  matchedEvidence: z.array(recommendationEvidencePointSchema).max(3),
  weakEvidence: z.boolean()
});

export const recommendationScoreBreakdownSchema = z.object({
  totalScore: z.number().min(0).max(100),
  abilityScore: z.number().min(0).max(100),
  intentMatchWeight: z.number().min(0).max(2),
  intentMatchScore: z.number().min(0).max(100),
  retrievalScore: z.number().min(0).max(100),
  cityScore: z.number().min(0).max(100),
  sourceConfidenceScore: z.number().min(0).max(100),
  dimensions: z.array(recommendationScoreDimensionSchema).length(5)
});

export const recommendationAnalysisPreviewSchema = z.object({
  strengths: z.array(z.string()).max(4),
  gaps: z.array(z.string()).max(4),
  jdGapMap: z.array(
    z.object({
      label: z.string(),
      current: z.string(),
      target: z.string()
    })
  ).max(5),
  interviewCta: z.string(),
  score: z.number().min(0).max(100)
});

export const fitAnalysisAbilityStatusSchema = z.enum(["strong", "medium", "weak"]);

export const fitAnalysisReasonSchema = z.object({
  title: z.string(),
  detail: z.string(),
  source: recommendationEvidenceSourceSchema,
  weakEvidence: z.boolean().default(false)
});

export const fitAnalysisAbilityItemSchema = z.object({
  dimension: recommendationDimensionSchema,
  label: z.string(),
  status: fitAnalysisAbilityStatusSchema,
  score: z.number().min(0).max(100),
  explanation: z.string(),
  evidenceSource: z.literal("resume"),
  evidence: z.array(z.string()).max(2),
  weakEvidence: z.boolean().default(false)
});

export const fitAnalysisIntentSummarySchema = z.object({
  targetCities: z.array(z.string()).max(6),
  preferredDirections: z.array(recommendationIntentDirectionSchema).max(6),
  preferredCompanies: z.array(z.string()).max(15),
  workStylePreferences: z.array(recommendationWorkStyleSchema).max(6),
  reasons: z.array(z.string()).max(3)
});

export const fitAnalysisResponseSchema = z.object({
  jobId: z.string(),
  company: z.string(),
  roleTitle: z.string(),
  city: z.string(),
  sourceType: z.literal("高置信岗位线索"),
  overallScore: z.number().min(0).max(100),
  whyRecommended: z.array(fitAnalysisReasonSchema).min(2).max(3),
  abilityMatch: z.array(fitAnalysisAbilityItemSchema).min(3).max(5),
  intentSummary: fitAnalysisIntentSummarySchema,
  strengths: z.array(z.string()).max(4),
  gaps: z.array(z.string()).max(4),
  jdGapMap: recommendationAnalysisPreviewSchema.shape.jdGapMap,
  nextSteps: z.array(z.string()).min(2).max(3),
  interviewCta: z.string(),
  scoreBreakdown: recommendationScoreBreakdownSchema
});

export const recommendationResultCardSchema = z.object({
  id: z.string(),
  jobId: z.string(),
  company: z.string(),
  roleTitle: z.string(),
  city: z.string(),
  sourceType: z.literal("高置信岗位线索"),
  matchScore: z.number().min(0).max(100),
  matchReasons: z.array(z.string()).length(3),
  riskReminder: z.string(),
  summary: z.string(),
  scoreBreakdown: recommendationScoreBreakdownSchema,
  analysisPreview: recommendationAnalysisPreviewSchema
});

export const topRecommendationResponseSchema = z.object({
  profileId: z.string(),
  generatedAt: z.string(),
  recommendations: z.array(recommendationResultCardSchema).length(5)
});

export type RecommendationDimension = z.infer<typeof recommendationDimensionSchema>;
export type RecommendationEvidenceSource = z.infer<typeof recommendationEvidenceSourceSchema>;
export type RecommendationIntentDirection = z.infer<typeof recommendationIntentDirectionSchema>;
export type RecommendationWorkStyle = z.infer<typeof recommendationWorkStyleSchema>;
export type RecommendationEvidencePoint = z.infer<typeof recommendationEvidencePointSchema>;
export type RecommendationDimensionSignal = z.infer<typeof recommendationDimensionSignalSchema>;
export type RecommendationEvidenceBucket = z.infer<typeof recommendationEvidenceBucketSchema>;
export type RecommendationAbilityProfile = z.infer<typeof recommendationAbilityProfileSchema>;
export type RecommendationIntentProfile = z.infer<typeof recommendationIntentProfileSchema>;
export type RecommendationCandidateProfileInput = z.infer<typeof recommendationCandidateProfileInputSchema>;
export type RecommendationJobSeed = z.infer<typeof recommendationJobSeedSchema>;
export type RecommendationScoreDimension = z.infer<typeof recommendationScoreDimensionSchema>;
export type RecommendationScoreBreakdown = z.infer<typeof recommendationScoreBreakdownSchema>;
export type RecommendationAnalysisPreview = z.infer<typeof recommendationAnalysisPreviewSchema>;
export type FitAnalysisReason = z.infer<typeof fitAnalysisReasonSchema>;
export type FitAnalysisAbilityItem = z.infer<typeof fitAnalysisAbilityItemSchema>;
export type FitAnalysisIntentSummary = z.infer<typeof fitAnalysisIntentSummarySchema>;
export type FitAnalysisResponse = z.infer<typeof fitAnalysisResponseSchema>;
export type RecommendationResultCard = z.infer<typeof recommendationResultCardSchema>;
export type TopRecommendationResponse = z.infer<typeof topRecommendationResponseSchema>;
