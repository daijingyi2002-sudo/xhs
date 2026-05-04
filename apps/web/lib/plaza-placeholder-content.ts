export type PlazaJobPlaceholder = {
  id: string;
  title: string;
  role: "AI 产品经理";
  company: string;
  city: string;
  salaryBand: string;
  confidence: number;
  workMode: string;
  sourceLabel: string;
  summary: string;
  matchReasons: [string, string, string];
  riskReminder: string;
  tags: string[];
  analysisHref: string;
  interviewHref: string;
  isPlaceholder: true;
};

export type PlazaInsight = {
  id: string;
  title: string;
  company: string;
  stage: string;
  topic: string;
  readTime: string;
  summary: string;
  href: string;
};

const companies = [
  { name: "字节跳动", city: "北京", mark: "BY" },
  { name: "腾讯", city: "深圳", mark: "TX" },
  { name: "阿里巴巴", city: "杭州", mark: "AL" },
  { name: "美团", city: "北京", mark: "MT" },
  { name: "小红书", city: "上海", mark: "XH" },
  { name: "百度", city: "北京", mark: "BD" },
  { name: "快手", city: "北京", mark: "KS" },
  { name: "蚂蚁集团", city: "杭州", mark: "AN" },
  { name: "商汤科技", city: "上海", mark: "ST" },
  { name: "科大讯飞", city: "合肥", mark: "IF" }
] as const;

const tracks = [
  {
    name: "内容智能策略",
    summary: "围绕内容理解、推荐解释和创作者体验，把模型能力转成可验证的产品策略。",
    tags: ["内容生态", "策略产品", "LLM 应用"],
    risk: "需要补足指标拆解与实验设计，否则容易停留在功能描述。"
  },
  {
    name: "企业智能助手",
    summary: "负责 Copilot 工作台、知识检索和业务流程自动化，强调场景闭环与交付稳定性。",
    tags: ["Agent", "B 端平台", "知识库"],
    risk: "需要准备平台化边界和权限安全案例，避免只讲单点 demo。"
  },
  {
    name: "搜索问答体验",
    summary: "面向搜索、问答和推荐解释场景，关注答案可信度、召回质量和用户反馈闭环。",
    tags: ["搜索问答", "RAG", "可信生成"],
    risk: "需要讲清证据引用、拒答策略和低置信处理。"
  },
  {
    name: "商业化增长工具",
    summary: "把 AI 能力放进线索筛选、投放创意和经营分析，连接业务指标与产品动作。",
    tags: ["增长", "商业化", "数据分析"],
    risk: "需要把 AI 产出和业务收益分开验证，避免过度归因。"
  },
  {
    name: "多模态创作工具",
    summary: "聚焦图文生成、素材理解和编辑工作流，要求兼顾创作效率与内容质量。",
    tags: ["多模态", "创作工具", "用户洞察"],
    risk: "需要说明内容安全、版权边界和质量评估方式。"
  }
] as const;

function buildPlaceholder(index: number): PlazaJobPlaceholder {
  const company = companies[index % companies.length];
  const track = tracks[Math.floor(index / companies.length) % tracks.length];
  const sequence = String(index + 1).padStart(2, "0");
  const id = `placeholder-ai-pm-${sequence}`;
  const confidence = 92 - (index % 9);

  return {
    id,
    title: `AI 产品经理｜${track.name}`,
    role: "AI 产品经理",
    company: company.name,
    city: company.city,
    salaryBand: index % 3 === 0 ? "18k-26k" : index % 3 === 1 ? "20k-30k" : "16k-24k",
    confidence,
    workMode: index % 4 === 0 ? "可远程协作" : index % 4 === 1 ? "混合办公" : "现场协作",
    sourceLabel: "占位岗位线索",
    summary: track.summary,
    matchReasons: [
      "适合展示 AI 产品经理方向的结构化思考。",
      "可承接简历、咨询画像和岗位分析的主链路。",
      "后续可直接替换为你提供的真实 50 个岗位。"
    ],
    riskReminder: track.risk,
    tags: [...track.tags, company.mark],
    analysisHref: `/jobs/${id}`,
    interviewHref: `/interview/${id}`,
    isPlaceholder: true
  };
}

export const plazaJobPlaceholders = Array.from({ length: 50 }, (_, index) => buildPlaceholder(index));

export const plazaInsights: PlazaInsight[] = [
  {
    id: "insight-ai-pm-metrics",
    title: "AI 产品经理一面高频：如何定义模型效果指标",
    company: "字节跳动",
    stage: "业务一面",
    topic: "指标体系",
    readTime: "8 min",
    summary: "从用户价值、模型质量、业务转化三个层级拆开回答，避免只讲准确率或召回率。",
    href: "/plaza/posts/post-1"
  },
  {
    id: "insight-copilot-platform",
    title: "智能助手平台面试：怎么讲清 Agent 边界",
    company: "蚂蚁集团",
    stage: "业务二面",
    topic: "Agent 设计",
    readTime: "10 min",
    summary: "重点准备任务拆解、权限控制、失败兜底和人工接管，让面试官看到产品化判断。",
    href: "/plaza/posts/post-3"
  },
  {
    id: "insight-creator-tools",
    title: "创作工具方向：用户洞察题怎么回答更像产品经理",
    company: "小红书",
    stage: "业务一面",
    topic: "用户研究",
    readTime: "7 min",
    summary: "先定义创作者分层，再解释素材生产、发布反馈和内容质量之间的真实矛盾。",
    href: "/plaza/posts/post-2"
  }
];
