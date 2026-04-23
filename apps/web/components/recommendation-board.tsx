"use client";

import { useEffect, useState } from "react";
import type { TopRecommendationResponse } from "@xhs/domain";
import { ConfidenceBadge, LeadCard, Reveal, SectionBlock } from "@xhs/ui";
import { loadConsultationState } from "../lib/consultation-session";

type LoadState =
  | { status: "loading" }
  | { status: "ready"; data: TopRecommendationResponse }
  | { status: "empty" }
  | { status: "error"; message: string };

export function RecommendationBoard() {
  const [loadState, setLoadState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    const consultationState = loadConsultationState();

    if (!consultationState?.done) {
      setLoadState({ status: "empty" });
      return;
    }

    async function run() {
      try {
        const response = await fetch("/api/recommendations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ consultationState })
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(payload?.error ?? "推荐结果加载失败。");
        }

        const data = (await response.json()) as TopRecommendationResponse;
        setLoadState({ status: "ready", data });
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
      <main className="page-stack">
        <SectionBlock
          eyebrow="岗位推荐"
          title="正在生成推荐岗位"
          description="马上会看到按匹配度排序的 5 个岗位。"
        >
          <ConfidenceBadge label="高置信岗位线索" />
        </SectionBlock>
      </main>
    );
  }

  if (loadState.status === "empty") {
    return (
      <main className="page-stack">
        <SectionBlock
          eyebrow="岗位推荐"
          title="先完成咨询，再进入岗位推荐"
          description="完成首页咨询后，这里会自动生成更值得优先看的岗位。"
        />
      </main>
    );
  }

  if (loadState.status === "error") {
    return (
      <main className="page-stack">
        <SectionBlock
          eyebrow="Top 5 Role Leads"
          title="推荐结果暂时没有成功生成"
          description={loadState.message}
        />
      </main>
    );
  }

  const { data } = loadState;

  return (
    <main className="page-stack">
      <Reveal>
        <SectionBlock
          eyebrow="岗位推荐"
          title="优先看的 5 个岗位"
          description="按匹配度排序，每个岗位都会告诉你推荐原因和风险提醒。"
        >
          <ConfidenceBadge label="高置信岗位线索" score={data.recommendations[0]?.matchScore} />
        </SectionBlock>
      </Reveal>

      <section className="lead-grid">
        {data.recommendations.map((recommendation, index) => (
          <Reveal key={recommendation.id} delay={0.06 * index}>
            <LeadCard
              company={recommendation.company}
              title={recommendation.roleTitle}
              city={recommendation.city}
              sourceLabel={recommendation.sourceType}
              score={recommendation.matchScore}
              summary={recommendation.summary}
              reasons={recommendation.matchReasons}
              riskReminder={recommendation.riskReminder}
              href={`/jobs/${recommendation.jobId}`}
            />
          </Reveal>
        ))}
      </section>
    </main>
  );
}
