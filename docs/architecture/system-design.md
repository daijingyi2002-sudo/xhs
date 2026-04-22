# System Design

## Document Status

- Review lenses applied:
  - `plan-eng-review`
  - `plan-ceo-review`
  - `plan-design-review`
- Status: APPROVED FOR PHASE 1 IMPLEMENTATION
- Review mode: FULL_REVIEW

## 1. Architecture Summary

Phase 1 architecture is intentionally simple:

- one monorepo
- one Next.js app for user-facing pages and internal dashboard
- one AI orchestration service for LangGraph workflows
- one crawler worker for Xiaohongshu ingestion
- one Supabase project with managed PostgreSQL and pgvector
- one runtime baseline on Node.js 22

This is the right shape because:

- it keeps infra light
- it isolates the only complex runtime, which is the AI orchestration layer
- it keeps frontend and business logic iteration fast

## 2. Top-Level Modules

```text
repo/
├─ apps/
│  └─ web/                  # Next.js App Router
├─ services/
│  └─ ai/                   # LangGraph + orchestration APIs
├─ workers/
│  └─ crawler/              # Playwright + OCR + ingestion
├─ packages/
│  ├─ domain/               # shared types / schemas
│  ├─ ui/                   # shared components / tokens
│  └─ config/               # shared config
└─ docs/
```

## 3. What Already Exists

- Scope and product constraints are defined in [AGENTS.md](C:\Users\28397\Desktop\xhs面试\AGENTS.md)
- Lotus provides the baseline Next.js project shape if needed
- No existing app code needs to be preserved, which means architecture can start clean

## 4. NOT in Scope

- Splitting into many microservices
- Complex event bus
- Multi-region deployment
- Full admin backoffice
- Video transcription pipeline
- External job platform aggregation at scale
- Fine-tuning infrastructure

## 5. Primary User-Facing Routes

```text
/                     homepage, agent entry, resume upload
/login                email + password login
/jobs                 top 5 role leads
/jobs/[jobId]         fit analysis
/interview/[jobId]    mock interview
/resume-lab           resume optimization
/plaza                read-only plaza
/plaza/posts/[postId] plaza detail
/history              user history
/admin                internal dashboard
```

## 6. Runtime Diagram

```text
            +---------------------------+
            |      Next.js Web App      |
            |  user pages + /admin      |
            +-------------+-------------+
                          |
                 HTTP / server actions
                          |
          +---------------+----------------+
          |                                |
          v                                v
+---------+----------+           +---------+----------+
|   AI Orchestration |           |      Supabase      |
|   LangGraph svc    |<--------->| Postgres + vector  |
+---------+----------+           +---------+----------+
          ^
          |
          |
+---------+----------+
|   Crawler Worker   |
| Playwright + OCR   |
+--------------------+
```

## 7. Data Flow

### 7.1 Resume to Recommendation

```text
[Resume Upload]
   -> parse
   -> normalize
   -> candidate profile
   -> consultation updates profile
   -> recommendation engine ranks Top 5
   -> user opens one role lead
```

### 7.2 Post Ingestion

```text
[Xiaohongshu URL / seed]
   -> Playwright fetch
   -> post metadata extraction
   -> image OCR extraction
   -> content cleanup
   -> dedupe
   -> LLM role lead extraction
   -> chunking / tags / embeddings
   -> recommendation pool + plaza corpus
```

### 7.3 Mock Interview Loop

```text
[candidate profile]
      +
[selected role lead]
      +
[retrieved experience evidence]
      +
[interview state]
      |
      v
[generate next question]
      |
      v
[user answer]
      |
      v
[evaluate answer]
      |
      +--> [turn feedback]
      |
      +--> [state update]
      |
      +--> [next turn or final summary]
```

## 8. Core Services

### 8.1 Web App

Responsibilities:

- authentication
- file upload
- user-facing routes
- plaza UI
- internal dashboard UI
- streaming chat client

### 8.2 AI Service

Responsibilities:

- candidate profile synthesis
- recommendation ranking orchestration
- fit analysis generation
- LangGraph interview orchestration
- resume optimization generation
- retrieval coordination

### 8.3 Crawler Worker

Responsibilities:

- fetch Xiaohongshu pages with Playwright
- extract text and metadata
- OCR images
- preserve source URL
- normalize to structured schema

## 9. Core Domain Entities

### User

- id
- email
- password_hash
- created_at

### Resume

- id
- user_id
- file_name
- file_type
- file_url
- parse_status
- raw_text
- created_at

### CandidateProfile

- id
- user_id
- resume_id
- base_profile_json
- capability_tags_json
- ai_pm_fit_json
- profile_version

### ConversationSession

- id
- user_id
- profile_id
- status
- created_at

### ConversationMessage

- id
- session_id
- role
- content
- metadata_json

### Company

- id
- name
- logo_url
- category

### JobLead

- id
- company_id
- role_name
- city
- seniority
- source_confidence
- extracted_requirements_json
- status

### XhsPost

- id
- source_url
- post_title
- author_name
- publish_time
- raw_text
- ocr_text
- metadata_json

### PostChunk

- id
- post_id
- chunk_text
- tags_json
- embedding

### RecommendationResult

- id
- user_id
- session_id
- profile_id
- job_lead_id
- score
- reasons_json
- risk_json

### InterviewSession

- id
- user_id
- job_lead_id
- profile_id
- state_json
- status

### InterviewTurn

- id
- interview_session_id
- role
- question
- answer
- feedback
- score_json

