import fs from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { createClient } from "@supabase/supabase-js";
import { chromium, type Browser, type BrowserContext } from "playwright";
import {
  buildDiscoveryQueries,
  buildLeadIngestionRecord,
  phase1Companies
} from "./index";
import { scrapeXhsNotesFromSearchCards } from "./xhs-search-cards";

type CliOptions = {
  limit: number;
  headless: boolean;
  write: boolean;
  storageStatePath: string;
  userDataDir?: string;
  captureLoginState: boolean;
  browserChannel: "msedge" | "chrome";
  keywords: string[];
  tags: string[];
  companies: string[];
  reportPath: string;
  loginWaitSeconds: number;
  maxQueries: number;
  searchSettleSeconds: number;
  detailReadSeconds: number;
  betweenClicksSeconds: number;
  rawSample: boolean;
  sampleQueries: string[];
};

function parseCsvFlag(raw: string | undefined, fallback: string[]) {
  if (!raw) return fallback;
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseBoolean(raw: string | undefined, fallback: boolean) {
  if (raw === undefined) return fallback;
  return raw !== "false";
}

function parseArgs(argv: string[]): CliOptions {
  const repoRoot = resolveRepoRoot();
  const values = new Map<string, string>();

  for (const item of argv) {
    if (!item.startsWith("--")) continue;
    const [rawKey, rawValue] = item.slice(2).split("=", 2);
    values.set(rawKey, rawValue ?? "true");
  }

  return {
    limit: Number(values.get("limit") ?? 50),
    headless: parseBoolean(values.get("headless"), false),
    write: parseBoolean(values.get("write"), false),
    storageStatePath:
      values.get("storage-state") ??
      path.join(repoRoot, "workers", "crawler", ".cache", "xiaohongshu-storage-state.json"),
    userDataDir: values.get("user-data-dir"),
    captureLoginState: parseBoolean(values.get("capture-login-state"), false),
    browserChannel: values.get("browser") === "chrome" ? "chrome" : "msedge",
    keywords: parseCsvFlag(values.get("keywords"), ["AI 产品经理", "AIGC 产品经理", "大模型产品经理", "AI PM"]),
    tags: parseCsvFlag(values.get("tags"), ["校招", "实习", "社招", "内推", "JD", "岗位"]),
    companies: parseCsvFlag(
      values.get("companies"),
      phase1Companies.map((company) => company.name)
    ),
    reportPath:
      values.get("report") ??
      path.join(repoRoot, "workers", "crawler", "output", "latest-xhs-job-crawl.json"),
    loginWaitSeconds: Number(values.get("login-wait-seconds") ?? 0),
    maxQueries: Number(values.get("max-queries") ?? 4),
    searchSettleSeconds: Number(values.get("search-settle-seconds") ?? 8),
    detailReadSeconds: Number(values.get("detail-read-seconds") ?? 8),
    betweenClicksSeconds: Number(values.get("between-clicks-seconds") ?? 12),
    rawSample: parseBoolean(values.get("raw-sample"), false),
    sampleQueries: parseCsvFlag(values.get("queries") ?? values.get("query"), ["AI"])
  };
}

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

function loadLocalEnv() {
  const repoRoot = resolveRepoRoot();
  const envFiles = [path.join(repoRoot, ".env.local"), path.join(repoRoot, "apps", "web", ".env.local")];

  for (const file of envFiles) {
    if (!fs.existsSync(file)) continue;

    const content = fs.readFileSync(file, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2];
      }
    }
  }
}

function ensureDirectory(targetPath: string) {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
}

async function waitForEnter() {
  const rl = readline.createInterface({ input, output });
  try {
    await rl.question("瀹屾垚鐧诲綍鍚庢寜鍥炶溅缁х画...");
  } finally {
    rl.close();
  }
}

async function createBrowser(options: CliOptions): Promise<{ browser: Browser | null; context: BrowserContext }> {
  if (options.userDataDir) {
    const context = await chromium.launchPersistentContext(options.userDataDir, {
      headless: options.headless,
      channel: options.browserChannel,
      viewport: { width: 1440, height: 1600 }
    });
    return { browser: null, context };
  }

  const browser = await chromium.launch({
    headless: options.headless,
    channel: options.browserChannel
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1600 },
    storageState: fs.existsSync(options.storageStatePath) ? options.storageStatePath : undefined
  });

  return { browser, context };
}

async function captureLoginState(options: CliOptions) {
  ensureDirectory(options.storageStatePath);
  const { browser, context } = await createBrowser({ ...options, headless: false });
  const page = await context.newPage();

  try {
    await page.goto("https://www.xiaohongshu.com/", { waitUntil: "domcontentloaded" });
    console.log("已打开小红书首页，请在浏览器中扫码或完成登录。");
    if (options.loginWaitSeconds > 0) {
      console.log(`将在 ${options.loginWaitSeconds} 秒后自动保存登录状态。`);
      await page.waitForTimeout(options.loginWaitSeconds * 1000);
    } else {
      await waitForEnter();
    }
    await context.storageState({ path: options.storageStatePath });
    console.log(`已保存登录状态到 ${options.storageStatePath}`);
  } finally {
    await page.close();
    await context.close();
    await browser?.close();
  }
}

function createSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) throw new Error("Missing Supabase credentials in .env.local");

  return createClient(url, key, {
    auth: {
      persistSession: false
    }
  });
}

