import type { ConsultationState } from "@xhs/ai";

export const CONSULTATION_SESSION_KEY = "xhs.consultation.state";

export function saveConsultationState(state: ConsultationState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CONSULTATION_SESSION_KEY, JSON.stringify(state));
}

export function loadConsultationState(): ConsultationState | null {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(CONSULTATION_SESSION_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as ConsultationState;
  } catch {
    window.localStorage.removeItem(CONSULTATION_SESSION_KEY);
    return null;
  }
}
