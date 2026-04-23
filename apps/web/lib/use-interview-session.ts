"use client";

import { useEffect, useState } from "react";
import type { InterviewSession, InterviewSubmitResult } from "@xhs/ai";

type InterviewLoadState =
  | { status: "loading" }
  | { status: "ready"; session: InterviewSession }
  | { status: "error"; message: string };

export function useInterviewSession(jobId: string) {
  const [loadState, setLoadState] = useState<InterviewLoadState>({ status: "loading" });
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoadState({ status: "loading" });
      setErrorMessage("");

      try {
        const response = await fetch("/api/interview/start", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ jobId })
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(payload?.error ?? "模拟面试初始化失败。");
        }

        const session = (await response.json()) as InterviewSession;

        if (!cancelled) {
          setLoadState({ status: "ready", session });
        }
      } catch (error) {
        if (!cancelled) {
          setLoadState({
            status: "error",
            message: error instanceof Error ? error.message : "模拟面试初始化失败。"
          });
        }
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [jobId]);

  async function submit(answer: string) {
    if (loadState.status !== "ready" || busy) return null;

    setBusy(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/interview/answer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          session: loadState.session,
          answer
        })
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "提交面试回答失败。");
      }

      const result = (await response.json()) as InterviewSubmitResult;
      setLoadState({ status: "ready", session: result.session });
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : "提交面试回答失败。";
      setErrorMessage(message);
      return null;
    } finally {
      setBusy(false);
    }
  }

  return {
    loadState,
    busy,
    errorMessage,
    submit
  };
}
