import Link from "next/link";
import { companies, jobLeads, plazaPosts } from "@xhs/domain";
import { Reveal, SectionBlock } from "@xhs/ui";

export default function PlazaPage() {
  return (
    <main className="page-stack">
      <Reveal>
        <SectionBlock
          eyebrow="Career Plaza"
          title="广场只做发现, 不做喧宾夺主。"
          description="这里分成推荐岗位和面试经验内容两个栏目。它是补充层，不是主战场，所以所有详情都要能把用户再推回岗位分析或模拟面试。"
        >
          <div className="plaza-tabs">
            <span className="pill">推荐岗位</span>
            <span className="pill">面试经验内容</span>
          </div>
        </SectionBlock>
      </Reveal>

      <section className="plaza-section">
        <p className="section-eyebrow">推荐岗位</p>
        <div className="plaza-grid">
          {jobLeads.slice(0, 4).map((lead, index) => {
            const company = companies.find((item) => item.id === lead.companyId);

            return (
              <Reveal key={lead.id} delay={0.05 * index}>
                <Link className="plaza-card" href={`/jobs/${lead.id}`}>
                  <div className="plaza-meta">
                    <span className="plaza-topic">{company?.name}</span>
                    <span className="journey-chip">{lead.city}</span>
                  </div>
                  <h3>{lead.title}</h3>
                  <p>{lead.summary}</p>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </section>

      <section className="plaza-section">
        <p className="section-eyebrow">面试经验内容</p>
        <div className="plaza-grid">
          {plazaPosts.map((post, index) => (
            <Reveal key={post.id} delay={0.06 * index}>
              <Link className="plaza-card" href={`/plaza/posts/${post.id}`}>
                <div className="plaza-meta">
                  <span className="plaza-topic">{post.topic}</span>
                  <span className="journey-chip">{post.stage}</span>
                </div>
                <h3>{post.title}</h3>
                <p>{post.excerpt}</p>
                <small className="plaza-small">来源作者: {post.authorName}</small>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
    </main>
  );
}
