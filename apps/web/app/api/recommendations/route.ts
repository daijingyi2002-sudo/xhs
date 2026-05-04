import {
  buildRecommendationProfileFromConsultation,
  createDemoRecommendationProfile,
  getTopRecommendations
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
  const persisted = await upsertActivityRecord({
    userId: auth.userId,
    accessToken: auth.accessToken,
    recordType: "recommendations",
    recordKey: "latest",
    payload: {
      response,
      profileTrace: profile.trace
    }
  });
  if (!persisted.ok) {
    console.warn("[activity-persistence] recommendations not saved", persisted.error);
  }

  return Response.json(response);
}
