"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { companies, type JobLead } from "@xhs/domain";
import type { InterviewAnswerRecord, InterviewSession } from "@xhs/ai";
import { type KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { completeInterviewForResumeOptimization, completeInterviewToPlaza } from "../lib/interview-completion";
import { useInterviewSession } from "../lib/use-interview-session";
import { AccountMenu } from "./account-menu";
import { BrandMark } from "./brand-mark";

const navItems = [
  { href: "/", icon: "home", label: "首页 Home" },
  { href: "/jobs", icon: "work", label: "职位 Jobs" },
  { href: "/interview/demo", icon: "psychology", label: "模拟面试 Interview", active: true },
  { href: "/resume-lab", icon: "biotech", label: "简历实验室 Resume Lab" },
  { href: "/plaza", icon: "forum", label: "广场 Plaza" },
  { href: "/history", icon: "history", label: "历史 History" }
];

type CompetencyBar = {
  label: string;
  level: string;
  percent: number;
  tone?: "active" | "muted";
};

function buildCompetencyBars(session: InterviewSession): CompetencyBar[] {
  const answeredCount = session.answers.length;

  return [
    {
      label: "产品策略 Product Strategy",
      level: answeredCount >= 2 ? "优秀 Strong" : "评估中 Assessing...",
      percent: answeredCount >= 2 ? 85 : 45,
      tone: answeredCount >= 2 ? "active" : "muted"
    },
    {
      label: "沟通能力 Communication",
      level: answeredCount >= 1 ? "良好 Good" : "评估中 Assessing...",
      percent: answeredCount >= 1 ? 75 : 40,
      tone: answeredCount >= 1 ? "active" : "muted"
    },
    {
      label: "AI 素养 AI Fluency",
      level: answeredCount >= 3 ? "良好 Good" : "评估中 Assessing...",
      percent: answeredCount >= 3 ? 72 : 38,
      tone: answeredCount >= 3 ? "active" : "muted"
    }
  ];
}

function buildFocusLabel(session: InterviewSession) {
  if (session.summary) {
    return {
      title: "面试复盘 Offer Readiness",
      description: "本轮面试已完成，重点放大优势、补强不足，并把反馈沉淀到简历优化。"
    };
  }

  return {
    title: session.currentTurn?.dimension ?? "当前轮次",
    description: session.currentTurn?.coachingFocus ?? "系统正在整理当前轮次重点。"
  };
}

function getFeedbackTitle(record: InterviewAnswerRecord, round: number) {
  return `第 ${round} 轮：${record.dimension}`;
}

function getCompanyName(companyId: string) {
  return companies.find((item) => item.id === companyId)?.name ?? companyId;
}

export function MockInterviewDashboard({ lead }: { lead: JobLead }) {
  const router = useRouter();
  const { loadState, busy, errorMessage, submit } = useInterviewSession(lead.id);
  const [draft, setDraft] = useState("");
  const [pendingAnswer, setPendingAnswer] = useState("");
  const [selectedGapIndex, setSelectedGapIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const session = loadState.status === "ready" ? loadState.session : null;
  const focus = useMemo(() => (session ? buildFocusLabel(session) : null), [session]);
  const competencyBars = useMemo(() => (session ? buildCompetencyBars(session) : []), [session]);
  const selectedGap =
    session?.summary && selectedGapIndex !== null ? session.summary.gaps[selectedGapIndex] ?? null : null;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: "end" });
  }, [busy, pendingAnswer, session?.answers.length, session?.currentTurn?.id, session?.summary]);

  async function handleSubmit() {
    const answer = draft.trim();
    if (!answer || busy) return;

    setPendingAnswer(answer);
    setDraft("");

    const result = await submit(answer);

    if (result) {
      setPendingAnswer("");
      return;
    }

    setDraft(answer);
    setPendingAnswer("");
  }

  function handleDraftKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey) return;

    event.preventDefault();
    void handleSubmit();
  }

  function handleResumeOptimization() {
    if (session) {
      completeInterviewForResumeOptimization(session, window.localStorage);
    }

    router.push("/resume-lab");
  }

  function handleEndInterview() {
    if (session) {
      completeInterviewToPlaza(session, window.localStorage);
    }

    router.push("/plaza");
  }

  if (loadState.status === "loading") {
    return (
      <div className="interview-shell interview-shell-loading">
        <div className="interview-loading-card">
          <h2>正在启动模拟面试...</h2>
          <p>系统正在加载岗位上下文、面试轮次与实时分析面板。</p>
        </div>
      </div>
    );
  }

  if (loadState.status === "error" || !session || !focus) {
    return (
      <div className="interview-shell interview-shell-loading">
        <div className="interview-loading-card">
          <h2>模拟面试暂时无法启动</h2>
          <p>{loadState.status === "error" ? loadState.message : "请稍后重试。"}</p>
          <Link href="/jobs" className="career-inline-link">
            返回职位页
          </Link>
        </div>
      </div>
    );
  }

  const feedbackItems = session.answers.slice(-2).reverse();
  const companyName = getCompanyName(lead.companyId);

  return (
    <>
      <div className="interview-shell">
      <aside className="interview-sidebar">
        <div className="interview-sidebar-header">
          <BrandMark size="lg" />
          <AccountMenu variant="interview" />
          <div>
            <h1>职业催化剂 Career Catalyst</h1>
            <p>AI 专家导师 Expert Mentor AI</p>
          </div>
        </div>

        <nav className="interview-nav">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className={`interview-nav-item ${item.active ? "is-active" : ""}`}>
              <span className="material-symbols-outlined">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      <main className="interview-main">
        <header className="interview-topbar">
          <div>
            <h2>
              {companyName} · {lead.title}
            </h2>
            <p>
              <span className="material-symbols-outlined">person</span>
              角色：{session.roleLabel}
            </p>
          </div>

          <div className="interview-topbar-actions">
            <div className="interview-progress-block">
              <span>进度 PROGRESS</span>
              <div className="interview-progress-row">
                <strong>
                  {session.summary
                    ? `已完成 ${session.progress.total} / ${session.progress.total}`
                    : `第 ${session.progress.current} 轮 / 共 ${session.progress.total} 轮`}
                </strong>
                <div className="interview-progress-dots">
                  {Array.from({ length: session.progress.total }).map((_, index) => (
                    <span
                      key={`dot-${index + 1}`}
                      className={index < session.answers.length ? "is-done" : index === session.answers.length ? "is-current" : ""}
                    />
                  ))}
                </div>
              </div>
            </div>

            <button type="button" className="interview-end-button" onClick={handleEndInterview}>
              结束面试 End Interview
            </button>
          </div>
        </header>

        <div className="interview-content">
          <section className="interview-chat-area">
            <div className="interview-messages">
              <div className="interview-system-chip">面试开始 - 上午 10:00 Interview Started - 10:00 AM</div>

              {session.answers.map((record, index) => (
                <div key={record.turnId} className="interview-message-pair">
                  <article className="interview-message interview-message-ai">
                    <div className="interview-bot-avatar">
                      <span className="material-symbols-outlined">psychology</span>
                    </div>
                    <div className="interview-bubble interview-bubble-ai">
                      <p>{record.question}</p>
                      <div className="interview-tag-row">
                        <span>{record.dimension}</span>
                      </div>
                    </div>
                  </article>

                  <article className="interview-message interview-message-user">
                    <div className="interview-user-avatar">You</div>
                    <div className="interview-bubble interview-bubble-user">
                      <p>{record.answer}</p>
                    </div>
                  </article>
                </div>
              ))}

              {session.currentTurn ? (
                <article className="interview-message interview-message-ai">
                  <div className="interview-bot-avatar">
                    <span className="material-symbols-outlined">psychology</span>
                  </div>
                  <div className="interview-bubble interview-bubble-ai">
                    <p>{session.currentTurn.question}</p>
                    <div className="interview-tag-row">
                      <span>{session.currentTurn.dimension}</span>
                    </div>
                  </div>
                </article>
              ) : null}

              {session.summary ? (
                <section className="interview-summary-card">
                  <div className="interview-summary-heading">
                    <span className="interview-summary-kicker">Offer Readiness</span>
                    <h3>面试复盘与下一步行动</h3>
                    <p>{session.summary.overallTakeaway}</p>
                  </div>

                  <div className="interview-summary-block">
                    <h4>优点，继续放大</h4>
                    <div className="interview-summary-list">
                      {session.summary.strengths.map((item) => (
                        <article key={item.title} className="interview-summary-item is-strength">
                          <strong>{item.title}</strong>
                          <p>{item.evidence}</p>
                          <small>{item.amplification}</small>
                        </article>
                      ))}
                    </div>
                  </div>

                  <div className="interview-summary-block">
                    <h4>不足，转成提高项</h4>
                    <div className="interview-summary-list">
                      {session.summary.gaps.map((item, index) => (
                        <article key={item.title} className="interview-summary-item is-gap">
                          <strong>{item.title}</strong>
                          <p>{item.evidence}</p>
                          <small>{item.improvement}</small>
                          <button
                            type="button"
                            className="interview-gap-detail-button"
                            onClick={() => setSelectedGapIndex(index)}
                          >
                            查看提升指引
                          </button>
                        </article>
                      ))}
                    </div>
                  </div>

                  <div className="interview-star-replay">
                    <div>
                      <span className="interview-summary-kicker">Interviewer Lens</span>
                      <h4>{session.summary.starReplay.interviewerPersona}</h4>
                      <p>{session.summary.starReplay.personaDefinition}</p>
                    </div>
                    <p>{session.summary.starReplay.perfectReplay}</p>
                    <div className="interview-tag-row">
                      {session.summary.starReplay.highlights.map((item) => (
                        <span key={item}>{item}</span>
                      ))}
                    </div>
                  </div>

                  <button type="button" className="interview-resume-cta" onClick={handleResumeOptimization}>
                    <span className="material-symbols-outlined">description</span>
                    <span>
                      <strong>{session.summary.resumeOptimizationCta.label}</strong>
                      <small>{session.summary.resumeOptimizationCta.reason}</small>
                    </span>
                  </button>
                </section>
              ) : null}

              {pendingAnswer ? (
                <div className="interview-message-pair">
                  <article className="interview-message interview-message-user">
                    <div className="interview-user-avatar">You</div>
                    <div className="interview-bubble interview-bubble-user">
                      <p>{pendingAnswer}</p>
                    </div>
                  </article>

                  <article className="interview-message interview-message-ai interview-message-thinking">
                    <div className="interview-bot-avatar">
                      <span className="material-symbols-outlined">psychology</span>
                    </div>
                    <div className="interview-bubble interview-bubble-ai">
                      <p>正在分析你的回答，并生成下一轮追问...</p>
                      <div className="interview-tag-row">
                        <span>真实生成中</span>
                      </div>
                    </div>
                  </article>
                </div>
              ) : null}

              <div ref={messagesEndRef} />
            </div>

            <div className="interview-input-area">
              <div className="interview-input-shell">
                <button type="button" className="interview-icon-button" disabled>
                  <span className="material-symbols-outlined">mic</span>
                </button>
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={handleDraftKeyDown}
                  placeholder="构思你的回答...（考虑核心 KPI 与过程指标）"
                  rows={3}
                  disabled={busy || !!session.summary}
                />
                <button
                  type="button"
                  className="interview-send-button"
                  onClick={handleSubmit}
                  disabled={busy || !!session.summary || !draft.trim()}
                >
                  <span className="material-symbols-outlined">send</span>
                  提交 Submit
                </button>
              </div>
              <div className="interview-input-footnote">
                <p>
                  <span className="material-symbols-outlined">lightbulb</span>
                  提示：使用 STAR 原则组织你的回答以保持清晰。
                </p>
                <p>按 Enter 发送，Shift+Enter 换行</p>
              </div>
              {errorMessage ? <p className="career-error-text">{errorMessage}</p> : null}
            </div>
          </section>

          <aside className="interview-analysis-panel">
            <div className="interview-analysis-header">
              <h3>
                <span className="material-symbols-outlined">monitoring</span>
                实时分析 Real-time Analysis
              </h3>
            </div>

            <div className="interview-analysis-body">
              <section>
                <h4>当前轮次焦点 CURRENT ROUND FOCUS</h4>
                <div className="interview-analysis-card">
                  <strong>{focus.title}</strong>
                  <p>{focus.description}</p>
                </div>
              </section>

              <section>
                <h4>上一轮反馈 LATEST FEEDBACK</h4>
                <div className="interview-feedback-stack">
                  {busy ? (
                    <article className="interview-feedback-card">
                      <div>
                        <span className="interview-feedback-dot is-muted" />
                        <strong>正在分析当前回答</strong>
                      </div>
                      <p>系统正在基于候选人背景、岗位线索和历史回答生成真实反馈与下一问。</p>
                    </article>
                  ) : null}
                  {feedbackItems.length > 0 ? (
                    feedbackItems.map((item, index) => (
                      <article key={`${item.turnId}-feedback`} className="interview-feedback-card">
                        <div>
                          <span className="interview-feedback-dot" />
                          <strong>{getFeedbackTitle(item, session.answers.length - index)}</strong>
                        </div>
                        <p>{item.feedback}</p>
                      </article>
                    ))
                  ) : (
                    <article className="interview-feedback-card">
                      <div>
                        <span className="interview-feedback-dot is-muted" />
                        <strong>等待第 1 轮回答</strong>
                      </div>
                      <p>提交第一轮回答后，这里会实时显示针对上一轮的中等强度反馈。</p>
                    </article>
                  )}
                </div>
              </section>

              <section>
                <h4>能力雷达 COMPETENCY SIGNALS</h4>
                <div className="interview-analysis-card">
                  <div className="interview-bar-stack">
                    {competencyBars.map((bar) => (
                      <div key={bar.label} className="interview-bar-item">
                        <div className="interview-bar-copy">
                          <span>{bar.label}</span>
                          <strong className={bar.tone === "active" ? "is-active" : "is-muted"}>{bar.level}</strong>
                        </div>
                        <div className="interview-bar-track">
                          <div
                            className={`interview-bar-fill ${bar.tone === "active" ? "is-active" : "is-muted"}`}
                            style={{ width: `${bar.percent}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </div>
          </aside>
        </div>
      </main>
      </div>
      {selectedGap ? (
        <div className="interview-modal-backdrop" role="presentation" onClick={() => setSelectedGapIndex(null)}>
          <section
            className="interview-gap-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="interview-gap-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button type="button" className="interview-modal-close" onClick={() => setSelectedGapIndex(null)}>
              <span className="material-symbols-outlined">close</span>
            </button>
            <span className="interview-summary-kicker">Improvement Guide</span>
            <h3 id="interview-gap-modal-title">{selectedGap.title}</h3>
            <p>{selectedGap.detail.whyItMatters}</p>
            <div className="interview-gap-modal-section">
              <strong>当前证据</strong>
              <p>{selectedGap.evidence}</p>
            </div>
            <div className="interview-gap-modal-section">
              <strong>提高方向</strong>
              <p>{selectedGap.improvement}</p>
            </div>
            <div className="interview-gap-modal-section">
              <strong>练习步骤</strong>
              <ol>
                {selectedGap.detail.practiceSteps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </div>
            <div className="interview-gap-modal-section">
              <strong>表达升级示例</strong>
              <p>{selectedGap.detail.exampleUpgrade}</p>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
