import {
  fitAnalyses,
  jobLeads,
  rankRecommendations,
  recommendationResults
} from "@xhs/domain";
import type { CandidateProfile, FitAnalysis, JobLead, RecommendationResult } from "@xhs/domain";

export function getTopRecommendations(profile: CandidateProfile): RecommendationResult[] {
  const ranked = rankRecommendations(profile, jobLeads);
  return ranked.length ? ranked.slice(0, 5) : recommendationResults.slice(0, 5);
}

export function getJobLead(jobLeadId: string): JobLead | undefined {
  return jobLeads.find((lead) => lead.id === jobLeadId);
}

export function getFitAnalysis(jobLeadId: string): FitAnalysis {
  const jobLead = getJobLead(jobLeadId);

  if (!jobLead) {
    throw new Error(`Unknown job lead: ${jobLeadId}`);
  }

  return (
    fitAnalyses[jobLeadId] ?? {
      jobLeadId,
      strengths: jobLead.recommendationReasons,
      gaps: [jobLead.riskReminder],
      jdGapMap: jobLead.extractedRequirements.map((requirement) => ({
        label: requirement,
        current: "有基础",
        target: "需要更硬的项目证据"
      })),
      summary: `${jobLead.title} 对你的整体匹配度较高，但需要把项目结果和商业判断讲得更硬。`
    }
  );
}
