"use client";

import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClientOrNull, type AuthSessionState } from "../lib/auth-client";

const publicRoutes = new Set(["/login"]);

function isPublicRoute(pathname: string) {
  return publicRoutes.has(pathname);
}

export function AuthGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sessionState, setSessionState] = useState<AuthSessionState>({ status: "loading" });
  const supabase = useMemo(() => getSupabaseBrowserClientOrNull(), []);

  useEffect(() => {
    if (!supabase) {
      setSessionState({ status: "unconfigured" });
      return;
    }

    const client = supabase;
    let cancelled = false;

    async function loadSession() {
      const { data } = await client.auth.getSession();
      const session = data.session;

      if (cancelled) return;

      if (!session) {
        setSessionState({ status: "unauthenticated" });
        return;
      }

      setSessionState({
        status: "authenticated",
        userId: session.user.id,
        email: session.user.email ?? null,
        accessToken: session.access_token
      });
    }

    void loadSession();

    const { data } = client.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setSessionState({ status: "unauthenticated" });
        return;
      }

      setSessionState({
        status: "authenticated",
        userId: session.user.id,
        email: session.user.email ?? null,
        accessToken: session.access_token
      });
    });

    return () => {
      cancelled = true;
      data.subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (isPublicRoute(pathname)) return;
    if (sessionState.status !== "unauthenticated") return;

    const search = typeof window === "undefined" ? "" : window.location.search;
    const suffix = `${pathname}${search}`;
    router.replace(`/login?next=${encodeURIComponent(suffix)}`);
  }, [pathname, router, sessionState.status]);

  if (isPublicRoute(pathname)) {
    return children;
  }

  if (sessionState.status === "unconfigured") {
    return (
      <main className="page-stack auth-status-page">
        <section className="detail-panel">
          <p className="section-eyebrow">Supabase</p>
          <h1>请先配置 Supabase 环境变量</h1>
          <p className="detail-copy">
            需要 `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 才能启用登录与 RLS 持久化。
          </p>
        </section>
      </main>
    );
  }

  if (sessionState.status !== "authenticated") {
    return (
      <main className="page-stack auth-status-page">
        <section className="detail-panel">
          <p className="section-eyebrow">Auth</p>
          <h1>正在确认登录状态</h1>
          <p className="detail-copy">登录后会继续进入当前求职流程。</p>
        </section>
      </main>
    );
  }

  return children;
}
