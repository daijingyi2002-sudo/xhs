import type { ConsultationState } from "@xhs/ai";
import { advanceConsultation, createQuestionStream } from "@xhs/ai";

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
          message: error instanceof Error ? error.message : "继续咨询失败。"
        });
      } finally {
        controller.close();
      }
    }
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    state?: ConsultationState;
    answer?: string;
  };

  if (!body.state) {
    return Response.json({ error: "缺少咨询状态。" }, { status: 400 });
  }

  if (!body.answer?.trim()) {
    return Response.json({ error: "回答不能为空。" }, { status: 400 });
  }

  const state = body.state;
  const answer = body.answer.trim();

  const stream = createEventStream(async (send) => {
    send({ type: "status", phase: "analyzing", message: "正在整理你这一轮补充的信息..." });

    const nextState = await advanceConsultation({
      state,
      answer
    });

    if (nextState.done) {
      send({
        type: "complete",
        state: nextState
      });
      return;
    }

    send({
      type: "status",
      phase: "questioning",
      message: `正在生成第 ${nextState.round} 轮问题...`
    });

    const { source, stream: questionStream } = await createQuestionStream(nextState);
    let question = "";

    for await (const delta of questionStream) {
      question += delta;
      send({ type: "question_delta", delta });
    }

    send({
      type: "ready",
      source,
      state: {
        ...nextState,
        source,
        currentQuestion: question.trim()
      }
    });
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform"
    }
  });
}
