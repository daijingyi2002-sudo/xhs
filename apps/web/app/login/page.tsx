"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { getSupabaseBrowserClientOrNull } from "../../lib/auth-client";
import {
  completeLoginAuthHandshake,
  type LoginAuthClient,
  type LoginMode
} from "../../lib/login-auth-handshake";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<LoginMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const nextPath = searchParams.get("next") || "/";

  function showNotice(text: string) {
    setErrorMessage("");
    setMessage(text);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const supabase = getSupabaseBrowserClientOrNull();

    if (!supabase) {
      setErrorMessage("Supabase 未配置，无法登录。请先配置 NEXT_PUBLIC_SUPABASE_URL 和 NEXT_PUBLIC_SUPABASE_ANON_KEY。");
      return;
    }

    setBusy(true);
    setMessage("");
    setErrorMessage("");

    try {
      const result = await completeLoginAuthHandshake(supabase as unknown as LoginAuthClient, {
        mode,
        email,
        password,
        displayName,
        nextPath
      });

      if (result.status === "pendingConfirmation") {
        setMessage(result.message);
        return;
      }

      router.replace(result.nextPath);
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "登录失败，请稍后重试。");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-screen">
      <header className="login-topbar">
        <div className="login-topbar-inner">
          <div className="login-wordmark">Career Copilot | 职业领航</div>
          <div className="login-topbar-actions">
            <button
              type="button"
              className="login-icon-button"
              aria-label="Language"
              onClick={() => showNotice("当前登录页已采用中英双语文案。")}
            >
              <span className="material-symbols-outlined">language</span>
            </button>
            <a className="login-support-button" href="mailto:support@example.com">
              Support
            </a>
          </div>
        </div>
      </header>

      <main className="login-main">
        <section className="login-card" aria-label="Career Copilot account login">
          <div className="login-visual">
            <div className="login-visual-content">
              <img src="/brand-mark.png" alt="Career Copilot Logo" className="login-logo" />
              <h2>Start your AI-powered career journey today.</h2>
              <p>今天开启您的 AI 驱动职业之旅。</p>
            </div>
            <div className="login-floating-icon login-floating-icon-top" aria-hidden="true">
              <span className="material-symbols-outlined">auto_awesome</span>
            </div>
            <div className="login-floating-icon login-floating-icon-bottom" aria-hidden="true">
              <span className="material-symbols-outlined">insights</span>
            </div>
          </div>

          <div className="login-form-panel">
            <div className="login-copy">
              <p className="login-kicker">Email + Password</p>
              <h1>{mode === "signin" ? "Welcome Back | 欢迎回来" : "Create Account | 创建账号"}</h1>
              <p>Sign in to continue your professional development.</p>
            </div>

            <div className="login-mode-tabs" aria-label="Login mode">
              <button
                type="button"
                className={mode === "signin" ? "is-active" : ""}
                onClick={() => setMode("signin")}
                disabled={busy}
              >
                登录
              </button>
              <button
                type="button"
                className={mode === "signup" ? "is-active" : ""}
                onClick={() => setMode("signup")}
                disabled={busy}
              >
                注册
              </button>
            </div>

            <form className="login-form" onSubmit={handleSubmit}>
              {mode === "signup" ? (
                <label className="login-field" htmlFor="display-name">
                  <span>Display Name | 昵称</span>
                  <input
                    id="display-name"
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    placeholder="例如：小林"
                    disabled={busy}
                  />
                </label>
              ) : null}

              <label className="login-field" htmlFor="email">
                <span>Email | 邮箱</span>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@example.com"
                  autoComplete="email"
                  disabled={busy}
                  required
                />
              </label>

              <label className="login-field" htmlFor="password">
                <span>Password | 密码</span>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="至少 8 位"
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  disabled={busy}
                  minLength={8}
                  required
                />
              </label>

              <div className="login-row">
                <span className="login-session-note">Supabase secured session</span>
                <button type="button" className="login-link-button" onClick={() => showNotice("密码重置入口暂未开放。")}>
                  Forgot password?
                </button>
              </div>

              <button type="submit" className="login-primary-button" disabled={busy}>
                {busy ? "处理中..." : mode === "signin" ? "Login | 登录" : "Create Account | 创建账号"}
              </button>

              {message ? <p className="login-message">{message}</p> : null}
              {errorMessage ? <p className="login-error">{errorMessage}</p> : null}
            </form>

            <div className="login-divider">
              <span>OR</span>
            </div>

            <button
              type="button"
              className="login-google-button"
              onClick={() => showNotice("Phase 1 仅开放邮箱 + 密码登录，Google 登录暂未接入。")}
            >
              <span className="login-google-mark">G</span>
              Sign in with Google
            </button>

            <p className="login-switch-copy">
              {mode === "signin" ? "Don't have an account?" : "Already have an account?"}{" "}
              <button type="button" onClick={() => setMode(mode === "signin" ? "signup" : "signin")}>
                {mode === "signin" ? "Create Account | 创建账号" : "Login | 登录"}
              </button>
            </p>
          </div>
        </section>
      </main>

      <footer className="login-footer">
        <div className="login-footer-inner">
          <strong>© 2026 Career Copilot. Evidence-backed AI Guidance.</strong>
          <nav>
            <button type="button" onClick={() => showNotice("隐私政策文档暂未接入。")}>
              Privacy Policy
            </button>
            <button type="button" onClick={() => showNotice("服务条款文档暂未接入。")}>
              Terms of Service
            </button>
            <button type="button" onClick={() => showNotice("当前登录页已采用中英双语文案。")}>
              English/中文
            </button>
          </nav>
        </div>
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="login-loading">
          <section>
            <p>Auth</p>
            <h1>正在加载登录页</h1>
          </section>
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
