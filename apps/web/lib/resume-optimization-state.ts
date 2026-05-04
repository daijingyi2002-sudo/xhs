import type { FinalResume, ResumeOptimizationResult, ResumeSectionName } from "@xhs/ai";

export type ResumeSuggestionStatus = "pending" | "accepted";

export type ResumeSuggestionState = {
  section: ResumeSectionName;
  status: ResumeSuggestionStatus;
};

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

export function createResumeSuggestionStates(result: ResumeOptimizationResult): ResumeSuggestionState[] {
  return result.section_suggestions.map((suggestion) => ({
    section: suggestion.section,
    status: "pending"
  }));
}

export function applyResumeSuggestion(states: ResumeSuggestionState[], section: ResumeSectionName) {
  return states.map((state) => (state.section === section ? { ...state, status: "accepted" as const } : state));
}

export function removeResumeSuggestion(states: ResumeSuggestionState[], section: ResumeSectionName) {
  return states.filter((state) => state.section !== section);
}

export function buildResumeDraft(result: ResumeOptimizationResult, states: ResumeSuggestionState[]): FinalResume {
  const draft: FinalResume = { ...result.final_resume };
  const activeSections = new Set(states.map((state) => state.section));

  for (const suggestion of result.section_suggestions) {
    if (activeSections.has(suggestion.section)) {
      continue;
    }

    const key = finalResumeKeyBySection[suggestion.section];
    draft[key] = suggestion.original_text === "未提供" ? "" : suggestion.original_text;
  }

  return draft;
}
