import { defaultCandidateProfile } from "@xhs/domain";
import type { CandidateProfile } from "@xhs/domain";

export function synthesizeCandidateProfile(input?: {
  resumeName?: string;
  userNotes?: string[];
}): CandidateProfile {
  const resumeSuffix = input?.resumeName ? [`已上传: ${input.resumeName}`] : [];
  const noteSuffix = input?.userNotes?.length ? input.userNotes : [];

  return {
    ...defaultCandidateProfile,
    baseProfile: {
      ...defaultCandidateProfile.baseProfile,
      projects: [...defaultCandidateProfile.baseProfile.projects, ...resumeSuffix, ...noteSuffix]
    }
  };
}
