# Final Execution Plan

## 1. Objective

在不写复杂后端平台的前提下，构建一个可演示、可闭环、可体现 AI 产品与前端能力的求职 Agent 系统。

## 2. Delivery Principle

先做闭环，再做宽度。

Phase 1 只允许围绕以下闭环投入：

`登录 -> 简历 -> 画像 -> 推荐 -> 分析 -> 模拟面试 -> 简历优化 -> 广场补充`

## 3. Workstreams

### Stream A: Product Shell

- auth
- homepage
- resume upload
- history shell

### Stream B: Profile + Recommendation

- parsing
- candidate profile
- top 5 role leads
- recommendation reasons

### Stream C: Fit Analysis + Interview

- analysis page
- LangGraph state machine
- streaming interview
- summary

### Stream D: KB + Plaza

- crawler
- OCR
- extraction
- plaza list/detail
- QR CTA

### Stream E: Admin Dashboard

- single internal page
- post count
- company overview
- role overview

## 4. Implementation Order

### Phase 0: Planning Lock

Deliverables:

- product brief
- user journeys
- system design
- KB strategy
- compliance doc
- eval metrics
- design plan

Exit condition:

- no unresolved scope ambiguity

### Phase 1: Skeleton

Build:

- monorepo structure
- Next.js app shell
- AI service skeleton
- crawler skeleton
- Supabase project setup
- Supabase schema baseline

Exit condition:

- app boots
- auth works
- DB and services connected

### Phase 2: Resume + Profile + Recommendation

Build:

- resume upload
- parse pipeline
- candidate profile
- top 5 recommendations

Exit condition:

- upload a resume and get 5 explainable role leads

### Phase 3: Analysis + Interview

Build:

- fit analysis page
- LangGraph interview state machine
- streaming UI
- per-turn feedback

Exit condition:

- one role can complete the full 10-round mock interview

### Phase 4: Resume Lab + Plaza + QR

Build:

- bullet rewrite suggestions
- plaza two-section UI
- detail pages
- QR generation

Exit condition:

- the full user demo story works end to end

### Phase 5: Dashboard + Polish

Build:

- internal metrics dashboard
- copy polish
- error states
- eval instrumentation

Exit condition:

- product is demo-ready

## 5. Weekly Roadmap Suggestion

### Week 1

- repo setup
- auth
- schema
- upload pipeline skeleton

### Week 2

- candidate profile
- recommendation engine
- jobs pages

### Week 3

- fit analysis
- LangGraph interview
- streaming UI

### Week 4

- resume optimization
- crawler + OCR
- plaza + QR

### Week 5

- dashboard
- hardening
- evals
- demo polish

## 6. Definition of Done

The project is “done enough” for Phase 1 when:

1. a user can start from login and finish the full funnel
2. the outputs are grounded and coherent
3. the visual product feels intentional
4. the technical story is interview-worthy

## 7. Biggest Execution Risks

1. spending too much time on crawler edge cases
2. letting plaza expand into a fake community product
3. building a complicated admin too early
4. letting interview flow become template-driven instead of stateful

## 8. Execution Discipline

- no feature enters scope unless it strengthens the main demo story
- every new output must have a user-facing reason to exist
- every AI step must be traceable back to data or state

## 9. Final Call

The smartest way to win here is not to build the most features.

It is to build the cleanest, most convincing closed loop.
