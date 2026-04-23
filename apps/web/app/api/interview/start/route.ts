import { createInterviewSession, getJobLead } from "@xhs/ai";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { jobId?: string } | null;

  if (!body?.jobId) {
    return Response.json({ error: "缺少 jobId，无法启动模拟面试。" }, { status: 400 });
  }

  const lead = getJobLead(body.jobId);

  if (!lead) {
    return Response.json({ error: "没有找到对应岗位，无法启动模拟面试。" }, { status: 404 });
  }

  return Response.json(createInterviewSession(lead));
}
