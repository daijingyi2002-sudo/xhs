import { describe, expect, it } from "vitest";
import { buildXhsSearchUrl, scrapeXhsNotesFromSearchCards } from "./xhs-search-cards";

describe("buildXhsSearchUrl", () => {
  it("opens only the Xiaohongshu search page for a discovery query", () => {
    expect(buildXhsSearchUrl("site:xiaohongshu.com/explore AI 产品经理 校招")).toBe(
      "https://www.xiaohongshu.com/search_result?keyword=AI%20%E4%BA%A7%E5%93%81%E7%BB%8F%E7%90%86%20%E6%A0%A1%E6%8B%9B"
    );
  });
});

describe("scrapeXhsNotesFromSearchCards", () => {
  it("clicks visible search cards and captures complete detail fields", async () => {
    const page = new FakeSearchPage();
    const context = {
      newPage: async () => page
    };

    const scrape = await scrapeXhsNotesFromSearchCards(context, ["AI 产品经理 校招 JD"], 1, {
      maxQueries: 1,
      searchSettleSeconds: 0,
      detailReadSeconds: 0,
      betweenClicksSeconds: 0,
      chooseCardIndexes: (count) => Array.from({ length: count }, (_, index) => index)
    });

    expect(page.gotoCalls).toEqual([buildXhsSearchUrl("AI 产品经理 校招 JD")]);
    expect(page.gotoCalls.some((url) => url.includes("/explore/"))).toBe(false);
    expect(page.cardClickCount).toBe(1);
    expect(scrape.results).toEqual([
      {
        noteId: "note123",
        url: "https://www.xiaohongshu.com/explore/note123?xsec_token=from-card",
        finalUrl: "https://www.xiaohongshu.com/explore/note123?xsec_source=pc_search",
        title: "AI 产品经理JD拆解",
        body: "正文第一段 正文第二段",
        authorName: "Sine的大喇叭",
        authorProfileUrl: "https://www.xiaohongshu.com/user/profile/user123",
        publishTime: "2026-04-29",
        tags: ["#AI产品经理", "#校招"],
        validated: true,
        blocker: null
      }
    ]);
  });

  it("runs the human pacing hook before search, before card clicks, and between scrolls", async () => {
    const page = new FakeSearchPage();
    const events: string[] = [];

    await scrapeXhsNotesFromSearchCards({ newPage: async () => page }, ["AI 后端开发工程师"], 1, {
      maxQueries: 1,
      searchSettleSeconds: 0,
      detailReadSeconds: 0,
      betweenClicksSeconds: 0,
      chooseCardIndexes: (count) => Array.from({ length: count }, (_, index) => index),
      humanPacing: async (event) => {
        events.push(event);
      }
    });

    expect(events).toEqual(expect.arrayContaining(["before_search", "before_card_click", "after_detail_read", "after_scroll"]));
  });
});

class FakeSearchPage {
  gotoCalls: string[] = [];
  cardClickCount = 0;
  private currentUrl = "";

  async goto(url: string) {
    this.gotoCalls.push(url);
    this.currentUrl = url;
  }

  async waitForTimeout() {}

  async title() {
    return "AI 产品经理 校招 JD - 小红书搜索";
  }

  url() {
    return this.currentUrl;
  }

  locator(selector: string) {
    if (selector === "body") {
      return {
        innerText: async () => "搜索结果"
      };
    }

    if (selector === ".note-item:visible") {
      return new FakeCardsLocator(this);
    }

    throw new Error(`Unexpected locator: ${selector}`);
  }

  async evaluate() {
    return {
      title: "AI 产品经理JD拆解",
      description: "正文第一段",
      authorName: "Sine的大喇叭",
      authorProfileUrl: "https://www.xiaohongshu.com/user/profile/user123",
      publishTime: "2026-04-29",
      bodyText: "正文第二段",
      tags: ["#AI产品经理", "#校招"]
    };
  }

  keyboard = {
    press: async () => {}
  };

  mouse = {
    wheel: async () => {}
  };

  async goBack() {
    this.currentUrl = this.gotoCalls.at(-1) ?? "";
  }

  async close() {}

  openDetail() {
    this.cardClickCount += 1;
    this.currentUrl = "https://www.xiaohongshu.com/explore/note123?xsec_source=pc_search";
  }
}

class FakeCardsLocator {
  constructor(private readonly page: FakeSearchPage) {}

  async count() {
    return 1;
  }

  nth() {
    return new FakeCardLocator(this.page);
  }
}

class FakeCardLocator {
  constructor(private readonly page: FakeSearchPage) {}

  locator() {
    return {
      first: () => ({
        getAttribute: async () => "/explore/note123?xsec_token=from-card"
      })
    };
  }

  async scrollIntoViewIfNeeded() {}

  async click() {
    this.page.openDetail();
  }
}
