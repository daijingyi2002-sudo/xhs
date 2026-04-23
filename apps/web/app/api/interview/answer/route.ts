import { submitInterviewAnswer } from "@xhs/ai";
import type { InterviewSession } from "@xhs/ai";

export const runtime = "nodejs";

export async function POST(request: Request) {
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
    return Response.json(submitInterviewAnswer(body.session, body.answer.trim()));
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "继续模拟面试失败。"
      },
      { status: 400 }
    );
  }
}
