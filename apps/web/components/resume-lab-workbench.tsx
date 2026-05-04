"use client";

import Link from "next/link";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import type { FinalResume, ResumeOptimizationResult, ResumeSectionName } from "@xhs/ai";
import { loadConsultationState } from "../lib/consultation-session";
import { findLatestCompletedInterviewSession } from "../lib/interview-session-persistence";
import {
  applyResumeSuggestion,
  buildResumeDraft,
  createResumeSuggestionStates,
  removeResumeSuggestion,
  type ResumeSuggestionState
} from "../lib/resume-optimization-state";
import { buildAuthenticatedHeaders } from "../lib/api-auth-fetch";
import { AccountMenu } from "./account-menu";
import { BrandMark } from "./brand-mark";

const navItems = [
  { href: "/", icon: "home", label: "首页 Home" },
  { href: "/jobs", icon: "work", label: "职位 Jobs" },
  { href: "/interview/demo", icon: "psychology", label: "模拟面试 Interview" },
  { href: "/resume-lab", icon: "biotech", label: "简历实验室 Resume Lab", active: true },
  { href: "/plaza", icon: "forum", label: "广场 Plaza" },
  { href: "/history", icon: "history", label: "历史 History" }
];

const finalResumeSections: Array<{ key: keyof FinalResume; section: ResumeSectionName; label: string }> = [
  { key: "basic_info", section: "基础信息", label: "基础信息" },
  { key: "job_intention", section: "求职意向", label: "求职意向" },
  { key: "education", section: "教育背景", label: "教育背景" },
  { key: "experience", section: "实习经历", label: "实习经历" },
  { key: "projects", section: "项目经历", label: "项目经历" },
  { key: "skills", section: "技能能力", label: "技能能力" },
  { key: "awards", section: "校园经历 / 获奖经历", label: "校园经历 / 获奖经历" },
  { key: "self_evaluation", section: "自我评价", label: "自我评价" }
];

type LoadState =
  | { status: "loading" }
  | { status: "ready"; data: ResumeOptimizationResult; usedDemoProfile: boolean }
  | { status: "error"; message: string };

function getResumePlainText(resume: FinalResume) {
  return finalResumeSections
    .map((item) => `${item.label}\n${resume[item.key]}`)
    .filter((item) => item.trim())
    .join("\n\n");
}

function downloadTextFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function getSuggestionStatus(states: ResumeSuggestionState[], section: ResumeSectionName) {
  return states.find((item) => item.section === section)?.status ?? "removed";
}

function ResumeLabChrome({ children }: { children: ReactNode }) {
  return (
    <div className="resume-catalyst-shell">
      <header className="resume-topbar">
        <div>
          <h1>职业催化剂 Career Catalyst</h1>
        </div>
        <div className="resume-topbar-actions">
          <BrandMark size="sm" />
          <label className="resume-search">
            <span className="material-symbols-outlined">search</span>
            <input placeholder="搜索... Search..." type="search" />
          </label>
          <button type="button" aria-label="Notifications">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button type="button" aria-label="Settings">
            <span className="material-symbols-outlined">settings</span>
          </button>
          <AccountMenu variant="compact" />
        </div>
      </header>

      <aside className="resume-sidebar">
        <div className="resume-sidebar-header">
          <BrandMark size="lg" />
          <AccountMenu variant="resume" />
          <strong>职业催化剂 Career Catalyst</strong>
          <span>AI 专家导师 Expert Mentor AI</span>
        </div>
        <nav className="resume-nav" aria-label="Resume Lab">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className={item.active ? "is-active" : ""}>
              <span className="material-symbols-outlined">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="resume-sidebar-footer">
          <Link href="/" className="resume-new-consultation">
            <span className="material-symbols-outlined">add</span>
            新咨询 New Consultation
          </Link>
        </div>
      </aside>

      {children}
    </div>
  );
}

