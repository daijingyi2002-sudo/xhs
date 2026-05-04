export type CandidateNoteInput = {
  noteId: string;
  url: string;
  title: string;
  body: string;
  authorName: string;
  publishTime: string;
  tags: string[];
  validated: boolean;
};

export type SeedCompanyRecord = {
  id: string;
  name: string;
  slug: string;
  category: "internet-major" | "ai-company";
  logoMark: string;
};

export type SeedJobLeadRecord = {
  id: string;
  companyId: string;
  roleName: string;
  title: string;
  city: string;
  seniority: string;
  sourceConfidence: number;
  summary: string;
  extractedRequirements: string[];
  recommendationReasons: [string, string, string];
  riskReminder: string;
  salaryBand: string;
};

export type SeedXhsPostRecord = {
  id: string;
  companyId: string;
  roleId: string;
  title: string;
  excerpt: string;
  sourceUrl: string;
  publishTime: string;
  authorName: string;
  topic: string;
  stage: string;
  ocrText: string;
  confidenceLabel: string;
};

export type LeadIngestionRecord = {
  company: SeedCompanyRecord;
  lead: SeedJobLeadRecord;
  post: SeedXhsPostRecord;
};

export const phase1Companies: SeedCompanyRecord[] = [
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
  { id: "ant", name: "蚂蚁集团", slug: "ant", category: "internet-major", logoMark: "蚁" },
  { id: "huawei", name: "华为", slug: "huawei", category: "internet-major", logoMark: "华" },
  { id: "sensetime", name: "商汤科技", slug: "sensetime", category: "ai-company", logoMark: "商" },
  { id: "iflytek", name: "科大讯飞", slug: "iflytek", category: "ai-company", logoMark: "讯" },
  { id: "cambricon", name: "寒武纪", slug: "cambricon", category: "ai-company", logoMark: "寒" }
];

const rolePatterns = [
  /AI\s*产品经理/i,
  /AIGC\s*产品经理/i,
  /大模型产品经理/i,
  /智能产品经理/i,
  /Agent\s*产品经理/i,
  /产品经理.*(AI|AIGC|大模型|智能|Agent)/i,
  /\bAI\s*PM\b/i
];

const hiringPatterns = [
  /校招/,
  /应届/,
  /实习/,
  /社招/,
  /内推/,
  /\bJD\b/i,
  /岗位/,
  /招聘/,
  /投递/,
  /hc/i,
  /岗位职责/,
  /任职要求/
];

const blockerPatterns = [
  /安全限制/,
  /IP存在风险/,
  /当前笔记暂时无法浏览/,
  /登录后查看/,
  /马上登录即可/,
  /扫码/,
  /手机号登录/
];

const negativeHiringPatterns = [/没有.{0,8}(JD|招聘|内推|投递)/, /无.{0,8}(JD|招聘|内推|投递)/];

const cityPatterns = ["北京", "上海", "杭州", "深圳", "广州", "成都", "南京", "武汉", "苏州", "西安"];

const requirementPatterns = [
  { label: "LLM 应用理解", patterns: [/LLM/i, /大模型/, /AIGC/i, /Agent/i, /RAG/i, /提示词/] },
  { label: "需求分析", patterns: [/需求分析/, /需求拆解/, /PRD/i, /产品需求/] },
  { label: "数据分析", patterns: [/数据分析/, /SQL/i, /指标/, /A\/B/i, /实验/, /转化/, /留存/] },
  { label: "用户研究", patterns: [/用户研究/, /用户访谈/, /调研/, /洞察/, /画像/] },
  { label: "产品方法论", patterns: [/MVP/i, /优先级/, /路线图/, /竞品/, /产品方法/] },
  { label: "跨团队推动", patterns: [/跨团队/, /协同/, /推动/, /沟通/, /合作/] }
];

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function truncate(value: string, maxLength: number) {
  return value.length <= maxLength ? value : `${value.slice(0, maxLength - 3)}...`;
}

function inferCompany(text: string) {
  return phase1Companies.find((company) => text.includes(company.name));
}

function inferCity(text: string) {
  return cityPatterns.find((city) => text.includes(city)) ?? "未知";
}

function inferSeniority(text: string) {
  if (/校招|应届/.test(text)) return "校招 / 应届";
  if (/实习/.test(text)) return "实习";
  if (/社招/.test(text)) return "社招";
  if (/内推/.test(text)) return "内推";
  return "待确认";
}

