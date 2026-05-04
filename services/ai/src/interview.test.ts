import { describe, expect, it } from "vitest";
import { getJobLead } from "./recommend";
import {
  createInterviewSession,
  evaluateAnswer,
  submitInterviewAnswer,
  type InterviewGenerationInput,
  type InterviewGenerationOutput
} from "./interview";

const lead = getJobLead("lead-bytedance-strategy");

if (!lead) {
  throw new Error("expected seeded job lead");
}

function makeGenerator() {
  const calls: InterviewGenerationInput[] = [];

  return {
    calls,
    generate: async (input: InterviewGenerationInput): Promise<InterviewGenerationOutput> => {
      calls.push(input);
      const nextTurn = input.state.answers.length + 1;
      const phase = nextTurn >= 7 ? "hr" : "manager";

      return {
        feedback: input.answer
          ? `这一轮回答抓到了${input.currentTurn.dimension}，但还需要补充证据链。下一步请围绕${input.jobLead.title}继续展开。`
          : "面试开始，我会先确认你的项目价值判断。",
        nextQuestion:
          nextTurn > 10
            ? null
            : {
                id: `turn-${nextTurn}`,
                phase,
                question: `基于你前面的回答和${input.jobLead.title}，第 ${nextTurn} 轮我会继续追问什么？`,
                coachingFocus: "保持用户问题、证据和指标闭环。",
                dimension: nextTurn === 1 ? "产品结构化思考" : input.currentTurn.dimension
              },
        signals: ["context-aware"],
        risks: input.answer?.includes("随便") ? ["answer-too-casual"] : [],
        summary:
          nextTurn > 10
            ? {
                overallTakeaway: "候选人已经具备 AI 产品经理的面试主线，但还需要把优势讲得更有证据，把短板转成可训练动作。",
                strengths: [
                  {
                    title: "产品闭环意识清楚",
                    evidence: "多轮回答都能围绕用户问题、指标闭环和策略取舍展开。",
                    amplification: "继续把这个优势放到简历项目开头，用结果指标承接。"
                  }
                ],
                gaps: [
                  {
                    title: "业务证据密度不足",
                    evidence: "回答中提到了指标，但缺少真实数值、对照组或结果变化。",
                    improvement: "补 2 个带基线、动作和结果的项目案例。",
                    detail: {
                      whyItMatters: "AI 产品经理面试会追问你如何证明功能值得做。",
                      practiceSteps: ["为每个项目补一个北极星指标", "准备一次取舍决策的反例", "用 60 秒讲清前后变化"],
                      exampleUpgrade: "不要只说提升体验，改成提升了哪个人群、哪个指标、为什么可信。"
                    }
                  }
                ],
                starReplay: {
                  interviewerPersona: "字节内容智能策略 Hiring Manager",
                  personaDefinition: "一线业务面试官，关注候选人能否把 AI 能力转成可验证的内容策略增长。",
                  perfectReplay:
                    "明星候选人会先界定内容创作者和消费用户的核心场景，再拆出策略目标、模型能力边界、实验指标和上线风险，最后用复盘说明为什么这个方案能被团队采纳。",
                  highlights: ["先讲用户场景", "再讲模型取舍", "最后讲指标和风险"]
                },
                resumeOptimizationCta: {
                  label: "去简历优化，放大优势并补齐短板",
                  href: "/resume-lab",
                  reason: "把本次面试暴露出的优势和不足同步成项目 bullet。"
                }
              }
            : null
      };
    }
  };
}

