import type { InterviewSession } from "@xhs/ai";

const HISTORY_STORAGE_KEY = "xhs:history-records";
const HISTORY_VERSION = 1;

type HistoryStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export type InterviewHistoryDestination = "resume-lab" | "plaza";

export type InterviewHistoryRecord = {
  id: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  roundLabel: string;
  takeaway: string;
  destination: InterviewHistoryDestination;
  createdAt: string;
  updatedAt: string;
};

export type ResumeOptimizationHistoryRecord = {
  id: string;
  sourceInterviewId: string;
  jobId: string;
  jobTitle: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type HistoryRecords = {
  interviews: InterviewHistoryRecord[];
  resumeOptimizations: ResumeOptimizationHistoryRecord[];
};

export type HistoryOverview = {
  interviewCount: number;
  resumeOptimizationCount: number;
  totalCount: number;
  latestUpdatedAt: string | null;
  nextAction: string;
};

type PersistedHistoryRecords = HistoryRecords & {
  version: number;
};

function emptyHistory(): HistoryRecords {
  return {
    interviews: [],
    resumeOptimizations: []
  };
}

export function getInterviewHistoryRecordId(session: Pick<InterviewSession, "jobId">) {
  return `interview:${session.jobId}`;
}

function isHistoryRecords(value: unknown): value is PersistedHistoryRecords {
  if (!value || typeof value !== "object") {
    return false;
  }

  const history = value as Partial<PersistedHistoryRecords>;

  return history.version === HISTORY_VERSION && Array.isArray(history.interviews) && Array.isArray(history.resumeOptimizations);
}

export function getHistoryRecords(storage: HistoryStorage): HistoryRecords {
  try {
    const rawValue = storage.getItem(HISTORY_STORAGE_KEY);

    if (!rawValue) {
      return emptyHistory();
    }

    const parsed = JSON.parse(rawValue) as unknown;

    if (!isHistoryRecords(parsed)) {
      storage.removeItem(HISTORY_STORAGE_KEY);
      return emptyHistory();
    }

    return {
      interviews: parsed.interviews,
      resumeOptimizations: parsed.resumeOptimizations
    };
  } catch {
    storage.removeItem(HISTORY_STORAGE_KEY);
    return emptyHistory();
  }
}

function saveHistoryRecords(history: HistoryRecords, storage: HistoryStorage) {
  const payload: PersistedHistoryRecords = {
    version: HISTORY_VERSION,
    interviews: history.interviews,
    resumeOptimizations: history.resumeOptimizations
  };

  try {
    storage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // History should not block the user flow when local storage is unavailable.
  }
}

function getSessionTakeaway(session: InterviewSession) {
  return (
    session.summary?.overallTakeaway ??
    session.answers.at(-1)?.feedback ??
    "模拟面试已保存，可从历史记录继续复盘本次表现。"
  );
}

export function addInterviewHistoryRecord(
  session: InterviewSession,
  storage: HistoryStorage,
  timestamp: string,
  destination: InterviewHistoryDestination
) {
  const history = getHistoryRecords(storage);
  const id = getInterviewHistoryRecordId(session);
  const existingRecord = history.interviews.find((record) => record.id === id);
  const nextRecord: InterviewHistoryRecord = {
    id,
    jobId: session.jobId,
    jobTitle: session.jobTitle,
    companyName: session.companyName,
    roundLabel: `${session.answers.length} / ${session.progress.total} 轮`,
    takeaway: getSessionTakeaway(session),
    destination,
    createdAt: existingRecord?.createdAt ?? timestamp,
    updatedAt: timestamp
  };

  saveHistoryRecords(
    {
      ...history,
      interviews: [nextRecord, ...history.interviews.filter((record) => record.id !== id)]
    },
    storage
  );

  return nextRecord;
}

export function addResumeOptimizationHistoryRecord(
  session: InterviewSession,
  storage: HistoryStorage,
  timestamp: string
) {
  const history = getHistoryRecords(storage);
  const sourceInterviewId = getInterviewHistoryRecordId(session);
  const id = `resume:${sourceInterviewId}`;
  const existingRecord = history.resumeOptimizations.find((record) => record.id === id);
  const nextRecord: ResumeOptimizationHistoryRecord = {
    id,
    sourceInterviewId,
    jobId: session.jobId,
    jobTitle: session.jobTitle,
    status: "由模拟面试生成",
    createdAt: existingRecord?.createdAt ?? timestamp,
    updatedAt: timestamp
  };

  saveHistoryRecords(
    {
      ...history,
      resumeOptimizations: [nextRecord, ...history.resumeOptimizations.filter((record) => record.id !== id)]
    },
    storage
  );

  return nextRecord;
}

export function buildHistoryOverview(history: HistoryRecords): HistoryOverview {
  const latestInterview = history.interviews[0] ?? null;
  const latestResumeOptimization = history.resumeOptimizations[0] ?? null;
  const latestRecords = [...history.interviews, ...history.resumeOptimizations].sort(
    (left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
  );
  const latestUpdatedAt = latestRecords[0]?.updatedAt ?? null;

  let nextAction = "先完成一次模拟面试，系统会把复盘沉淀到历史记录";

  if (latestResumeOptimization) {
    nextAction = `继续打磨 ${latestResumeOptimization.jobTitle} 的简历表达`;
  } else if (latestInterview) {
    nextAction = `基于 ${latestInterview.jobTitle} 的面试复盘生成简历优化`;
  }

  return {
    interviewCount: history.interviews.length,
    resumeOptimizationCount: history.resumeOptimizations.length,
    totalCount: history.interviews.length + history.resumeOptimizations.length,
    latestUpdatedAt,
    nextAction
  };
}
