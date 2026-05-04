import { describe, expect, it } from "vitest";
import {
  buildAccountAvatarLabel,
  buildAccountProfileResponse,
  type AccountProfileRow,
  type AccountResumeRow
} from "./account-profile";

describe("account profile mapping", () => {
  it("builds a persistent account view from profile and latest resume rows", () => {
    const profile: AccountProfileRow = {
      id: "user-1",
      email: "student@example.com",
      username: "student_ai_pm",
      display_name: "小林",
      basic_info: {
        city: "上海",
        target_role: "AI 产品经理",
        school: "复旦大学",
        graduation_year: "2026"
      }
    };
    const resume: AccountResumeRow = {
      id: "resume-1",
      file_name: "resume.pdf",
      file_type: "application/pdf",
      raw_text: "做过 AI 产品项目。",
      created_at: "2026-05-04T12:00:00.000Z"
    };

    expect(buildAccountProfileResponse(profile, resume)).toEqual({
      user: {
        id: "user-1",
        email: "student@example.com",
        username: "student_ai_pm",
        displayName: "小林",
        basicInfo: {
          city: "上海",
          targetRole: "AI 产品经理",
          school: "复旦大学",
          graduationYear: "2026"
        }
      },
      resume: {
        id: "resume-1",
        fileName: "resume.pdf",
        fileType: "application/pdf",
        hasText: true,
        uploadedAt: "2026-05-04T12:00:00.000Z"
      }
    });
  });

  it("uses stable defaults when optional fields are missing", () => {
    expect(
      buildAccountProfileResponse(
        {
          id: "user-1",
          email: "student@example.com",
          username: null,
          display_name: null,
          basic_info: null
        },
        null
      )
    ).toMatchObject({
      user: {
        username: "",
        displayName: "",
        basicInfo: {
          city: "",
          targetRole: "",
          school: "",
          graduationYear: ""
        }
      },
      resume: null
    });
  });

  it("builds avatar initials from nickname, username, then email", () => {
    expect(buildAccountAvatarLabel({ displayName: "小林", username: "lin_ai", email: "lin@example.com" })).toBe("小林");
    expect(buildAccountAvatarLabel({ displayName: "", username: "ai_product", email: "lin@example.com" })).toBe("AP");
    expect(buildAccountAvatarLabel({ displayName: "", username: "", email: "student.pm@example.com" })).toBe("SP");
    expect(buildAccountAvatarLabel({ displayName: "", username: "", email: "" })).toBe("用");
  });
});
