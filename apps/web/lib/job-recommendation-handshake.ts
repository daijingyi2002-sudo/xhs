import type { FitAnalysisResponse, TopRecommendationResponse } from "@xhs/domain";
import { fitAnalysisResponseSchema, topRecommendationResponseSchema } from "@xhs/domain";
import type { ConsultationState } from "@xhs/ai";

export type RecommendationRequestBody = {
  consultationState: ConsultationState;
};

export type FitAnalysisRequestBody = {
  jobId: string;
  consultationState: ConsultationState;
};

export function canRequestRecommendations(consultationState: ConsultationState | null) {
  return consultationState?.done === true;
}

export function buildRecommendationRequest(
  consultationState: ConsultationState | null
): RecommendationRequestBody | null {
  if (!consultationState || !canRequestRecommendations(consultationState)) return null;

  return {
    consultationState
  };
}

export function buildFitAnalysisRequest(
  jobId: string,
  consultationState: ConsultationState | null
): FitAnalysisRequestBody | null {
  if (!jobId || !consultationState || !canRequestRecommendations(consultationState)) return null;

  return {
    jobId,
    consultationState
  };
}

export function buildJobAnalysisHref(jobId: string) {
  return `/jobs/${encodeURIComponent(jobId)}`;
}

export function parseTopRecommendationsResponse(payload: unknown): TopRecommendationResponse {
  return topRecommendationResponseSchema.parse(payload);
}

export function parseFitAnalysisResponse(payload: unknown): FitAnalysisResponse {
  return fitAnalysisResponseSchema.parse(payload);
}
