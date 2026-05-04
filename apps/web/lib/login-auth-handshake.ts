export type LoginMode = "signin" | "signup";

type AuthUser = {
  id: string;
  email?: string | null;
};

type AuthSession = {
  access_token?: string;
};

type AuthResult = {
  data: {
    user: AuthUser | null;
    session: AuthSession | null;
  };
  error: Error | null;
};

export type LoginAuthClient = {
  auth: {
    signInWithPassword(credentials: { email: string; password: string }): Promise<AuthResult>;
    signUp(credentials: {
      email: string;
      password: string;
      options?: {
        data?: {
          display_name?: string | null;
        };
      };
    }): Promise<AuthResult>;
  };
  from(table: "user_profiles"): {
    upsert(
      payload: {
        id: string;
        email: string;
        display_name: string | null;
      },
      options: { onConflict: "id" }
    ): Promise<{ error: Error | null }>;
  };
};

export type LoginHandshakeInput = {
  mode: LoginMode;
  email: string;
  password: string;
  displayName: string;
  nextPath: string;
};

export type LoginHandshakeResult =
  | { status: "authenticated"; nextPath: string }
  | { status: "pendingConfirmation"; message: string };

export async function completeLoginAuthHandshake(
  supabase: LoginAuthClient,
  input: LoginHandshakeInput
): Promise<LoginHandshakeResult> {
  const email = input.email.trim();
  const displayName = input.displayName.trim();
  const credentials = {
    email,
    password: input.password
  };

  const { data, error } =
    input.mode === "signin"
      ? await supabase.auth.signInWithPassword(credentials)
      : await supabase.auth.signUp({
          ...credentials,
          options: {
            data: {
              display_name: displayName || null
            }
          }
        });

  if (error) {
    throw error;
  }

  if (data.user) {
    const { error: profileError } = await supabase.from("user_profiles").upsert(
      {
        id: data.user.id,
        email: data.user.email ?? email,
        display_name: displayName || null
      },
      {
        onConflict: "id"
      }
    );

    if (profileError) {
      throw profileError;
    }
  }

  if (!data.session) {
    return {
      status: "pendingConfirmation",
      message: "账号已创建，请按 Supabase 邮件确认后再登录。"
    };
  }

  return {
    status: "authenticated",
    nextPath: input.nextPath
  };
}
