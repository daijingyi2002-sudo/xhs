"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import type { HistoryRecords } from "../../lib/history-records";
import { buildHistoryOverview, getHistoryRecords } from "../../lib/history-records";
import { buildAuthenticatedHeaders } from "../../lib/api-auth-fetch";
import { AccountMenu } from "../../components/account-menu";
import { BrandMark } from "../../components/brand-mark";

const navItems = [
  { href: "/", icon: "home", label: "首页 Home" },
  { href: "/jobs", icon: "work", label: "职位 Jobs" },
  { href: "/interview/demo", icon: "psychology", label: "模拟面试 Interview" },
  { href: "/resume-lab", icon: "biotech", label: "简历实验室 Resume Lab" },
  { href: "/plaza", icon: "forum", label: "广场 Plaza" },
  { href: "/history", icon: "history", label: "历史 History", active: true }
];

function createEmptyHistory(): HistoryRecords {
  return {
    interviews: [],
    resumeOptimizations: []
  };
}

function formatTime(value: string | null) {
  if (!value) return "暂无记录";

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function getDestinationLabel(destination: "resume-lab" | "plaza") {
  return destination === "resume-lab" ? "已进入简历优化" : "已回到职业广场";
}

function HistoryChrome({ children }: { children: ReactNode }) {
  return (
    <div className="resume-catalyst-shell">
      <header className="resume-topbar">
        <div>
          <h1>历史记录 History</h1>
        </div>
        <div className="resume-topbar-actions">
          <BrandMark size="sm" />
          <label className="resume-search">
            <span className="material-symbols-outlined">search</span>
            <input placeholder="搜索历史记录..." type="search" />
          </label>
          <Link href="/interview/demo" className="history-topbar-link">
            <span className="material-symbols-outlined">add</span>
            新面试
          </Link>
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
        <nav className="resume-nav" aria-label="History">
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

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryRecords>(createEmptyHistory);
  const [historyError, setHistoryError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadHistory() {
      try {
        const response = await fetch("/api/history", {
          method: "GET",
          headers: await buildAuthenticatedHeaders()
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(payload?.error ?? "历史记录加载失败。");
        }

        const data = (await response.json()) as HistoryRecords;

        if (!cancelled) {
          setHistory(data);
        }
      } catch (error) {
        if (!cancelled) {
          setHistory(getHistoryRecords(window.localStorage));
          setHistoryError(error instanceof Error ? error.message : "历史记录加载失败，已显示本地缓存。");
        }
      }
    }

    void loadHistory();

    return () => {
      cancelled = true;
    };
  }, []);

  const overview = buildHistoryOverview(history);

  return (
    <HistoryChrome>
      <main className="resume-lab-page history-workbench-page">
        <section className="history-hero">
          <div>
            <p className="section-eyebrow">Career Memory</p>
            <h1>把每一次面试和简历优化沉淀成下一步行动</h1>
            <p>历史模块聚合模拟面试与简历优化两类记录，帮助你追踪训练证据、复盘结果和下一次准备重点。</p>
          </div>
          <div className="history-next-action">
            <span>下一步建议</span>
            <strong>{overview.nextAction}</strong>
            <small>最近更新：{formatTime(overview.latestUpdatedAt)}</small>
          </div>
        </section>

        <section className="history-stat-grid" aria-label="历史统计">
          {historyError ? (
            <article>
              <span>同步状态</span>
              <strong>本地缓存</strong>
              <small>{historyError}</small>
            </article>
          ) : null}
          <article>
            <span>总记录</span>
            <strong>{overview.totalCount}</strong>
            <small>Interview + Resume</small>
          </article>
          <article>
            <span>模拟面试</span>
            <strong>{overview.interviewCount}</strong>
            <small>已保存的训练复盘</small>
          </article>
          <article>
            <span>简历优化</span>
            <strong>{overview.resumeOptimizationCount}</strong>
            <small>由面试证据生成</small>
          </article>
        </section>

        <section className="history-module-grid">
          <section className="history-module" aria-labelledby="interview-history-title">
            <div className="history-module-head">
              <div>
                <p className="section-eyebrow">Mock Interview</p>
                <h2 id="interview-history-title">模拟面试历史</h2>
              </div>
              <Link href="/interview/demo">
                <span className="material-symbols-outlined">play_arrow</span>
                开始新面试
              </Link>
            </div>

            <div className="history-record-stack">
              {history.interviews.length > 0 ? (
                history.interviews.map((item) => (
                  <article key={item.id} className="history-record-card">
                    <div className="history-record-head">
                      <div>
                        <span className="history-chip">模拟面试</span>
                        <h3>{item.jobTitle}</h3>
                      </div>
                      <strong>{item.roundLabel}</strong>
                    </div>
                    <div className="history-meta-row">
                      <span>
                        <span className="material-symbols-outlined">apartment</span>
                        {item.companyName}
                      </span>
                      <span>
                        <span className="material-symbols-outlined">schedule</span>
                        {formatTime(item.updatedAt)}
                      </span>
                      <span>{getDestinationLabel(item.destination)}</span>
                    </div>
                    <p className="history-takeaway">{item.takeaway}</p>
                    <div className="history-card-actions">
                      <Link href="/interview/demo">查看面试工作台</Link>
                      <Link href={`/resume-lab?jobId=${item.jobId}`}>生成简历优化</Link>
                    </div>
                  </article>
                ))
              ) : (
                <article className="history-empty-state">
                  <span className="material-symbols-outlined">psychology</span>
                  <h3>还没有模拟面试记录</h3>
                  <p>完成或结束一次模拟面试后，这里会保存岗位、轮次、复盘重点和后续去向。</p>
                  <Link href="/interview/demo">开始第一次模拟面试</Link>
                </article>
              )}
            </div>
          </section>

          <section className="history-module" aria-labelledby="resume-history-title">
            <div className="history-module-head">
              <div>
                <p className="section-eyebrow">Resume Optimization</p>
                <h2 id="resume-history-title">简历优化历史</h2>
              </div>
              <Link href="/resume-lab">
                <span className="material-symbols-outlined">description</span>
                打开实验室
              </Link>
            </div>

            <div className="history-record-stack">
              {history.resumeOptimizations.length > 0 ? (
                history.resumeOptimizations.map((item) => (
                  <article key={item.id} className="history-record-card history-record-card-accent">
                    <div className="history-record-head">
                      <div>
                        <span className="history-chip">简历优化</span>
                        <h3>{item.jobTitle}</h3>
                      </div>
                      <strong>已生成</strong>
                    </div>
                    <div className="history-meta-row">
                      <span>
                        <span className="material-symbols-outlined">update</span>
                        {formatTime(item.updatedAt)}
                      </span>
                      <span>{item.status}</span>
                    </div>
                    <p className="history-takeaway">
                      这条记录来自对应模拟面试的反馈证据，可继续回到简历实验室调整项目表达、关键词和风险提示。
                    </p>
                    <div className="history-card-actions">
                      <Link href={`/resume-lab?jobId=${item.jobId}`}>继续编辑</Link>
                      <Link href="/history">查看来源记录</Link>
                    </div>
                  </article>
                ))
              ) : (
                <article className="history-empty-state">
                  <span className="material-symbols-outlined">description</span>
                  <h3>还没有简历优化记录</h3>
                  <p>从面试总结进入简历优化后，系统会记录目标岗位、生成时间和优化来源。</p>
                  <Link href="/resume-lab">打开简历实验室</Link>
                </article>
              )}
            </div>
          </section>
        </section>
      </main>
    </HistoryChrome>
  );
}
