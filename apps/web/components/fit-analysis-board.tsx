"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { FitAnalysisResponse } from "@xhs/domain";
import { ConfidenceBadge, MetricCard, Reveal, SectionBlock } from "@xhs/ui";
import { loadConsultationState } from "../lib/consultation-session";

type LoadState =
  | { status: "loading" }
  | { status: "ready"; data: FitAnalysisResponse }
  | { status: "empty" }
  | { status: "error"; message: string };

const statusLabels: Record<string, string> = {
  strong: "强",
  medium: "中",
  weak: "弱"
};

const directionLabels: Record<string, string> = {
  ai: "AI",
  tool: "工具",
  content: "内容",
  commerce: "电商",
  community: "社区",
  general: "通用产品"
};

const workStyleLabels: Record<string, string> = {
  "big-tech": "大厂",
  "growth-stage": "成长型团队",
  "high-intensity": "高节奏",
  stability: "稳定交付"
};

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
          headers: {
            "Content-Type": "application/json"
          },
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
      <main className="page-stack">
        <SectionBlock
          eyebrow="岗位分析"
          title="正在生成岗位匹配分析"
          description="马上会看到你的优势、短板和 JD 差距。"
        />
      </main>
    );
  }

  if (loadState.status === "empty") {
    return (
      <main className="page-stack">
        <SectionBlock
          eyebrow="岗位分析"
          title="先完成咨询，再进入岗位分析"
          description="完成首页咨询后，这里会基于你的信息生成岗位匹配分析。"
        >
          <div className="pill-row">
            <Link href="/" className="primary-button">
              回到首页完成咨询
            </Link>
          </div>
        </SectionBlock>
      </main>
    );
  }

  if (loadState.status === "error") {
    return (
      <main className="page-stack">
        <SectionBlock eyebrow="Fit Analysis" title="岗位匹配分析暂时没有成功生成" description={loadState.message} />
      </main>
    );
  }

  const { data } = loadState;

  return (
    <main className="page-stack">
      <Reveal>
        <div className="detail-panel">
          <div className="detail-topline">
            <p className="section-eyebrow">{data.company}</p>
            <ConfidenceBadge label={data.sourceType} score={data.overallScore} />
          </div>
          <h2 className="detail-title">{data.roleTitle}</h2>
          <p className="detail-copy">先看这个岗位为什么适合你、还差什么，再决定下一步怎么准备。</p>
        </div>
      </Reveal>

      <section className="detail-grid">
        <div className="detail-panel-stack">
          <Reveal>
            <div className="detail-panel">
              <p className="section-eyebrow">推荐原因</p>
              <div className="fit-reason-list">
                {data.whyRecommended.map((item) => (
                  <article key={`${item.source}-${item.title}`} className="fit-reason-item">
                    <div className="fit-reason-topline">
                      <strong>{item.title}</strong>
                      <span className={`fit-source fit-source-${item.source}`}>
                        {item.source === "resume" ? "能力证据 / 简历" : "职业意图 / 对话"}
                      </span>
                    </div>
                    <p>{item.detail}</p>
                  </article>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.04}>
            <div className="detail-panel">
              <p className="section-eyebrow">能力匹配</p>
              <div className="ability-grid">
                {data.abilityMatch.map((item) => (
                  <article key={item.dimension} className="ability-card">
                    <div className="ability-card-topline">
                      <strong>{item.label}</strong>
                      <span className={`ability-status ability-status-${item.status}`}>
                        {statusLabels[item.status]}
                      </span>
                    </div>
                    <p>{item.explanation}</p>
                    <div className="evidence-list">
                      {item.evidence.length > 0 ? (
                        item.evidence.map((evidence) => <span key={evidence}>简历证据：{evidence}</span>)
                      ) : (
                        <span>简历证据较弱，当前还缺少更直接的支撑。</span>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="detail-panel">
              <p className="section-eyebrow">差距分析</p>
              <ul className="fit-list">
                {data.gaps.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <div className="jd-map">
                {data.jdGapMap.map((item) => (
                  <article key={item.label} className="jd-row">
                    <strong>{item.label}</strong>
                    <p>当前证据：{item.current}</p>
                    <p>岗位期待：{item.target}</p>
                  </article>
                ))}
              </div>
            </div>
          </Reveal>
        </div>

        <div className="detail-panel-stack">
          <Reveal>
            <div className="detail-panel">
              <p className="section-eyebrow">岗位概览</p>
              <div className="metric-row metric-row-single">
                <MetricCard label="城市" value={data.city} detail={data.sourceType} />
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.04}>
            <div className="detail-panel">
              <p className="section-eyebrow">你的偏好</p>
              <div className="intent-summary">
                <p>
                  <strong>目标城市：</strong>
                  {data.intentSummary.targetCities.length > 0 ? data.intentSummary.targetCities.join(" / ") : "暂未明确"}
                </p>
                <p>
                  <strong>偏好方向：</strong>
                  {data.intentSummary.preferredDirections.length > 0
                    ? data.intentSummary.preferredDirections.map((item) => directionLabels[item] ?? item).join(" / ")
                    : "暂未明确"}
                </p>
                <p>
                  <strong>偏好公司：</strong>
                  {data.intentSummary.preferredCompanies.length > 0
                    ? data.intentSummary.preferredCompanies.join(" / ")
                    : "暂无特别明确的公司偏好"}
                </p>
                <p>
                  <strong>工作偏好：</strong>
                  {data.intentSummary.workStylePreferences.length > 0
                    ? data.intentSummary.workStylePreferences.map((item) => workStyleLabels[item] ?? item).join(" / ")
                    : "暂未明确"}
                </p>
              </div>
              <ul className="fit-list fit-list-compact">
                {data.intentSummary.reasons.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="detail-panel">
              <p className="section-eyebrow">下一步建议</p>
              <ul className="fit-list">
                {data.nextSteps.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <div className="pill-row">
                <Link href={`/interview/${data.jobId}`} className="primary-button">
                  进入模拟面试
                </Link>
                <Link href="/jobs" className="ghost-button">
                  返回岗位推荐
                </Link>
              </div>
              <p className="detail-caption">{data.interviewCta}</p>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
