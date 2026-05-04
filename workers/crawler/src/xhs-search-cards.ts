import { detectSearchAccessBlocker } from "./access";
import { detectAccessBlocker } from "./ingestion";

type XhsSearchPage = {
  goto: (url: string, options: { waitUntil: "domcontentloaded"; timeout: number }) => Promise<unknown>;
  waitForTimeout: (timeout: number) => Promise<unknown>;
  locator: (selector: string) => any;
  title: () => Promise<string>;
  url: () => string;
  keyboard: { press: (key: string) => Promise<unknown> };
  goBack: (options: { waitUntil: "domcontentloaded"; timeout: number }) => Promise<unknown>;
  mouse: { wheel: (deltaX: number, deltaY: number) => Promise<unknown> };
  evaluate: (fn: string | (() => unknown)) => Promise<unknown>;
  close: () => Promise<unknown>;
};

type XhsSearchContext = {
  newPage: () => Promise<XhsSearchPage>;
};

export type XhsSearchCardScrapeOptions = {
  maxQueries: number;
  searchSettleSeconds: number;
  detailReadSeconds: number;
  betweenClicksSeconds: number;
  chooseCardIndexes?: (count: number) => number[];
  onResult?: (result: XhsSearchCardScrapeResult) => void;
  humanPacing?: (event: "before_search" | "before_card_click" | "after_detail_read" | "after_scroll") => Promise<void>;
};

export type XhsSearchCardScrapeResult = {
  noteId: string;
  url: string;
  finalUrl: string;
  title: string;
  body: string;
  authorName: string;
  authorProfileUrl: string;
  publishTime: string;
  tags: string[];
  validated: boolean;
  blocker: string | null;
};

export type XhsPagePayload = {
  title: string;
  description: string;
  authorName: string;
  authorProfileUrl: string;
  publishTime: string;
  bodyText: string;
  tags: string[];
};

export function toXhsSearchText(query: string) {
  return query.replace(/^site:xiaohongshu\.com\/explore\s+/, "").trim();
}

export function buildXhsSearchUrl(query: string) {
  return `https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(toXhsSearchText(query))}`;
}

