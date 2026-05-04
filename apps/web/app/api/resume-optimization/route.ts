import {
  buildRecommendationProfileFromConsultation,
  createDemoRecommendationProfile,
  generateResumeOptimizationWithQwen,
  getFitAnalysisForJob,
  getTopRecommendations
} from "@xhs/ai";
import type { ConsultationState, InterviewSession, ResumeOptimizationInput } from "@xhs/ai";
import { requireAuthenticatedRequest } from "../../../lib/auth-server";
import { upsertActivityRecord } from "../../../lib/user-activity-server";

export const runtime = "nodejs";

type ResumeOptimizationRequest = {
  original_resume?: string;
  target_position?: string;
  recommended_jobs?: ResumeOptimizationInput["recommended_jobs"];
  interview_transcript?: ResumeOptimizationInput["interview_transcript"];
  interview_summary?: string;
  improvement_suggestions?: string[];
  job_jd_keywords?: string[];
  user_supplement?: string;
  jobId?: string;
  consultationState?: ConsultationState;
  interviewSession?: InterviewSession | null;
  useDemoProfile?: boolean;
};

export async function POST(request: Request) {
  const auth = await requireAuthenticatedRequest(request);
  if (auth instanceof Response) return auth;

  const body = (await request.json().catch(() => null)) as ResumeOptimizationRequest | null;

  if (!body?.consultationState && !body?.useDemoProfile && !body?.original_resume) {
    return Response.json(
      {
        error: "缺少原始简历或咨询状态，无法生成简历优化建议。"
      },
      { status: 400 }
    );
  }

  const profile = body.consultationState
    ? buildRecommendationProfileFromConsultation(body.consultationState)
    : createDemoRecommendationProfile();
  const recommendations = await getTopRecommendations(profile);
  const jobId = body.jobId ?? body.interviewSession?.jobId ?? recommendations.recommendations[0]?.jobId;

  if (!jobId) {
    return Response.json(
      {
        error: "缺少目标岗位，无法判断简历与岗位的匹配度。"
      },
      { status: 400 }
    );
  }

  const fitAnalysis = await getFitAnalysisForJob(profile, jobId);

  if (!fitAnalysis) {
    return Response.json(
      {
        error: "没有找到目标岗位的匹配分析，无法生成简历优化建议。"
      },
      { status: 404 }
    );
  }

  const interviewSession = body.interviewSession ?? null;
  const interviewSummary = body.interview_summary ?? interviewSession?.summary?.overallTakeaway ?? "";
  const improvementSuggestions =
    body.improvement_suggestions ??
    interviewSession?.summary?.gaps.map((gap) => gap.improvement) ??
    fitAnalysis.nextSteps;

  const input: ResumeOptimizationInput = {
    original_resume: body.original_resume ?? body.consultationState?.resumeExcerpt ?? profile.trace.resumeExcerpt,
    target_position: body.target_position ?? fitAnalysis.roleTitle,
    recommended_jobs:
      body.recommended_jobs ??
      recommendations.recommendations.map((recommendation) => ({
        company: recommendation.company,
        role_title: recommendation.roleTitle,
        match_score: recommendation.matchScore,
        requirements: [
          ...recommendation.matchReasons,
          ...fitAnalysis.jdGapMap.map((item) => item.label),
          recommendation.riskReminder
        ],
        match_reasons: recommendation.matchReasons,
        risk_reminder: recommendation.riskReminder,
        summary: recommendation.summary
      })),
    interview_transcript:
      body.interview_transcript ??
      interviewSession?.answers.map((answer) => ({
        question: answer.question,
        answer: answer.answer,
        feedback: answer.feedback
      })) ??
      [],
    interview_summary: interviewSummary,
    improvement_suggestions: improvementSuggestions,
    job_jd_keywords:
      body.job_jd_keywords ??
      [
        ...fitAnalysis.jdGapMap.map((item) => item.label),
        ...fitAnalysis.abilityMatch.map((item) => item.label),
        ...fitAnalysis.nextSteps
      ],
    user_supplement: body.user_supplement ?? ""
  };

  const result = await generateResumeOptimizationWithQwen(input);
  const persisted = await upsertActivityRecord({
    userId: auth.userId,
    accessToken: auth.accessToken,
    recordType: "resume_optimization",
    recordKey: jobId,
    payload: {
      jobId,
      result,
      sourceInterviewJobId: interviewSession?.jobId ?? null
    }
  });
  if (!persisted.ok) {
    console.warn("[activity-persistence] resume optimization not saved", persisted.error);
  }

  return Response.json(result);
}