### InterviewSummary

- id
- interview_session_id
- summary_json

### ResumeOptimizationResult

- id
- user_id
- job_lead_id
- profile_id
- optimization_json

## 10. Candidate Profile Model

```text
CandidateProfile
├─ Base Profile Layer
│  ├─ education
│  ├─ internships
│  ├─ projects
│  ├─ skills
│  └─ target preferences
├─ Capability Tag Layer
│  ├─ AI/LLM understanding
│  ├─ product methodology
│  ├─ data analysis
│  ├─ user research
│  └─ communication
└─ AI PM Fit Layer
   ├─ current fit score
   ├─ strong dimensions
   ├─ weak dimensions
   └─ recommended next actions
```

## 11. Recommendation System

### Input signals

- candidate profile
- conversation updates
- role lead structured fields
- relevant experience chunks

### Ranking strategy

Final score = weighted rule score + semantic similarity score + evidence confidence adjustment

Recommended initial split:

- rule score: 50%
- semantic similarity: 30%
- evidence confidence: 20%

### Primary dimensions

1. AI / LLM application understanding
2. project experience
3. product methodology
4. data analysis ability
5. user research ability

## 12. LangGraph State Machine

```text
START
  -> load_context
  -> generate_opening
  -> manager_rounds
  -> hr_rounds
  -> summarize
  -> resume_optimize
  -> END
```

Detailed node sketch:

```text
load_context
  -> fetch profile
  -> fetch selected role lead
  -> retrieve related chunks

generate_opening
  -> produce first question

manager_rounds
  -> question
  -> answer
  -> evaluate
  -> feedback
  -> update_state
  -> continue_or_switch

hr_rounds
  -> question
  -> answer
  -> evaluate
  -> feedback
  -> update_state
  -> continue_or_finish

summarize
  -> 5-dimension summary

resume_optimize
  -> bullet rewrite suggestions
```

## 13. Internal Dashboard

Phase 1 keeps this intentionally thin:

- single dashboard page
- only for the project owner

Widgets:

1. total post count
2. company overview
3. role overview

Role overview requirements:

- total role count
- post count per role

This is enough for operational visibility without building a CRUD-heavy admin system.

## 14. Failure Modes

| Flow | Failure | Test needed | Error handling | User-visible message |
|------|---------|-------------|----------------|----------------------|
| Resume upload | parse fails on DOCX edge case | yes | yes | yes |
| Candidate profile | profile fields missing after parse | yes | yes | yes |
| Recommendation | no role leads returned | yes | yes | yes |
| Recommendation | low-quality extraction inflates score | yes | partial | yes |
| Analysis | evidence retrieval empty | yes | yes | yes |
| Interview | streaming disconnect mid-turn | yes | yes | yes |
| Interview | LangGraph state corruption | yes | yes | yes |
| Resume optimization | weak generic output | yes | partial | yes |
| Plaza detail | source URL missing for QR | yes | yes | yes |
| Crawler | page structure changed | yes | yes | no, internal only |

### Critical gaps

If any of the following ships without tests, it is a critical gap:

- resume parsing
- recommendation ranking
- interview state transitions
- QR URL presence handling

## 15. Testing Strategy

### Unit tests

- parsers
- profile synthesis adapters
- ranking formula
- prompt payload builders
- interview state transitions

### Integration tests

- upload resume -> profile generated
- profile -> top 5 recommendations
- role open -> fit analysis returns
- interview 10-turn happy path
- post ingestion -> chunking -> embeddings

### End-to-end tests

- signup/login
- upload resume and reach jobs page
- enter interview and finish flow
- open plaza detail and generate QR

## 16. Performance Targets

- homepage interactive under 2s on warm load
- recommendation result under 4s after conversation submit
- fit analysis under 5s
- per-turn interview latency under 3s for first streamed token
- plaza list loads under 2s

## 17. Security and Privacy

- passwords hashed with a standard KDF
- upload storage separated from public assets
- signed URLs for private resume files
- no user resume content exposed in shared retrieval corpus
- audit logs for parse, recommendation, interview, and optimization events

## 18. Worktree Parallelization Strategy

### Dependency table

| Step | Modules touched | Depends on |
|------|-----------------|------------|
| Auth + resume upload | `apps/web`, `packages/domain`, `db` | — |
| Candidate profile + recommendation | `services/ai`, `packages/domain`, `db` | Auth + resume upload |
| Fit analysis + interview | `services/ai`, `apps/web`, `db` | Candidate profile + recommendation |
| Crawler + KB ingestion | `workers/crawler`, `packages/domain`, `db` | — |
| Plaza + QR experience | `apps/web`, `db` | Crawler + KB ingestion |
| Dashboard | `apps/web`, `db` | Crawler + KB ingestion |

### Parallel lanes

- Lane A: Auth + resume upload -> Candidate profile + recommendation -> Fit analysis + interview
- Lane B: Crawler + KB ingestion -> Plaza + QR experience
- Lane C: Dashboard

### Execution order

- Launch Lane A and Lane B in parallel
- Start Lane C after database schema settles
- Merge A + B before full E2E testing

### Conflict flags

- Lane A and Lane B both touch `db`; coordinate schema changes carefully
- Lane B and Lane C both depend on ingestion-facing tables; keep migrations centralized

## 19. Final Engineering Call

This project does not need fancy infra.

It needs:

- crisp schemas
- honest product language
- a strong stateful interview loop
- a clean frontend that makes the flow obvious

That is the technical bar for Phase 1.