describe("interview session flow", () => {
  it("turn feedback includes interviewer intent and concrete next-step coaching", () => {
    const feedback = evaluateAnswer("我觉得这个问题可以用数据看看，然后继续优化。", {
      id: "turn-feedback-contract",
      phase: "manager",
      question: "你如何判断一个 AI 产品机会是否值得做？",
      coachingFocus: "说明用户场景、判断依据、业务指标和下一步验证动作。",
      dimension: "用户洞察"
    });

    expect(feedback).toContain("面试官意图");
    expect(feedback).toContain("具体改法");
    expect(feedback).toContain("下轮可这样说");
  });

  it("starts an interview by calling the real generation boundary for the opening question", async () => {
    const generator = makeGenerator();

    const session = await createInterviewSession(lead, { generator: generator.generate });

    expect(generator.calls).toHaveLength(1);
    expect(generator.calls[0].answer).toBeNull();
    expect(generator.calls[0].state.answers).toHaveLength(0);
    expect(session.jobId).toBe(lead.id);
    expect(session.currentTurn?.id).toBe("turn-1");
    expect(session.currentTurn?.question).toContain(lead.title);
    expect(session.phase).toBe("manager");
    expect(session.roleLabel).toContain("Hiring Manager");
    expect(session.progress.current).toBe(1);
    expect(session.answers).toHaveLength(0);
  });

  it("records the answer, sends history to the generator, and advances with a generated next question", async () => {
    const generator = makeGenerator();
    const session = await createInterviewSession(lead, { generator: generator.generate });

    const result = await submitInterviewAnswer(
      session,
      "我会先拆用户痛点，再用核心 KPI 和过程指标判断这个求职 Agent 是否真的值得做。",
      { generator: generator.generate }
    );

    expect(generator.calls).toHaveLength(2);
    expect(generator.calls[1].answer).toContain("核心 KPI");
    expect(generator.calls[1].recentHistory[0].answer).toContain("核心 KPI");
    expect(result.feedback).toContain("证据链");
    expect(result.session.answers).toHaveLength(1);
    expect(result.session.currentTurn?.id).toBe("turn-2");
    expect(result.session.currentTurn?.question).toContain(lead.title);
    expect(result.session.progress.current).toBe(2);
    expect(result.session.summary).toBeNull();
  });

  it("fails explicitly when no generation boundary is available instead of using fixed fallback questions", async () => {
    await expect(createInterviewSession(lead)).rejects.toThrow("Interview generation provider is not configured");
  });

  it("returns a success-oriented final summary with strengths, gaps, star replay, and resume CTA", async () => {
    const generator = makeGenerator();
    let session = await createInterviewSession(lead, { generator: generator.generate });

    for (let index = 0; index < 10; index += 1) {
      const result = await submitInterviewAnswer(
        session,
        `第 ${index + 1} 轮回答：我会补充用户问题、证据链、指标闭环和策略取舍。`,
        { generator: generator.generate }
      );
      session = result.session;
    }

    expect(session.phase).toBe("summary");
    expect(session.currentTurn).toBeNull();
    expect(session.answers).toHaveLength(10);
    expect(session.summary?.strengths[0]).toMatchObject({
      title: "产品闭环意识清楚"
    });
    expect(session.summary?.gaps[0]).toMatchObject({
      title: "业务证据密度不足",
      improvement: "补 2 个带基线、动作和结果的项目案例。"
    });
    expect(session.summary?.gaps[0].detail.practiceSteps).toHaveLength(3);
    expect(session.summary?.starReplay.interviewerPersona).toContain("Hiring Manager");
    expect(session.summary?.starReplay.personaDefinition).toContain("一线业务面试官");
    expect(session.summary?.resumeOptimizationCta.href).toBe("/resume-lab");
    expect("scoreByDimension" in (session.summary ?? {})).toBe(false);
  });

  it("finishes with the model summary after round 10 even when the model returns a stray next question", async () => {
    const generator = makeGenerator();
    const generate = async (input: InterviewGenerationInput): Promise<InterviewGenerationOutput> => {
      const output = await generator.generate(input);

      if (input.state.answers.length === 10) {
        return {
          ...output,
          nextQuestion: {
            id: "stray-turn-11",
            phase: "hr",
            question: "模型误返回的第 11 轮追问，系统不应展示。",
            coachingFocus: "忽略多余追问，进入总结。",
            dimension: "业务理解"
          },
          summary: {
            overallTakeaway: "这是第 10 轮后的大模型最终总结，应该直接返回给前端展示。",
            strengths: [
              {
                title: "结构化表达稳定",
                evidence: "能持续围绕用户、指标、证据链回答。",
                amplification: "把这个优势放到简历项目 bullet 的第一层。"
              }
            ],
            gaps: [
              {
                title: "AI 边界判断不足",
                evidence: "回答里有 Agent 应用，但缺少失败场景。",
                improvement: "补充模型误判、人工兜底和评估指标。",
                detail: {
                  whyItMatters: "面试官会通过边界问题判断你是否真正理解 AI 产品。",
                  practiceSteps: ["列 3 个模型失败场景", "写出对应兜底策略", "补一个评估指标"],
                  exampleUpgrade: "从能做 Agent 升级为知道 Agent 在什么情况下不该自动决策。"
                }
              }
            ],
            starReplay: {
              interviewerPersona: "AI 产品负责人",
              personaDefinition: "关注候选人能否用产品语言管理模型不确定性。",
              perfectReplay: "明星表现会把用户场景、模型能力、失败边界、指标验收和跨团队落地讲成一条完整链路。",
              highlights: ["场景清晰", "边界清晰", "验收清晰"]
            },
            resumeOptimizationCta: {
              label: "去简历优化",
              href: "/resume-lab",
              reason: "把面试证据沉淀成简历表达。"
            }
          }
        };
      }

      return output;
    };
    let session = await createInterviewSession(lead, { generator: generate });

    for (let index = 0; index < 10; index += 1) {
      const result = await submitInterviewAnswer(
        session,
        `第 ${index + 1} 轮回答：我会补充用户问题、证据链、指标闭环和策略取舍。`,
        { generator: generate }
      );
      session = result.session;
    }

    expect(session.phase).toBe("summary");
    expect(session.currentTurn).toBeNull();
    expect(session.answers).toHaveLength(10);
    expect(session.summary?.overallTakeaway).toContain("第 10 轮后的大模型最终总结");
    expect(session.summary?.resumeOptimizationCta.href).toBe("/resume-lab");
  });

  it("keeps the fixed manager-to-HR split when the model mislabels the next question phase", async () => {
    const generator = makeGenerator();
    const generate = async (input: InterviewGenerationInput): Promise<InterviewGenerationOutput> => {
      const output = await generator.generate(input);

      if (input.state.answers.length === 6 && output.nextQuestion) {
        return {
          ...output,
          nextQuestion: {
            ...output.nextQuestion,
            phase: "manager"
          }
        };
      }

      return output;
    };
    let session = await createInterviewSession(lead, { generator: generate });

    for (let index = 0; index < 6; index += 1) {
      const result = await submitInterviewAnswer(
        session,
        `第 ${index + 1} 轮回答：我会补充用户问题、证据链、指标闭环和策略取舍。`,
        { generator: generate }
      );
      session = result.session;
    }

    expect(session.phase).toBe("hr");
    expect(session.currentTurn?.phase).toBe("hr");
  });
});
