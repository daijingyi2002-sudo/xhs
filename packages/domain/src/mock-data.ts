import type {
  AdminSnapshot,
  CandidateProfile,
  Company,
  FitAnalysis,
  InterviewSummary,
  InterviewTurn,
  JobLead,
  RecommendationResult,
  ResumeSuggestion,
  XhsPost
} from "./schemas";

export const heroRole = "AI 产品经理" as const;

export const companies: Company[] = [
  { id: "bytedance", name: "字节跳动", slug: "bytedance", category: "internet-major", logoMark: "字" },
  { id: "tencent", name: "腾讯", slug: "tencent", category: "internet-major", logoMark: "腾" },
  { id: "alibaba", name: "阿里巴巴", slug: "alibaba", category: "internet-major", logoMark: "阿" },
  { id: "meituan", name: "美团", slug: "meituan", category: "internet-major", logoMark: "美" },
  { id: "pinduoduo", name: "拼多多", slug: "pinduoduo", category: "internet-major", logoMark: "拼" },
  { id: "baidu", name: "百度", slug: "baidu", category: "internet-major", logoMark: "百" },
  { id: "kuaishou", name: "快手", slug: "kuaishou", category: "internet-major", logoMark: "快" },
  { id: "xiaomi", name: "小米", slug: "xiaomi", category: "internet-major", logoMark: "米" },
  { id: "xiaohongshu", name: "小红书", slug: "xiaohongshu", category: "internet-major", logoMark: "红" },
  { id: "jd", name: "京东", slug: "jd", category: "internet-major", logoMark: "京" },
  { id: "ant", name: "蚂蚁集团", slug: "ant", category: "internet-major", logoMark: "蚂" },
  { id: "huawei", name: "华为", slug: "huawei", category: "internet-major", logoMark: "华" },
  { id: "sensetime", name: "商汤科技", slug: "sensetime", category: "ai-company", logoMark: "商" },
  { id: "iflytek", name: "科大讯飞", slug: "iflytek", category: "ai-company", logoMark: "讯" },
  { id: "cambricon", name: "寒武纪", slug: "cambricon", category: "ai-company", logoMark: "寒" }
];

export const jobLeads: JobLead[] = [
  {
    id: "lead-bytedance-strategy",
    companyId: "bytedance",
    roleName: heroRole,
    title: "AI 产品经理, 内容智能策略",
    city: "北京",
    seniority: "校招 / 应届",
    sourceConfidence: 94,
    summary: "聚焦大模型内容理解与策略落地，强调从数据洞察到用户场景闭环。",
    extractedRequirements: ["AI/LLM 应用理解", "内容产品思维", "跨团队推进", "实验设计"],
    recommendationReasons: ["你的项目叙事已经能承接 AI 功能落地", "用户研究与数据分析标签更适配内容策略", "北京意向与岗位城市一致"],
    riskReminder: "需要把项目里的指标闭环讲得更硬，不然容易被追问业务价值。",
    salaryBand: "20k-28k"
  },
  {
    id: "lead-ant-copilot",
    companyId: "ant",
    roleName: heroRole,
    title: "AI 产品经理, 智能助手平台",
    city: "杭州",
    seniority: "校招 / 应届",
    sourceConfidence: 91,
    summary: "偏平台型 AI 产品，需要把模型能力转成稳定产品体验和策略系统。",
    extractedRequirements: ["Agent 设计", "平台化能力", "指标定义", "产品方法论"],
    recommendationReasons: ["你对 Agent 托管式流程理解较强", "平台产品叙事和你的系统设计能力匹配", "你的作品方向可直接转成面试案例"],
    riskReminder: "如果没有补充 B 端或平台化思考，容易被认为偏功能型 PM。",
    salaryBand: "18k-26k"
  },
  {
    id: "lead-baidu-search",
    companyId: "baidu",
    roleName: heroRole,
    title: "AI 产品经理, 搜索智能问答",
    city: "北京",
    seniority: "校招 / 应届",
    sourceConfidence: 89,
    summary: "更看重 AI 理解、信息架构和产品结构化表达。",
    extractedRequirements: ["信息检索理解", "对话体验设计", "数据分析", "产品结构化思考"],
    recommendationReasons: ["你当前产品拆解方式适合答搜索问答类产品题", "对知识库和检索链路的理解是加分项", "整体画像偏结构化和策略型"],
    riskReminder: "需要准备搜索场景下的指标体系，否则问到留存会显得虚。",
    salaryBand: "19k-27k"
  },
  {
    id: "lead-xiaohongshu-community",
    companyId: "xiaohongshu",
    roleName: heroRole,
    title: "AI 产品经理, 社区创作工具",
    city: "上海",
    seniority: "校招 / 应届",
    sourceConfidence: 87,
    summary: "偏重用户洞察、创作者工具体验和 AI 交互设计。",
    extractedRequirements: ["用户洞察", "内容社区理解", "创作工具产品感", "AI 交互体验"],
    recommendationReasons: ["你对社区内容和面经场景非常熟悉", "用户洞察是你当前画像里的稳定优势", "这个项目本身就能作为强相关作品案例"],
    riskReminder: "需要说明你如何处理平台内容质量与推荐信号，不然会被追问风控。",
    salaryBand: "18k-25k"
  },
  {
    id: "lead-sensetime-enterprise",
    companyId: "sensetime",
    roleName: heroRole,
    title: "AI 产品经理, 行业解决方案",
    city: "上海",
    seniority: "校招 / 应届",
    sourceConfidence: 84,
    summary: "偏 AI 能力商品化，需要用更稳的业务语言讲模型价值。",
    extractedRequirements: ["AI 技术理解", "行业方案包装", "商业理解", "交付意识"],
    recommendationReasons: ["你对 AI 能力到产品场景映射有明显优势", "商业理解维度可通过这个项目补强", "上海岗位为你提供更强的 AI 公司叙事样本"],
    riskReminder: "行业方案岗更看重商业化表达，你需要减少纯体验向措辞。",
    salaryBand: "17k-24k"
  }
];

