import Link from "next/link";
import { getFitAnalysis, getJobLead } from "@xhs/ai";
import { companies, jobLeads } from "@xhs/domain";
import { ConfidenceBadge, MetricCard, Reveal } from "@xhs/ui";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return jobLeads.map((lead) => ({ jobId: lead.id }));
}

export default async function JobDetailPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  const lead = getJobLead(jobId);

  if (!lead) notFound();

  const company = companies.find((item) => item.id === lead.companyId);
  const analysis = getFitAnalysis(jobId);

  return (
    <main className="page-stack">
      <Reveal>
        <div className="detail-panel">
          <div className="detail-topline">
            <p className="section-eyebrow">{company?.name}</p>
            <ConfidenceBadge label="高置信岗位线索" score={lead.sourceConfidence} />
          </div>
          <h2 className="detail-title">{lead.title}</h2>
          <p className="detail-copy">{analysis.summary}</p>
        </div>
      </Reveal>

      <section className="detail-grid">
        <div className="detail-panel-stack">
          <div className="detail-panel">
            <p className="section-eyebrow">Strengths</p>
            <ul className="fit-list">
              {analysis.strengths.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="detail-panel">
            <p className="section-eyebrow">Gaps</p>
            <ul className="fit-list">
              {analysis.gaps.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="detail-panel">
            <p className="section-eyebrow">JD Gap Map</p>
            <div className="jd-map">
              {analysis.jdGapMap.map((item) => (
                <article key={item.label} className="jd-row">
                  <strong>{item.label}</strong>
                  <p>现在: {item.current}</p>
                  <p>目标: {item.target}</p>
                </article>
              ))}
            </div>
          </div>
        </div>

        <div className="detail-panel-stack">
          <MetricCard label="城市" value={lead.city} detail={`薪资区间 ${lead.salaryBand}`} />
          <MetricCard label="经验要求" value={lead.seniority} detail="当前 Phase 1 只收校招 / 应届语境。" />
          <MetricCard label="下一步" value="面试" detail="从分析页直接进入模拟面试，避免把洞察留在纸面上。" tone="dark" />
          <div className="detail-panel">
            <p className="section-eyebrow">CTA</p>
            <div className="pill-row">
              <Link href={`/interview/${lead.id}`} className="primary-button">
                进入模拟面试
              </Link>
              <Link href="/resume-lab" className="ghost-button">
                看简历优化
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
