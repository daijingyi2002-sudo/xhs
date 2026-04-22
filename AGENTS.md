# Project-Specific Rules

> Universal workflow rules and quality gates are inherited from Lotus global rules.
> This file contains only project-specific product, data, AI, and execution constraints.
> Official gstack is the workflow source of truth; Lotus is used for rule injection and project template layering.

## Project Identity

- Working name: 求职 Agent / 面试知识库平台
- Product type: 作品集级 AI 求职辅导 Web 产品
- Primary users: 校招 / 应届生
- Primary language: Simplified Chinese first
- Primary market: 中国互联网与 AI 相关岗位
- Phase 1 hero role: AI 产品经理

## North Star

- 让用户进入网页后的第一分钟就感受到“被理解、被引导、被匹配”，而不是先填表
- 用 Agent 托管式咨询、岗位线索推荐、面试经验知识库、模拟面试和简历优化，形成完整求职闭环
- Phase 1 的作品集展示重点优先级为:
  - AI agent 设计能力与状态机设计能力
  - 可运行的求职闭环
  - 数据工程与知识库能力

## Hard Gates Before Code

- Before any business code is written, produce and approve:
  - `docs/product/brief.md`
  - `docs/product/user-journeys.md`
  - `docs/architecture/system-design.md`
  - `docs/data/knowledge-base-strategy.md`
  - `docs/data/compliance-and-risk.md`
  - `docs/evals/acceptance-metrics.md`
- Mandatory gstack flow before code:
  - `/office-hours`
  - `/plan-ceo-review`
  - `/plan-eng-review`
- Any user-facing page, interaction model, or design system decision must also pass:
  - `/plan-design-review`
- If the above documents and reviews are not complete, do not create:
  - app routes
  - UI components
  - API handlers
  - crawler jobs
  - database schema migrations
  - LangGraph workflows
  - recommendation or scoring logic

## Product Scope

### 1. Homepage Entry

- The homepage must be agent-first, not form-first
- The homepage must show:
  - hosted consultation chat entry
  - optional resume upload entry
- Resume upload is encouraged but not required
- The main user journey is:
  - upload resume
  - agent consultation
  - top 5 recommended roles
  - fit analysis
  - mock interview
  - resume optimization

### 2. Hosted Consultation

- The first interaction is fully agent-led
- The agent should progressively clarify:
  - target city
  - target company preference
  - internship / project history
  - AI / LLM understanding
  - product methodology
  - data analysis ability
  - user research ability
  - resume strengths and gaps
- Lack of a clear job direction is not a blocker
- The agent must update the candidate profile continuously from conversation history and uploaded resume

### 3. Role Recommendation

- Phase 1 only supports one hero role:
  - AI 产品经理
- Recommendation list size is fixed at:
  - Top 5
- Recommendation logic must be hybrid:
  - explicit rule weights
  - embedding retrieval
- Every recommendation card must show:
  - match score
  - 3 match reasons
  - 1 risk reminder

### 4. Job Pool Positioning

- Do not describe the phase 1 pool as “已验证真实岗位”
- Phase 1 wording must be:
  - 高置信岗位线索
- Current pipeline is:
  - Xiaohongshu post provides role lead
  - crawler ingests post content and metadata
  - LLM reviews content logic and extracts structured role lead
  - qualified leads enter the recommendation pool
- No manual verification and no third-party job-source verification in phase 1

### 5. Fit Analysis

- After a user enters a recommended role, the system must generate:
  - strengths
  - gaps
  - JD gap map
  - interview entry CTA
  - score as a secondary signal
- Display priority on the page is:
  - strengths / weaknesses
  - JD gap map
  - interview CTA
  - score

### 6. Mock Interview

- The mock interview must be a real streaming chat experience
- It must use LangGraph persistent state
- The interview order is fixed:
  - hiring manager first
  - HR second
- Default round split is:
  - hiring manager 6 rounds
  - HR 4 rounds
- The next question must be dynamically generated from:
  - current candidate profile
  - previous user answer
  - current role requirements
  - interview state so far
