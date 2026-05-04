import { describe, expect, it, vi } from "vitest";
import {
  buildActivityHistoryRecords,
  type UserActivityRecord
} from "./user-activity-server";

describe("user activity persistence mapping", () => {
  it("builds dashboard history from user-scoped activity records", () => {
    const records: UserActivityRecord[] = [
      {
        id: "activity-interview",
        record_type: "interview_session",
        record_key: "job-1",
        payload: {
          session: {
            jobId: "job-1",
            jobTitle: "AI 产品经理",
            companyName: "小红书",
            answers: [{ answer: "answer", feedback: "feedback" }],
            progress: { current: 1, total: 10 },
            summary: { overallTakeaway: "表达有结构，下一步补齐业务指标。" }
          }
        },
        created_at: "2026-05-04T10:00:00.000Z",
        updated_at: "2026-05-04T10:01:00.000Z"
      },
      {
        id: "activity-resume",
        record_type: "resume_optimization",
        record_key: "job-1",
        payload: {
          result: {
            target_position: "AI 产品经理"
          }
        },
        created_at: "2026-05-04T10:02:00.000Z",
        updated_at: "2026-05-04T10:03:00.000Z"
      }
    ];

    expect(buildActivityHistoryRecords(records)).toEqual({
      interviews: [
        {
          id: "interview:job-1",
          jobId: "job-1",
          jobTitle: "AI 产品经理",
          companyName: "小红书",
          roundLabel: "1 / 10 轮",
          takeaway: "表达有结构，下一步补齐业务指标。",
          destination: "resume-lab",
          createdAt: "2026-05-04T10:00:00.000Z",
          updatedAt: "2026-05-04T10:01:00.000Z"
        }
      ],
      resumeOptimizations: [
        {
          id: "resume:job-1",
          sourceInterviewId: "interview:job-1",
          jobId: "job-1",
          jobTitle: "AI 产品经理",
          status: "已生成",
          createdAt: "2026-05-04T10:02:00.000Z",
          updatedAt: "2026-05-04T10:03:00.000Z"
        }
      ]
    });
  });

  it("does not throw when persistence is unavailable", async () => {
    const upsert = vi.fn().mockResolvedValue({ error: new Error("rls denied") });
    const result = await import("./user-activity-server").then((module) =>
      module.upsertActivityRecord(
        {
          userId: "user-1",
          accessToken: "token",
          recordType: "recommendations",
          recordKey: "latest",
          payload: { ok: true }
        },
        {
          from: () => ({
            upsert
          })
        }
      )
    );

    expect(result.ok).toBe(false);
    expect(result.error).toContain("rls denied");
  });

  it("keeps business routes stable when the persistence client throws", async () => {
    const result = await import("./user-activity-server").then((module) =>
      module.upsertActivityRecord(
        {
          userId: "user-1",
          accessToken: "token",
          recordType: "fit_analysis",
          recordKey: "job-1",
          payload: { ok: true }
        },
        {
          from: () => {
            throw new Error("network down");
          }
        }
      )
    );

    expect(result).toEqual({ ok: false, error: "network down" });
  });
});
