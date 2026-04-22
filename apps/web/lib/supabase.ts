import { createSupabaseBrowserClient, getPublicEnv, productConfig } from "@xhs/config";

export function getSupabaseStatus() {
  const env = getPublicEnv();
  const client = createSupabaseBrowserClient();

  return {
    enabled: Boolean(client),
    projectUrl: env.NEXT_PUBLIC_SUPABASE_URL ?? "未配置",
    productLabel: productConfig.jobLeadLabel
  };
}
