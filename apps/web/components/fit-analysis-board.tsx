"use client";

import Link from "next/link";
import { type ReactNode, useEffect, useState } from "react";
import type { FitAnalysisAbilityItem, FitAnalysisResponse } from "@xhs/domain";
import {
  ArrowLeft,
  Bell,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  ClipboardList,
  FlaskConical,
  History,
  Home,
  MapPin,
  MessageCircle,
  Plus,
  Radar,
  Search,
  TriangleAlert
} from "lucide-react";
import { loadConsultationState } from "../lib/consultation-session";
import { buildAuthenticatedHeaders } from "../lib/api-auth-fetch";
import { AccountMenu } from "./account-menu";
import { BrandMark } from "./brand-mark";

type LoadState =
  | { status: "loading" }
  | { status: "ready"; data: FitAnalysisResponse }
  | { status: "empty" }
  | { status: "error"; message: string };

type AbilityStatus = FitAnalysisAbilityItem["status"];

const navItems = [
  { href: "/", icon: Home, label: "首页 Home" },
  { href: "/jobs", icon: BriefcaseBusiness, label: "职位 Jobs", active: true },
  { href: "/interview/demo", icon: MessageCircle, label: "模拟面试 Interview" },
  { href: "/resume-lab", icon: FlaskConical, label: "简历实验室 Resume Lab" },
  { href: "/plaza", icon: MessageCircle, label: "广场 Plaza" },
  { href: "/history", icon: History, label: "历史 History" }
];

const statusLabels: Record<AbilityStatus, string> = {
  strong: "超过 Exceeds",
  medium: "达标 Meets",
  weak: "差距 Gap"
};

