import { z } from "zod";

export const companySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  category: z.enum(["internet-major", "ai-company"]),
  logoMark: z.string()
});

export const jobLeadSchema = z.object({
  id: z.string(),
  companyId: z.string(),
  roleName: z.literal("AI 产品经理"),
  title: z.string(),
  city: z.string(),
  seniority: z.string(),
  sourceConfidence: z.number().min(0).max(100),
  summary: z.string(),
  extractedRequirements: z.array(z.string()),
  recommendationReasons: z.array(z.string()).length(3),
  riskReminder: z.string(),
  salaryBand: z.string()
});

export const xhsPostSchema = z.object({
  id: z.string(),
  companyId: z.string(),
  roleId: z.string(),
  title: z.string(),
  excerpt: z.string(),
  sourceUrl: z.string().url().optional(),
  publishTime: z.string(),
  authorName: z.string(),
  topic: z.string(),
  stage: z.string(),
  ocrText: z.string(),
  confidenceLabel: z.literal("高置信岗位线索")
});

export const recommendationResultSchema = z.object({
  id: z.string(),
  jobLeadId: z.string(),
  score: z.number().min(0).max(100),
  reasons: z.array(z.string()).length(3),
  riskReminder: z.string()
});

export const candidateProfileSchema = z.object({
  id: z.string(),
  userId: z.string(),
  heroRole: z.literal("AI 产品经理"),
  baseProfile: z.object({
    education: z.array(z.string()),
    internships: z.array(z.string()),
    projects: z.array(z.string()),
    skills: z.array(z.string()),
    targetCities: z.array(z.string())
  }),
  capabilityTags: z.array(z.string()),
  aiPmFit: z.object({
    score: z.number().min(0).max(100),
    strengths: z.array(z.string()),
    gaps: z.array(z.string()),
    nextActions: z.array(z.string())
  })
});

export const fitAnalysisSchema = z.object({
  jobLeadId: z.string(),
  strengths: z.array(z.string()),
  gaps: z.array(z.string()),
  jdGapMap: z.array(
    z.object({
      label: z.string(),
      current: z.string(),
      target: z.string()
    })
  ),
  summary: z.string()
});

export const interviewTurnSchema = z.object({
  id: z.string(),
  phase: z.enum(["manager", "hr"]),
  question: z.string(),
  coachingFocus: z.string(),
  dimension: z.string()
});

export const interviewSummarySchema = z.object({
  scoreByDimension: z.array(
    z.object({
      dimension: z.string(),
      score: z.number().min(0).max(10),
      note: z.string()
    })
  ),
  overallTakeaway: z.string(),
  nextActions: z.array(z.string())
});

export const resumeSuggestionSchema = z.object({
  id: z.string(),
  original: z.string(),
  rewritten: z.string(),
  reason: z.string()
});

export const adminSnapshotSchema = z.object({
  totalPosts: z.number(),
  totalRoles: z.number(),
  companies: z.array(
    z.object({
      companyId: z.string(),
      companyName: z.string(),
      postCount: z.number()
    })
  ),
  roleOverview: z.array(
    z.object({
      roleName: z.string(),
      postCount: z.number()
    })
  )
});

export type Company = z.infer<typeof companySchema>;
export type JobLead = z.infer<typeof jobLeadSchema>;
export type XhsPost = z.infer<typeof xhsPostSchema>;
export type RecommendationResult = z.infer<typeof recommendationResultSchema>;
export type CandidateProfile = z.infer<typeof candidateProfileSchema>;
export type FitAnalysis = z.infer<typeof fitAnalysisSchema>;
export type InterviewTurn = z.infer<typeof interviewTurnSchema>;
export type InterviewSummary = z.infer<typeof interviewSummarySchema>;
export type ResumeSuggestion = z.infer<typeof resumeSuggestionSchema>;
export type AdminSnapshot = z.infer<typeof adminSnapshotSchema>;
