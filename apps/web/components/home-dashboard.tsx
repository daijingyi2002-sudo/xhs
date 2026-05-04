"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import type { ConsultationState } from "@xhs/ai";
import { saveConsultationState } from "../lib/consultation-session";
import {
  buildConsultationDialogTurns,
  buildHomeViewModel,
  type HomeDialogMessage
} from "../lib/home-view-model";
import { buildAuthenticatedHeaders } from "../lib/api-auth-fetch";
import { AccountMenu } from "./account-menu";
import { BrandMark } from "./brand-mark";

type StreamEvent = Record<string, unknown>;

const navItems = [
  { href: "/", icon: "home", label: "首页 Home", active: true },
  { href: "/jobs", icon: "work", label: "职位 Jobs" },
  { href: "/interview/demo", icon: "psychology", label: "模拟面试 Interview" },
  { href: "/resume-lab", icon: "biotech", label: "简历实验室 Resume Lab" },
  { href: "/plaza", icon: "forum", label: "广场 Plaza" },
  { href: "/history", icon: "history", label: "历史 History" }
];

function upsertAssistantMessage(
  messages: HomeDialogMessage[],
  id: string,
  delta: string
): HomeDialogMessage[] {
  const existing = messages.find((message) => message.id === id);

  if (!existing) {
    return [...messages, { id, role: "assistant", content: delta }];
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
    throw new Error("服务端没有返回可读取的数据流。");
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

export function HomeDashboard() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const chatHistoryRef = useRef<HTMLDivElement | null>(null);
  const [messages, setMessages] = useState<HomeDialogMessage[]>([]);
  const [composerValue, setComposerValue] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [session, setSession] = useState<ConsultationState | null>(null);
  const [statusMessage, setStatusMessage] = useState("AI 导师已就绪，等待你的背景说明或简历。");
  const [errorMessage, setErrorMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const viewModel = useMemo(() => buildHomeViewModel(session), [session]);
  const dialogTurns = useMemo(() => buildConsultationDialogTurns(messages), [messages]);

  async function startConsultation() {
    if (busy || (!resumeFile && !composerValue.trim())) return;

    setBusy(true);
    setErrorMessage("");
    setMessages([]);
    setSession(null);
    setStatusMessage("正在解析材料并生成第 1 轮问题...");

    try {
      const formData = new FormData();
      if (resumeFile) {
        formData.append("resume", resumeFile);
      }
      if (composerValue.trim()) {
        formData.append("userNote", composerValue.trim());
      }

      const assistantId = "assistant-round-1";
      const response = await fetch("/api/consultation/start", {
        method: "POST",
        headers: await buildAuthenticatedHeaders(),
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
          const nextState = event.state as ConsultationState;
          setSession(nextState);
          setStatusMessage("第 1 轮问题已生成，请继续回答。");
          setComposerValue("");
          chatHistoryRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
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
    if (!session || busy || !composerValue.trim()) return;

    const answer = composerValue.trim();
    const nextAssistantId = `assistant-round-${Math.min(session.round + 1, session.maxRounds)}`;
    setBusy(true);
    setErrorMessage("");
    setMessages((current) => [...current, { id: `user-round-${session.round}`, role: "user", content: answer }]);
    setComposerValue("");

    try {
      const response = await fetch("/api/consultation/answer", {
        method: "POST",
        headers: await buildAuthenticatedHeaders({
          "Content-Type": "application/json"
        }),
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
          setStatusMessage(`第 ${nextState.round} 轮问题已生成，请继续补充。`);
          chatHistoryRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
          return;
        }

        if (event.type === "complete") {
          const nextState = event.state as ConsultationState;
          setSession(nextState);
          setStatusMessage("三轮咨询已完成，可以进入岗位推荐。");

          const finalSummary =
            typeof nextState.finalSummary === "string" ? nextState.finalSummary.trim() : "";

          if (finalSummary) {
            setMessages((current) => [
              ...current,
              { id: "consultation-summary", role: "assistant", content: finalSummary }
            ]);
          }

          saveConsultationState(nextState);
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

  function persistCompletedConsultation() {
    if (session?.done) {
      saveConsultationState(session);
    }
  }

  function handlePrimaryAction() {
    if (session?.done) {
      persistCompletedConsultation();
      router.push(viewModel.recommendationCta?.href ?? "/jobs");
      return;
    }

    if (session) {
      void submitAnswer();
      return;
    }

    void startConsultation();
  }

  return (
    <div className="career-shell">
      <header className="career-mobile-bar">
        <div className="career-mobile-brand">
          <BrandMark size="sm" />
          <AccountMenu variant="compact" />
          <span>职业催化剂 Career Catalyst</span>
        </div>
      </header>

      <aside className="career-sidebar">
        <div className="career-sidebar-header">
          <AccountMenu variant="career" />
          <h1>职业催化剂 Career Catalyst</h1>
          <p>AI 专家导师 Expert Mentor AI</p>
        </div>

        <nav className="career-nav" aria-label="Homepage">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className={`career-nav-item ${item.active ? "is-active" : ""}`}>
              <span className="material-symbols-outlined">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="career-sidebar-footer">
          <button
            type="button"
            className="career-sidebar-cta"
            onClick={() => {
              setSession(null);
              setMessages([]);
              setComposerValue("");
              setResumeFile(null);
              setStatusMessage("AI 导师已就绪，等待新的咨询输入。");
              setErrorMessage("");
            }}
          >
            <span className="material-symbols-outlined">add</span>
            新咨询 New Consultation
          </button>
        </div>
      </aside>

      <main className="career-main">
        <div className="career-main-gradient" />

        <div className="career-content">
          <section className="career-hero">
            <div className="career-hero-icon">
              <BrandMark size="xl" />
            </div>
            <h2>
              早上好，让我们一起规划您的职业道路。
              <br />
              Good morning. Let's shape your career path.
            </h2>
            <p>
              告诉我您的职业目标或上传您的简历。 Tell me about your career goals or upload your
              resume to get started.
            </p>

            <div className="career-chat-card">
              <div className="career-dialog-history">
                {dialogTurns.length > 0 ? (
                  dialogTurns.map((turn) =>
                    turn.kind === "summary" ? (
                      <article key={turn.id} className="career-dialog-summary">
                        <span>{turn.label}</span>
                        <p>{turn.question}</p>
                      </article>
                    ) : (
                      <article key={turn.id} className="career-dialog-turn">
                        <span className="career-dialog-label">{turn.label}</span>
                        <div className="career-dialog-row is-agent">
                          <div className="career-dialog-avatar">AI</div>
                          <div className="career-dialog-bubble">
                            <span>Agent 问题</span>
                            <p>{turn.question || "正在生成本轮问题..."}</p>
                          </div>
                        </div>
                        <div className="career-dialog-row is-user">
                          <div className={`career-dialog-bubble ${turn.answer ? "" : "is-pending"}`}>
                            <span>你的回答</span>
                            <p>{turn.answer ?? "等待回答"}</p>
                          </div>
                          <div className="career-dialog-avatar">你</div>
                        </div>
                      </article>
                    )
                  )
                ) : (
                  <div className="career-dialog-empty">
                    <span className="career-badge">{viewModel.progressLabel}</span>
                    <p>告诉我你的求职意向后，我会用 3 轮问题逐步确认城市、岗位和公司偏好。</p>
                  </div>
                )}
                <div ref={chatHistoryRef} />
              </div>

              <div className="career-composer-shell">
                {session && dialogTurns.length === 0 ? (
                  <div className="career-current-question">
                    <span className="career-badge">{viewModel.progressLabel}</span>
                    <p>{session.currentQuestion || "正在生成本轮问题..."}</p>
                  </div>
                ) : null}

                <textarea
                  value={composerValue}
                  onChange={(event) => setComposerValue(event.target.value)}
                  placeholder={
                    session
                      ? "输入本轮回答，越具体越好。"
                      : "例如：我想找 AI 产品经理方向，优先上海/杭州，希望去互联网大厂或 AI 公司。"
                  }
                  className="career-composer"
                  disabled={busy}
                />

                <div className="career-chat-toolbar">
                  <div className="career-chat-meta">
                    <button
                      type="button"
                      aria-label="Attach File"
                      className="career-icon-button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={busy}
                    >
                      <span className="material-symbols-outlined">attach_file</span>
                    </button>
                    <span>AI 导师已就绪 AI COACH READY</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.docx,.txt,.md"
                      className="career-hidden-input"
                      onChange={(event) => setResumeFile(event.target.files?.[0] ?? null)}
                    />
                  </div>

                  <button
                    type="button"
                    className="career-submit-button"
                    onClick={handlePrimaryAction}
                    disabled={
                      busy ||
                      (session ? !session.done && !composerValue.trim() : !resumeFile && !composerValue.trim())
                    }
                  >
                    <span className="material-symbols-outlined">
                      {session?.done ? "east" : "arrow_upward"}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            <div className="career-divider">
              <div />
              <span>or</span>
              <div />
            </div>

            <button
              type="button"
              className="career-upload-button"
              onClick={() => fileInputRef.current?.click()}
              disabled={busy}
            >
              <span className="material-symbols-outlined">upload_file</span>
              上传简历 Upload Resume
            </button>

            {resumeFile ? <p className="career-file-chip">已选择简历：{resumeFile.name}</p> : null}
            <p className="career-status-text">{busy ? "处理中，请稍候..." : statusMessage}</p>
            {errorMessage ? <p className="career-error-text">{errorMessage}</p> : null}
            {viewModel.recommendationCta ? (
              <Link
                href={viewModel.recommendationCta.href}
                className="career-recommendation-cta"
                onClick={persistCompletedConsultation}
              >
                <span className="material-symbols-outlined">work</span>
                <span>{viewModel.recommendationCta.label}</span>
                <span className="material-symbols-outlined">arrow_forward</span>
              </Link>
            ) : null}
          </section>

        </div>
      </main>
    </div>
  );
}
