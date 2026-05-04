import { requireAuthenticatedRequest } from "../../../lib/auth-server";
import { buildActivityHistoryRecords, listActivityRecords } from "../../../lib/user-activity-server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await requireAuthenticatedRequest(request);
  if (auth instanceof Response) return auth;

  const result = await listActivityRecords({ accessToken: auth.accessToken });

  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 503 });
  }

  return Response.json(buildActivityHistoryRecords(result.records));
}