- Do not implement it as a fixed scripted questionnaire
- Each round must give medium-strength feedback:
  - 2-3 short sentences
- Final summary dimensions are fixed to:
  - product structured thinking
  - AI / LLM understanding
  - user insight
  - project expression
  - business understanding

### 7. Resume Optimization

- Resume optimization is downstream of both candidate profile and interview evidence
- Output priority is fixed to:
  - target-role bullet rewrite suggestions
  - structured problem list
  - optional full rewritten resume later
- Do not output generic resume polish only

### 8. Career Plaza

- Career plaza is in MVP, but it must remain lighter than the main funnel
- Plaza must be read-only in phase 1
- Plaza must contain two sections:
  - 推荐岗位
  - 面试经验内容
- Plaza should be organized by role first
- Plaza supports:
  - card list browsing
  - filters
  - detail view
  - CTA back into role analysis or mock interview
- Do not build:
  - posting
  - comments
  - likes
  - private messaging
  - P2P real-time interaction

### 9. QR Jump to Original Post

- QR jump to original post is part of MVP
- Crawler metadata must capture the original source URL when available
- The app must support generating a QR code from the source URL
- The QR feature is an enhancement layer and must not block the core funnel

## Phase 1 Company Scope

- Phase 1 company pool size is fixed to 15
- Company direction is fixed to:
  - internet majors
  - AI companies
- Phase 1 companies:
  - 字节跳动
  - 腾讯
  - 阿里巴巴
  - 美团
  - 拼多多
  - 百度
  - 快手
  - 小米
  - 小红书
  - 京东
  - 蚂蚁集团
  - 华为
  - 商汤科技
  - 科大讯飞
  - 寒武纪

## Phase 1 Non-Goals

- Do not expand to multiple hero roles
- Do not build a full admin system
- Do not build social posting or community interactions
- Do not build comments ingestion
- Do not build complex video-post pipelines in phase 1
- Do not build recruiter-side workflows
- Do not fine-tune or train a foundation model from scratch

## Product Principles

- Agent first, forms second
- One hero role before many roles
- Evidence before explanation
- Retrieval before generation where facts matter
- High-confidence lead wording over overclaiming verification
- Every major output must be traceable back to input evidence
- Plaza must not steal attention from the main funnel

## Data Strategy

### Knowledge Base Layers

- Layer 1: raw Xiaohongshu post metadata and content
- Layer 2: normalized post schema
- Layer 3: cleaned and deduplicated experience chunks
- Layer 4: structured tags
  - company
  - role
  - interview stage
  - topic
  - recency
  - credibility score
- Layer 5: embeddings and retrieval indexes
- Layer 6: user-facing summaries, fit analysis support, and interview prompt context

### Ingestion Principles

- Xiaohongshu is both:
  - role-lead source
  - interview-experience source
- Preserve source metadata for traceability
- Deduplicate aggressively
- Separate raw storage from model-ready chunks
- Preserve original source URL when available for QR generation
- Phase 1 ingestion includes:
  - post text
  - image OCR text
  - post metadata
- Phase 1 excludes:
  - comments
  - complex video subtitle pipeline

### User Data Principles

- Resume and profile data are sensitive personal data
- Store the minimum necessary user information
- Separate user-private artifacts from shared knowledge-base artifacts
- Do not leak one user's resume details into another user's outputs
- Every upload, parse, and summary flow must be auditable

## Candidate Profile

- Candidate profile is mandatory and three-layered:
  - base profile layer
  - capability tag layer
  - AI product manager fit layer
- Phase 1 fit dimensions are fixed to:
  - AI / LLM application understanding
  - project experience
  - product methodology
  - data analysis ability
  - user research ability

## AI System Direction

### Default Architecture Direction

- Use Lotus `nextjs` project template when bootstrapping the web app
- Runtime baseline is fixed to:
  - Node.js 22
- The codebase should be a monorepo
- Default structure:
  - `apps/web`
  - `services/ai`
  - `workers/crawler`
  - shared packages as needed
- Frontend and internal dashboard live in the same Next.js app
- Backend should stay lightweight; the project emphasis is frontend quality and business logic quality

