import { submitInterviewAnswer } from "@xhs/ai";
import type { InterviewSession } from "@xhs/ai";
import { requireAuthenticatedRequest } from "../../../../lib/auth-server";
import { upsertActivityRecord } from "../../../../lib/user-activity-server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = await requireAuthenticatedRequest(request);
  if (auth instanceof Response) return auth;

  const body = (await request.json().catch(() => null)) as
    | {
        session?: InterviewSession;
        answer?: string;
      }
    | null;

  if (!body?.session) {
    return Response.json({ error: "缺少面试会话状态。" }, { status: 400 });
  }

  if (!body.answer?.trim()) {
    return Response.json({ error: "回答不能为空。" }, { status: 400 });
  }

  try {
    const result = await submitInterviewAnswer(body.session, body.answer.trim());
    const persisted = await upsertActivityRecord({
      userId: auth.userId,
      accessToken: auth.accessToken,
      recordType: "interview_session",
      recordKey: result.session.jobId,
      payload: {
        jobId: result.session.jobId,
        session: result.session
      }
    });
    if (!persisted.ok) {
      console.warn("[activity-persistence] interview answer not saved", persisted.error);
    }
    return Response.json(result);
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "继续模拟面试失败。"
      },
      { status: 400 }
    );
  }
}
