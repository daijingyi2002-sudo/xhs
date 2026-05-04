import OpenAI from "openai";
import { z } from "zod";
import { getServerEnv } from "@xhs/config";

export type ResumeSectionName =
  | "基础信息"
  | "求职意向"
  | "教育背景"
  | "实习经历"
  | "项目经历"
  | "技能能力"
  | "校园经历 / 获奖经历"
  | "自我评价";

export type RecommendedJobForResume = {
  company?: string;
  role_title?: string;
  match_score?: number;
  requirements?: string[];
  match_reasons?: string[];
  risk_reminder?: string;
  summary?: string;
};

export type InterviewTranscriptItem = {
  question?: string;
  answer?: string;
  feedback?: string;
};

export type ResumeOptimizationInput = {
  original_resume: string;
  target_position: string;
  recommended_jobs?: RecommendedJobForResume[];
  interview_transcript?: InterviewTranscriptItem[];
  interview_summary?: string;
  improvement_suggestions?: string[];
  job_jd_keywords?: string[];
  user_supplement?: string;
};

export type ResumeSectionEvidence = {
  section: ResumeSectionName;
  present: boolean;
  original_text: string;
  evidence_items: string[];
  detection_reasons: string[];
  confidence: number;
};

export type ResumeSectionSuggestion = {
  section: ResumeSectionName;
  original_text: string;
  problem: string;
  suggestion: string;
  revised_text: string;
  reason: string;
  related_job_requirement: string;
  confidence: number;
  risk_warning: string;
  applied: boolean;
};

export type InterviewBasedImprovement = {
  interview_issue: string;
  resume_problem: string;
  resume_revision_strategy: string;
};

export type ResumeMatchScore = {
  before_score: number;
  after_score: number;
  score_reason: string;
  missing_keywords: string[];
  added_keywords: string[];
  strongest_sections: ResumeSectionName[];
  weakest_sections: ResumeSectionName[];
};

export type KeywordOptimization = {
  missing_keywords: string[];
  added_keywords: string[];
  keyword_coverage_before: string;
  keyword_coverage_after: string;
};

export type FinalResume = {
  basic_info: string;
  job_intention: string;
  education: string;
  experience: string;
  projects: string;
  skills: string;
  awards: string;
  self_evaluation: string;
};

export type ResumeOptimizationResult = {
  generation_source?: "qwen" | "fallback";
  target_position: string;
  resume_match_score: ResumeMatchScore;
  section_suggestions: ResumeSectionSuggestion[];
  interview_based_improvements: InterviewBasedImprovement[];
  keyword_optimization: KeywordOptimization;
  final_resume: FinalResume;
};

export type ResumeOptimizationModelPrompt = {
  input: ResumeOptimizationInput;
  section_evidence: Record<ResumeSectionName, ResumeSectionEvidence>;
  fallback_result: ResumeOptimizationResult;
  safety_rules: string[];
};

export type ResumeOptimizationModelClient = {
  generate: (prompt: ResumeOptimizationModelPrompt) => Promise<ResumeOptimizationResult>;
};

const sectionNames = [
  "基础信息",
  "求职意向",
  "教育背景",
  "实习经历",
  "项目经历",
  "技能能力",
  "校园经历 / 获奖经历",
  "自我评价"
] as const satisfies readonly ResumeSectionName[];

const sectionNameSchema = z.enum(sectionNames);

const finalResumeKeyBySection: Record<ResumeSectionName, keyof FinalResume> = {
  基础信息: "basic_info",
  求职意向: "job_intention",
  教育背景: "education",
  实习经历: "experience",
  项目经历: "projects",
  技能能力: "skills",
  "校园经历 / 获奖经历": "awards",
  自我评价: "self_evaluation"
};

const sectionAliases: Record<ResumeSectionName, string[]> = {
  基础信息: ["基础信息", "个人信息", "联系方式", "姓名"],
  求职意向: ["求职意向", "目标岗位", "应聘岗位", "求职方向"],
  教育背景: ["教育背景", "教育经历", "学历", "学校", "专业"],
  实习经历: ["实习经历", "实习经验", "实习", "工作经历"],
  项目经历: ["项目经历", "项目经验", "作品项目", "项目"],
  技能能力: ["技能能力", "技能栈", "专业技能", "技能", "工具"],
  "校园经历 / 获奖经历": ["校园经历", "获奖经历", "荣誉奖项", "获奖", "竞赛", "社团"],
  自我评价: ["自我评价", "个人评价", "个人总结", "自我介绍"]
};

