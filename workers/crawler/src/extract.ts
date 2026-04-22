import type { JobLead, XhsPost } from "@xhs/domain";

export function extractRoleLead(post: XhsPost, lead: JobLead) {
  return {
    companyId: lead.companyId,
    roleName: lead.roleName,
    sourceConfidence: lead.sourceConfidence,
    evidence: [post.title, post.excerpt, post.ocrText].filter(Boolean)
  };
}

export function preserveSourceUrl(post: XhsPost) {
  return {
    postId: post.id,
    sourceUrl: post.sourceUrl ?? null,
    hasQrTarget: Boolean(post.sourceUrl)
  };
}