function extractRequirements(text: string) {
  return requirementPatterns
    .filter((item) => item.patterns.some((pattern) => pattern.test(text)))
    .map((item) => item.label);
}

function hasRoleSignal(text: string) {
  return rolePatterns.some((pattern) => pattern.test(text));
}

function hasHiringSignal(text: string) {
  if (negativeHiringPatterns.some((pattern) => pattern.test(text))) {
    return false;
  }

  return hiringPatterns.some((pattern) => pattern.test(text));
}

function computeConfidence(input: CandidateNoteInput, requirementCount: number) {
  let score = 0;
  if (input.validated) score += 35;
  if (input.authorName) score += 5;
  if (input.publishTime) score += 5;

  const text = normalizeWhitespace([input.title, input.body, ...input.tags].join(" "));
  if (inferCompany(text)) score += 20;
  if (hasRoleSignal(text)) score += 15;
  if (hasHiringSignal(text)) score += 15;

  score += Math.min(10, requirementCount * 2);

  return Math.min(99, score);
}

export function detectAccessBlocker(input: {
  finalUrl?: string;
  title?: string;
  body?: string;
}) {
  const text = normalizeWhitespace([input.title ?? "", input.body ?? ""].join(" "));

  if (input.finalUrl && !input.finalUrl.includes("xiaohongshu.com")) {
    return "not_xiaohongshu";
  }

  if (input.finalUrl && !input.finalUrl.includes("/explore")) {
    return "redirected_away_from_note";
  }

  if (blockerPatterns.some((pattern) => pattern.test(text))) {
    return "login_or_access_blocked";
  }

  return null;
}

export function buildLeadIngestionRecord(input: CandidateNoteInput): LeadIngestionRecord | null {
  if (!input.validated) {
    return null;
  }

  const blocker = detectAccessBlocker({
    finalUrl: input.url,
    title: input.title,
    body: input.body
  });
  if (blocker) {
    return null;
  }

  const text = normalizeWhitespace([input.title, input.body, ...input.tags].join(" "));
  const company = inferCompany(text);
  if (!company) {
    return null;
  }

  if (!hasRoleSignal(text) || !hasHiringSignal(text)) {
    return null;
  }

  const extractedRequirements = extractRequirements(text);
  if (extractedRequirements.length < 2) {
    return null;
  }

  const sourceConfidence = computeConfidence(input, extractedRequirements.length);
  if (sourceConfidence < 80) {
    return null;
  }

  const city = inferCity(text);
  const seniority = inferSeniority(text);
  const leadId = `lead-${company.id}-${input.noteId}`;
  const postId = `post-${company.id}-${input.noteId}`;
  const summary = truncate(normalizeWhitespace(`${input.title} ${input.body}`), 120);

  const recommendationReasons: [string, string, string] = [
    `原帖明确提到${company.name}与 AI 产品经理相关岗位信号`,
    `正文包含${extractedRequirements.slice(0, 2).join("、")}等能力关键词`,
    "抓取时保留原帖 URL，可回跳核对原始内容"
  ];

  return {
    company,
    lead: {
      id: leadId,
      companyId: company.id,
      roleName: "AI 产品经理",
      title: normalizeWhitespace(input.title || `${company.name} AI 产品经理`),
      city,
      seniority,
      sourceConfidence,
      summary,
      extractedRequirements,
      recommendationReasons,
      riskReminder: "线索来自小红书公开内容，未做官方职位验证；投递前仍需核对原帖与官网信息。",
      salaryBand: "未披露"
    },
    post: {
      id: postId,
      companyId: company.id,
      roleId: leadId,
      title: normalizeWhitespace(input.title),
      excerpt: truncate(normalizeWhitespace(input.body), 96),
      sourceUrl: input.url,
      publishTime: normalizeWhitespace(input.publishTime || new Date().toISOString().slice(0, 10)),
      authorName: normalizeWhitespace(input.authorName || "未知作者"),
      topic: input.tags.find((tag) => /校招|实习|社招|内推|JD|岗位/.test(tag)) ?? "岗位线索",
      stage: "job-lead",
      ocrText: "",
      confidenceLabel: "高置信岗位线索"
    }
  };
}
