# Xiaohongshu Real Job Seeding Plan

## Status

- Review lenses applied:
  - `office-hours`
  - `plan-eng-review`
- Status: READY TO IMPLEMENT WITH LOGIN-STATE DEPENDENCY
- Date: 2026-04-23

## Objective

Use Playwright to collect the first 50 Xiaohongshu role leads for this product's Phase 1 hero role, then seed them into the recommendation corpus.

Success means:

1. every retained record points to a real Xiaohongshu post URL
2. every retained record carries enough evidence to qualify as a high-confidence role lead
3. the retained records can be written into `companies`, `job_leads`, and `xhs_posts`

## Office-Hours Call

The user does not need "50 officially verified jobs."
They need "50 high-confidence role leads that feel real, are traceable, and can jump back to the source."

That matters because Phase 1 product language explicitly forbids claiming:

- verified real job
- official company hiring insight

So this plan defines "real enough for Phase 1" as:

1. the source URL is a real Xiaohongshu post URL
2. the post is accessible at crawl time in a trusted logged-in browser context
3. the title/body/tags clearly show:
   - a Phase 1 company match
   - AI product manager role intent
   - hiring intent such as `校招` / `实习` / `社招` / `内推` / `JD` / `岗位`
4. the record keeps the source URL for later QR jump and manual review

## What Already Exists

- `workers/crawler/src/normalize.ts`
  Reuses the existing Xiaohongshu normalization direction.
- `workers/crawler/src/extract.ts`
  Reuses the existing "extract evidence and preserve source URL" direction.
- `supabase/migrations/0001_phase1_baseline.sql`
  Already provides `companies`, `job_leads`, and `xhs_posts`.
- `docs/data/knowledge-base-strategy.md`
  Already defines the storage layers and the "high-confidence role lead" positioning.
- `docs/data/compliance-and-risk.md`
  Already locks the honesty boundary: no "verified real job" claim.

## Eng Review

### Architecture Choice

Use a four-step batch pipeline:

```text
keywords + tags
  -> external search discovery (DuckDuckGo HTML)
  -> Playwright note revisit with login state
  -> high-confidence lead filter
  -> Supabase upsert
```

Why this shape:

- Xiaohongshu site search is login-gated and can return risk blocks
- direct note URLs are still the right source of truth once a trusted login state exists
- this keeps the anti-fragile part small: only the "note revisit" step depends on site DOM details

### Data Flow

```text
query matrix
  -> discovered URLs
  -> scrape result
  -> blocker check
  -> lead mapping
  -> DB write
```

### Failure Modes

| Codepath | Realistic failure | Test | Handling | User impact |
|----------|-------------------|------|----------|-------------|
| discovery | search engine returns zero Xiaohongshu URLs | yes | report + stop early | visible |
| note revisit | login wall or access restriction | partial | blocker reason in crawl report | visible |
| lead mapping | post is generic interview content, not a role lead | yes | reject without DB write | visible |
| DB write | Supabase credentials missing or write fails | no | throw and stop | visible |

Critical gap today:

- real Xiaohongshu access still depends on a trusted logged-in browser state

## NOT in Scope

- OCR extraction in this first seeding loop
  The first bottleneck is URL access and evidence quality, not image parsing.
- LLM-based post summarization
  Rule-based gating is enough for the first 50 leads and keeps hallucination risk down.
- user-specific `recommendation_results` writes
  No target user/session was supplied, so this run seeds the shared role-lead corpus first.
- official job verification
  Explicitly out of Phase 1 product scope.

## Acceptance Gate For Retained Records

Retain only if all conditions pass:

1. source URL is a Xiaohongshu `explore` URL
2. page stays on note context after Playwright visit
3. no access blocker text such as `安全限制` or `登录后查看`
4. text matches one Phase 1 company
5. text matches AI PM role keywords
6. text matches hiring-signal keywords
7. text yields at least 2 extracted requirement signals
8. confidence score is at least 80

## Parallelization

Sequential implementation, no parallelization opportunity.

The write path is shared and Xiaohongshu scraping is bottlenecked by one browser context plus one shared DB target.

## Final Call

This is the right first loop:

- honest about what "real" means in Phase 1
- small enough to build quickly
- traceable enough to support recommendation, plaza, and QR jump later

The only real blocker left is login state, not architecture.
