import { describe, expect, it } from "vitest";
import { buildLeadIngestionRecord } from "./ingestion";

describe("buildLeadIngestionRecord", () => {
  it("maps a validated Xiaohongshu note to a high-confidence job lead", () => {
    const record = buildLeadIngestionRecord({
      noteId: "6909680e0000000007033511",
      url: "https://www.xiaohongshu.com/explore/6909680e0000000007033511",
      title: "字节跳动 AI 产品经理校招，附 JD 和投递建议",
      body: "字节跳动 AI 产品经理 校招 JD，要求有 LLM 应用理解、需求分析、数据分析、用户研究经验。",
      authorName: "校招冲刺日记",
      publishTime: "2026-04-20",
      tags: ["字节跳动", "AI产品经理", "校招", "JD"],
      validated: true
    });

    expect(record).not.toBeNull();
    expect(record?.company.id).toBe("bytedance");
    expect(record?.lead.id).toBe("lead-bytedance-6909680e0000000007033511");
    expect(record?.lead.sourceConfidence).toBeGreaterThanOrEqual(85);
    expect(record?.lead.city).toBe("未知");
    expect(record?.lead.extractedRequirements).toEqual(
      expect.arrayContaining(["LLM 应用理解", "需求分析", "数据分析"])
    );
    expect(record?.post.sourceUrl).toBe("https://www.xiaohongshu.com/explore/6909680e0000000007033511");
  });

  it("rejects notes without a clear company match and hiring signal", () => {
    const record = buildLeadIngestionRecord({
      noteId: "abc123",
      url: "https://www.xiaohongshu.com/explore/abc123",
      title: "AI 产品经理面经复盘",
      body: "分享一下面试感受和答题思路，没有 JD、招聘、内推或投递信息。",
      authorName: "面经收集者",
      publishTime: "2026-04-18",
      tags: ["AI产品经理", "面经"],
      validated: true
    });

    expect(record).toBeNull();
  });
});