const headingMatchers: Array<{ section: ResumeSectionName; patterns: RegExp[] }> = [
  { section: "基础信息", patterns: [/^(基础信息|个人信息|联系方式)\s*[:：]?/] },
  { section: "求职意向", patterns: [/^(求职意向|目标岗位|应聘岗位|求职方向)\s*[:：]?/] },
  { section: "教育背景", patterns: [/^(教育背景|教育经历|学历)\s*[:：]?/] },
  { section: "实习经历", patterns: [/^(实习经历|实习经验|工作经历|实践经历)\s*[:：]?/] },
  { section: "项目经历", patterns: [/^(项目经历|项目经验|作品项目|项目)\s*[:：]?/] },
  { section: "技能能力", patterns: [/^(技能能力|技能栈|专业技能|技能|工具)\s*[:：]?/] },
  { section: "校园经历 / 获奖经历", patterns: [/^(校园经历|获奖经历|荣誉奖项|获奖|竞赛经历|社团经历)\s*[:：]?/] },
  { section: "自我评价", patterns: [/^(自我评价|个人评价|个人总结|自我介绍)\s*[:：]?/] }
];

const issueStrategies: Array<{ issue: string; patterns: RegExp[]; strategy: string; resumeProblem: string }> = [
  {
    issue: "项目目标表达不清",
    patterns: [/项目目标/, /目标表达/, /目标.*不清/],
    resumeProblem: "项目经历只写了做过什么，没有先交代项目背景、用户痛点和产品目标。",
    strategy: "在项目经历开头补充项目背景、目标用户、用户痛点和产品目标。"
  },
  {
    issue: "用户需求分析不足",
    patterns: [/用户需求/, /用户.*不足/, /需求分析/],
    resumeProblem: "简历没有体现如何发现需求、判断优先级或验证用户问题。",
    strategy: "补充用户访谈、反馈归因、需求拆解或优先级判断过程。"
  },
  {
    issue: "指标意识弱",
    patterns: [/指标/, /量化/, /数据意识/, /业务结果/],
    resumeProblem: "项目结果缺少指标口径，面试官难以判断产品动作是否有效。",
    strategy: "补充数据指标、验证方式和复盘结论；若暂无真实数字，只写“建议补充具体数据”。"
  },
  {
    issue: "AI产品理解浅",
    patterns: [/AI产品/, /AI.*理解/, /模型边界/, /能力边界/],
    resumeProblem: "AI相关项目没有讲清模型能力边界、兜底策略和产品化取舍。",
    strategy: "补充AI能力设计、模型边界、人机协同、失败兜底和评估方式。"
  },
  {
    issue: "技术方案表达不清",
    patterns: [/技术方案/, /方案表达/, /架构/, /RAG|Agent|LLM/i],
    resumeProblem: "技术实现只列名词，缺少为什么这样设计以及和产品目标的关系。",
    strategy: "用产品语言解释技术方案：场景、方案、边界、风险和验收方式。"
  }
];

const missingOriginalMarkers = ["未提供", "未填写", "暂无", "无", "空缺"];

const resumeOptimizationResultSchema: z.ZodType<ResumeOptimizationResult> = z.object({
  generation_source: z.enum(["qwen", "fallback"]).optional(),
  target_position: z.string(),
  resume_match_score: z.object({
    before_score: z.number(),
    after_score: z.number(),
    score_reason: z.string(),
    missing_keywords: z.array(z.string()),
    added_keywords: z.array(z.string()),
    strongest_sections: z.array(sectionNameSchema),
    weakest_sections: z.array(sectionNameSchema)
  }),
  section_suggestions: z.array(
    z.object({
      section: sectionNameSchema,
      original_text: z.string(),
      problem: z.string(),
      suggestion: z.string(),
      revised_text: z.string(),
      reason: z.string(),
      related_job_requirement: z.string(),
      confidence: z.number(),
      risk_warning: z.string(),
      applied: z.boolean().default(true)
    })
  ),
  interview_based_improvements: z.array(
    z.object({
      interview_issue: z.string(),
      resume_problem: z.string(),
      resume_revision_strategy: z.string()
    })
  ),
  keyword_optimization: z.object({
    missing_keywords: z.array(z.string()),
    added_keywords: z.array(z.string()),
    keyword_coverage_before: z.string(),
    keyword_coverage_after: z.string()
  }),
  final_resume: z.object({
    basic_info: z.string(),
    job_intention: z.string(),
    education: z.string(),
    experience: z.string(),
    projects: z.string(),
    skills: z.string(),
    awards: z.string(),
    self_evaluation: z.string()
  })
});

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function unique(items: string[]) {
  return Array.from(new Set(items.map(normalizeWhitespace).filter(Boolean)));
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function extractJsonBlock(raw: string) {
  const normalized = raw.trim();
  const fenced = normalized.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);

  if (fenced?.[1]) {
    return fenced[1].trim();
  }

  const firstBrace = normalized.indexOf("{");
  const lastBrace = normalized.lastIndexOf("}");

  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return normalized.slice(firstBrace, lastBrace + 1);
  }

  return normalized;
}

