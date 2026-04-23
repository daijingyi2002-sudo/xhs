import {
  buildRecommendationProfileFromConsultation,
  createDemoRecommendationProfile,
  getFitAnalysisForJob
} from "@xhs/ai";
import type { ConsultationState } from "@xhs/ai";

export const runtime = "nodejs";

export async function POST(request: Request) {
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

  return Response.json(response);
}
