"use client";

import { useEffect, useMemo, useState } from "react";
import { LogOut, Save, Upload, UserRound, X } from "lucide-react";
import { buildAuthenticatedHeaders } from "../lib/api-auth-fetch";
import { getSupabaseBrowserClientOrNull } from "../lib/auth-client";
import { buildAccountAvatarLabel, type AccountProfileResponse } from "../lib/account-profile";

type AccountMenuVariant = "career" | "jobs" | "resume" | "interview" | "compact";

const variantClass: Record<AccountMenuVariant, string> = {
  career: "career-avatar",
  jobs: "jobs-avatar",
  resume: "resume-avatar resume-avatar-large",
  interview: "interview-avatar",
  compact: "career-avatar career-avatar-small"
};

function getInitials(profile: AccountProfileResponse | null) {
  return buildAccountAvatarLabel({
    displayName: profile?.user.displayName,
    username: profile?.user.username,
    email: profile?.user.email
  });
}

function createEmptyProfile(): AccountProfileResponse {
  return {
    user: {
      id: "",
      email: "",
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
  };
}

export function AccountMenu({ variant = "jobs" }: { variant?: AccountMenuVariant }) {
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState<AccountProfileResponse | null>(null);
  const [draft, setDraft] = useState<AccountProfileResponse>(createEmptyProfile);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const displayLabel = useMemo(() => profile?.user.displayName || profile?.user.email || "已登录", [profile]);

  async function loadProfile() {
    try {
      const response = await fetch("/api/account/profile", {
        headers: await buildAuthenticatedHeaders()
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "账户资料加载失败。");
      }

      const data = (await response.json()) as AccountProfileResponse;
      setProfile(data);
      setDraft(data);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "账户资料加载失败。");
    }
  }

  useEffect(() => {
    void loadProfile();
  }, []);

  async function saveProfile() {
    setBusy(true);
    setMessage("");
    setErrorMessage("");

    try {
      const response = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: await buildAuthenticatedHeaders({
          "Content-Type": "application/json"
        }),
        body: JSON.stringify({
          username: draft.user.username,
          displayName: draft.user.displayName,
          basicInfo: draft.user.basicInfo
        })
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "保存失败。");
      }

      const data = (await response.json()) as AccountProfileResponse;
      setProfile(data);
      setDraft(data);
      setMessage("资料已保存。");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "保存失败。");
    } finally {
      setBusy(false);
    }
  }

  async function uploadResume(file: File | null) {
    if (!file) return;
    setBusy(true);
    setMessage("");
    setErrorMessage("");

    try {
      const formData = new FormData();
      formData.append("resume", file);
      const response = await fetch("/api/account/profile", {
        method: "POST",
        headers: await buildAuthenticatedHeaders(),
        body: formData
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "简历保存失败。");
      }

      const data = (await response.json()) as AccountProfileResponse;
      setProfile(data);
      setDraft(data);
      setMessage("简历已保存。");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "简历保存失败。");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    const supabase = getSupabaseBrowserClientOrNull();
    await supabase?.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <>
      <button type="button" className={`account-trigger ${variantClass[variant]}`} onClick={() => setOpen(true)}>
        {getInitials(profile)}
      </button>

      {open ? (
        <div className="account-overlay" role="presentation" onClick={() => setOpen(false)}>
          <section className="account-panel" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <header className="account-panel-header">
              <div className="account-panel-identity">
                <div className="account-panel-avatar">{getInitials(profile)}</div>
                <div>
                  <span>当前登录</span>
                  <strong>{displayLabel}</strong>
                  <small>{profile?.user.email ?? "正在读取账户"}</small>
                </div>
              </div>
              <button type="button" className="account-icon-button" onClick={() => setOpen(false)} aria-label="关闭">
                <X size={18} />
              </button>
            </header>

            <div className="account-form-grid">
              <label>
                <span>用户名</span>
                <input
                  value={draft.user.username}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      user: { ...current.user, username: event.target.value }
                    }))
                  }
                  placeholder="例如 student_ai_pm"
                />
              </label>
              <label>
                <span>昵称</span>
                <input
                  value={draft.user.displayName}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      user: { ...current.user, displayName: event.target.value }
                    }))
                  }
                  placeholder="展示给自己的名字"
                />
              </label>
              <label>
                <span>目标城市</span>
                <input
                  value={draft.user.basicInfo.city}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      user: {
                        ...current.user,
                        basicInfo: { ...current.user.basicInfo, city: event.target.value }
                      }
                    }))
                  }
                  placeholder="上海 / 北京 / 深圳"
                />
              </label>
              <label>
                <span>目标岗位</span>
                <input
                  value={draft.user.basicInfo.targetRole}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      user: {
                        ...current.user,
                        basicInfo: { ...current.user.basicInfo, targetRole: event.target.value }
                      }
                    }))
                  }
                  placeholder="AI 产品经理"
                />
              </label>
              <label>
                <span>学校</span>
                <input
                  value={draft.user.basicInfo.school}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      user: {
                        ...current.user,
                        basicInfo: { ...current.user.basicInfo, school: event.target.value }
                      }
                    }))
                  }
                  placeholder="学校 / 学院"
                />
              </label>
              <label>
                <span>毕业年份</span>
                <input
                  value={draft.user.basicInfo.graduationYear}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      user: {
                        ...current.user,
                        basicInfo: { ...current.user.basicInfo, graduationYear: event.target.value }
                      }
                    }))
                  }
                  placeholder="2026"
                />
              </label>
            </div>

            <div className="account-resume-card">
              <div>
                <span>个人简历</span>
                <strong>{profile?.resume?.fileName ?? "还没有保存简历"}</strong>
                <small>
                  {profile?.resume
                    ? `${profile.resume.hasText ? "已解析文本" : "已保存文件信息"} · ${new Date(profile.resume.uploadedAt).toLocaleString("zh-CN")}`
                    : "上传后会保存到当前用户的 resumes 表。"}
                </small>
              </div>
              <label className="account-upload-button">
                <Upload size={16} />
                上传
                <input
                  type="file"
                  accept=".pdf,.docx,.txt,.md"
                  disabled={busy}
                  onChange={(event) => void uploadResume(event.target.files?.[0] ?? null)}
                />
              </label>
            </div>

            {message ? <p className="account-message">{message}</p> : null}
            {errorMessage ? <p className="account-error">{errorMessage}</p> : null}

            <footer className="account-actions">
              <button type="button" className="account-secondary-action" onClick={signOut}>
                <LogOut size={16} />
                退出登录
              </button>
              <button type="button" className="account-primary-action" onClick={saveProfile} disabled={busy}>
                {busy ? <UserRound size={16} /> : <Save size={16} />}
                保存资料
              </button>
            </footer>
          </section>
        </div>
      ) : null}
    </>
  );
}
