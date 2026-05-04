"use client";

import { getAccessToken } from "./auth-client";

type HeaderMap = Record<string, string>;

export function mergeAuthHeaders(headers: HeaderMap = {}, accessToken: string | null): HeaderMap {
  if (!accessToken) return headers;

  return {
    ...headers,
    Authorization: `Bearer ${accessToken}`
  };
}

export async function buildAuthenticatedHeaders(headers: HeaderMap = {}) {
  return mergeAuthHeaders(headers, await getAccessToken());
}