function JobsChrome({ children }: { children: ReactNode }) {
  return (
    <div className="jobs-shell">
      <header className="jobs-mobile-bar">
        <BrandMark size="sm" />
        <AccountMenu variant="compact" />
        <strong>职业催化剂 Career Catalyst</strong>
      </header>

      <aside className="jobs-sidebar">
        <div className="jobs-sidebar-header">
          <BrandMark size="lg" />
          <AccountMenu variant="jobs" />
          <div>
            <strong>职业催化剂 Career Catalyst</strong>
            <span>AI 专家导师 Expert Mentor AI</span>
          </div>
        </div>

        <nav className="jobs-nav" aria-label="Job analysis">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className={`jobs-nav-item ${item.active ? "is-active" : ""}`}>
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="jobs-sidebar-footer">
          <Link href="/" className="jobs-new-consultation">
            <Plus size={18} />
            新咨询 New Consultation
          </Link>
        </div>
      </aside>

      <main className="jobs-main">
        <div className="jobs-topbar">
          <div>
            <span>Role Intelligence</span>
            <strong>职位匹配分析</strong>
          </div>
          <div className="jobs-topbar-status">
            <Bell size={18} />
            <span>高置信岗位线索</span>
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}

function JobsStatusPanel({
  eyebrow,
  title,
  description,
  action
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <JobsChrome>
      <section className="jobs-status-panel">
        <p>{eyebrow}</p>
        <h1>{title}</h1>
        <span>{description}</span>
        {action ? <div className="jobs-status-actions">{action}</div> : null}
      </section>
    </JobsChrome>
  );
}

function ScoreRing({ score }: { score: number }) {
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const normalizedScore = Math.max(0, Math.min(100, score));
  const offset = circumference - (normalizedScore / 100) * circumference;

  return (
    <div className="jobs-score-ring jobs-score-ring-lg" aria-label={`匹配分数 ${normalizedScore}`}>
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r={radius} />
        <circle cx="50" cy="50" r={radius} strokeDasharray={circumference} strokeDashoffset={offset} />
      </svg>
      <strong>{normalizedScore}</strong>
    </div>
  );
}

function getRequiredMarker(item: FitAnalysisAbilityItem) {
  if (item.status === "strong") {
    return Math.max(62, Math.min(88, item.score - 12));
  }

  if (item.status === "medium") {
    return item.score;
  }

  return Math.min(95, Math.max(item.score + 20, 72));
}

function EvidenceChip({ children }: { children: ReactNode }) {
  return (
    <span className="jobs-evidence-chip">
      <Search size={14} />
      {children}
    </span>
  );
}

function AnalysisContent({ data }: { data: FitAnalysisResponse }) {
  return (
    <div className="jobs-detail-page">
      <section className="jobs-detail-header">
        <div>
          <div className="jobs-detail-kicker">
            <span>职位分析 ROLE ANALYSIS</span>
            <small>Ref: {data.jobId}</small>
          </div>
          <h1>{data.roleTitle}</h1>
          <p className="jobs-detail-company">
            <Building2 size={20} />
            {data.company}
            <i />
            <MapPin size={20} />
            {data.city}
          </p>
          <p className="jobs-detail-summary">{data.overall_summary}</p>
        </div>

        <aside className="jobs-detail-score-card">
          <ScoreRing score={data.overallScore} />
          <div>
            <strong>高度匹配 Strong Alignment</strong>
            <span>
              基于已完成的求职意向对话、简历证据与该岗位线索，系统生成当前匹配判断。
            </span>
          </div>
        </aside>
      </section>

      <section className="jobs-detail-grid">
        <div className="jobs-detail-stack">
          <article className="jobs-analysis-section">
            <div className="jobs-section-title">
              <CheckCircle2 size={22} />
              <h2>优势总结 Advantage Summary</h2>
            </div>
            <ul className="jobs-analysis-rich-list">
              {data.strength_analysis.map((item) => (
                <li key={item}>
                  <CheckCircle2 size={20} />
                  <div>
                    <p>{item}</p>
                  </div>
                </li>
              ))}
              {data.whyRecommended.map((item) => (
                <li key={`${item.source}-${item.title}`}>
                  <CheckCircle2 size={20} />
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.detail}</p>
                    <EvidenceChip>
                      证据来源：{item.source === "resume" ? "简历 Resume" : "求职意向对话 Consultation"}
                      {item.weakEvidence ? "，证据偏弱" : ""}
                    </EvidenceChip>
                  </div>
                </li>
              ))}
            </ul>
          </article>

          <article className="jobs-analysis-section jobs-analysis-section-alert">
            <div className="jobs-section-title">
              <TriangleAlert size={22} />
              <h2>识别差距 Identified Gaps</h2>
            </div>
            <ul className="jobs-analysis-rich-list">
              {data.gap_analysis.map((gap) => (
                <li key={gap}>
                  <TriangleAlert size={20} />
                  <div>
                    <p>{gap}</p>
                  </div>
                </li>
              ))}
              {data.gaps.map((gap) => (
                <li key={gap}>
                  <TriangleAlert size={20} />
                  <div>
                    <p>{gap}</p>
                    <EvidenceChip>建议在模拟面试和简历优化中优先补强</EvidenceChip>
                  </div>
                </li>
              ))}
            </ul>
          </article>
        </div>

        <aside className="jobs-analysis-section jobs-gap-map">
          <div className="jobs-section-title jobs-section-title-spread">
            <h2>JD 差距图谱 JD Gap Map</h2>
            <Radar size={22} />
          </div>

          <div className="jobs-skill-legend">
            <span>
              <i className="jobs-legend-user" /> 您的水平 Your Level
            </span>
            <span>
              <i className="jobs-legend-required" /> 要求水平 Required Level
            </span>
          </div>

          <div className="jobs-skill-stack">
            {data.abilityMatch.map((item) => {
              const requiredMarker = getRequiredMarker(item);
              return (
                <div key={item.dimension} className="jobs-skill-row">
                  <div>
                    <strong>{item.label}</strong>
                    <span className={`jobs-skill-status is-${item.status}`}>{statusLabels[item.status]}</span>
                  </div>
                  <div className="jobs-skill-track">
                    <span style={{ width: `${item.score}%` }} />
                    <i style={{ left: `${requiredMarker}%` }} />
                  </div>
                  <p>{item.explanation}</p>
                </div>
              );
            })}
          </div>

          <p className="jobs-detail-footnote">
            此分析使用已完成咨询画像、简历证据和岗位线索进行映射；证据不足的维度会在差距中显式标记。
          </p>
        </aside>
      </section>

      <section className="jobs-jd-section jobs-detail-jd-section">
        {data.jdGapMap.map((item) => (
          <article key={item.label}>
            <strong>{item.label}</strong>
            <p>当前证据：{item.current}</p>
            <p>岗位期待：{item.target}</p>
          </article>
        ))}
      </section>

      <section className="jobs-modal-actions jobs-detail-actions">
        <div className="jobs-advice-panel">
          <strong>简历优化建议</strong>
          {data.resume_advice.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
        <div className="jobs-advice-panel">
          <strong>面试建议</strong>
          {data.interview_advice.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
        <Link href="/jobs" className="jobs-outline-action">
          <ArrowLeft size={18} />
          返回职位推荐
        </Link>
        <Link href={`/resume-lab?jobId=${encodeURIComponent(data.jobId)}`} className="jobs-outline-action">
          <ClipboardList size={18} />
          针对此职位优化简历 Optimize Resume
        </Link>
        <Link href={`/interview/${encodeURIComponent(data.jobId)}`} className="jobs-primary-action">
          <MessageCircle size={18} />
          开始此职位的模拟面试 Start Mock Interview
        </Link>
      </section>
    </div>
  );
}

export function FitAnalysisBoard({ jobId }: { jobId: string }) {
  const [loadState, setLoadState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    const consultationState = loadConsultationState();

    if (!consultationState?.done) {
      setLoadState({ status: "empty" });
      return;
    }

    async function run() {
      try {
        const response = await fetch("/api/fit-analysis", {
          method: "POST",
          headers: await buildAuthenticatedHeaders({
            "Content-Type": "application/json"
          }),
          body: JSON.stringify({ jobId, consultationState })
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(payload?.error ?? "岗位匹配分析加载失败。");
        }

        const data = (await response.json()) as FitAnalysisResponse;
        setLoadState({ status: "ready", data });
      } catch (error) {
        setLoadState({
          status: "error",
          message: error instanceof Error ? error.message : "岗位匹配分析加载失败。"
        });
      }
    }

    void run();
  }, [jobId]);

  if (loadState.status === "loading") {
    return (
      <JobsStatusPanel
        eyebrow="职位分析"
        title="正在生成岗位匹配分析"
        description="系统正在读取已完成的求职咨询画像，并与当前岗位线索完成匹配分析。"
      />
    );
  }

  if (loadState.status === "empty") {
    return (
      <JobsStatusPanel
        eyebrow="职位分析"
        title="先完成咨询，再进入岗位分析"
        description="完成首页的一问一答求职意向咨询后，这里会基于你的偏好、简历证据和岗位线索生成完整分析。"
        action={
          <Link href="/" className="jobs-primary-action">
            回到首页完成咨询
          </Link>
        }
      />
    );
  }

  if (loadState.status === "error") {
    return (
      <JobsStatusPanel
        eyebrow="Fit Analysis"
        title="岗位匹配分析暂时没有成功生成"
        description={loadState.message}
      />
    );
  }

  return (
    <JobsChrome>
      <AnalysisContent data={loadState.data} />
    </JobsChrome>
  );
}
