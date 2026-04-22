# Knowledge Base Strategy

## 1. Purpose

知识库不是为了“把帖子都存下来”，而是为了支持三件事：

1. 更可信的岗位线索推荐
2. 更有针对性的岗位差距分析
3. 更贴近真实经验的模拟面试

## 2. Source Definition

Phase 1 source:

- Xiaohongshu

Roles of the source:

- role-lead source
- interview-experience source

## 3. Ingestion Scope

### Included

- post text
- image OCR text
- post metadata
- original source URL when available

### Excluded

- comments
- complex video subtitle pipelines

## 4. Storage Layers

```text
Layer 1  raw_post
Layer 2  normalized_post
Layer 3  extracted_role_lead
Layer 4  cleaned_chunks
Layer 5  tags + embeddings
Layer 6  retrieval-ready context
```

## 5. Schema Outline

### raw_post

- source_url
- title
- raw_text
- raw_html_snapshot or equivalent capture
- raw_metadata_json

### normalized_post

- normalized_text
- ocr_text
- publish_time
- company_candidates
- role_candidates

### extracted_role_lead

- canonical_company
- canonical_role
- city
- seniority
- confidence_score
- evidence_span_json

### cleaned_chunks

- post_id
- chunk_index
- chunk_text
- chunk_type

### tags

- company
- role
- interview stage
- topic
- recency
- credibility score

## 6. Chunking Strategy

Chunk by semantic meaning, not fixed token count only.

Recommended chunk types:

- interview process
- questions asked
- answer strategy
- hiring bar signals
- company / role context

Each chunk should preserve:

- source post reference
- position in original post
- extracted tags

## 7. Retrieval Strategy

### For recommendation

Retrieve:

- company-role relevant chunks
- role lead evidence
- confidence signals

### For fit analysis

Retrieve:

- job-lead requirement evidence
- company / role interview themes
- missing capability signals

### For interview

Retrieve:

- likely question themes
- behavioral and domain prompts
- company-specific patterns

## 8. Quality Pipeline

```text
fetch
 -> normalize
 -> OCR
 -> dedupe
 -> extract role lead
 -> score confidence
 -> chunk
 -> tag
 -> embed
 -> ready for retrieval
```

## 9. Dedupe Rules

Dedupe across:

- same source URL
- same normalized title + publish time
- highly similar normalized text

Keep one canonical post record, but preserve alternate ingestion records in metadata if needed.

## 10. Confidence Scoring

Confidence score should combine:

- extraction completeness
- company-role clarity
- text quality
- metadata quality
- consistency between text and OCR

This score influences recommendation ranking but does not make the lead “verified.”

## 11. URL and QR Strategy

Every retained post should attempt to preserve:

- original URL
- URL availability status

If URL exists:

- allow QR generation on detail page

If URL missing:

- hide QR CTA
- do not break the page

## 12. Human Readiness Principle

Even if data is machine-usable, it must still be human-traceable:

- every recommendation needs evidence pointers
- every fit analysis needs source-backed rationale
- every interview prompt should be attributable to retrieved themes, not pure model memory

## 13. Data Refresh Strategy

Phase 1 can use batch refreshes.

Recommended initial cadence:

- seed import
- manual reruns for target companies / roles
- periodic refresh job later

Do not overbuild real-time ingestion in phase 1.

## 14. Knowledge Base Risks

### Risk 1

Too much noisy content enters the corpus.

Mitigation:

- strong normalization
- confidence scoring
- chunk-level filtering

### Risk 2

Role lead extraction becomes overconfident.

Mitigation:

- separate confidence score from truth claims
- preserve evidence spans

### Risk 3

Retrieval returns generic content.

Mitigation:

- tag by role
- tag by company
- tag by interview stage
- add hybrid retrieval

## 15. Final KB Rule

The knowledge base is not a content graveyard.

It is a retrieval system designed to drive:

- recommendation quality
- interview realism
- actionability
