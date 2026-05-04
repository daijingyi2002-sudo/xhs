import { createInterviewSession, getJobLead } from "@xhs/ai";
import { requireAuthenticatedRequest } from "../../../../lib/auth-server";
import { upsertActivityRecord } from "../../../../lib/user-activity-server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = await requireAuthenticatedRequest(request);
  if (auth instanceof Response) return auth;

  const body = (await request.json().catch(() => null)) as { jobId?: string } | null;

  if (!body?.jobId) {
    return Response.json({ error: "缺少 jobId，无法启动模拟面试。" }, { status: 400 });
  }

  const lead = getJobLead(body.jobId);

  if (!lead) {
    return Response.json({ error: "没有找到对应岗位，无法启动模拟面试。" }, { status: 404 });
  }

  try {
    const session = await createInterviewSession(lead);
    const persisted = await upsertActivityRecord({
      userId: auth.userId,
      accessToken: auth.accessToken,
      recordType: "interview_session",
      recordKey: body.jobId,
      payload: {
        jobId: body.jobId,
        session
      }
    });
    if (!persisted.ok) {
      console.warn("[activity-persistence] interview start not saved", persisted.error);
    }
    return Response.json(session);
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "模拟面试生成服务暂时不可用，请稍后重试。"
      },
      { status: 503 }
    );
  }
}
