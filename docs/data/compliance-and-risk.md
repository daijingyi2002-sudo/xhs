# Compliance and Risk

## 1. Purpose

This document defines the minimum compliance and risk posture for Phase 1.

The goal is not to pretend the product is enterprise-ready.
The goal is to avoid preventable trust failures.

## 2. Risk Categories

1. Third-party content risk
2. User privacy risk
3. Misleading product claims
4. Security risk
5. Operational risk

## 3. Third-Party Content Rules

### Source handling

- Preserve source attribution metadata
- Preserve source URL when available
- Do not claim original content ownership
- Keep the QR jump feature as a pointer back to source, not a replacement for source attribution

### Product language

- Do not call phase 1 role leads “verified real jobs”
- Use `高置信岗位线索`
- Do not imply official partnership with Xiaohongshu or target companies

### Content storage caution

- Store only what the product needs for retrieval and explanation
- Avoid unnecessary expansion into unrelated user-generated content

## 4. User Data Rules

### Sensitive data

- resumes
- education background
- project and internship history
- conversation history
- interview results

### Required controls

- authenticated access for user histories
- private resume storage
- least-privilege access to raw resume content
- auditability for parsing and processing flows

## 5. Security Baseline

- password hashing required
- no plaintext password storage
- signed or protected resume file access
- avoid storing secrets in frontend code
- internal dashboard must require auth

## 6. Product Honesty Rules

### Allowed claims

- personalized recommendation
- high-confidence role leads
- AI-generated fit analysis
- AI mock interview

### Disallowed claims

- verified real job
- guaranteed interview success
- guaranteed offer improvement
- official company hiring insight

## 7. Internal Dashboard Risk

Because the admin is only for the project owner:

- keep access narrow
- no need for a full RBAC system in phase 1
- still protect the route behind auth

## 8. AI Risk Controls

### Recommendation

- show reasoning
- show risk reminder
- avoid overclaiming certainty

### Interview

- keep feedback constructive
- avoid shaming language
- surface uncertainty where evidence is weak

### Resume optimization

- tie suggestions to target role
- avoid fabricated experience claims

## 9. Operational Risk Matrix

| Risk | Severity | Likelihood | Mitigation |
|------|----------|------------|------------|
| misleading job claim | high | medium | use honest wording |
| resume data leak | high | low-medium | private storage + auth |
| broken source URL | low | medium | hide QR gracefully |
| crawler breakage | medium | high | retries + monitoring |
| generic interview prompts | medium | medium | retrieval + state tests |
| noisy knowledge base | medium | high | dedupe + scoring |

## 10. User-Facing Disclosures

Recommended disclosure copy areas:

- recommendation page: explain that roles are high-confidence leads derived from collected public content
- analysis page: explain that outputs are advisory, not official recruiting judgments
- QR jump: explain that opening source content depends on the original post still being available

## 11. Removal and Retention

Minimum requirements:

- retain metadata necessary for attribution
- define how removed or unavailable source content is handled
- if source URL is dead, do not present broken QR CTA
- define retention policy for resume files and history before launch

## 12. Final Compliance Call

Phase 1 is allowed to be lean.

It is not allowed to be sloppy.
