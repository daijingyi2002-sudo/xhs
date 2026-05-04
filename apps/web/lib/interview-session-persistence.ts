import type { InterviewSession } from "@xhs/ai";

const STORAGE_VERSION = 1;
export const INTERVIEW_SESSION_STORAGE_PREFIX = "xhs:interview-session";

type InterviewSessionStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;
type EnumerableInterviewSessionStorage = InterviewSessionStorage & Pick<Storage, "key" | "length">;

type PersistedInterviewSession = {
  version: number;
  session: InterviewSession;
};

export function getInterviewSessionStorageKey(jobId: string) {
  return `${INTERVIEW_SESSION_STORAGE_PREFIX}:${jobId}`;
}

function isInterviewSession(value: unknown, jobId: string): value is InterviewSession {
  if (!value || typeof value !== "object") {
    return false;
  }

  const session = value as Partial<InterviewSession>;

  return (
    session.jobId === jobId &&
    typeof session.jobTitle === "string" &&
    typeof session.companyName === "string" &&
    Boolean(session.progress) &&
    Array.isArray(session.answers)
  );
}

export function loadPersistedInterviewSession(jobId: string, storage: InterviewSessionStorage): InterviewSession | null {
  const key = getInterviewSessionStorageKey(jobId);

  try {
    const rawValue = storage.getItem(key);

    if (!rawValue) {
      return null;
    }

    const parsed = JSON.parse(rawValue) as Partial<PersistedInterviewSession>;

    if (parsed.version !== STORAGE_VERSION || !isInterviewSession(parsed.session, jobId)) {
      storage.removeItem(key);
      return null;
    }

    return parsed.session;
  } catch {
    storage.removeItem(key);
    return null;
  }
}

export function savePersistedInterviewSession(session: InterviewSession, storage: InterviewSessionStorage) {
  const payload: PersistedInterviewSession = {
    version: STORAGE_VERSION,
    session
  };

  try {
    storage.setItem(getInterviewSessionStorageKey(session.jobId), JSON.stringify(payload));
  } catch {
    // Persistence is a convenience layer; interview flow should continue if storage is unavailable.
  }
}

export function clearPersistedInterviewSession(jobId: string, storage: InterviewSessionStorage) {
  try {
    storage.removeItem(getInterviewSessionStorageKey(jobId));
  } catch {
    // Clearing is best-effort; navigation should still proceed if storage is unavailable.
  }
}

export function findLatestCompletedInterviewSession(
  storage: EnumerableInterviewSessionStorage
): InterviewSession | null {
  const completedSessions: InterviewSession[] = [];

  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);

    if (!key?.startsWith(`${INTERVIEW_SESSION_STORAGE_PREFIX}:`)) {
      continue;
    }

    const jobId = key.slice(`${INTERVIEW_SESSION_STORAGE_PREFIX}:`.length);
    const session = loadPersistedInterviewSession(jobId, storage);

    if (session?.summary) {
      completedSessions.push(session);
    }
  }

  return (
    completedSessions.sort((left, right) => {
      const answerDelta = right.answers.length - left.answers.length;
      if (answerDelta !== 0) return answerDelta;
      return right.progress.current - left.progress.current;
    })[0] ?? null
  );
}
