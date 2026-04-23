"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import type { ConsultationState } from "@xhs/ai";
import { saveConsultationState } from "../lib/consultation-session";
import { buildHomeViewModel } from "../lib/home-view-model";

type Message = {
  id: string;
  role: "assistant" | "user";
  content: string;
};

type StreamEvent = Record<string, unknown>;

const navItems = [
  { href: "/", icon: "home", label: "首页 Home", active: true },
  { href: "/jobs", icon: "work", label: "职位 Jobs" },
  { href: "/interview/demo", icon: "psychology", label: "模拟面试 Interview" },
  { href: "/resume-lab", icon: "biotech", label: "简历实验室 Resume Lab" },
  { href: "/plaza", icon: "forum", label: "广场 Plaza" },
  { href: "/history", icon: "history", label: "历史 History" }
];

const processSteps = [
  {
    icon: "forum",
    label: "步骤 1 Step 1",
    title: "咨询 Consult",
    copy:
      "通过引导式对话识别您的核心优势和职业抱负。 Identify your core strengths and true career aspirations through guided conversation."
  },
  {
    icon: "join_inner",
    label: "步骤 2 Step 2",
    title: "匹配 Match",
    copy:
      "根据市场需求和高潜力行业角色调整您的个人资料。 Align your profile with high-potential industry roles and market demands."
  },
  {
    icon: "analytics",
    label: "步骤 3 Step 3",
    title: "分析 Analyze",
    copy:
      "深入分析您当前的简历和技能差距。 Perform a deep-dive gap analysis on your current resume and skill set."
  },
  {
    icon: "record_voice_over",
    label: "步骤 4 Step 4",
    title: "面试 Interview",
    copy:
      "进行真实的、针对职位的 AI 行为和技术模拟。 Practice with realistic, role-specific AI behavioral and technical mocks."
  },
  {
    icon: "trending_up",
    label: "步骤 5 Step 5",
    title: "优化 Optimize",
    copy:
      "完善您的策略，商谈薪资，并获得理想职位。 Refine your strategy, negotiate offers, and secure your ideal position.",
    featured: true
  }
];

function upsertAssistantMessage(messages: Message[], id: string, delta: string): Message[] {
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
  const transcriptRef = useRef<HTMLDivElement | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [composerValue, setComposerValue] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [session, setSession] = useState<ConsultationState | null>(null);
  const [statusMessage, setStatusMessage] = useState("AI 导师已就绪，等待你的背景说明或简历。");
  const [errorMessage, setErrorMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const viewModel = useMemo(() => buildHomeViewModel(session), [session]);

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
          transcriptRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
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
          setStatusMessage(`第 ${nextState.round} 轮问题已生成，请继续补充。`);
          transcriptRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
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

  function handlePrimaryAction() {
    if (session?.done) {
      saveConsultationState(session);
      router.push("/jobs");
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
          <div className="career-avatar career-avatar-small">CC</div>
          <span>职业催化剂 Career Catalyst</span>
        </div>
      </header>

      <aside className="career-sidebar">
        <div className="career-sidebar-header">
          <div className="career-avatar">CC</div>
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
              <span className="material-symbols-outlined">psychology</span>
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
              {session ? (
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
                    : "例如：我是一名寻求转型为产品经理的中层市场经理。我缺少哪些技能？"
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
          </section>

          <section className="career-profile-section">
            <div className="career-section-heading">
              <h3>咨询进度与候选人画像 Consultation Snapshot</h3>
              <p>前端展示沿用你的首页风格，数据与会话状态走项目现有咨询后端。</p>
            </div>

            <div className="career-profile-grid">
              {viewModel.profileCards.map((card) => (
                <article key={card.label} className="career-profile-card">
                  <span>{card.label}</span>
                  <strong>{card.value}</strong>
                </article>
              ))}
            </div>

            <div className="career-transcript-grid">
              <div className="career-transcript-card" ref={transcriptRef}>
                <div className="career-transcript-head">
                  <h4>三轮对话记录 Three-Round Consultation</h4>
                  <span>{viewModel.progressLabel}</span>
                </div>
                <div className="career-transcript-list">
                  {messages.length > 0 ? (
                    messages.map((message) => (
                      <article
                        key={message.id}
                        className={`career-message ${message.role === "assistant" ? "is-assistant" : "is-user"}`}
                      >
                        <span>{message.role === "assistant" ? "Agent" : "You"}</span>
                        <p>{message.content}</p>
                      </article>
                    ))
                  ) : (
                    <p className="career-empty-copy">
                      对话启动后，这里会实时显示三轮问题、你的回答与最终总结。
                    </p>
                  )}
                </div>
              </div>

              <div className="career-transcript-card">
                <div className="career-transcript-head">
                  <h4>当前状态 Live Status</h4>
                  <span>{viewModel.stage}</span>
                </div>
                <p className="career-side-copy">{viewModel.statusText}</p>
                {session ? (
                  <ul className="career-side-list">
                    <li>已确认：{session.strengths.slice(0, 2).join(" / ") || "等待更多信息"}</li>
                    <li>待补充：{session.gaps.slice(0, 2).join(" / ") || "当前无明显缺口"}</li>
                    <li>材料摘要：{session.profileSummary}</li>
                  </ul>
                ) : (
                  <ul className="career-side-list">
                    <li>支持上传 PDF / DOCX / TXT / MD 简历</li>
                    <li>未上传简历也能直接开始 3 轮咨询</li>
                    <li>完成后将自动进入 Top 5 岗位推荐</li>
                  </ul>
                )}

                {session?.done ? (
                  <Link href="/jobs" className="career-inline-link">
                    进入推荐岗位总览
                  </Link>
                ) : null}
              </div>
            </div>
          </section>

          <section className="career-process-section">
            <div className="career-section-heading">
              <h3>导师计划流程 The Mentorship Process</h3>
              <p>
                实现职业目标的结构化方法 A structured approach to achieving your professional
                objectives.
              </p>
            </div>

            <div className="career-process-grid">
              {processSteps.map((step) => (
                <article
                  key={step.title}
                  className={`career-process-card ${step.featured ? "is-featured" : ""}`}
                >
                  <div className="career-process-icon">
                    <span className="material-symbols-outlined">{step.icon}</span>
                  </div>
                  <span className="career-process-label">{step.label}</span>
                  <h4>{step.title}</h4>
                  <p>{step.copy}</p>
                </article>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
