import { extractResumeText } from "@xhs/ai";
import { requireAuthenticatedRequest, createUserScopedSupabase } from "../../../../lib/auth-server";
import {
  buildAccountProfileResponse,
  type AccountProfileRow,
  type AccountResumeRow
} from "../../../../lib/account-profile";

export const runtime = "nodejs";

type AccountProfilePatch = {
  username?: string;
  displayName?: string;
  basicInfo?: {
    city?: string;
    targetRole?: string;
    school?: string;
    graduationYear?: string;
  };
};

function sanitizeText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

async function getCurrentProfile(request: Request) {
  const auth = await requireAuthenticatedRequest(request);
  if (auth instanceof Response) return auth;

  const supabase = createUserScopedSupabase(auth.accessToken);
  if (!supabase) {
    return Response.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  return { auth, supabase };
}

export async function GET(request: Request) {
  const context = await getCurrentProfile(request);
  if (context instanceof Response) return context;

  const { auth, supabase } = context;
  const { data: userData, error: userError } = await supabase.auth.getUser(auth.accessToken);
  if (userError || !userData.user) {
    return Response.json({ error: "登录状态已失效，请重新登录。" }, { status: 401 });
  }

  const email = userData.user.email ?? "";
  await supabase.from("user_profiles").upsert(
    {
      id: auth.userId,
      email,
      updated_at: new Date().toISOString()
    },
    { onConflict: "id" }
  );

  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("id, email, username, display_name, basic_info")
    .eq("id", auth.userId)
    .single();

  if (profileError || !profile) {
    return Response.json({ error: profileError?.message ?? "无法读取用户资料。" }, { status: 503 });
  }

  const { data: resumes, error: resumeError } = await supabase
    .from("resumes")
    .select("id, file_name, file_type, raw_text, created_at")
    .eq("user_id", auth.userId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (resumeError) {
    return Response.json({ error: resumeError.message }, { status: 503 });
  }

  return Response.json(
    buildAccountProfileResponse(profile as AccountProfileRow, (resumes?.[0] as AccountResumeRow | undefined) ?? null)
  );
}

export async function PATCH(request: Request) {
  const context = await getCurrentProfile(request);
  if (context instanceof Response) return context;

  const { auth, supabase } = context;
  const body = (await request.json().catch(() => null)) as AccountProfilePatch | null;
  const { data: userData } = await supabase.auth.getUser(auth.accessToken);
  const email = userData.user?.email ?? "";

  const profilePayload = {
    id: auth.userId,
    email,
    username: sanitizeText(body?.username, 40) || null,
    display_name: sanitizeText(body?.displayName, 40) || null,
    basic_info: {
      city: sanitizeText(body?.basicInfo?.city, 40),
      target_role: sanitizeText(body?.basicInfo?.targetRole, 80),
      school: sanitizeText(body?.basicInfo?.school, 80),
      graduation_year: sanitizeText(body?.basicInfo?.graduationYear, 12)
    },
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase.from("user_profiles").upsert(profilePayload, { onConflict: "id" });

  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  return GET(request);
}

export async function POST(request: Request) {
  const context = await getCurrentProfile(request);
  if (context instanceof Response) return context;

  const { auth, supabase } = context;
  const formData = await request.formData();
  const resume = formData.get("resume");

  if (!(resume instanceof File)) {
    return Response.json({ error: "请上传简历文件。" }, { status: 400 });
  }

  const rawText = await extractResumeText({
    name: resume.name,
    type: resume.type,
    bytes: await resume.arrayBuffer()
  });

  const { error } = await supabase.from("resumes").insert({
    user_id: auth.userId,
    file_name: resume.name,
    file_type: resume.type || "application/octet-stream",
    parse_status: rawText ? "completed" : "empty",
    raw_text: rawText,
    updated_at: new Date().toISOString()
  });

  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  return GET(request);
}
