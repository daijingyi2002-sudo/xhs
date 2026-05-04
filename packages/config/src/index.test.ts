import { afterEach, describe, expect, it, vi } from "vitest";
import { createSupabaseBrowserClient } from "./index";

describe("Supabase browser client", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("reuses one browser client instance for the shared auth storage key", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");

    const first = createSupabaseBrowserClient();
    const second = createSupabaseBrowserClient();

    expect(first).toBe(second);
  });
});