export function extractXhsNoteId(url: string) {
  const match = url.match(/\/explore\/([^/?#]+)/);
  return match?.[1] ?? "";
}

export function toAbsoluteXhsUrl(href: string) {
  try {
    return new URL(href, "https://www.xiaohongshu.com").toString();
  } catch {
    return href;
  }
}

export function shuffledIndexes(count: number) {
  return Array.from({ length: count }, (_, index) => index).sort(() => Math.random() - 0.5);
}

export async function closeXhsSearchDetail(
  page: Pick<XhsSearchPage, "keyboard" | "waitForTimeout" | "url" | "goBack">,
  searchUrl: string
) {
  await page.keyboard.press("Escape").catch(() => undefined);
  await page.waitForTimeout(800);

  if (page.url() !== searchUrl && page.url().includes("/explore/")) {
    await page.goBack({ waitUntil: "domcontentloaded", timeout: 15000 }).catch(() => undefined);
    await page.waitForTimeout(1200);
  }
}

export async function extractXhsPagePayload(page: Pick<XhsSearchPage, "evaluate">) {
  return (await page.evaluate(`
    (() => {
      const toAbsoluteUrl = (href) => {
        if (!href) return "";
        try {
          return new URL(href, location.href).toString();
        } catch {
          return href;
        }
      };

      const readMeta = (attribute, value) =>
        document.querySelector('meta[' + attribute + '="' + value + '"]')?.getAttribute("content")?.trim() || "";

      const readText = (selectors) => {
        for (const selector of selectors) {
          const node = document.querySelector(selector);
          const text = node?.textContent?.trim();
          if (text) return text;
        }
        return "";
      };

      const bodyText = document.body?.innerText?.trim() || "";
      const profileAnchor =
        document.querySelector('.author-container a[href*="/user/profile/"]') ||
        document.querySelector('.author-wrapper a[href*="/user/profile/"]') ||
        document.querySelector('.note-content a[href*="/user/profile/"]') ||
        document.querySelector('a[href*="/user/profile/"]');
      const tagTexts = Array.from(document.querySelectorAll("a, span, div"))
        .map((node) => node.textContent?.trim() || "")
        .filter(Boolean)
        .filter((text) => /^#/.test(text) || /\\u6821\\u62db|\\u5b9e\\u4e60|\\u793e\\u62db|\\u5185\\u63a8|\\u5c97\\u4f4d|JD|AI\\u4ea7\\u54c1\\u7ecf\\u7406|AIGC|\\u5927\\u6a21\\u578b/.test(text))
        .slice(0, 24);
      const authorName =
        readText([".author-container .username", ".author-wrapper .name", ".user-name", "[data-v-author]"]) ||
        profileAnchor?.textContent?.trim() ||
        "";

      return {
        title:
          readText(["#detail-title", ".note-content .title", "h1", "title"]) ||
          readMeta("property", "og:title") ||
          document.title ||
          "",
        description:
          readText(["#detail-desc", ".note-content .desc", "main"]) ||
          readMeta("name", "description") ||
          readMeta("property", "og:description") ||
          "",
        authorName,
        authorProfileUrl: toAbsoluteUrl(profileAnchor?.getAttribute("href") || ""),
        publishTime: readText([".note-content .date", ".publish-date", "time"]),
        bodyText,
        tags: Array.from(new Set(tagTexts))
      };
    })()
  `)) as XhsPagePayload;
}

export async function scrapeXhsNotesFromSearchCards(
  context: XhsSearchContext,
  queries: string[],
  limit: number,
  options: XhsSearchCardScrapeOptions
) {
  const results: XhsSearchCardScrapeResult[] = [];
  const seen = new Set<string>();
  const page = await context.newPage();
  let queryCount = 0;
  let blockedReason: string | null = null;
  const chooseCardIndexes = options.chooseCardIndexes ?? shuffledIndexes;

  try {
    for (const query of queries) {
      if (results.length >= limit || queryCount >= options.maxQueries) break;

      queryCount += 1;
      const searchUrl = buildXhsSearchUrl(query);

      // This crawler intentionally opens only search pages directly. Detail pages
      // must be entered by clicking visible cards, otherwise XHS often redirects
      // to captcha/discovery pages and loses note body/profile fields.
      await options.humanPacing?.("before_search");
      await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
      await page.waitForTimeout(options.searchSettleSeconds * 1000);

      const searchBody = await page.locator("body").innerText().catch(() => "");
      const searchBlocker = detectSearchAccessBlocker({
        title: await page.title().catch(() => ""),
        body: searchBody
      });
      if (searchBlocker) {
        blockedReason = searchBlocker;
        break;
      }

      for (let scrollRound = 0; scrollRound < 5 && results.length < limit; scrollRound += 1) {
        const cards = page.locator(".note-item:visible");
        const count = await cards.count().catch(() => 0);

        for (const index of chooseCardIndexes(count)) {
          if (results.length >= limit) break;

          const card = cards.nth(index);
          const rawHref = await card.locator('a[href*="/explore/"]').first().getAttribute("href").catch(() => null);
          if (!rawHref) continue;

          const url = toAbsoluteXhsUrl(rawHref);
          const noteId = extractXhsNoteId(url);
          if (!noteId || seen.has(noteId)) continue;

          seen.add(noteId);
          try {
            await card.scrollIntoViewIfNeeded({ timeout: 5000 });
            await page.waitForTimeout(options.betweenClicksSeconds * 1000);
            await options.humanPacing?.("before_card_click");
            await card.click({ timeout: 10000 });
            await page.waitForTimeout(options.detailReadSeconds * 1000);
            await options.humanPacing?.("after_detail_read");

            const finalUrl = page.url();
            const payload = await extractXhsPagePayload(page);
            const body = [payload.description, payload.bodyText].filter(Boolean).join(" ");
            const blocker = detectAccessBlocker({
              finalUrl: finalUrl.includes("/explore/") ? finalUrl : url,
              title: payload.title,
              body
            });

            results.push({
              noteId,
              url,
              finalUrl,
              title: payload.title,
              body,
              authorName: payload.authorName,
              authorProfileUrl: payload.authorProfileUrl,
              publishTime: payload.publishTime,
              tags: payload.tags,
              validated: blocker === null,
              blocker
            });
            options.onResult?.(results[results.length - 1]);
          } catch (error) {
            results.push({
              noteId,
              url,
              finalUrl: page.url(),
              title: "",
              body: error instanceof Error ? error.message : String(error),
              authorName: "",
              authorProfileUrl: "",
              publishTime: "",
              tags: [],
              validated: false,
              blocker: "click_failed"
            });
            options.onResult?.(results[results.length - 1]);
          } finally {
            await closeXhsSearchDetail(page, searchUrl);
          }
        }

        await page.mouse.wheel(0, 2200);
        await page.waitForTimeout(options.searchSettleSeconds * 1000);
        await options.humanPacing?.("after_scroll");
      }
    }

    return { results, blockedReason };
  } finally {
    await page.close();
  }
}
