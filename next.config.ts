import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // ビルド時にESLintエラーを無視（警告のみ）
    ignoreDuringBuilds: false,
  },
  typescript: {
    // ビルド時にTypeScriptエラーを無視しない（本番環境では推奨しない）
    ignoreBuildErrors: false,
  },
  // 環境変数の検証をスキップ
  experimental: {
    // 必要に応じて追加
  },
};

export default nextConfig;