export const recommendationResults: RecommendationResult[] = jobLeads.map((lead, index) => ({
  id: `rec-${lead.id}`,
  jobLeadId: lead.id,
  score: 95 - index * 3,
  reasons: lead.recommendationReasons,
  riskReminder: lead.riskReminder
}));

export const defaultCandidateProfile: CandidateProfile = {
  id: "profile-demo",
  userId: "demo-user",
  heroRole,
  baseProfile: {
    education: ["某 985 高校, 信息管理与信息系统"],
    internships: ["校内实验室, 做过基于 LLM 的检索问答原型"],
    projects: ["求职 Agent / 面试知识库平台", "用户研究与推荐策略课程项目"],
    skills: ["PRD", "SQL", "Prompt Design", "Figma", "Python"],
    targetCities: ["北京", "上海", "杭州"]
  },
  capabilityTags: ["AI/LLM 应用理解", "产品结构化思考", "用户洞察", "数据分析", "项目表达"],
  aiPmFit: {
    score: 87,
    strengths: ["能把模型能力翻译成产品场景", "结构化表达清晰", "用户洞察较强"],
    gaps: ["商业化表达还不够硬", "缺少大规模实验叙事", "平台产品思考可以更强"],
    nextActions: ["补 2 个指标闭环案例", "准备一套 AI 产品 trade-off 回答", "强化简历里的结果指标"]
  }
};

export const fitAnalyses: Record<string, FitAnalysis> = {
  "lead-bytedance-strategy": {
    jobLeadId: "lead-bytedance-strategy",
    strengths: ["项目本身能证明你会做 AI 产品闭环", "用户洞察和内容理解适配内容智能场景", "能够讲清 retrieval + generation 的价值链"],
    gaps: ["A/B 实验叙事偏弱", "商业价值指标不够锋利", "跨团队推进案例还不够强"],
    jdGapMap: [
      { label: "AI 产品理解", current: "能讲架构与场景", target: "能讲取舍与效果衡量" },
      { label: "实验设计", current: "有课程项目经验", target: "要能说清指标与实验假设" },
      { label: "业务表达", current: "偏产品语言", target: "要能补充业务增益和增长逻辑" }
    ],
    summary: "整体匹配度高，但你需要把“会做”升级成“能证明这件事有效”。"
  }
};

export const interviewTurns: InterviewTurn[] = [
  { id: "turn-1", phase: "manager", question: "先不用介绍你自己，直接讲这个求职 Agent 为什么值得做。", coachingFocus: "先讲用户痛点，再讲闭环价值。", dimension: "产品结构化思考" },
  { id: "turn-2", phase: "manager", question: "如果推荐结果不准，你会先查模型、数据，还是交互路径？为什么？", coachingFocus: "说排查顺序，不要只说都会看。", dimension: "AI / LLM 理解" },
  { id: "turn-3", phase: "manager", question: "你为什么把岗位池定义成高置信岗位线索，而不直接说真实岗位？", coachingFocus: "这里要体现产品诚实和风险判断。", dimension: "商业理解" },
  { id: "turn-4", phase: "manager", question: "如果面试经验帖子内容互相矛盾，你的知识库怎么处理？", coachingFocus: "讲标签、置信度和 evidence trace。", dimension: "AI / LLM 理解" },
  { id: "turn-5", phase: "manager", question: "你怎么定义这个产品 Phase 1 的成功？", coachingFocus: "回到推荐、模拟面试、简历优化三条主指标。", dimension: "产品结构化思考" },
  { id: "turn-6", phase: "manager", question: "如果广场的数据热度很高，但主闭环转化下降，你怎么取舍？", coachingFocus: "先讲北极星指标，再讲产品边界。", dimension: "商业理解" },
  { id: "turn-7", phase: "hr", question: "说一个你做项目时推进最困难的时刻，你是怎么推动的？", coachingFocus: "回答要有冲突、有动作、有结果。", dimension: "项目表达" },
  { id: "turn-8", phase: "hr", question: "你最想加入什么样的团队，为什么？", coachingFocus: "把团队偏好和岗位要求连起来。", dimension: "用户洞察" },
  { id: "turn-9", phase: "hr", question: "如果这次没拿到 offer，你会怎么调整自己？", coachingFocus: "体现复盘能力和成长心态。", dimension: "项目表达" },
  { id: "turn-10", phase: "hr", question: "最后一个问题，你为什么适合 AI 产品经理？", coachingFocus: "用 strengths + evidence 收束，不要空喊热爱。", dimension: "AI / LLM 理解" }
];

