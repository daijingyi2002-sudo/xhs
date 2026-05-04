import type {
  HistoryRecords,
  InterviewHistoryRecord,
  ResumeOptimizationHistoryRecord
} from "./history-records";
import { createUserScopedSupabase } from "./auth-server";

type SupabaseLike = {
  from: (table: string) => {
    upsert?: (value: unknown, options?: unknown) => Promise<{ error: { message?: string } | Error | null }>;
    select?: (columns?: string) => {
      order: (column: string, options?: { ascending?: boolean }) => Promise<{ data: unknown; error: { message?: string } | Error | null }>;
    };
  };
};

export type ActivityRecordType =
  | "consultation"
  | "recommendations"
  | "fit_analysis"
  | "interview_session"
  | "resume_optimization";

export type UserActivityRecord = {
  id: string;
  record_type: ActivityRecordType | string;
  record_key: string;
  payload: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type UpsertActivityInput = {
  userId: string;
  accessToken: string;
  recordType: ActivityRecordType;
  recordKey: string;
  payload: Record<string, unknown>;
};

export type ListActivityInput = {
  accessToken: string;
};

function errorMessage(error: { message?: string } | Error | null | undefined) {
  if (!error) return "unknown persistence error";
  return error.message ?? "unknown persistence error";
}

function getScopedClient(accessToken: string, injectedClient?: SupabaseLike) {
  return injectedClient ?? createUserScopedSupabase(accessToken);
}

export async function upsertActivityRecord(input: UpsertActivityInput, injectedClient?: SupabaseLike) {
  try {
    const client = getScopedClient(input.accessToken, injectedClient);

    if (!client) {
      return { ok: false, error: "Supabase is not configured." };
    }

    const operation = client.from("user_activity_records").upsert?.(
      {
        user_id: input.userId,
        record_type: input.recordType,
        record_key: input.recordKey,
        payload: input.payload,
        updated_at: new Date().toISOString()
      },
      {
        onConflict: "user_id,record_type,record_key"
      }
    );
    const { error } = operation ? await operation : { error: new Error("Supabase upsert is unavailable.") };

    if (error) {
      return { ok: false, error: errorMessage(error) };
    }

    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "unknown persistence error" };
  }
}

export async function listActivityRecords(input: ListActivityInput, injectedClient?: SupabaseLike) {
  const client = getScopedClient(input.accessToken, injectedClient);

  if (!client) {
    return { ok: false as const, error: "Supabase is not configured.", records: [] };
  }

  const query = client
    .from("user_activity_records")
    .select?.("id, record_type, record_key, payload, created_at, updated_at");

  if (!query) {
    return { ok: false as const, error: "Supabase select is unavailable.", records: [] };
  }

  const { data, error } = await query.order("updated_at", { ascending: false });

  if (error) {
    return { ok: false as const, error: errorMessage(error), records: [] };
  }

  return {
    ok: true as const,
    records: Array.isArray(data) ? (data as UserActivityRecord[]) : []
  };
}

function getString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function getNestedRecord(value: unknown, key: string): Record<string, unknown> | null {
  if (!value || typeof value !== "object") return null;
  const nested = (value as Record<string, unknown>)[key];
  return nested && typeof nested === "object" ? (nested as Record<string, unknown>) : null;
}

function buildInterviewRecord(record: UserActivityRecord): InterviewHistoryRecord | null {
  const session = getNestedRecord(record.payload, "session") ?? record.payload;
  const jobId = getString(session.jobId, record.record_key);
  const progress = getNestedRecord(session, "progress");
  const summary = getNestedRecord(session, "summary");
  const answers = Array.isArray(session.answers) ? session.answers : [];

  return {
    id: `interview:${jobId}`,
    jobId,
    jobTitle: getString(session.jobTitle, "AI 产品经理模拟面试"),
    companyName: getString(session.companyName, "目标公司"),
    roundLabel: `${answers.length || Number(progress?.current ?? 0)} / ${Number(progress?.total ?? 10)} 轮`,
    takeaway: getString(
      summary?.overallTakeaway,
      answers.length > 0 ? "面试记录已保存，可继续复盘回答证据和下一步改进。" : "面试已创建，等待开始回答。"
    ),
    destination: "resume-lab",
    createdAt: record.created_at,
    updatedAt: record.updated_at
  };
}

function buildResumeRecord(record: UserActivityRecord): ResumeOptimizationHistoryRecord {
  const result = getNestedRecord(record.payload, "result") ?? record.payload;
  const jobId = getString(record.payload.jobId, record.record_key);
  const jobTitle = getString(result.target_position, "AI 产品经理");

  return {
    id: `resume:${jobId}`,
    sourceInterviewId: `interview:${jobId}`,
    jobId,
    jobTitle,
    status: "已生成",
    createdAt: record.created_at,
    updatedAt: record.updated_at
  };
}

export function buildActivityHistoryRecords(records: UserActivityRecord[]): HistoryRecords {
  const interviews = records
    .filter((record) => record.record_type === "interview_session")
    .map(buildInterviewRecord)
    .filter((record): record is InterviewHistoryRecord => Boolean(record));

  const resumeOptimizations = records
    .filter((record) => record.record_type === "resume_optimization")
    .map(buildResumeRecord);

  return {
    interviews,
    resumeOptimizations
  };
}
