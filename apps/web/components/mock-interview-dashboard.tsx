"use client";

import Link from "next/link";
import { companies, type JobLead } from "@xhs/domain";
import type { InterviewAnswerRecord, InterviewSession } from "@xhs/ai";
import { useMemo, useState } from "react";
import { useInterviewSession } from "../lib/use-interview-session";

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
      title: "面试总结 Interview Summary",
      description: "本轮面试已完成，下面展示维度总结与下一步建议。"
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
  const { loadState, busy, errorMessage, submit } = useInterviewSession(lead.id);
  const [draft, setDraft] = useState("");

  const session = loadState.status === "ready" ? loadState.session : null;
  const focus = useMemo(() => (session ? buildFocusLabel(session) : null), [session]);
  const competencyBars = useMemo(() => (session ? buildCompetencyBars(session) : []), [session]);

  async function handleSubmit() {
    if (!draft.trim()) return;
    const result = await submit(draft.trim());

    if (result) {
      setDraft("");
    }
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
    <div className="interview-shell">
      <aside className="interview-sidebar">
        <div className="interview-sidebar-header">
          <div className="interview-avatar">CC</div>
          <div>
            <h1>Career Catalyst</h1>
            <p>Expert Mentor AI</p>
          </div>
          <button
            type="button"
            className="interview-submit-side"
            onClick={handleSubmit}
            disabled={busy || !!session.summary || !draft.trim()}
          >
            <span className="material-symbols-outlined">send</span>
            提交 Submit
          </button>
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

            <Link href="/jobs" className="interview-end-button">
              结束面试 End Interview
            </Link>
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
                  <h3>面试总结 Interview Summary</h3>
                  <p>{session.summary.overallTakeaway}</p>
                  <div className="interview-summary-grid">
                    {session.summary.scoreByDimension.map((item) => (
                      <article key={item.dimension} className="interview-summary-metric">
                        <strong>{item.dimension}</strong>
                        <span>{item.score}/10</span>
                        <p>{item.note}</p>
                      </article>
                    ))}
                  </div>
                </section>
              ) : null}
            </div>

            <div className="interview-input-area">
              <div className="interview-input-shell">
                <button type="button" className="interview-icon-button" disabled>
                  <span className="material-symbols-outlined">mic</span>
                </button>
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
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
  );
}
