import { createClient } from "@supabase/supabase-js";
import { getPublicEnv } from "@xhs/config";

export type AuthenticatedRequest = {
  userId: string;
  accessToken: string;
};

export function getBearerToken(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? null;
}

export async function requireAuthenticatedRequest(request: Request): Promise<AuthenticatedRequest | Response> {
  const env = getPublicEnv();
  const token = getBearerToken(request);

  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return Response.json({ error: "Supabase auth is not configured." }, { status: 503 });
  }

  if (!token) {
    return Response.json({ error: "请先登录后再使用该功能。" }, { status: 401 });
  }

  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return Response.json({ error: "登录状态已失效，请重新登录。" }, { status: 401 });
  }

  return {
    userId: data.user.id,
    accessToken: token
  };
}

export function createUserScopedSupabase(accessToken: string) {
  const env = getPublicEnv();

  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null;
  }

  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}
