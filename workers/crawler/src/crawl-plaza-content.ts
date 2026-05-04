import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { scrapeXhsNotesFromSearchCards, type XhsSearchCardScrapeResult } from "./xhs-search-cards";

const repoRoot = resolveRepoRoot();
const outputPath = path.join(repoRoot, "workers", "crawler", "output", "plaza-resume-content-50.json");
const storageStatePath = path.join(repoRoot, "workers", "crawler", ".cache", "xiaohongshu-storage-state.json");

const queries = [
  "AI\u4ea7\u54c1\u7ecf\u7406 \u7b80\u5386",
  "AI \u4ea7\u54c1\u7ecf\u7406 \u7b80\u5386\u4f18\u5316",
  "\u4ea7\u54c1\u7ecf\u7406 \u7b80\u5386 \u6821\u62db",
  "\u4ea7\u54c1\u7ecf\u7406 \u7b80\u5386 \u5b9e\u4e60",
  "\u5927\u5382 \u4ea7\u54c1\u7ecf\u7406 \u7b80\u5386",
  "\u6821\u62db \u4ea7\u54c1\u7ecf\u7406 \u7b80\u5386",
  "AI\u4ea7\u54c1\u7ecf\u7406 \u6c42\u804c\u7ecf\u9a8c",
  "AI\u4ea7\u54c1\u7ecf\u7406 \u9762\u8bd5\u7ecf\u9a8c",
  "\u4ea7\u54c1\u7ecf\u7406 \u7b80\u5386 JD",
  "\u4e92\u8054\u7f51\u6c42\u804c \u7b80\u5386 \u4ea7\u54c1\u7ecf\u7406"
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
        target: "resume-plaza-content",
        crawlMethod: "xhs-search-card-click",
        riskControls: {
          directNoteGotoDisabled: true,
          writeToDatabase: false,
          searchSettleSeconds: 8,
          detailReadSeconds: 8,
          betweenClicksSeconds: 8
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
const seen = new Set<string>();
const seenFinalBaseUrls = new Set<string>();
let rejectedCount = 0;

ensureDirectory(outputPath);
if (fs.existsSync(outputPath)) {
  const existing = JSON.parse(fs.readFileSync(outputPath, "utf8")) as { records?: PlazaContentRecord[] };
  for (const record of existing.records ?? []) {
    const finalBaseUrl = record.finalUrl.split("?")[0];
    if (seen.has(record.noteId) || seenFinalBaseUrls.has(finalBaseUrl)) {
      continue;
    }

    seen.add(record.noteId);
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

try {
  const scrape = await scrapeXhsNotesFromSearchCards(context, queries, 70, {
    maxQueries: queries.length,
    searchSettleSeconds: 8,
    detailReadSeconds: 8,
    betweenClicksSeconds: 8,
    chooseCardIndexes: (count) => Array.from({ length: count }, (_, index) => index),
    onResult: (item) => {
      if (records.length >= 50) return;

      const finalBaseUrl = item.finalUrl.split("?")[0];
      if (!isComplete(item) || seen.has(item.noteId) || seenFinalBaseUrls.has(finalBaseUrl)) {
        rejectedCount += 1;
        return;
      }

      seen.add(item.noteId);
      seenFinalBaseUrls.add(finalBaseUrl);
      records.push(toRecord(item));
      writeSnapshot(records, rejectedCount, null);
      console.log(`kept ${records.length}/50 ${item.title}`);
    }
  });

  writeSnapshot(records, rejectedCount, scrape.blockedReason);
  if (records.length < 50) {
    process.exitCode = 1;
    console.log(`Only collected ${records.length} complete records. Rejected ${rejectedCount}.`);
  } else {
    console.log(`Collected 50 complete records at ${outputPath}`);
  }
} finally {
  await context.close();
  await browser.close();
}
