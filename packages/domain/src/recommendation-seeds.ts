import type { RecommendationJobSeed } from "./recommendation-contracts";

const aiHeavy = {
  ai_llm_understanding: 0.32,
  project_experience: 0.22,
  product_methodology: 0.18,
  data_analysis: 0.16,
  user_research: 0.12
} as const;

const communityHeavy = {
  ai_llm_understanding: 0.24,
  project_experience: 0.2,
  product_methodology: 0.18,
  data_analysis: 0.14,
  user_research: 0.24
} as const;

const platformHeavy = {
  ai_llm_understanding: 0.28,
  project_experience: 0.2,
  product_methodology: 0.22,
  data_analysis: 0.16,
  user_research: 0.14
} as const;

const productHeavy = {
  ai_llm_understanding: 0.22,
  project_experience: 0.24,
  product_methodology: 0.24,
  data_analysis: 0.16,
  user_research: 0.14
} as const;

export const phase1RecommendationJobSeeds: RecommendationJobSeed[] = [
  {
    id: "seed-bytedance-ai-content",
    companyId: "bytedance",
    companyName: "字节跳动",
    roleTitle: "AI 产品经理",
    jobTitle: "AI 产品经理 - 内容理解与创作工具",
    city: "北京",
    summary: "聚焦内容理解、创作提效和大模型能力落地，强调从用户场景到指标闭环的完整产品判断。",
    requirements: ["理解 AI / LLM 能力边界", "能拆解内容创作场景", "能用指标验证功能价值", "能推进跨团队落地"],
    preferredSignals: ["做过 AI 产品原型或 Agent 项目", "能讲清用户问题与方案取舍", "对内容产品有理解"],
    riskHints: ["如果案例只有功能描述、没有指标闭环，容易被继续追问业务价值。"],
    sourceType: "高置信岗位线索",
    sourceConfidence: 94,
    dimensionWeights: aiHeavy,
    retrievalText:
      "字节跳动 北京 AI 产品经理 内容理解 创作工具 大模型 指标闭环 用户场景 方案取舍 跨团队落地"
  },
  {
    id: "seed-tencent-ai-assistant",
    companyId: "tencent",
    companyName: "腾讯",
    roleTitle: "AI 产品经理",
    jobTitle: "AI 产品经理 - 智能助手与效率产品",
    city: "深圳",
    summary: "更看重产品结构化思考、协作能力和 AI 功能在真实场景中的稳定交付。",
    requirements: ["有清晰的产品判断方法", "能拆解效率类场景", "能理解多轮交互与体验设计", "能协同研发推进"],
    preferredSignals: ["做过对话式产品", "能讲清优先级和 trade-off", "表达稳定清晰"],
    riskHints: ["如果缺少复杂协作场景，可能会显得更像功能型 PM。"],
    sourceType: "高置信岗位线索",
    sourceConfidence: 92,
    dimensionWeights: platformHeavy,
    retrievalText:
      "腾讯 深圳 AI 产品经理 智能助手 效率产品 多轮交互 体验设计 优先级 trade-off 协作推进"
  },
  {
    id: "seed-alibaba-ai-commerce",
    companyId: "alibaba",
    companyName: "阿里巴巴",
    roleTitle: "AI 产品经理",
    jobTitle: "AI 产品经理 - 电商经营与商家工具",
    city: "杭州",
    summary: "偏经营和商家效率场景，重视业务理解、指标体系和 AI 能力的经营价值。",
    requirements: ["理解经营指标", "能拆解商家工具场景", "对 AI 能力有实际判断", "能连接产品与业务目标"],
    preferredSignals: ["做过经营分析或增长分析", "有 SQL / 数据分析经历", "会用案例说明商业价值"],
    riskHints: ["如果没有经营类指标叙事，面试中会被追问价值证明。"],
    sourceType: "高置信岗位线索",
    sourceConfidence: 90,
    dimensionWeights: {
      ai_llm_understanding: 0.24,
      project_experience: 0.22,
      product_methodology: 0.18,
      data_analysis: 0.24,
      user_research: 0.12
    },
    retrievalText:
      "阿里巴巴 杭州 AI 产品经理 电商 经营 商家工具 SQL 数据分析 商业价值 指标体系"
  },
  {
    id: "seed-meituan-ai-local",
    companyId: "meituan",
    companyName: "美团",
    roleTitle: "AI 产品经理",
    jobTitle: "AI 产品经理 - 本地生活智能决策",
    city: "北京",
    summary: "强调高频业务场景、指标敏感度和 AI 能力在本地生活中的稳定决策支持。",
    requirements: ["能理解高频业务链路", "对转化与漏斗敏感", "能把 AI 方案落到经营动作", "能处理复杂约束"],
    preferredSignals: ["做过增长或转化分析", "能讲清数据到产品动作的链路", "有执行节奏感"],
    riskHints: ["如果案例无法落到具体业务动作，会显得过于概念化。"],
    sourceType: "高置信岗位线索",
    sourceConfidence: 91,
    dimensionWeights: {
      ai_llm_understanding: 0.22,
      project_experience: 0.22,
      product_methodology: 0.18,
      data_analysis: 0.24,
      user_research: 0.14
    },
    retrievalText:
      "美团 北京 AI 产品经理 本地生活 智能决策 转化 漏斗 经营动作 高频业务 复杂约束"
  },
  {
    id: "seed-pdd-ai-growth",
    companyId: "pinduoduo",
    companyName: "拼多多",
    roleTitle: "AI 产品经理",
    jobTitle: "AI 产品经理 - 增长与推荐策略",
    city: "上海",
    summary: "偏增长策略与推荐场景，要求强数据敏感度和非常具体的结果表达。",
    requirements: ["对增长指标敏感", "能解释推荐策略逻辑", "会做实验与复盘", "能承受高节奏推进"],
    preferredSignals: ["有 A/B 实验经历", "熟悉 SQL 或指标分析", "表达结果导向"],
    riskHints: ["如果回答不够量化，容易在面试里被迅速压缩评分。"],
    sourceType: "高置信岗位线索",
    sourceConfidence: 89,
    dimensionWeights: {
      ai_llm_understanding: 0.2,
      project_experience: 0.22,
      product_methodology: 0.16,
      data_analysis: 0.28,
      user_research: 0.14
    },
    retrievalText:
      "拼多多 上海 AI 产品经理 增长 推荐策略 A/B 实验 SQL 指标分析 结果导向"
  },
  {
    id: "seed-baidu-ai-search",
    companyId: "baidu",
    companyName: "百度",
    roleTitle: "AI 产品经理",
    jobTitle: "AI 产品经理 - 搜索与问答体验",
    city: "北京",
    summary: "关注检索、问答和 AI 交互体验，重视结构化表达与信息组织能力。",
    requirements: ["理解检索与问答场景", "能拆解用户问题路径", "能定义质量指标", "有一定 AI / LLM 理解"],
    preferredSignals: ["做过知识库、搜索、RAG 或问答相关项目", "能解释信息架构", "表达清晰有结构"],
    riskHints: ["如果对 retrieval 和生成的边界说不清，会被继续深挖。"],
    sourceType: "高置信岗位线索",
    sourceConfidence: 90,
    dimensionWeights: aiHeavy,
    retrievalText:
      "百度 北京 AI 产品经理 搜索 问答 检索 RAG 信息架构 质量指标 交互体验"
  },
  {
    id: "seed-kuaishou-ai-creator",
    companyId: "kuaishou",
    companyName: "快手",
    roleTitle: "AI 产品经理",
    jobTitle: "AI 产品经理 - 创作者增长工具",
    city: "北京",
    summary: "偏创作者工具和社区生态，重视用户洞察、内容理解与增长闭环。",
    requirements: ["理解创作者场景", "能做用户洞察", "能定义增长闭环", "能平衡体验与平台规则"],
    preferredSignals: ["做过内容或社区相关项目", "有用户研究经历", "能解释指标与体验取舍"],
    riskHints: ["如果只讲功能，不讲平台生态与用户机制，容易被判定视角偏窄。"],
    sourceType: "高置信岗位线索",
    sourceConfidence: 87,
    dimensionWeights: communityHeavy,
    retrievalText:
      "快手 北京 AI 产品经理 创作者 工具 社区 内容理解 用户洞察 增长闭环 平台规则"
  },
  {
    id: "seed-xiaomi-ai-os",
    companyId: "xiaomi",
    companyName: "小米",
    roleTitle: "AI 产品经理",
    jobTitle: "AI 产品经理 - 终端智能体验",
    city: "北京",
    summary: "关注终端体验、设备联动和 AI 功能在真实使用场景中的可用性。",
    requirements: ["关注终端体验", "能做复杂流程拆解", "理解 AI 功能可用性", "有跨端协同意识"],
    preferredSignals: ["做过复杂交互产品", "有产品方法论表达", "能讲场景化设计"],
    riskHints: ["如果没有复杂体验设计案例，容易显得过于互联网单端化。"],
    sourceType: "高置信岗位线索",
    sourceConfidence: 86,
    dimensionWeights: platformHeavy,
    retrievalText:
      "小米 北京 AI 产品经理 终端 智能体验 设备联动 场景化设计 复杂流程 可用性"
  },
  {
    id: "seed-rednote-ai-community",
    companyId: "xiaohongshu",
    companyName: "小红书",
    roleTitle: "AI 产品经理",
    jobTitle: "AI 产品经理 - 社区创作与内容体验",
    city: "上海",
    summary: "重视内容社区、创作工具和用户洞察，强调 AI 在内容理解中的真实体验价值。",
    requirements: ["理解社区内容机制", "能做创作工具产品", "有用户研究能力", "能平衡内容质量与体验效率"],
    preferredSignals: ["做过内容社区项目", "有用户访谈或洞察经验", "能将洞察转成产品动作"],
    riskHints: ["如果对内容质量和平台约束没有回答，容易被认为理解不够完整。"],
    sourceType: "高置信岗位线索",
    sourceConfidence: 88,
    dimensionWeights: communityHeavy,
    retrievalText:
      "小红书 上海 AI 产品经理 社区 创作工具 内容体验 用户研究 内容质量 平台约束"
  },
  {
    id: "seed-jd-ai-commerce-tool",
    companyId: "jd",
    companyName: "京东",
    roleTitle: "AI 产品经理",
    jobTitle: "AI 产品经理 - 商家经营智能工具",
    city: "北京",
    summary: "聚焦商家经营工具和效率优化，要求数据分析、经营理解和产品推进能力同时在线。",
    requirements: ["理解商家经营场景", "能搭指标体系", "有 AI 工具理解", "能做业务动作闭环"],
    preferredSignals: ["做过经营分析", "会用 SQL 做业务判断", "能讲清产品上线结果"],
    riskHints: ["如果没有经营场景案例，容易被追问为什么适合电商工具线。"],
    sourceType: "高置信岗位线索",
    sourceConfidence: 88,
    dimensionWeights: {
      ai_llm_understanding: 0.22,
      project_experience: 0.22,
      product_methodology: 0.18,
      data_analysis: 0.24,
      user_research: 0.14
    },
    retrievalText:
      "京东 北京 AI 产品经理 商家经营 工具 SQL 指标体系 业务动作 效率优化 电商"
  },
  {
    id: "seed-ant-ai-copilot",
    companyId: "ant",
    companyName: "蚂蚁集团",
    roleTitle: "AI 产品经理",
    jobTitle: "AI 产品经理 - 智能助手平台",
    city: "杭州",
    summary: "偏平台化与助手能力封装，强调 Agent 设计、能力边界和稳定产品交付。",
    requirements: ["理解 Agent 工作流", "能做平台能力抽象", "有稳定交付意识", "能定义体验与指标"],
    preferredSignals: ["做过 Agent 或工作流产品", "理解工具平台边界", "有系统设计表达能力"],
    riskHints: ["如果只有 Demo 级功能，没有平台抽象，会显得支撑力不足。"],
    sourceType: "高置信岗位线索",
    sourceConfidence: 91,
    dimensionWeights: platformHeavy,
    retrievalText:
      "蚂蚁集团 杭州 AI 产品经理 智能助手 平台化 Agent 工作流 能力边界 交付 指标"
  },
  {
    id: "seed-huawei-ai-enterprise",
    companyId: "huawei",
    companyName: "华为",
    roleTitle: "AI 产品经理",
    jobTitle: "AI 产品经理 - 企业智能解决方案",
    city: "深圳",
    summary: "偏企业级解决方案与稳定交付，要求更强的结构化表达、行业理解和跨团队协同。",
    requirements: ["理解企业场景", "能做复杂需求拆解", "能协调多角色推进", "有 AI 方案落地意识"],
    preferredSignals: ["有结构化表达能力", "有复杂项目经验", "能讲稳定性与交付"],
    riskHints: ["如果项目案例都偏轻量原型，可能难以支撑企业级交付叙事。"],
    sourceType: "高置信岗位线索",
    sourceConfidence: 87,
    dimensionWeights: {
      ai_llm_understanding: 0.24,
      project_experience: 0.26,
      product_methodology: 0.2,
      data_analysis: 0.14,
      user_research: 0.16
    },
    retrievalText:
      "华为 深圳 AI 产品经理 企业 智能解决方案 复杂需求 交付 协同 稳定性 结构化表达"
  },
  {
    id: "seed-sensetime-ai-solution",
    companyId: "sensetime",
    companyName: "商汤科技",
    roleTitle: "AI 产品经理",
    jobTitle: "AI 产品经理 - 行业解决方案",
    city: "上海",
    summary: "更强调 AI 技术理解和方案商品化，适合想强化 AI 叙事与商业表达的候选人。",
    requirements: ["有 AI / LLM 理解", "能解释模型能力边界", "能讲行业落地方案", "有商业表达能力"],
    preferredSignals: ["做过 AI 项目", "理解检索或模型调用链路", "能讲清方案价值"],
    riskHints: ["如果商业表达薄弱，会影响整体匹配度。"],
    sourceType: "高置信岗位线索",
    sourceConfidence: 84,
    dimensionWeights: aiHeavy,
    retrievalText:
      "商汤科技 上海 AI 产品经理 行业解决方案 模型能力边界 商业表达 商品化 AI 项目"
  },
  {
    id: "seed-iflytek-ai-education",
    companyId: "iflytek",
    companyName: "科大讯飞",
    roleTitle: "AI 产品经理",
    jobTitle: "AI 产品经理 - 教育与办公智能产品",
    city: "合肥",
    summary: "兼顾 AI 能力落地和教育/办公场景理解，重视真实场景、用户反馈与产品闭环。",
    requirements: ["理解教育或办公场景", "有用户反馈闭环意识", "能做 AI 功能落地", "能讲清结果与改进"],
    preferredSignals: ["有教学、教育或知识服务相关经历", "做过用户反馈分析", "能把场景讲具体"],
    riskHints: ["如果没有场景细节，只讲技术能力，会显得和岗位距离较远。"],
    sourceType: "高置信岗位线索",
    sourceConfidence: 86,
    dimensionWeights: communityHeavy,
    retrievalText:
      "科大讯飞 合肥 AI 产品经理 教育 办公 智能产品 用户反馈 场景理解 知识服务"
  },
  {
    id: "seed-cambricon-ai-platform",
    companyId: "cambricon",
    companyName: "寒武纪",
    roleTitle: "AI 产品经理",
    jobTitle: "AI 产品经理 - AI 基础能力平台",
    city: "北京",
    summary: "更偏基础能力平台与技术理解，需要候选人能把模型或算力能力翻译成产品价值。",
    requirements: ["理解 AI 基础能力", "能做平台抽象", "能讲清技术到产品的映射", "有较强结构化表达"],
    preferredSignals: ["理解模型、RAG 或推理链路", "做过工具平台或系统设计", "能讲能力边界"],
    riskHints: ["如果技术理解只停留在表层，会削弱岗位说服力。"],
    sourceType: "高置信岗位线索",
    sourceConfidence: 83,
    dimensionWeights: {
      ai_llm_understanding: 0.34,
      project_experience: 0.22,
      product_methodology: 0.18,
      data_analysis: 0.12,
      user_research: 0.14
    },
    retrievalText:
      "寒武纪 北京 AI 产品经理 基础能力 平台 模型 RAG 推理链路 能力边界 系统设计"
  },
  {
    id: "seed-baidu-ai-enterprise-search",
    companyId: "baidu",
    companyName: "百度",
    roleTitle: "AI 产品经理",
    jobTitle: "AI 产品经理 - 企业知识搜索",
    city: "北京",
    summary: "面向企业知识搜索与问答，要求对检索、知识组织和产品落地都有较强理解。",
    requirements: ["理解知识搜索场景", "能组织复杂信息", "会定义问答质量指标", "理解 AI 检索增强"],
    preferredSignals: ["做过知识库或检索项目", "能讲产品结构", "有数据分析闭环"],
    riskHints: ["如果缺少知识组织或质量指标叙事，会显得准备不够完整。"],
    sourceType: "高置信岗位线索",
    sourceConfidence: 85,
    dimensionWeights: aiHeavy,
    retrievalText:
      "百度 北京 AI 产品经理 企业知识搜索 知识库 检索增强 问答 质量指标 信息组织"
  },
  {
    id: "seed-meituan-ai-merchant-service",
    companyId: "meituan",
    companyName: "美团",
    roleTitle: "AI 产品经理",
    jobTitle: "AI 产品经理 - 商家服务智能化",
    city: "上海",
    summary: "面向商家服务与效率提升，强调问题拆解、业务理解和 AI 能力的可用性。",
    requirements: ["理解服务链路", "能拆经营问题", "能定义效率指标", "理解 AI 功能可用性"],
    preferredSignals: ["有服务或工具产品经验", "做过数据分析", "能讲结果和改进路径"],
    riskHints: ["如果案例里没有稳定结果或效率指标，容易被质疑落地性。"],
    sourceType: "高置信岗位线索",
    sourceConfidence: 84,
    dimensionWeights: {
      ai_llm_understanding: 0.22,
      project_experience: 0.24,
      product_methodology: 0.2,
      data_analysis: 0.2,
      user_research: 0.14
    },
    retrievalText:
      "美团 上海 AI 产品经理 商家服务 效率提升 经营问题 指标 AI 可用性 结果改进"
  }
];
