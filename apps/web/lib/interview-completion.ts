import type { InterviewSession } from "@xhs/ai";
import { addInterviewHistoryRecord, addResumeOptimizationHistoryRecord } from "./history-records";
import { clearPersistedInterviewSession } from "./interview-session-persistence";

type CompletionStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function completeInterviewForResumeOptimization(
  session: InterviewSession,
  storage: CompletionStorage,
  timestamp = new Date().toISOString()
) {
  addInterviewHistoryRecord(session, storage, timestamp, "resume-lab");
  addResumeOptimizationHistoryRecord(session, storage, timestamp);
  clearPersistedInterviewSession(session.jobId, storage);
}

export function completeInterviewToPlaza(
  session: InterviewSession,
  storage: CompletionStorage,
  timestamp = new Date().toISOString()
) {
  addInterviewHistoryRecord(session, storage, timestamp, "plaza");
  clearPersistedInterviewSession(session.jobId, storage);
}
