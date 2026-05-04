"use client";

import Link from "next/link";
import { type ReactNode, useEffect, useState } from "react";
import type { RecommendationResultCard, TopRecommendationResponse } from "@xhs/domain";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  FlaskConical,
  Gauge,
  History,
  Home,
  MapPin,
  MessageCircle,
  Plus,
  Sparkles,
  Users
} from "lucide-react";
import { loadConsultationState } from "../lib/consultation-session";
import {
  buildJobAnalysisHref,
  buildRecommendationRequest,
  parseTopRecommendationsResponse
} from "../lib/job-recommendation-handshake";
import { buildAuthenticatedHeaders } from "../lib/api-auth-fetch";
import { AccountMenu } from "./account-menu";
import { BrandMark } from "./brand-mark";

type LoadState =
  | { status: "loading" }
  | { status: "ready"; data: TopRecommendationResponse }
  | { status: "empty" }
  | { status: "error"; message: string };

const navItems = [
  { href: "/", icon: Home, label: "首页 Home" },
  { href: "/jobs", icon: BriefcaseBusiness, label: "职位 Jobs", active: true },
  { href: "/interview/demo", icon: MessageCircle, label: "模拟面试 Interview" },
  { href: "/resume-lab", icon: FlaskConical, label: "简历实验室 Resume Lab" },
  { href: "/plaza", icon: Users, label: "广场 Plaza" },
  { href: "/history", icon: History, label: "历史 History" }
];

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

        <nav className="jobs-nav" aria-label="Job recommendation">
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
            <strong>AI 产品经理职位推荐</strong>
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

function ScoreRing({ score, size = "md" }: { score: number; size?: "sm" | "md" }) {
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.max(0, Math.min(100, score)) / 100) * circumference;

  return (
    <div className={`jobs-score-ring jobs-score-ring-${size}`}>
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r={radius} />
        <circle cx="50" cy="50" r={radius} strokeDasharray={circumference} strokeDashoffset={offset} />
      </svg>
      <strong>{score}</strong>
    </div>
  );
}

function FeaturedRecommendationCard({
  recommendation
}: {
  recommendation: RecommendationResultCard;
}) {
  return (
    <article className="jobs-feature-card">
      <div className="jobs-feature-main">
        <div className="jobs-card-kicker">
          <Sparkles size={18} />
          <span>首选推荐 Top Pick</span>
        </div>
        <h2>{recommendation.roleTitle}</h2>
        <p className="jobs-company-line">
          <Building2 size={18} />
          {recommendation.company}
          <span />
          <MapPin size={18} />
          {recommendation.city}
        </p>
        <p className="jobs-summary">{recommendation.summary}</p>
        <p className="jobs-summary">{recommendation.recommendation_reason}</p>

        <div className="jobs-feature-score">
          <ScoreRing score={recommendation.matchScore} />
          <div>
            <strong>匹配度 Match Confidence</strong>
            <span>{recommendation.analysisPreview.interviewCta}</span>
          </div>
        </div>

        <Link href={buildJobAnalysisHref(recommendation.jobId)} className="jobs-primary-action">
          查看完整分析 View Full Analysis
          <ArrowRight size={18} />
        </Link>
      </div>

      <div className="jobs-feature-evidence">
        <p>推荐理由 Match Reasons</p>
        <ul>
          {recommendation.matched_strengths.map((reason) => (
            <li key={reason}>
              <CheckCircle2 size={18} />
              <span>{reason}</span>
            </li>
          ))}
        </ul>
        <div className="jobs-risk-note">
          <AlertTriangle size={18} />
          <span>{recommendation.riskReminder}</span>
        </div>
      </div>
    </article>
  );
}

