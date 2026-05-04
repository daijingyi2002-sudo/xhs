export type AccountBasicInfo = {
  city: string;
  targetRole: string;
  school: string;
  graduationYear: string;
};

export type AccountProfileRow = {
  id: string;
  email: string;
  username: string | null;
  display_name: string | null;
  basic_info: Record<string, unknown> | null;
};

export type AccountResumeRow = {
  id: string;
  file_name: string;
  file_type: string;
  raw_text: string | null;
  created_at: string;
};

export type AccountProfileResponse = {
  user: {
    id: string;
    email: string;
    username: string;
    displayName: string;
    basicInfo: AccountBasicInfo;
  };
  resume: {
    id: string;
    fileName: string;
    fileType: string;
    hasText: boolean;
    uploadedAt: string;
  } | null;
};

function readString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function getAsciiInitials(value: string) {
  return value
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getDisplayInitials(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";

  const ascii = getAsciiInitials(trimmed);
  if (ascii) return ascii;

  return Array.from(trimmed).slice(0, 2).join("");
}

export function buildAccountAvatarLabel(account: {
  displayName?: string | null;
  username?: string | null;
  email?: string | null;
}) {
  const displayName = account.displayName?.trim();
  if (displayName) return getDisplayInitials(displayName);

  const username = account.username?.trim();
  if (username) return getDisplayInitials(username);

  const emailName = account.email?.split("@")[0]?.trim();
  if (emailName) return getDisplayInitials(emailName);

  return "用";
}

function buildBasicInfo(value: Record<string, unknown> | null): AccountBasicInfo {
  return {
    city: readString(value?.city),
    targetRole: readString(value?.target_role),
    school: readString(value?.school),
    graduationYear: readString(value?.graduation_year)
  };
}

export function buildAccountProfileResponse(
  profile: AccountProfileRow,
  resume: AccountResumeRow | null
): AccountProfileResponse {
  return {
    user: {
      id: profile.id,
      email: profile.email,
      username: profile.username ?? "",
      displayName: profile.display_name ?? "",
      basicInfo: buildBasicInfo(profile.basic_info)
    },
    resume: resume
      ? {
          id: resume.id,
          fileName: resume.file_name,
          fileType: resume.file_type,
          hasText: Boolean(resume.raw_text?.trim()),
          uploadedAt: resume.created_at
        }
      : null
  };
}
