"use client";

import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import type { ConsultationState } from "@xhs/ai";
import { saveConsultationState } from "../lib/consultation-session";

type Message = {
  id: string;
  role: "assistant" | "user";
  content: string;
};

type StreamEvent = Record<string, unknown>;

const focusLabels: Record<string, string> = {
  city_preference: "城市",
  company_preference: "公司",
  project_depth: "项目",
  ai_understanding: "AI / LLM",
  product_method: "方法论",
  data_analysis: "数据",
  user_research: "研究",
  role_concern: "顾虑"
};

function upsertAssistantMessage(messages: Message[], id: string, delta: string): Message[] {
  const existing = messages.find((message) => message.id === id);

  if (!existing) {
    const nextMessage: Message = { id, role: "assistant", content: delta };
    return [...messages, nextMessage];
  }

  return messages.map((message) =>
    message.id === id ? { ...message, content: `${message.content}${delta}` } : message
  );
}

async function consumeJsonLines(response: Response, onEvent: (event: StreamEvent) => void) {
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? "请求失败。");
  }

  if (!response.body) {
    throw new Error("服务端没有返回可读取的流。");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();

    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      onEvent(JSON.parse(trimmed) as StreamEvent);
    }
  }

  if (buffer.trim()) {
    onEvent(JSON.parse(buffer) as StreamEvent);
  }
}

