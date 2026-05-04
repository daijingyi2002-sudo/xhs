import { describe, expect, it } from "vitest";
import { buildDiscoveryQueries, parseDuckDuckGoResults } from "./discovery";

describe("buildDiscoveryQueries", () => {
  it("builds unique query combinations from companies, keywords, and tags", () => {
    const queries = buildDiscoveryQueries({
      companies: ["字节跳动", "小红书"],
      keywords: ["AI 产品经理", "AIGC 产品经理"],
      tags: ["校招", "实习"]
    });

    expect(queries).toContain("site:xiaohongshu.com/explore 字节跳动 AI 产品经理 校招");
    expect(queries).toContain("site:xiaohongshu.com/explore 小红书 AIGC 产品经理 实习");
    expect(queries).toContain("site:xiaohongshu.com/explore AI 产品经理 校招");
    expect(new Set(queries).size).toBe(queries.length);
  });
});

describe("parseDuckDuckGoResults", () => {
  it("extracts unique Xiaohongshu explore urls from html search results", () => {
    const html = `
      <div class="result__title">
        <a class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fwww.xiaohongshu.com%2Fexplore%2F6909680e0000000007033511&rut=abc">
          小红书
        </a>
      </div>
      <div class="result__title">
        <a class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fwww.xiaohongshu.com%2Fexplore%2F6909680e0000000007033511&rut=def">
          小红书
        </a>
      </div>
      <div class="result__title">
        <a class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fwww.xiaohongshu.com%2Fexplore%2F684e623b000000000f03b17b%3Fxsec_token%3D123&rut=ghi">
          小红书
        </a>
      </div>
    `;

    expect(parseDuckDuckGoResults(html)).toEqual([
      "https://www.xiaohongshu.com/explore/6909680e0000000007033511",
      "https://www.xiaohongshu.com/explore/684e623b000000000f03b17b?xsec_token=123"
    ]);
  });
});
