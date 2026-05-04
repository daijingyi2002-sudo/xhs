import { describe, expect, it } from "vitest";
import { completeLoginAuthHandshake, type LoginAuthClient } from "./login-auth-handshake";

function createAuthClient(overrides: Partial<LoginAuthClient> = {}) {
  const calls: Array<{ name: string; payload: unknown }> = [];
  const client: LoginAuthClient = {
    auth: {
      async signInWithPassword(payload) {
        calls.push({ name: "signInWithPassword", payload });
        return {
          data: {
            user: { id: "user-1", email: "lin@example.com" },
            session: { access_token: "token-1" }
          },
          error: null
        };
      },
      async signUp(payload) {
        calls.push({ name: "signUp", payload });
        return {
          data: {
            user: { id: "user-1", email: "lin@example.com" },
            session: null
          },
          error: null
        };
      }
    },
    from(table) {
      calls.push({ name: "from", payload: table });
      return {
        async upsert(payload, options) {
          calls.push({ name: "upsert", payload: { payload, options } });
          return { error: null };
        }
      };
    },
    ...overrides
  };

  return { client, calls };
}

describe("login auth handshake", () => {
  it("signs in with trimmed credentials and upserts the Supabase profile", async () => {
    const { client, calls } = createAuthClient();

    await expect(
      completeLoginAuthHandshake(client, {
        mode: "signin",
        email: " lin@example.com ",
        password: "password123",
        displayName: " 林见夏 ",
        nextPath: "/jobs"
      })
    ).resolves.toEqual({ status: "authenticated", nextPath: "/jobs" });

    expect(calls).toEqual([
      {
        name: "signInWithPassword",
        payload: { email: "lin@example.com", password: "password123" }
      },
      { name: "from", payload: "user_profiles" },
      {
        name: "upsert",
        payload: {
          payload: {
            id: "user-1",
            email: "lin@example.com",
            display_name: "林见夏"
          },
          options: { onConflict: "id" }
        }
      }
    ]);
  });

  it("returns a pending confirmation state when sign-up creates no session", async () => {
    const { client } = createAuthClient();

    await expect(
      completeLoginAuthHandshake(client, {
        mode: "signup",
        email: "new@example.com",
        password: "password123",
        displayName: "新用户",
        nextPath: "/"
      })
    ).resolves.toEqual({
      status: "pendingConfirmation",
      message: "账号已创建，请按 Supabase 邮件确认后再登录。"
    });
  });

  it("surfaces Supabase auth errors to the caller", async () => {
    const { client } = createAuthClient({
      auth: {
        async signInWithPassword() {
          return {
            data: { user: null, session: null },
            error: new Error("Invalid login credentials")
          };
        },
        async signUp() {
          return { data: { user: null, session: null }, error: null };
        }
      }
    });

    await expect(
      completeLoginAuthHandshake(client, {
        mode: "signin",
        email: "wrong@example.com",
        password: "bad-password",
        displayName: "",
        nextPath: "/"
      })
    ).rejects.toThrow("Invalid login credentials");
  });
});
