import fs from "node:fs";
import path from "node:path";
import { chromium, type Page } from "playwright";
import { scrapeXhsNotesFromSearchCards, type XhsSearchCardScrapeResult } from "./xhs-search-cards";

const repoRoot = resolveRepoRoot();
const outputPath = path.join(repoRoot, "workers", "crawler", "output", "plaza-backend-ai-content-30.json");
const storageStatePath = path.join(repoRoot, "workers", "crawler", ".cache", "xiaohongshu-storage-state.json");

const targetCount = 30;
const queries = [
  "AI\u540e\u7aef\u5f00\u53d1 \u7b80\u5386",
  "\u540e\u7aef\u5f00\u53d1\u5de5\u7a0b\u5e08 AI \u7b80\u5386",
  "\u5927\u6a21\u578b \u540e\u7aef\u5f00\u53d1 \u7b80\u5386",
  "AI\u5de5\u7a0b\u5e08 \u540e\u7aef \u6c42\u804c",
  "LLM \u540e\u7aef\u5f00\u53d1 \u9762\u8bd5\u7ecf\u9a8c",
  "RAG \u540e\u7aef\u5f00\u53d1 \u9879\u76ee\u7ecf\u9a8c",
  "\u540e\u7aef\u5f00\u53d1 AI \u5b9e\u4e60",
  "\u540e\u7aef\u5f00\u53d1 \u5927\u6a21\u578b \u6821\u62db",
  "AI\u5e94\u7528\u5f00\u53d1 \u540e\u7aef \u9762\u8bd5",
  "\u7b97\u6cd5\u5de5\u7a0b \u540e\u7aef\u5f00\u53d1 AI"
];

type PlazaContentRecord = {
  noteId: string;
  sourceUrl: string;
  finalUrl: string;
  title: string;
  username: string;
  profile: string;
  text: string;
  publishTime: string;
  tags: string[];
};

function resolveRepoRoot() {
  let current = process.cwd();

  while (true) {
    if (fs.existsSync(path.join(current, "package.json")) && fs.existsSync(path.join(current, "AGENTS.md"))) {
      return current;
    }

    const parent = path.dirname(current);
    if (parent === current) return process.cwd();
    current = parent;
  }
}

function ensureDirectory(filePath: string) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function humanPacing(page: Page, keptCount: () => number, event: string) {
  const waitMs =
    event === "before_search"
      ? randomInt(12_000, 22_000)
      : event === "before_card_click"
        ? randomInt(9_000, 18_000)
        : event === "after_detail_read"
          ? randomInt(6_000, 14_000)
          : randomInt(14_000, 26_000);

  await sleep(waitMs);

  if (event === "before_card_click" || event === "after_scroll") {
    await page.mouse.wheel(0, randomInt(180, 760)).catch(() => undefined);
    await sleep(randomInt(900, 2_800));
  }

  if (keptCount() > 0 && keptCount() % 6 === 0 && event === "after_detail_read") {
    await sleep(randomInt(90_000, 150_000));
  }
}

function isComplete(item: XhsSearchCardScrapeResult) {
  return (
    item.validated &&
    item.blocker === null &&
    item.finalUrl.includes("/explore/") &&
    item.title.trim().length > 0 &&
    item.authorName.trim().length > 0 &&
    item.authorProfileUrl.includes("/user/profile/") &&
    item.body.trim().length >= 20
  );
}

function toRecord(item: XhsSearchCardScrapeResult): PlazaContentRecord {
  return {
    noteId: item.noteId,
    sourceUrl: item.url,
    finalUrl: item.finalUrl,
    title: item.title.trim(),
    username: item.authorName.trim(),
    profile: item.authorProfileUrl,
    text: item.body.replace(/\s{3,}/g, " ").trim(),
    publishTime: item.publishTime.trim(),
    tags: item.tags
  };
}

function writeSnapshot(records: PlazaContentRecord[], rejectedCount: number, blockedReason: string | null) {
  ensureDirectory(outputPath);
  fs.writeFileSync(
    outputPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        target: "backend-ai-engineer-plaza-content",
        crawlMethod: "xhs-search-card-click",
        riskControls: {
          directNoteGotoDisabled: true,
          writeToDatabase: false,
          searchSettleSeconds: 14,
          detailReadSeconds: 12,
          betweenClicksSeconds: 14,
          randomizedHumanPacing: true,
          longPauseEveryKept: 6,
          stopOnRiskOrCaptcha: true
        },
        queries,
        count: records.length,
        rejectedCount,
        blockedReason,
        records
      },
      null,
      2
    ),
    "utf8"
  );
}

const records: PlazaContentRecord[] = [];
const seenNoteIds = new Set<string>();
const seenFinalBaseUrls = new Set<string>();
let rejectedCount = 0;

ensureDirectory(outputPath);
if (fs.existsSync(outputPath)) {
  const existing = JSON.parse(fs.readFileSync(outputPath, "utf8")) as { records?: PlazaContentRecord[] };
  for (const record of existing.records ?? []) {
    const finalBaseUrl = record.finalUrl.split("?")[0];
    if (seenNoteIds.has(record.noteId) || seenFinalBaseUrls.has(finalBaseUrl)) continue;
    seenNoteIds.add(record.noteId);
    seenFinalBaseUrls.add(finalBaseUrl);
    records.push(record);
  }
}
writeSnapshot(records, rejectedCount, null);

const browser = await chromium.launch({ channel: "msedge", headless: false });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1600 },
  storageState: fs.existsSync(storageStatePath) ? storageStatePath : undefined
});
const pacingPage = await context.newPage();
await pacingPage.close();

try {
  const scrape = await scrapeXhsNotesFromSearchCards(context, queries, 45, {
    maxQueries: queries.length,
    searchSettleSeconds: 14,
    detailReadSeconds: 12,
    betweenClicksSeconds: 14,
    chooseCardIndexes: (count) => Array.from({ length: count }, (_, index) => index),
    humanPacing: async (event) => {
      const pages = context.pages();
      await humanPacing(pages[pages.length - 1] as Page, () => records.length, event);
    },
    onResult: (item) => {
      if (records.length >= targetCount) return;

      const finalBaseUrl = item.finalUrl.split("?")[0];
      if (!isComplete(item) || seenNoteIds.has(item.noteId) || seenFinalBaseUrls.has(finalBaseUrl)) {
        rejectedCount += 1;
        return;
      }

      seenNoteIds.add(item.noteId);
      seenFinalBaseUrls.add(finalBaseUrl);
      records.push(toRecord(item));
      writeSnapshot(records, rejectedCount, null);
      console.log(`kept ${records.length}/${targetCount} ${item.title}`);
    }
  });

  writeSnapshot(records, rejectedCount, scrape.blockedReason);
  if (scrape.blockedReason) {
    process.exitCode = 2;
    console.log(`Stopped because Xiaohongshu reported risk: ${scrape.blockedReason}`);
  } else if (records.length < targetCount) {
    process.exitCode = 1;
    console.log(`Only collected ${records.length} complete records. Rejected ${rejectedCount}.`);
  } else {
    console.log(`Collected ${targetCount} complete records at ${outputPath}`);
  }
} finally {
  await context.close();
  await browser.close();
}
