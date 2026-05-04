import { describe, expect, it } from "vitest";
import { detectSearchAccessBlocker } from "./access";

describe("detectSearchAccessBlocker", () => {
  it("flags the Xiaohongshu search login wall", () => {
    expect(
      detectSearchAccessBlocker({
        title: "AI 产品经理 - 小红书搜索",
        body: "登录后查看搜索结果 可用 小红书 微信 扫码 手机号登录"
      })
    ).toBe("search_requires_login");
  });

  it("flags account risk and safety verification pages", () => {
    expect(
      detectSearchAccessBlocker({
        title: "安全验证",
        body: "当前账号存在风险，请完成安全验证后继续访问"
      })
    ).toBe("search_access_blocked");
  });
});
