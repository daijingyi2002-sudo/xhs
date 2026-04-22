import Link from "next/link";
import { companies, defaultCandidateProfile, heroRole } from "@xhs/domain";
import { AppFrame, HeroPanel, MetricCard, Reveal, RouteRail, SectionBlock } from "@xhs/ui";
import { ConsultationStudio } from "../components/consultation-studio";

const journeyItems = [
  "上传简历或直接开始 Agent 咨询",
  "基于对话和画像生成 Top 5 高置信岗位线索",
  "进入岗位分析页，看优势、短板与 JD 差距",
  "开启 10 轮左右的模拟面试",
  "拿到 bullet 级简历优化建议"
];

export default function HomePage() {
  return (
    <main className="page-stack">
      <section className="hero-layout">
        <Reveal>
          <HeroPanel>
            <p className="section-eyebrow">Editorial Operations Room</p>
            <h2 className="hero-display">让求职从刷帖, 变成被托管的准备流程。</h2>
            <p className="hero-body">
              这不是一个先让你填长表单的求职网站。它先由 Agent 主动问清你的经历、目标城市、项目证据和风险点，再用高置信岗位线索、面试经验知识库和模拟面试把你一步步推向更像 offer-ready 的状态。
            </p>
            <div className="pill-row">
              <span className="pill">Hero Role: {heroRole}</span>
              <span className="pill">Top 15 公司池</span>
              <span className="pill">岗位池表述: 高置信岗位线索</span>
            </div>
          </HeroPanel>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="hero-aside">
            <div className="metric-row">
              <MetricCard label="画像得分" value={`${defaultCandidateProfile.aiPmFit.score}`} detail="当前演示画像更偏结构化和策略型 AI PM。" />
              <MetricCard label="能力标签" value="05" detail="AI/LLM、产品结构化、用户洞察、数据分析、项目表达。" />
              <MetricCard label="公司池" value={`${companies.length}`} detail="互联网大厂 + AI 公司，围绕 AI 产品经理收窄。" />
            </div>
            <RouteRail items={journeyItems} />
          </div>
        </Reveal>
      </section>

      <section className="route-grid">
        <Reveal delay={0.12}>
          <SectionBlock
            eyebrow="Agent First"
            title="首页先让用户动起来, 而不是先解释产品。"
            description="左边给用户清楚的战术地图，右边直接进入托管式咨询。这个入口既能承接简历上传，也能承接方向不清晰的用户。"
          >
            <div className="status-bar">
              <p className="helper-copy">我们先看的是用户是否值得被推到某个岗位线索，而不是先让用户自己在岗位海里淹死。</p>
              <strong>01 / 05</strong>
            </div>
          </SectionBlock>
        </Reveal>

        <Reveal delay={0.18}>
          <ConsultationStudio />
        </Reveal>
      </section>

      <Reveal delay={0.24}>
        <SectionBlock
          eyebrow="Why This Looks Different"
          title="这不是默认 AI SaaS 页面。"
          description="我们故意不用千篇一律的紫色渐变和中性栅格，而是做成一块温暖却带压迫感的求职作战台。截图拿掉 logo，依然能认得出来。"
        >
          <div className="metric-row">
            <MetricCard label="记忆点" value="01" detail="大字号标题 + 规则化网格 + 琥珀色信号条，像一本正在被批注的求职档案。" />
            <MetricCard label="主动作" value="咨询" detail="首页只有一个主要行动，先聊，再推荐，不让用户在入口迷失。" />
            <MetricCard label="下一步" value="岗位线索" detail="一旦 Agent 捕到足够信号，系统就把用户推向岗位分析，而不是继续闲聊。" tone="dark" />
          </div>
          <Link href="/jobs" className="primary-button">
            直接查看推荐岗位
          </Link>
        </SectionBlock>
      </Reveal>
    </main>
  );
}