### Core Engines

- Consultation engine:
  - owns user discovery dialogue
  - updates candidate profile
- Recommendation engine:
  - ranks top 5 high-confidence role leads
- Fit analysis engine:
  - compares user profile against one role lead and related experience evidence
- Interview engine:
  - runs LangGraph persistent mock interview loops
- Resume optimization engine:
  - generates role-specific bullet rewrite suggestions
- Knowledge retrieval engine:
  - retrieves company-role relevant interview experience

### Decision Rules

- Facts shown to users must be grounded in stored data and retrieval
- Generated explanations must stay traceable
- If evidence is weak, say so explicitly
- Do not claim “verified real role” in phase 1 copy

## Authentication and History

- Phase 1 must include login
- Login method is fixed to:
  - email + password
- User history must persist:
  - resume uploads
  - consultation history
  - recommendation results
  - interview records
  - resume optimization results

## Evaluation Requirements

- Before shipping recommendation logic, define offline evals for:
  - recommendation relevance
  - explanation quality
  - hallucinated-role rate
- Before shipping mock interview, define evals for:
  - role consistency
  - turn-to-turn memory quality
  - usefulness of per-turn feedback
  - summary accuracy
- Before shipping resume optimization, define evals for:
  - role alignment
  - specificity
  - actionability
- No AI feature ships without acceptance metrics in `docs/evals/acceptance-metrics.md`

## UX and IA Direction

- Suggested primary routes:
  - `/`
  - `/login`
  - `/jobs`
  - `/jobs/[jobId]`
  - `/interview/[jobId]`
  - `/resume-lab`
  - `/plaza`
  - `/plaza/posts/[postId]`
  - `/history`
  - `/admin`
- The core journey should feel continuous:
  - resume upload
  - consultation
  - top 5 recommendation
  - fit analysis
  - interview
  - resume improvement

## Internal Dashboard

- Phase 1 admin is a single lightweight dashboard page
- It is only for the project owner
- It must include at least:
  - total post count
  - company overview
  - role overview
- Role overview must show:
  - total role count
  - post count per role
- Keep internal operations lightweight and avoid full CRUD-heavy backoffice design in phase 1

## Storage and Infra

- Primary data platform:
  - Supabase
- Primary database layer:
  - Supabase-managed PostgreSQL
  - pgvector
- Deployment shape:
  - one web app
  - one AI service
  - one crawler worker
  - one Supabase project

## Risk and Compliance

- This project touches third-party content, personal resumes, and AI-generated advice
- Do not treat compliance as a later polish step
- Before implementing ingestion at scale, document:
  - data source ownership
  - storage scope
  - attribution strategy
  - takedown / removal path
  - retention policy
  - user consent and privacy boundaries
- Before using company logos, confirm acceptable usage path

## Engineering Discipline

- Favor vertical slices over isolated demo features
- Every slice must connect UI, data, AI logic, and evaluation in a minimal but real loop
- Prefer schemas and contracts before prompt sprawl
- Avoid hidden prompt logic with no tests, no metrics, and no source traceability
- Use feature flags for risky AI experiences
- Log enough to debug retrieval, scoring, and interview-state failures

## gstack Workflow Expectations

- Product framing or scope change:
  - use `/office-hours`
  - then `/plan-ceo-review`
- Architecture or data-flow change:
  - use `/plan-eng-review`
- User-facing UI or interaction design change:
  - use `/plan-design-review`
- Bug, regression, or unclear failure:
  - use `/investigate`
- Before merge:
  - use `/review`
- Before release:
  - use `/qa`
  - then `/ship`

## First Implementation Milestone

- Milestone 0 is alignment, not shipping code
- The first approved build milestone is a thin but real end-to-end loop with:
  - email login
  - resume upload and parsing
  - hosted consultation
  - top 5 AI product manager recommendations
  - one fit analysis page
  - one 10-round dynamic mock interview
  - one resume bullet rewrite output
  - one lightweight plaza with two sections
  - one lightweight internal dashboard
- If a task does not strengthen this loop, question whether it belongs in phase 1
