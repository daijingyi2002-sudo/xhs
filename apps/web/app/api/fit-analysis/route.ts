import {
  buildRecommendationProfileFromConsultation,
  createDemoRecommendationProfile,
  getFitAnalysisForJob
} from "@xhs/ai";
import type { ConsultationState } from "@xhs/ai";
import { requireAuthenticatedRequest } from "../../../lib/auth-server";
import { upsertActivityRecord } from "../../../lib/user-activity-server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = await requireAuthenticatedRequest(request);
  if (auth instanceof Response) return auth;

  const body = (await request.json().catch(() => null)) as
    | {
        jobId?: string;
        consultationState?: ConsultationState;
        useDemoProfile?: boolean;
      }
    | null;

  if (!body?.jobId) {
    return Response.json(
      {
        error: "缺少 jobId，无法生成岗位匹配分析。"
      },
      { status: 400 }
    );
  }

  if (!body?.consultationState && !body?.useDemoProfile) {
    return Response.json(
      {
        error: "缺少 consultationState，无法生成岗位匹配分析。"
      },
      { status: 400 }
    );
  }

  const profile = body.consultationState
    ? buildRecommendationProfileFromConsultation(body.consultationState)
    : createDemoRecommendationProfile();
  const response = await getFitAnalysisForJob(profile, body.jobId);

  if (!response) {
    return Response.json(
      {
        error: "没有找到对应的岗位分析结果。"
      },
      { status: 404 }
    );
  }

  const persisted = await upsertActivityRecord({
    userId: auth.userId,
    accessToken: auth.accessToken,
    recordType: "fit_analysis",
    recordKey: body.jobId,
    payload: {
      jobId: body.jobId,
      response,
      profileTrace: profile.trace
    }
  });
  if (!persisted.ok) {
    console.warn("[activity-persistence] fit analysis not saved", persisted.error);
  }

  return Response.json(response);
}