async function writeToSupabase(records: ReturnType<typeof buildLeadIngestionRecord>[]) {
  const validRecords = records.filter((record): record is NonNullable<typeof record> => record !== null);
  if (validRecords.length === 0) return;

  const client = createSupabaseClient();
  const companies = validRecords.map((record) => record.company);
  const leads = validRecords.map((record) => ({
    id: record.lead.id,
    company_id: record.lead.companyId,
    role_name: record.lead.roleName,
    title: record.lead.title,
    city: record.lead.city,
    seniority: record.lead.seniority,
    source_confidence: record.lead.sourceConfidence,
    summary: record.lead.summary,
    extracted_requirements: record.lead.extractedRequirements,
    recommendation_reasons: record.lead.recommendationReasons,
    risk_reminder: record.lead.riskReminder,
    salary_band: record.lead.salaryBand
  }));
  const posts = validRecords.map((record) => ({
    id: record.post.id,
    company_id: record.post.companyId,
    role_id: record.post.roleId,
    title: record.post.title,
    excerpt: record.post.excerpt,
    source_url: record.post.sourceUrl,
    publish_time: record.post.publishTime.slice(0, 10),
    author_name: record.post.authorName,
    topic: record.post.topic,
    stage: record.post.stage,
    ocr_text: record.post.ocrText,
    confidence_label: record.post.confidenceLabel
  }));

  const companyResult = await client.from("companies").upsert(companies, { onConflict: "id" });
  if (companyResult.error) throw companyResult.error;

  const leadResult = await client.from("job_leads").upsert(leads, { onConflict: "id" });
  if (leadResult.error) throw leadResult.error;

  const postResult = await client.from("xhs_posts").upsert(posts, { onConflict: "id" });
  if (postResult.error) throw postResult.error;
}

async function main() {
  loadLocalEnv();
  const options = parseArgs(process.argv.slice(2));

  if (options.captureLoginState) {
    await captureLoginState(options);
    return;
  }

  const queries = options.rawSample
    ? options.sampleQueries
    : buildDiscoveryQueries({
        companies: options.companies,
        keywords: options.keywords,
        tags: options.tags
      });

  const report = {
    generatedAt: new Date().toISOString(),
    options: {
      limit: options.limit,
      headless: options.headless,
      write: options.write,
      browserChannel: options.browserChannel,
      storageStatePath: options.storageStatePath,
      userDataDir: options.userDataDir,
      maxQueries: options.maxQueries,
      searchSettleSeconds: options.searchSettleSeconds,
      detailReadSeconds: options.detailReadSeconds,
      betweenClicksSeconds: options.betweenClicksSeconds,
      rawSample: options.rawSample,
      sampleQueries: options.sampleQueries,
      directNoteGotoDisabled: true
    },
    discoverySource: "xhs-search-card-click",
    discoveredCount: 0,
    keptCount: 0,
    rejectedCount: 0,
    rawSamples: [] as Array<{
      noteId: string;
      sourceUrl: string;
      finalUrl: string;
      title: string;
      body: string;
      excerpt: string;
      authorName: string;
      authorProfileUrl: string;
      publishTime: string;
      blocker: string | null;
    }>,
    kept: [] as Array<{ url: string; leadId: string; companyId: string; confidence: number }>,
    rejected: [] as Array<{ url: string; reason: string }>,
    blocked: [] as Array<{ url: string; blocker: string }>
  };

  const { browser, context } = await createBrowser(options);
  const records: Array<NonNullable<ReturnType<typeof buildLeadIngestionRecord>>> = [];

  try {
    const searchCardScrape = await scrapeXhsNotesFromSearchCards(context, queries, options.limit, options);

    if (searchCardScrape.blockedReason) {
      report.blocked.push({
        url: "https://www.xiaohongshu.com/search_result",
        blocker: searchCardScrape.blockedReason
      });
    }

    report.discoveredCount = searchCardScrape.results.length;

    if (options.rawSample) {
      report.rawSamples = searchCardScrape.results.map((item) => ({
        noteId: item.noteId,
        sourceUrl: item.url,
        finalUrl: item.finalUrl,
        title: item.title,
        body: item.body,
        excerpt: item.body.slice(0, 180),
        authorName: item.authorName,
        authorProfileUrl: item.authorProfileUrl,
        publishTime: item.publishTime,
        blocker: item.blocker
      }));
    } else {
      for (const scraped of searchCardScrape.results) {
        if (records.length >= options.limit) break;

        if (!scraped.validated || !scraped.noteId) {
          const blocker = scraped.blocker ?? "unknown_blocker";
          report.blocked.push({ url: scraped.url, blocker });
          continue;
        }

        const record = buildLeadIngestionRecord(scraped);
        if (!record) {
          report.rejected.push({ url: scraped.url, reason: "not_a_high_confidence_job_lead" });
          continue;
        }

        records.push(record);
        report.kept.push({
          url: scraped.url,
          leadId: record.lead.id,
          companyId: record.company.id,
          confidence: record.lead.sourceConfidence
        });
      }
    }
  } finally {
    await context.close();
    await browser?.close();
  }

  report.keptCount = report.kept.length;
  report.rejectedCount = report.rejected.length + report.blocked.length;

  ensureDirectory(options.reportPath);
  fs.writeFileSync(options.reportPath, JSON.stringify(report, null, 2), "utf8");

  if (!options.rawSample && options.write && records.length > 0) {
    await writeToSupabase(records);
  }

  console.log(`发现候选笔记卡片: ${report.discoveredCount}`);
  console.log(`原始样本: ${report.rawSamples.length}`);
  console.log(`保留高置信岗位线索: ${report.keptCount}`);
  console.log(`阻塞或拒绝: ${report.rejectedCount}`);
  console.log(`报告已写入: ${options.reportPath}`);

  if (report.discoveredCount === 0) {
    process.exitCode = 1;
    console.log("当前没有抓到可见笔记卡片。请确认登录后的搜索页能正常显示笔记流。");
  }
}

await main();
