"use client";

import { createSupabaseBrowserClient } from "@xhs/config";

export type AuthSessionState =
  | { status: "loading" }
  | { status: "authenticated"; userId: string; email: string | null; accessToken: string }
  | { status: "unauthenticated" }
  | { status: "unconfigured" };

export function getSupabaseBrowserClientOrNull() {
  return createSupabaseBrowserClient();
}

export async function getAccessToken() {
  const supabase = getSupabaseBrowserClientOrNull();
  if (!supabase) return null;

  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export async function buildAuthHeaders() {
  const token = await getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