function RecommendationCard({
  recommendation
}: {
  recommendation: RecommendationResultCard;
}) {
  return (
    <article className="jobs-card">
      <div className="jobs-card-progress" aria-hidden="true">
        <span style={{ width: `${recommendation.matchScore}%` }} />
      </div>

      <div className="jobs-card-topline">
        <div>
          <h3>{recommendation.roleTitle}</h3>
          <p>
            <Building2 size={16} />
            {recommendation.company}
            <span>·</span>
            {recommendation.city}
          </p>
        </div>
        <div className="jobs-match-chip">
          <Gauge size={16} />
          {recommendation.matchScore} 匹配
        </div>
      </div>

      <div className="jobs-reason-stack">
        <p className="jobs-card-explanation">{recommendation.recommendation_reason}</p>
        {recommendation.matched_strengths.map((reason) => (
          <div key={reason} className="jobs-reason-row">
            <CheckCircle2 size={18} />
            <span>{reason}</span>
          </div>
        ))}
      </div>

      <p className="jobs-card-risk">
        <strong>风险 Risk:</strong> {recommendation.riskReminder}
      </p>

      <Link href={buildJobAnalysisHref(recommendation.jobId)} className="jobs-secondary-action">
        查看完整分析 View Full Analysis
      </Link>
    </article>
  );
}

export function RecommendationBoard() {
  const [loadState, setLoadState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    const storedState = loadConsultationState();
    const requestBody = buildRecommendationRequest(storedState);

    if (!requestBody) {
      setLoadState({ status: "empty" });
      return;
    }

    async function run() {
      try {
        const response = await fetch("/api/recommendations", {
          method: "POST",
          headers: await buildAuthenticatedHeaders({
            "Content-Type": "application/json"
          }),
          body: JSON.stringify(requestBody)
        });

        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error((payload as { error?: string } | null)?.error ?? "推荐结果加载失败。");
        }

        setLoadState({ status: "ready", data: parseTopRecommendationsResponse(payload) });
      } catch (error) {
        setLoadState({
          status: "error",
          message: error instanceof Error ? error.message : "推荐结果加载失败。"
        });
      }
    }

    void run();
  }, []);

  if (loadState.status === "loading") {
    return (
      <JobsStatusPanel
        eyebrow="岗位推荐"
        title="正在生成推荐岗位"
        description="系统正在读取咨询画像并编排 Top 5 高置信岗位线索。"
      />
    );
  }

  if (loadState.status === "empty") {
    return (
      <JobsStatusPanel
        eyebrow="岗位推荐"
        title="先完成咨询，再进入岗位推荐"
        description="完成首页的 Agent 咨询后，这里会基于你的简历和对话生成 Top 5 推荐。"
        action={
          <Link href="/" className="jobs-primary-action">
            回到首页完成咨询
            <ArrowRight size={18} />
          </Link>
        }
      />
    );
  }

  if (loadState.status === "error") {
    return (
      <JobsStatusPanel
        eyebrow="Top 5 Role Leads"
        title="推荐结果暂时没有成功生成"
        description={loadState.message}
      />
    );
  }

  const [featuredRecommendation, ...otherRecommendations] = loadState.data.recommendations;

  return (
    <JobsChrome>
      <section className="jobs-hero">
        <div>
          <p>AI Product Manager Leads</p>
          <h1>AI 产品经理职位推荐</h1>
          <span>
            基于你最近完成的简历扫描和 Agent 咨询，我为你锁定 5 个最值得优先分析的高置信岗位线索。
          </span>
        </div>
        <div className="jobs-hero-badge">
          <Sparkles size={18} />
          <strong>{loadState.data.recommendations.length}</strong>
          <span>Top Matches</span>
        </div>
      </section>

      <section className="jobs-board">
        {featuredRecommendation ? (
          <FeaturedRecommendationCard recommendation={featuredRecommendation} />
        ) : null}

        <div className="jobs-card-grid">
          {otherRecommendations.map((recommendation) => (
            <RecommendationCard key={recommendation.id} recommendation={recommendation} />
          ))}
        </div>
      </section>

    </JobsChrome>
  );
}
