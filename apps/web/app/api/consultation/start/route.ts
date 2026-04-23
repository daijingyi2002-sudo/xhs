import { extractResumeText, startConsultation, createQuestionStream } from "@xhs/ai";

export const runtime = "nodejs";

function createEventStream(
  callback: (send: (payload: Record<string, unknown>) => void) => Promise<void>
) {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      const send = (payload: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`${JSON.stringify(payload)}\n`));
      };

      try {
        await callback(send);
      } catch (error) {
        send({
          type: "error",
          message: error instanceof Error ? error.message : "启动咨询失败。"
        });
      } finally {
        controller.close();
      }
    }
  });
}

export async function POST(request: Request) {
  const requestStartedAt = Date.now();
  console.info("[consultation-perf] request start", JSON.stringify({ route: "start" }));
  const formData = await request.formData();
  const resume = formData.get("resume");
  const userNote = String(formData.get("userNote") ?? "").trim();

  if (!(resume instanceof File) && !userNote) {
    return Response.json(
      {
        error: "请上传简历，或至少补充一段背景说明。"
      },
      { status: 400 }
    );
  }

  const stream = createEventStream(async (send) => {
    send({ type: "status", phase: "parsing", message: "正在解析简历和补充说明..." });

    const resumeText =
      resume instanceof File
        ? await extractResumeText({
            name: resume.name,
            type: resume.type,
            bytes: await resume.arrayBuffer()
          })
        : userNote;

    if (!resumeText) {
      throw new Error("没有提取到有效的简历文本，请尝试 PDF、DOCX、TXT 或 MD 文件。");
    }

    send({ type: "status", phase: "analyzing", message: "正在基于原文整理已确认信息与待补充信息..." });

    const initialState = await startConsultation({
      resumeName: resume instanceof File ? resume.name : null,
      resumeText,
      userNote
    });

    send({ type: "status", phase: "questioning", message: "正在生成第 1 轮问题..." });

    const { source, stream: questionStream } = await createQuestionStream(initialState);
    let question = "";

    for await (const delta of questionStream) {
      question += delta;
      send({ type: "question_delta", delta });
    }

    send({
      type: "ready",
      source,
      state: {
        ...initialState,
        source,
        currentQuestion: question.trim()
      }
    });
    console.info(
      "[consultation-perf] route done",
      JSON.stringify({
        route: "start",
        source,
        durationMs: Date.now() - requestStartedAt
      })
    );
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform"
    }
  });
}
