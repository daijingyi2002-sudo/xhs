import { synthesizeCandidateProfile, getTopRecommendations, getJobLead } from "@xhs/ai";
import { companies } from "@xhs/domain";
import { ConfidenceBadge, LeadCard, Reveal, SectionBlock } from "@xhs/ui";

export default function JobsPage() {
  const profile = synthesizeCandidateProfile({ userNotes: ["方向偏 AI 产品经理", "希望有内容和平台型岗位"] });
  const recommendations = getTopRecommendations(profile);

  return (
    <main className="page-stack">
      <Reveal>
        <SectionBlock
          eyebrow="Top 5 Role Leads"
          title="不是海投列表, 而是 Agent 为你收束出来的 5 个高优先级线索。"
          description="每张卡片都必须回答三个问题: 为什么它匹配、它在哪些地方适合你、你需要警惕什么。"
        >
          <ConfidenceBadge label="高置信岗位线索" score={recommendations[0]?.score} />
        </SectionBlock>
      </Reveal>

      <section className="lead-grid">
        {recommendations.map((recommendation, index) => {
          const lead = getJobLead(recommendation.jobLeadId);
          const company = companies.find((item) => item.id === lead?.companyId);

          if (!lead || !company) return null;

          return (
            <Reveal key={lead.id} delay={0.06 * index}>
              <LeadCard
                company={company.name}
                title={lead.title}
                score={recommendation.score}
                summary={lead.summary}
                reasons={recommendation.reasons}
                riskReminder={recommendation.riskReminder}
                href={`/jobs/${lead.id}`}
              />
            </Reveal>
          );
        })}
      </section>
    </main>
  );
}
