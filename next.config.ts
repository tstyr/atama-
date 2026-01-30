import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // ビルド時にESLintエラーを無視
    ignoreDuringBuilds: true,
  },
  typescript: {
    // ビルド時にTypeScriptエラーを無視
    ignoreBuildErrors: true,
  },
  // 環境変数の検証をスキップ
  experimental: {
    // 必要に応じて追加
  },
};

export default nextConfig;