export function ResumeLabWorkbench() {
  const [loadState, setLoadState] = useState<LoadState>({ status: "loading" });
  const [suggestionStates, setSuggestionStates] = useState<ResumeSuggestionState[]>([]);
  const [copyState, setCopyState] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoadState({ status: "loading" });
      setCopyState("");

      try {
        const consultationState = loadConsultationState();
        const interviewSession = findLatestCompletedInterviewSession(window.localStorage);
        const selectedJobId = new URLSearchParams(window.location.search).get("jobId") ?? undefined;
        const response = await fetch("/api/resume-optimization", {
          method: "POST",
          headers: await buildAuthenticatedHeaders({
            "Content-Type": "application/json"
          }),
          body: JSON.stringify({
            consultationState: consultationState ?? undefined,
            interviewSession,
            jobId: selectedJobId ?? interviewSession?.jobId,
            original_resume: consultationState?.resumeExcerpt,
            useDemoProfile: !consultationState
          })
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(payload?.error ?? "简历优化生成失败。");
        }

        const data = (await response.json()) as ResumeOptimizationResult;

        if (!cancelled) {
          setSuggestionStates(createResumeSuggestionStates(data));
          setLoadState({ status: "ready", data, usedDemoProfile: !consultationState });
        }
      } catch (error) {
        if (!cancelled) {
          setLoadState({
            status: "error",
            message: error instanceof Error ? error.message : "简历优化生成失败。"
          });
        }
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, []);

  const resumeDraft = useMemo(() => {
    if (loadState.status !== "ready") return null;
    return buildResumeDraft(loadState.data, suggestionStates);
  }, [loadState, suggestionStates]);

  if (loadState.status === "loading") {
    return (
      <ResumeLabChrome>
        <main className="resume-lab-page">
          <section className="resume-lab-loading">
            <p className="section-eyebrow">Resume Lab</p>
            <h1>正在生成逐条简历诊断</h1>
            <p>系统会同时读取原始简历、目标岗位、推荐结果、模拟面试记录和面试总结。</p>
          </section>
        </main>
      </ResumeLabChrome>
    );
  }

  if (loadState.status === "error") {
    return (
      <ResumeLabChrome>
        <main className="resume-lab-page">
          <section className="resume-lab-loading">
            <p className="section-eyebrow">Resume Lab</p>
            <h1>简历优化暂时没有生成成功</h1>
            <p>{loadState.message}</p>
            <Link href="/" className="primary-button">
              回到首页补充简历和咨询
            </Link>
          </section>
        </main>
      </ResumeLabChrome>
    );
  }

  const { data } = loadState;
  const activeSuggestions = data.section_suggestions.filter((suggestion) =>
    suggestionStates.some((state) => state.section === suggestion.section)
  );
  const acceptedCount = suggestionStates.filter((state) => state.status === "accepted").length;
  const pendingCount = suggestionStates.filter((state) => state.status === "pending").length;

  async function handleCopy() {
    if (!resumeDraft) return;
    await navigator.clipboard.writeText(getResumePlainText(resumeDraft));
    setCopyState("已复制");
    window.setTimeout(() => setCopyState(""), 1600);
  }

  function handleExportWord() {
    if (!resumeDraft) return;
    downloadTextFile(
      "ai-resume-optimized.doc",
      `<html><body><pre>${getResumePlainText(resumeDraft)}</pre></body></html>`,
      "application/msword"
    );
  }

  function handlePrintPdf() {
    window.print();
  }

  return (
    <ResumeLabChrome>
      <main className="resume-lab-page">
        <section className="resume-lab-hero">
          <div>
            <p className="section-eyebrow">AI Resume Consultant</p>
            <h1>把面试反馈沉淀成可投递简历</h1>
            <p>
              当前目标岗位是 <strong>{data.target_position}</strong>。系统先逐条诊断，再生成最终版简历；缺少真实数据时只提示补充，不自动编造。
            </p>
          </div>
          <div className="resume-score-card">
            <span>匹配度</span>
            <strong>
              {data.resume_match_score.before_score} → {data.resume_match_score.after_score}
            </strong>
            <p>{data.resume_match_score.score_reason}</p>
          </div>
        </section>

        {loadState.usedDemoProfile ? (
          <div className="resume-lab-notice">当前没有读取到完整咨询状态，页面使用演示画像生成。完成上传、推荐和面试后会自动使用真实上下文。</div>
        ) : null}

        <section className="resume-lab-toolbar">
          <div>
            <strong>{activeSuggestions.length}</strong>
            <span>条建议仍在工作台</span>
          </div>
          <div>
            <strong>{acceptedCount}</strong>
            <span>条已应用</span>
          </div>
          <div>
            <strong>{pendingCount}</strong>
            <span>条待确认</span>
          </div>
          <button type="button" onClick={handleCopy}>
            <span className="material-symbols-outlined">content_copy</span>
            {copyState || "复制"}
          </button>
          <button type="button" onClick={handlePrintPdf}>
            <span className="material-symbols-outlined">picture_as_pdf</span>
            PDF
          </button>
          <button type="button" onClick={handleExportWord}>
            <span className="material-symbols-outlined">description</span>
            Word
          </button>
        </section>

        <section className="resume-lab-workspace">
          <aside className="resume-evidence-panel">
            <div className="resume-side-card">
              <p className="section-eyebrow">岗位匹配</p>
              <h2>缺口与关键词</h2>
              <div className="resume-keyword-list">
                {data.keyword_optimization.missing_keywords.slice(0, 6).map((keyword) => (
                  <span key={keyword}>{keyword}</span>
                ))}
              </div>
              <p>
                覆盖率：{data.keyword_optimization.keyword_coverage_before} → {data.keyword_optimization.keyword_coverage_after}
              </p>
            </div>

            <div className="resume-side-card">
              <p className="section-eyebrow">面试反向补强</p>
              <h2>从暴露问题回到简历</h2>
              <div className="resume-improvement-list">
                {data.interview_based_improvements.map((item) => (
                  <article key={`${item.interview_issue}-${item.resume_revision_strategy}`}>
                    <strong>{item.interview_issue}</strong>
                    <p>{item.resume_problem}</p>
                    <small>{item.resume_revision_strategy}</small>
                  </article>
                ))}
              </div>
            </div>
          </aside>

          <section className="resume-document-panel" aria-label="最终版简历">
            <div className="resume-document-paper">
              {resumeDraft
                ? finalResumeSections.map((item) => {
                    const status = getSuggestionStatus(suggestionStates, item.section);
                    const content = resumeDraft[item.key];
                    if (!content) return null;

                    return (
                      <article key={item.key} className={`resume-document-section resume-document-section-${status}`}>
                        <h3>{item.label}</h3>
                        <p>{content}</p>
                      </article>
                    );
                  })
                : null}
            </div>
          </section>

          <aside className="resume-suggestion-panel" aria-label="逐条修改建议">
            <div className="resume-suggestion-head">
              <p className="section-eyebrow">逐条建议</p>
              <h2>逐条确认，不盲改</h2>
            </div>

            {activeSuggestions.map((suggestion) => {
              const status = getSuggestionStatus(suggestionStates, suggestion.section);
              return (
                <article key={suggestion.section} className={`resume-suggestion-card resume-suggestion-card-${status}`}>
                  <div className="resume-suggestion-card-head">
                    <strong>{suggestion.section}</strong>
                    <span>{status === "accepted" ? "已应用" : "待确认"}</span>
                  </div>
                  <dl>
                    <dt>原文</dt>
                    <dd>{suggestion.original_text}</dd>
                    <dt>问题</dt>
                    <dd>{suggestion.problem}</dd>
                    <dt>修改建议</dt>
                    <dd>{suggestion.suggestion}</dd>
                    <dt>修改后</dt>
                    <dd>{suggestion.revised_text}</dd>
                    <dt>优化理由</dt>
                    <dd>{suggestion.reason}</dd>
                    <dt>风险提示</dt>
                    <dd>{suggestion.risk_warning}</dd>
                  </dl>
                  <div className="resume-suggestion-actions">
                    <button
                      type="button"
                      onClick={() => setSuggestionStates((current) => applyResumeSuggestion(current, suggestion.section))}
                    >
                      <span className="material-symbols-outlined">check</span>
                      应用
                    </button>
                    <button
                      type="button"
                      className="resume-suggestion-remove"
                      onClick={() => setSuggestionStates((current) => removeResumeSuggestion(current, suggestion.section))}
                    >
                      <span className="material-symbols-outlined">delete</span>
                      不应用
                    </button>
                  </div>
                </article>
              );
            })}
          </aside>
        </section>
      </main>
    </ResumeLabChrome>
  );
}