export const interviewSummary: InterviewSummary = {
  scoreByDimension: [
    { dimension: "产品结构化思考", score: 8, note: "主线清晰，但指标表达还可以更锋利。" },
    { dimension: "AI / LLM 理解", score: 8, note: "能讲系统链路，但 trade-off 细节还需补充。" },
    { dimension: "用户洞察", score: 9, note: "对求职用户的真实痛点把握较强。" },
    { dimension: "项目表达", score: 7, note: "表达流畅，但结果量化不够。" },
    { dimension: "商业理解", score: 7, note: "已经有意识，但需要更具体的业务语言。" }
  ],
  overallTakeaway: "你已经具备 AI 产品经理的雏形，下一步关键是把产品判断转成更硬的业务证据。",
  nextActions: ["把 2 个项目 bullet 改成结果导向", "准备 AI 产品取舍题答案库", "补一套增长与实验指标叙事"]
};

export const resumeSuggestions: ResumeSuggestion[] = [
  {
    id: "resume-1",
    original: "负责一个求职相关项目的产品设计和前端实现。",
    rewritten: "主导设计并实现面向校招用户的求职 Agent 产品闭环，串联简历解析、岗位线索推荐、模拟面试与简历优化，明确以推荐准确度、面试反馈可执行性和简历改写质量作为核心指标。",
    reason: "把“负责”改成“主导”，并补足产品闭环和指标视角。"
  },
  {
    id: "resume-2",
    original: "做了一个基于大模型的知识库项目。",
    rewritten: "搭建基于检索增强的面试经验知识库，完成帖子采集、OCR、结构化标签与高置信岗位线索抽取，为推荐和模拟面试提供可追溯上下文。",
    reason: "把泛泛的“知识库”翻译成 AI 产品经理看得懂的系统能力。"
  },
  {
    id: "resume-3",
    original: "和同学一起做过用户调研。",
    rewritten: "围绕求职场景完成多轮用户访谈与行为归因，识别“方向不清晰、信息割裂、准备路径不连续”三类核心痛点，并据此重排首页交互和主闭环优先级。",
    reason: "把调研结果直接映射到产品决策。"
  }
];

export const plazaPosts: XhsPost[] = [
  {
    id: "post-1",
    companyId: "bytedance",
    roleId: "lead-bytedance-strategy",
    title: "字节 AI 产品一面复盘，重点全在指标和场景拆解",
    excerpt: "帖子重点提到面试官会追问为什么这个 AI 功能值得做，以及你如何证明它真的提升用户价值。",
    sourceUrl: "https://www.xiaohongshu.com/explore/demo-bytedance-ai-pm",
    publishTime: "2026-03-18",
    authorName: "应届 PM 冲刺中",
    topic: "一面复盘",
    stage: "manager",
    ocrText: "指标, 用户价值, 场景拆解",
    confidenceLabel: "高置信岗位线索"
  },
  {
    id: "post-2",
    companyId: "xiaohongshu",
    roleId: "lead-xiaohongshu-community",
    title: "小红书 AI 产品面试经验，创作者工具题很多",
    excerpt: "更强调创作者体验、社区机制和 AI 交互设计，不会只聊模型本身。",
    sourceUrl: "https://www.xiaohongshu.com/explore/demo-rednote-ai-pm",
    publishTime: "2026-03-26",
    authorName: "求职做题人",
    topic: "内容社区",
    stage: "manager",
    ocrText: "创作者, 工具体验, 社区机制",
    confidenceLabel: "高置信岗位线索"
  },
  {
    id: "post-3",
    companyId: "ant",
    roleId: "lead-ant-copilot",
    title: "蚂蚁智能助手 PM 面试，平台化思路真的重要",
    excerpt: "帖子里多次提到，面试官在意的不是功能点，而是你怎么定义平台能力边界。",
    sourceUrl: "https://www.xiaohongshu.com/explore/demo-ant-ai-platform",
    publishTime: "2026-04-03",
    authorName: "杭漂产品同学",
    topic: "平台能力",
    stage: "hr",
    ocrText: "平台边界, 能力复用, 组件化",
    confidenceLabel: "高置信岗位线索"
  }
];

export const adminSnapshot: AdminSnapshot = {
  totalPosts: plazaPosts.length,
  totalRoles: 1,
  companies: companies.slice(0, 6).map((company, index) => ({
    companyId: company.id,
    companyName: company.name,
    postCount: index === 0 ? 2 : 1
  })),
  roleOverview: [
    {
      roleName: heroRole,
      postCount: plazaPosts.length
    }
  ]
};

