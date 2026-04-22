# Acceptance Metrics

## 1. Goal

定义 Phase 1 的上线门槛，避免“功能做出来了但没有质量标准”。

## 2. Product Metrics

### PM1. Recommendation usefulness

Question:

- 用户是否觉得 Top 5 推荐有意义

Acceptance target:

- 至少 70% 的试用反馈认为推荐“有明显相关性”

### PM2. Interview usefulness

Question:

- 用户是否觉得模拟面试反馈有帮助

Acceptance target:

- 至少 70% 的试用反馈认为反馈“具体且可执行”

### PM3. Resume actionability

Question:

- 用户是否能直接根据建议修改简历

Acceptance target:

- 至少 70% 的试用反馈认为 bullet 改写建议“可直接使用或轻改后使用”

## 3. Recommendation Evals

### Offline metrics

- top-5 relevance score
- explanation quality score
- hallucinated-role rate
- weak-evidence disclosure rate

### Acceptance targets

- hallucinated-role rate: 0 tolerated in visible UI claims
- each card must include 3 reasons + 1 risk reminder
- at least 80% of sampled results have traceable evidence

## 4. Fit Analysis Evals

Metrics:

- strengths accuracy
- gap specificity
- JD gap usefulness
- CTA clarity

Acceptance targets:

- at least 80% of sampled analyses contain role-specific, not generic, gaps
- at least 80% of analyses map at least 3 gaps to concrete next actions

## 5. Interview Evals

Metrics:

- role consistency
- turn memory quality
- question continuity
- feedback usefulness
- summary coherence

Acceptance targets:

- 10-turn flow completes without broken state
- at least 80% of sampled turns reference prior user context correctly
- per-turn feedback stays within 2-3 short sentences
- final summary covers the 5 required dimensions

## 6. Resume Optimization Evals

Metrics:

- target-role alignment
- bullet specificity
- avoidance of fabricated claims

Acceptance targets:

- every suggestion maps to target role
- zero fabricated achievements introduced by the system
- at least 80% of sampled suggestions are concrete enough to edit directly

## 7. Technical Metrics

### Latency

- homepage interactive under 2s warm
- recommendation response under 4s
- first streamed interview token under 3s
- plaza list under 2s

### Reliability

- upload parse success above 90% on prepared test set
- interview flow success above 95% on internal happy-path runs

## 8. Data Quality Metrics

- duplicate post rate after dedupe
- source URL coverage
- role extraction confidence distribution
- chunk tag completeness

Acceptance targets:

- source URL preserved for at least 80% of posts where available
- duplicate reduction above 70% on known duplicate sets

## 9. Manual Review Checklist

- no page says “已验证真实岗位”
- QR only shows when URL exists
- plaza does not overshadow homepage CTA
- history preserves user flow correctly
- admin dashboard metrics are internally consistent

## 10. Release Gate

Phase 1 is ready for coded implementation when:

1. all required planning docs exist
2. metrics are agreed
3. no unresolved critical gap remains in recommendation, interview, or resume flows

Phase 1 is ready for demo when:

1. the main funnel works end to end
2. outputs are grounded and understandable
3. latency is acceptable for a real walkthrough