function preSegmentResumeText(originalResume: string) {
  const headingPattern =
    /(基础信息|个人信息|联系方式|求职意向|目标岗位|应聘岗位|求职方向|教育背景|教育经历|学历|实习经历|实习经验|工作经历|实践经历|项目经历|项目经验|作品项目|技能能力|技能栈|专业技能|技能|校园经历|获奖经历|荣誉奖项|自我评价|个人评价|个人总结)\s*[:：]/g;

  return originalResume.replace(headingPattern, "\n$1：");
}

function splitResumeLines(originalResume: string) {
  return preSegmentResumeText(originalResume)
    .split(/\r?\n|；|;/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function getHeadingSection(line: string) {
  return headingMatchers.find((item) => item.patterns.some((pattern) => pattern.test(line)))?.section ?? null;
}

function getLineContentSection(line: string): { section: ResumeSectionName; reason: string; score: number } | null {
  const normalized = normalizeWhitespace(line);
  const lower = normalized.toLowerCase();
  const hasDateRange = /(?:20\d{2}|19\d{2})[./年-]?\d{0,2}\s*[-至~—–]\s*(?:20\d{2}|19\d{2}|至今|现在|present)/i.test(
    normalized
  );

  if (/(实习|intern|实习生|助理|trainee)/i.test(normalized)) {
    return { section: "实习经历", reason: "出现实习/Intern/实习生等经历信号", score: hasDateRange ? 0.95 : 0.88 };
  }

  if (hasDateRange && /(公司|科技|集团|部门|产品|运营|数据|算法|研发|商业化|策略)/.test(normalized)) {
    return { section: "实习经历", reason: "时间范围加公司/岗位描述，判定为工作或实习经历", score: 0.76 };
  }

  if (/(项目|系统|平台|Agent|RAG|LLM|大模型|智能体|上线|需求|PRD|原型|迭代|负责.*(设计|搭建|开发|落地))/i.test(normalized)) {
    return { section: "项目经历", reason: "出现项目、系统、AI能力或产品交付信号", score: 0.82 };
  }

  if (/(SQL|Python|R\b|Excel|Figma|Axure|Prompt|prompt|Tableau|PowerBI|Java|TypeScript|熟悉|掌握|技能|工具)/i.test(lower)) {
    return { section: "技能能力", reason: "出现工具、技能或方法能力信号", score: 0.78 };
  }

  if (/(大学|学院|本科|硕士|博士|学士|专业|GPA|绩点|研究生|本科生|20\d{2}级)/.test(normalized)) {
    return { section: "教育背景", reason: "出现学校、学历、专业或GPA信号", score: 0.82 };
  }

  if (/(奖|获奖|竞赛|比赛|挑战杯|互联网\+|学生会|社团|志愿|校园|负责人|主席|部长)/.test(normalized)) {
    return { section: "校园经历 / 获奖经历", reason: "出现校园组织、竞赛或获奖信号", score: 0.78 };
  }

  if (/(求职意向|目标岗位|应聘|意向岗位|方向[:：]|AI产品经理|数据产品经理|后端开发)/.test(normalized)) {
    return { section: "求职意向", reason: "出现求职目标或岗位方向信号", score: 0.84 };
  }

  if (/(自我评价|学习能力|沟通能力|责任心|抗压|积极|认真|复盘|总结)/.test(normalized)) {
    return { section: "自我评价", reason: "出现自我评价或软素质描述信号", score: 0.68 };
  }

  if (/[\w.+-]+@[\w.-]+\.\w+|1[3-9]\d{9}|linkedin|github|姓名|电话|邮箱|微信/i.test(normalized)) {
    return { section: "基础信息", reason: "出现联系方式或个人基础信息信号", score: 0.9 };
  }

  return null;
}

function emptyEvidenceMap() {
  const evidence = {} as Record<ResumeSectionName, ResumeSectionEvidence>;

  for (const section of sectionNames) {
    evidence[section] = {
      section,
      present: false,
      original_text: "",
      evidence_items: [],
      detection_reasons: [],
      confidence: 0
    };
  }

  return evidence;
}

function pushEvidence(
  evidence: Record<ResumeSectionName, ResumeSectionEvidence>,
  section: ResumeSectionName,
  line: string,
  reason: string,
  score: number
) {
  const item = evidence[section];

  item.present = true;
  item.evidence_items = unique([...item.evidence_items, line]);
  item.original_text = item.evidence_items.join("\n");
  item.detection_reasons = unique([...item.detection_reasons, reason]);
  item.confidence = clamp(Math.max(item.confidence, score), 0, 0.98);
}

export function analyzeResumeSectionEvidence(originalResume: string) {
  const evidence = emptyEvidenceMap();
  const lines = splitResumeLines(originalResume);
  let currentSection: ResumeSectionName | null = null;

  lines.forEach((line, index) => {
    const headingSection = getHeadingSection(line);

    if (headingSection) {
      currentSection = headingSection;
      pushEvidence(evidence, headingSection, line, "命中模块标题", 0.92);
      return;
    }

    const inferred = getLineContentSection(line);

    if (inferred) {
      currentSection = inferred.section;
      pushEvidence(evidence, inferred.section, line, inferred.reason, inferred.score);
      return;
    }

    if (currentSection && currentSection !== "基础信息") {
      pushEvidence(evidence, currentSection, line, `延续上一条${currentSection}语义`, 0.62);
      return;
    }

    if (index <= 2 && line.length <= 40) {
      currentSection = "基础信息";
      pushEvidence(evidence, "基础信息", line, "简历开头短文本，作为基础信息候选", 0.58);
    }
  });

  return evidence;
}

function evidenceToSections(evidence: Record<ResumeSectionName, ResumeSectionEvidence>) {
  return Object.fromEntries(sectionNames.map((section) => [section, evidence[section].original_text])) as Record<
    ResumeSectionName,
    string
  >;
}

function hasRealNumber(value: string) {
  return /\d+%|\d+\s*(?:倍|人|名|次|个|项|万|小时|天|周|个月)|提升\s*\d|增长\s*\d|降低\s*\d|转化率|留存率|点击率|准确率/.test(
    value
  );
}

function getDefaultKeywords(input: ResumeOptimizationInput) {
  const recommendedRequirements = input.recommended_jobs?.flatMap((job) => job.requirements ?? []) ?? [];
  const defaultAiPmKeywords = ["AI能力设计", "用户需求分析", "数据指标", "项目复盘", "个人贡献"];

  return unique([...(input.job_jd_keywords ?? []), ...recommendedRequirements, ...defaultAiPmKeywords]).slice(0, 12);
}

function keywordCoverage(resumeText: string, keywords: string[]) {
  const hitKeywords = keywords.filter((keyword) => resumeText.includes(keyword));
  const missingKeywords = keywords.filter((keyword) => !resumeText.includes(keyword));
  const coverage = keywords.length === 0 ? 0 : Math.round((hitKeywords.length / keywords.length) * 100);

  return { hitKeywords, missingKeywords, coverage };
}

function extractInterviewIssues(input: ResumeOptimizationInput) {
  const corpus = normalizeWhitespace(
    [
      input.interview_summary ?? "",
      ...(input.improvement_suggestions ?? []),
      ...(input.interview_transcript ?? []).flatMap((item) => [item.answer ?? "", item.feedback ?? ""])
    ].join(" ")
  );

  const matched = issueStrategies.filter((item) => item.patterns.some((pattern) => pattern.test(corpus)));

  return matched.length > 0
    ? matched
    : [
        {
          issue: "面试表达需要沉淀到简历",
          patterns: [],
          resumeProblem: "简历和面试表现之间还没有形成清晰闭环。",
          strategy: "把面试总结中的优势和短板对应回项目经历、技能能力和自我评价。"
        }
      ];
}

function getRelatedRequirement(section: ResumeSectionName, keywords: string[]) {
  if (section === "项目经历") return keywords.find((item) => /AI|用户|指标|复盘|项目/.test(item)) ?? keywords[0] ?? "目标岗位能力";
  if (section === "实习经历") return keywords.find((item) => /产品|用户|指标|业务|项目/.test(item)) ?? keywords[0] ?? "岗位相关实践";
  if (section === "技能能力") return keywords.find((item) => /AI|数据|指标|技能/.test(item)) ?? keywords[0] ?? "岗位技能";
  if (section === "自我评价") return keywords.find((item) => /复盘|个人贡献|用户/.test(item)) ?? keywords[0] ?? "岗位适配度";
  if (section === "求职意向") return "目标岗位一致性";
  return keywords[0] ?? "目标岗位要求";
}

function buildProblem(section: ResumeSectionName, evidence: ResumeSectionEvidence, missingKeywords: string[]) {
  const originalText = evidence.original_text;

  if (!evidence.present) {
    return `该模块缺失，目标岗位需要的${section}信息没有被展示。`;
  }

  if (section === "实习经历") {
    if (!/负责|参与|主导|协助|跟进|输出|分析|设计|落地|验收/.test(originalText)) {
      return "实习经历已经识别到，但职责动作不够清楚，需要说明具体负责什么、怎么做、交付了什么。";
    }

    if (!hasRealNumber(originalText)) {
      return "实习经历已经提供，但结果证据和指标口径不足；不要虚构数字，可提示补充真实数据。";
    }

    return "实习经历可保留，需要进一步对齐目标岗位的核心能力和业务结果表达。";
  }

  if (section === "项目经历" && !/背景|痛点|目标|指标|结果|复盘|贡献/.test(originalText)) {
    return "项目表达偏描述工作内容，缺少背景、目标、产品动作、结果复盘和个人贡献。";
  }

  if (section === "技能能力" && missingKeywords.length > 0) {
    return `技能表达未覆盖 ${missingKeywords.slice(0, 3).join("、")} 等岗位关键词。`;
  }

  if (section === "自我评价" && /学习能力强|沟通能力好|认真|负责/.test(originalText)) {
    return "表达偏泛化，缺少与目标岗位直接相关的能力证据。";
  }

  if (section === "求职意向" && !originalText.includes("AI")) {
    return "求职方向不够聚焦，和目标岗位的连接不明显。";
  }

  return "当前表达可以保留，但需要更贴近目标岗位的能力关键词和证据链。";
}

function buildRevisedText(params: {
  section: ResumeSectionName;
  evidence: ResumeSectionEvidence;
  targetPosition: string;
  keywords: string[];
  relatedRequirement: string;
  hasNumbers: boolean;
}) {
  const { section, evidence, targetPosition, keywords, relatedRequirement, hasNumbers } = params;
  const base = evidence.original_text || "未提供";
  const keywordHint = keywords.slice(0, 3).join("、");

  if (section === "求职意向") {
    return `求职意向：${targetPosition}`;
  }

  if (section === "实习经历") {
    if (!evidence.present) {
      return `未提供实习经历。建议只补充真实发生过的实习、工作或实践经历；如果没有，不要虚构，可强化项目经历。`;
    }

    const numberHint = hasNumbers
      ? "保留已验证的量化结果，并补充指标口径"
      : "建议补充具体数据；当前不写未被证实的量化结果";
    return `${base}\n优化方向：围绕${targetPosition}补充业务背景、负责动作、协作对象、交付物、真实结果与${numberHint}。`;
  }

  if (section === "项目经历") {
    const numberHint = hasNumbers
      ? "补充已有量化结果和复盘结论"
      : "建议补充具体数据，当前不写未被证实的量化结果";
    return `${base}\n优化方向：围绕${targetPosition}补充项目背景、用户痛点、产品目标、核心功能/AI能力设计、个人贡献与${numberHint}。`;
  }

  if (section === "技能能力") {
    return evidence.present
      ? `${base}\n优化方向：按${targetPosition}岗位要求重排技能，优先展示${keywordHint || relatedRequirement}。`
      : `未提供技能能力。建议补充真实掌握的工具、方法和AI产品能力，不要写未掌握技能。`;
  }

  if (section === "自我评价") {
    return evidence.present
      ? `${base}\n优化方向：删除泛化形容词，改为用真实项目证据概括${relatedRequirement}。`
      : `未提供自我评价。建议用真实项目证据概括${targetPosition}相关能力，避免空泛自夸。`;
  }

  if (!evidence.present) {
    return `未提供。建议补充与${targetPosition}相关的真实经历，不要虚构公司、项目或结果。`;
  }

  return `${base}\n优化方向：保留真实信息，突出与${targetPosition}相关的${relatedRequirement}。`;
}

function buildSectionSuggestions(
  input: ResumeOptimizationInput,
  evidenceBySection: Record<ResumeSectionName, ResumeSectionEvidence>,
  keywords: string[]
) {
  const originalResume = input.original_resume;
  const { missingKeywords } = keywordCoverage(originalResume, keywords);
  const hasNumbers = hasRealNumber(originalResume) || Boolean(input.user_supplement && hasRealNumber(input.user_supplement));

  return sectionNames.map<ResumeSectionSuggestion>((section) => {
    const evidence = evidenceBySection[section];
    const relatedRequirement = getRelatedRequirement(section, keywords);
    const problem = buildProblem(section, evidence, missingKeywords);
    const revisedText = buildRevisedText({
      section,
      evidence,
      targetPosition: input.target_position,
      keywords,
      relatedRequirement,
      hasNumbers
    });

    return {
      section,
      original_text: evidence.original_text || "未提供",
      problem,
      suggestion:
        section === "项目经历"
          ? "按“项目背景-用户痛点-产品目标-核心功能/AI能力设计-个人贡献-结果复盘”重写。"
          : section === "实习经历"
            ? "先保留已识别到的实习事实，再补强业务背景、职责动作、交付物和真实结果。"
            : `补强与${relatedRequirement}相关的真实信息，并删除泛化表达。`,
      revised_text: revisedText,
      reason: `这样改能让简历更直接回应${input.target_position}对${relatedRequirement}的判断。`,
      related_job_requirement: relatedRequirement,
      confidence: evidence.present ? Math.max(0.7, evidence.confidence) : 0.58,
      risk_warning: hasNumbers
        ? "已检测到可能的量化信息，使用前仍需确认数字来源真实。"
        : "未检测到真实量化结果，禁止自动编造数字；如需量化，请用户补充具体数据。",
      applied: true
    };
  });
}

function buildInterviewBasedImprovements(input: ResumeOptimizationInput): InterviewBasedImprovement[] {
  return extractInterviewIssues(input).map((item) => ({
    interview_issue: item.issue,
    resume_problem: item.resumeProblem,
    resume_revision_strategy: item.strategy
  }));
}

function clampScore(value: number) {
  return clamp(Math.round(value), 0, 100);
}

function buildScores(
  input: ResumeOptimizationInput,
  evidenceBySection: Record<ResumeSectionName, ResumeSectionEvidence>,
  suggestions: ResumeSectionSuggestion[],
  keywords: string[]
): ResumeMatchScore {
  const before = keywordCoverage(input.original_resume, keywords);
  const afterText = suggestions.map((item) => item.revised_text).join("\n");
  const after = keywordCoverage(`${input.original_resume}\n${afterText}`, keywords);
  const completeSections = sectionNames.filter((section) => evidenceBySection[section].present);
  const weakSections = sectionNames.filter((section) => {
    const evidence = evidenceBySection[section];
    return !evidence.present || /缺失|缺少|不足|泛化|不够/.test(buildProblem(section, evidence, before.missingKeywords));
  });
  const beforeScore = clampScore(42 + before.coverage * 0.42 + completeSections.length * 2);
  const afterScore = clampScore(Math.max(beforeScore + 8, 58 + after.coverage * 0.34 + completeSections.length * 2));
  const addedKeywords = after.hitKeywords.filter((keyword) => !before.hitKeywords.includes(keyword));

  return {
    before_score: beforeScore,
    after_score: afterScore,
    score_reason: `当前简历关键词覆盖率约 ${before.coverage}%，优化后预计提升到 ${after.coverage}%。评分提升来自岗位关键词补齐、项目/实习经历结构化和面试短板反向补强。`,
    missing_keywords: before.missingKeywords,
    added_keywords: addedKeywords,
    strongest_sections: completeSections.slice(0, 3),
    weakest_sections: weakSections.slice(0, 3)
  };
}

function getSuggestionText(suggestions: ResumeSectionSuggestion[], section: ResumeSectionName) {
  return suggestions.find((item) => item.section === section)?.revised_text ?? "";
}

function buildFinalResume(
  input: ResumeOptimizationInput,
  sections: Record<ResumeSectionName, string>,
  suggestions: ResumeSectionSuggestion[],
  addedKeywords: string[]
): FinalResume {
  const projectText = getSuggestionText(suggestions, "项目经历");
  const internshipText = getSuggestionText(suggestions, "实习经历");
  const skillText = getSuggestionText(suggestions, "技能能力");
  const suggestedKeywords = addedKeywords.length > 0 ? `\n建议补充关键词：${addedKeywords.join("、")}` : "";

  return {
    basic_info: sections["基础信息"] || "未提供基础信息。建议补充姓名、手机号、邮箱和所在城市。",
    job_intention: `求职意向：${input.target_position}`,
    education: sections["教育背景"] || "未提供教育背景。建议补充学校、专业、学历和时间。",
    experience:
      internshipText ||
      sections["实习经历"] ||
      "未提供实习经历。如暂无实习，不建议虚构，可突出真实项目经历。",
    projects: `${projectText || sections["项目经历"] || "未提供项目经历。建议补充真实项目。"}${suggestedKeywords}`,
    skills: skillText || `技能能力：围绕${input.target_position}补充真实掌握的工具、方法和AI产品能力。`,
    awards: sections["校园经历 / 获奖经历"] || "未提供校园 / 获奖经历。可删除该模块或补充真实奖项。",
    self_evaluation: getSuggestionText(suggestions, "自我评价") || sections["自我评价"] || "自我评价：建议用真实项目证据概括岗位适配度。"
  };
}

function getEvidenceCorpus(input: ResumeOptimizationInput) {
  return normalizeWhitespace(
    [
      input.original_resume,
      input.user_supplement ?? "",
      ...(input.interview_transcript ?? []).flatMap((item) => [item.question ?? "", item.answer ?? "", item.feedback ?? ""]),
      input.interview_summary ?? "",
      ...(input.improvement_suggestions ?? [])
    ].join("\n")
  );
}

function sanitizeUnsupportedQuantifiedClaims(text: string, evidenceCorpus: string) {
  const quantifierPattern = /\d+(?:\.\d+)?\s*(?:%|个百分点|倍|人|名|次|个|项|款|万|k|K|w|W|小时|天|周|个月)/g;
  let sanitized = text;
  let changed = false;
  const matches = text.match(quantifierPattern) ?? [];

  for (const match of matches) {
    if (!evidenceCorpus.includes(match)) {
      sanitized = sanitized.replaceAll(match, "具体数据待补充");
      changed = true;
    }
  }

  return { text: sanitized, changed };
}

function isMissingOriginalText(value: string) {
  const normalized = normalizeWhitespace(value);
  return !normalized || missingOriginalMarkers.some((marker) => normalized === marker || normalized.startsWith(marker));
}

function isMissingSectionClaim(section: ResumeSectionName, value: string) {
  const normalized = normalizeWhitespace(value);
  const aliases = sectionAliases[section];

  return aliases.some((alias) => {
    const escapedAlias = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return (
      new RegExp(`(没有|未提供|缺少|无|空缺|未体现|暂未看到).{0,8}${escapedAlias}`).test(normalized) ||
      new RegExp(`${escapedAlias}.{0,8}(缺失|为空|没有|未提供|不存在)`).test(normalized)
    );
  });
}

function guardSuggestionAgainstEvidence(params: {
  suggestion: ResumeSectionSuggestion;
  fallback: ResumeSectionSuggestion;
  evidence: ResumeSectionEvidence;
  evidenceCorpus: string;
}) {
  const { suggestion, fallback, evidence, evidenceCorpus } = params;
  const claimText = [suggestion.original_text, suggestion.problem, suggestion.suggestion, suggestion.revised_text].join(" ");

  if (evidence.present && (isMissingOriginalText(suggestion.original_text) || isMissingSectionClaim(suggestion.section, claimText))) {
    return {
      ...fallback,
      risk_warning: `${fallback.risk_warning} 已用本地内容证据纠正模型对“${suggestion.section}”的缺失误判。`
    };
  }

  const revised = sanitizeUnsupportedQuantifiedClaims(suggestion.revised_text, evidenceCorpus);
  const riskWarning = revised.changed
    ? `${suggestion.risk_warning} 检测到模型生成了原材料未出现的量化数字，已替换为“具体数据待补充”。`
    : suggestion.risk_warning;

  return {
    ...suggestion,
    original_text: evidence.present ? evidence.original_text : suggestion.original_text || fallback.original_text,
    revised_text: revised.text,
    confidence: clamp(suggestion.confidence, 0, 0.98),
    risk_warning: riskWarning,
    applied: true
  };
}

function guardFinalResumeAgainstEvidence(
  finalResume: FinalResume,
  fallback: FinalResume,
  evidenceBySection: Record<ResumeSectionName, ResumeSectionEvidence>,
  evidenceCorpus: string
) {
  const guarded: FinalResume = { ...finalResume };

  for (const section of sectionNames) {
    const key = finalResumeKeyBySection[section];
    const value = guarded[key];
    const evidence = evidenceBySection[section];

    if (evidence.present && (isMissingOriginalText(value) || isMissingSectionClaim(section, value))) {
      guarded[key] = fallback[key];
      continue;
    }

    guarded[key] = sanitizeUnsupportedQuantifiedClaims(value, evidenceCorpus).text;
  }

  return guarded;
}

function guardModelResult(
  modelResult: ResumeOptimizationResult,
  fallback: ResumeOptimizationResult,
  evidenceBySection: Record<ResumeSectionName, ResumeSectionEvidence>,
  input: ResumeOptimizationInput
) {
  const evidenceCorpus = getEvidenceCorpus(input);
  const modelSuggestionsBySection = new Map(modelResult.section_suggestions.map((suggestion) => [suggestion.section, suggestion]));
  const fallbackSuggestionsBySection = new Map(fallback.section_suggestions.map((suggestion) => [suggestion.section, suggestion]));

  const sectionSuggestions = sectionNames.map((section) => {
    const fallbackSuggestion = fallbackSuggestionsBySection.get(section);
    const modelSuggestion = modelSuggestionsBySection.get(section);

    if (!fallbackSuggestion) {
      throw new Error(`Missing fallback suggestion for ${section}`);
    }

    if (!modelSuggestion) {
      return fallbackSuggestion;
    }

    return guardSuggestionAgainstEvidence({
      suggestion: {
        ...fallbackSuggestion,
        ...modelSuggestion,
        section
      },
      fallback: fallbackSuggestion,
      evidence: evidenceBySection[section],
      evidenceCorpus
    });
  });

  return {
    ...fallback,
    ...modelResult,
    target_position: input.target_position,
    resume_match_score: {
      ...fallback.resume_match_score,
      ...modelResult.resume_match_score,
      before_score: clampScore(modelResult.resume_match_score.before_score),
      after_score: clampScore(Math.max(modelResult.resume_match_score.after_score, modelResult.resume_match_score.before_score))
    },
    section_suggestions: sectionSuggestions,
    final_resume: guardFinalResumeAgainstEvidence(modelResult.final_resume, fallback.final_resume, evidenceBySection, evidenceCorpus)
  };
}

function buildSafetyRules() {
  return [
    "必须基于 section_evidence 判断模块是否存在，present=true 时禁止说该模块未提供、没有或缺失。",
    "逐条建议必须对应原文内容，不要按模板机械生成。",
    "禁止虚构公司、项目、岗位、数字、结果、奖项和个人贡献。",
    "缺少量化数据时写“建议补充具体数据”，不要直接写百分比或增长倍数。",
    "每条建议必须包含原文、问题、修改建议、修改后、优化理由、岗位要求、置信度和风险提示。",
    "最终版简历必须完整，但缺失模块只能提示补充真实信息，不能替用户编造。"
  ];
}

function buildQwenMessages(prompt: ResumeOptimizationModelPrompt) {
  return [
    {
      role: "system" as const,
      content:
        "你是一个严谨的中文AI产品经理求职简历顾问。你只基于用户提供的简历、岗位、推荐结果和面试证据给出修改建议。你必须输出严格JSON，不要使用Markdown。"
    },
    {
      role: "user" as const,
      content: JSON.stringify(
        {
          task: "resume_optimization_with_section_evidence",
          target_position: prompt.input.target_position,
          original_resume: prompt.input.original_resume,
          recommended_jobs: prompt.input.recommended_jobs ?? [],
          interview_transcript: prompt.input.interview_transcript ?? [],
          interview_summary: prompt.input.interview_summary ?? "",
          improvement_suggestions: prompt.input.improvement_suggestions ?? [],
          job_jd_keywords: prompt.input.job_jd_keywords ?? [],
          user_supplement: prompt.input.user_supplement ?? "",
          section_evidence: prompt.section_evidence,
          fallback_result_for_shape_only: prompt.fallback_result,
          safety_rules: prompt.safety_rules,
          output_contract: {
            target_position: "string",
            resume_match_score:
              "{ before_score:number, after_score:number, score_reason:string, missing_keywords:string[], added_keywords:string[], strongest_sections:ResumeSectionName[], weakest_sections:ResumeSectionName[] }",
            section_suggestions:
              "ResumeSectionSuggestion[]. 必须覆盖基础信息、求职意向、教育背景、实习经历、项目经历、技能能力、校园经历 / 获奖经历、自我评价。section_evidence[section].present=true 时 original_text 必须引用对应证据，不允许写未提供。",
            interview_based_improvements:
              "{ interview_issue:string, resume_problem:string, resume_revision_strategy:string }[]",
            keyword_optimization:
              "{ missing_keywords:string[], added_keywords:string[], keyword_coverage_before:string, keyword_coverage_after:string }",
            final_resume:
              "{ basic_info:string, job_intention:string, education:string, experience:string, projects:string, skills:string, awards:string, self_evaluation:string }"
          }
        },
        null,
        2
      )
    }
  ];
}

function createQwenResumeOptimizationClient(): ResumeOptimizationModelClient | null {
  const env = getServerEnv();
  const apiKey = env.OPENAI_API_KEY;

  if (!apiKey) {
    return null;
  }

  const model = env.OPENAI_MODEL ?? "qwen-turbo-latest";
  const client = new OpenAI({
    apiKey,
    baseURL: env.OPENAI_BASE_URL ?? "https://dashscope.aliyuncs.com/compatible-mode/v1",
    timeout: Number(process.env.OPENAI_RESUME_TIMEOUT_MS ?? 30000)
  });

  return {
    async generate(prompt) {
      const completion = await client.chat.completions.create({
        model,
        messages: buildQwenMessages(prompt),
        temperature: 0.2,
        max_tokens: 3500,
        response_format: { type: "json_object" }
      });

      const rawContent = completion.choices[0]?.message.content;

      if (!rawContent) {
        throw new Error("Qwen resume optimization returned empty content.");
      }

      return resumeOptimizationResultSchema.parse(JSON.parse(extractJsonBlock(rawContent)));
    }
  };
}

export function generateResumeOptimization(input: ResumeOptimizationInput): ResumeOptimizationResult {
  const keywords = getDefaultKeywords(input);
  const evidenceBySection = analyzeResumeSectionEvidence(input.original_resume);
  const sections = evidenceToSections(evidenceBySection);
  const sectionSuggestions = buildSectionSuggestions(input, evidenceBySection, keywords);
  const score = buildScores(input, evidenceBySection, sectionSuggestions, keywords);

  return {
    generation_source: "fallback",
    target_position: input.target_position,
    resume_match_score: score,
    section_suggestions: sectionSuggestions,
    interview_based_improvements: buildInterviewBasedImprovements(input),
    keyword_optimization: {
      missing_keywords: score.missing_keywords,
      added_keywords: score.added_keywords,
      keyword_coverage_before: `${keywordCoverage(input.original_resume, keywords).coverage}%`,
      keyword_coverage_after: `${keywordCoverage(`${input.original_resume}\n${sectionSuggestions.map((item) => item.revised_text).join("\n")}`, keywords).coverage}%`
    },
    final_resume: buildFinalResume(input, sections, sectionSuggestions, score.added_keywords)
  };
}

export async function generateResumeOptimizationWithQwen(
  input: ResumeOptimizationInput,
  modelClient: ResumeOptimizationModelClient | null = createQwenResumeOptimizationClient()
): Promise<ResumeOptimizationResult> {
  const fallback = generateResumeOptimization(input);
  const sectionEvidence = analyzeResumeSectionEvidence(input.original_resume);

  if (!modelClient) {
    return fallback;
  }

  try {
    const modelResult = resumeOptimizationResultSchema.parse(
      await modelClient.generate({
        input,
        section_evidence: sectionEvidence,
        fallback_result: fallback,
        safety_rules: buildSafetyRules()
      })
    );

    return {
      ...guardModelResult(modelResult, fallback, sectionEvidence, input),
      generation_source: "qwen"
    };
  } catch {
    return fallback;
  }
}
