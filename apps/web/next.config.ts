import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@xhs/domain", "@xhs/ui", "@xhs/config", "@xhs/ai"],
  serverExternalPackages: ["pdf-parse", "@napi-rs/canvas"]
};

export default nextConfig;
