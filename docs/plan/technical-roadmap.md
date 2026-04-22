# Project Technical Roadmap

## 1. Phase Map

```text
P0  Planning locked
P1  App skeleton + schema + auth
P2  Resume parsing + candidate profile + recommendation
P3  Fit analysis + LangGraph interview
P4  KB ingestion + plaza + QR
P5  Dashboard + hardening + demo polish
P6  Post-MVP expansion
```

## 2. Tech Stack

### Frontend

- Next.js App Router
- React
- TypeScript
- shared UI package

### Runtime

- Node.js 22

### Backend / orchestration

- lightweight service boundary
- LangGraph service for stateful AI flows

### Data

- Supabase
- Supabase-managed PostgreSQL
- pgvector

### Ingestion

- Playwright
- OCR provider or local OCR integration

### Auth

- email + password

## 3. Why This Stack

- Next.js keeps the frontend fast to build and demo
- Node.js 22 is the fixed project runtime baseline for compatibility and deployment stability
- LangGraph isolates the one genuinely stateful part
- Supabase-managed PostgreSQL + pgvector is enough for both product data and retrieval while keeping backend ops light
- Playwright is pragmatic for page capture

## 4. Phase-by-Phase Technical Goals

### P1

Goal:

- establish app, service, worker, db boundaries

Technical deliverables:

- repo structure
- environment config
- schema base
- auth flow

### P2

Goal:

- convert resume and chat into a stable candidate profile

Technical deliverables:

- upload pipeline
- parser adapter
- profile schema
- recommendation engine v1

### P3

Goal:

- prove the stateful AI core

Technical deliverables:

- LangGraph graph
- streaming transport
- interview state persistence
- fit analysis generation

### P4

Goal:

- make the knowledge layer visible to users

Technical deliverables:

- post ingestion pipeline
- OCR extraction
- chunking + embedding
- plaza list/detail
- QR generation

### P5

Goal:

- stabilize and instrument

Technical deliverables:

- dashboard
- eval scripts
- logs
- edge-case handling

## 5. Technical Debt You Intentionally Accept

- no complex admin CRUD
- no video ingestion pipeline
- no external verified job source
- no advanced permissions model
- no realtime infra

This is good debt, because it protects the build from premature platform work.

## 6. Expansion Roadmap

### V1.5

- improved source freshness
- richer dashboard
- more nuanced confidence scoring

### V2

- second role track
- P2P or social interaction experiments
- stronger role lead verification

### V3

- broader company coverage
- better cross-role transfer logic
- advanced evaluator loops

## 7. Hard Technical Rules

- do not mix interview state logic into the web app
- do not let recommendation logic live only in prompts
- do not store user-private content in shared retrieval tables
- do not claim truth where the system only has inference

## 8. Milestone Demo Story

The technical milestone story should be easy to narrate:

1. user logs in
2. uploads resume
3. system builds profile
4. system recommends 5 role leads
5. user opens one lead
6. analysis shows strengths and gaps
7. interview runs with dynamic state
8. resume lab turns feedback into bullet rewrites
9. plaza and QR show how the KB connects back to source

## 9. Final Roadmap Call

The roadmap is front-loaded on product proof, not infrastructure prestige.

That is exactly what this project needs.
