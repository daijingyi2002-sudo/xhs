import {
  buildRecommendationProfileFromConsultation,
  createDemoRecommendationProfile,
  getTopRecommendations
} from "@xhs/ai";
import type { ConsultationState } from "@xhs/ai";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | {
        consultationState?: ConsultationState;
        useDemoProfile?: boolean;
      }
    | null;

  if (!body?.consultationState && !body?.useDemoProfile) {
    return Response.json(
      {
        error: "缺少 consultationState，无法生成 Top 5 推荐。"
      },
      { status: 400 }
    );
  }

  const profile = body.consultationState
    ? buildRecommendationProfileFromConsultation(body.consultationState)
    : createDemoRecommendationProfile();
  const response = await getTopRecommendations(profile);

  return Response.json(response);
}
