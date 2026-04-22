import type { XhsPost } from "@xhs/domain";

export type RawXhsPayload = {
  url?: string;
  title: string;
  body: string;
  publishTime: string;
  authorName: string;
  ocrText?: string;
};

export function normalizeXhsPayload(payload: RawXhsPayload, companyId: string, roleId: string): XhsPost {
  return {
    id: `post-${companyId}-${Math.abs(hash(payload.title)).toString(36)}`,
    companyId,
    roleId,
    title: payload.title,
    excerpt: payload.body.slice(0, 96),
    sourceUrl: payload.url,
    publishTime: payload.publishTime,
    authorName: payload.authorName,
    topic: "待分类",
    stage: "manager",
    ocrText: payload.ocrText ?? "",
    confidenceLabel: "高置信岗位线索"
  };
}

function hash(value: string) {
  return value.split("").reduce((acc, char) => acc * 31 + char.charCodeAt(0), 7);
}