export function ConsultationStudio() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [userNote, setUserNote] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [session, setSession] = useState<ConsultationState | null>(null);
  const [statusMessage, setStatusMessage] = useState(
    "上传简历或补充背景后，我们会先开始第 1 轮咨询。"
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const transcriptRef = useRef<HTMLDivElement | null>(null);

  const canStart = !busy && (!!resumeFile || userNote.trim().length > 0);
  const currentRound = session?.done ? session.maxRounds : session?.round ?? 0;

  const snapshot = useMemo(() => {
    if (!session) {
      return [
        resumeFile ? `已选择简历：${resumeFile.name}` : "还没有上传简历。",
        userNote.trim()
          ? `补充说明：${userNote.trim().slice(0, 48)}`
          : "可选补充：目标城市、目标公司、经历背景，或你当前最担心的问题。",
        "开始后会先生成第 1 轮问题，再根据你的回答继续追问。"
      ];
    }

    return [
      `轮次：${currentRound} / ${session.maxRounds}`,
      `当前聚焦：${focusLabels[session.currentFocus] ?? session.currentFocus}`,
      `材料摘要：${session.profileSummary}`,
      `已确认信息：${session.strengths.slice(0, 2).join(" | ") || "暂未提取到足够信息"}`,
      `待补充信息：${session.gaps.slice(0, 2).join(" | ") || "当前没有明显待补充项"}`
    ];
  }, [currentRound, resumeFile, session, userNote]);

  async function startConsultation() {
    if (!canStart) return;

    setBusy(true);
    setErrorMessage("");
    setMessages([]);
    setSession(null);
    setStatusMessage("已收到材料，正在生成第 1 轮问题...");
    transcriptRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

    try {
      const formData = new FormData();
      if (resumeFile) {
        formData.append("resume", resumeFile);
      }
      if (userNote.trim()) {
        formData.append("userNote", userNote.trim());
      }

      const assistantId = "assistant-round-1";
      const response = await fetch("/api/consultation/start", {
        method: "POST",
        body: formData
      });

      await consumeJsonLines(response, (event) => {
        if (event.type === "status") {
          setStatusMessage(String(event.message ?? ""));
          return;
        }

        if (event.type === "question_delta") {
          setMessages((current) => upsertAssistantMessage(current, assistantId, String(event.delta ?? "")));
          return;
        }

        if (event.type === "ready") {
          setSession(event.state as ConsultationState);
          setStatusMessage("第 1 轮问题已生成，继续回答即可。");
          return;
        }

        if (event.type === "error") {
          throw new Error(String(event.message ?? "启动咨询失败。"));
        }
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "启动咨询失败。");
    } finally {
      setBusy(false);
    }
  }

  async function submitAnswer() {
    if (!session || !draft.trim() || busy) return;

    const answer = draft.trim();
    const answerRound = session.round;
    const nextAssistantId = `assistant-round-${Math.min(answerRound + 1, session.maxRounds)}`;

    setBusy(true);
    setErrorMessage("");
    setDraft("");
    setMessages((current) => [...current, { id: `user-round-${answerRound}`, role: "user", content: answer }]);

    try {
      const response = await fetch("/api/consultation/answer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          state: session,
          answer
        })
      });

      await consumeJsonLines(response, (event) => {
        if (event.type === "status") {
          setStatusMessage(String(event.message ?? ""));
          return;
        }

        if (event.type === "question_delta") {
          setMessages((current) => upsertAssistantMessage(current, nextAssistantId, String(event.delta ?? "")));
          return;
        }

        if (event.type === "ready") {
          const nextState = event.state as ConsultationState;
          setSession(nextState);
          setStatusMessage(`第 ${nextState.round} 轮问题已生成。`);
          return;
        }

        if (event.type === "complete") {
          const nextState = event.state as ConsultationState;
          setSession(nextState);
          setStatusMessage("三轮追问已完成，可以继续进入推荐岗位和匹配分析。");
          const finalSummary = nextState.finalSummary;
          if (typeof finalSummary === "string") {
            setMessages((current) => [...current, { id: "consultation-summary", role: "assistant", content: finalSummary }]);
          }
          return;
        }

        if (event.type === "error") {
          throw new Error(String(event.message ?? "继续咨询失败。"));
        }
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "继续咨询失败。");
    } finally {
      setBusy(false);
    }
  }

  function goToRecommendations() {
    if (!session) return;
    saveConsultationState(session);
    router.push("/jobs");
  }

  return (
    <div className="consultation-studio">
      <div className="consultation-head">
        <p className="section-eyebrow">咨询入口</p>
        <h3>先说你的背景，我们马上开始第一轮咨询。</h3>
      </div>

      <label className="upload-strip">
        <span>上传简历</span>
        <input
          type="file"
          accept=".pdf,.docx,.txt,.md"
          disabled={busy}
          onChange={(event) => setResumeFile(event.target.files?.[0] ?? null)}
        />
      </label>

      {resumeFile ? (
        <div className="status-chip status-chip-success">
          <strong>上传成功</strong>
          <span>{resumeFile.name}</span>
        </div>
      ) : null}

      <div className="composer">
        <textarea
          value={userNote}
          onChange={(event) => setUserNote(event.target.value)}
          placeholder="可选补充：目标城市、公司偏好、经历背景，或你当前最担心的问题。"
          rows={3}
          disabled={busy}
        />
        <button
          type="button"
          className={`primary-button ${busy && !session ? "is-loading" : ""}`}
          onClick={startConsultation}
          disabled={!canStart}
          aria-busy={busy && !session}
        >
          {busy && !session ? "正在生成第 1 轮问题..." : "开始第 1 轮追问"}
        </button>
      </div>

      <div className="snapshot-panel">
        <p className="section-eyebrow">已获取信息</p>
        <ul>
          {snapshot.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <div className="status-strip">
        <strong>状态</strong>
        <span>{statusMessage}</span>
      </div>

      {errorMessage ? <p className="error-banner">{errorMessage}</p> : null}

      <div className="transcript-panel" ref={transcriptRef}>
        <p className="section-eyebrow">对话记录</p>
        <div className="chat-log">
          {messages.length ? (
            messages.map((message) => (
              <article key={message.id} className={`chat-row chat-row-${message.role}`}>
                <span className="chat-role">{message.role === "assistant" ? "Agent" : "你"}</span>
                <p>{message.content}</p>
              </article>
            ))
          ) : (
            <p className="helper-copy">开始后，这里会显示问题和你的回答。</p>
          )}
        </div>
      </div>

      {session && !session.done ? (
        <div className="composer">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="输入这一轮回答。你给的信息越具体，下一轮问题就会越精准。"
            rows={4}
            disabled={busy}
          />
          <button type="button" className="primary-button" onClick={submitAnswer} disabled={busy || !draft.trim()}>
            {busy ? "正在生成下一轮问题..." : `提交第 ${session.round} 轮回答`}
          </button>
        </div>
      ) : null}

      {session?.done ? (
        <div className="status-card">
          <p className="section-eyebrow">下一步</p>
          <h4>咨询已完成，可以继续看推荐岗位和岗位分析。</h4>
          <div className="pill-row">
            <span className="pill">画像已更新</span>
            <span className="pill">可查看 Top 5 推荐</span>
            <span className="pill">可继续模拟面试</span>
          </div>
          <button type="button" className="primary-button" onClick={goToRecommendations}>
            查看推荐岗位
          </button>
        </div>
      ) : null}
    </div>
  );
}
