import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: process.env.IS_TAURI_BUILD === "true" ? "export" : undefined,
  images: {
    unoptimized: true,
  },
  // Turbopack config (used by Vercel's default `next build` in Next.js 16)
  // An explicit turbopack block silences the webpack-conflict error without
  // needing to replicate every webpack rule (SVGs are not imported in this project).
  turbopack: {},
  // Webpack config (used locally via `next build --webpack` / `next dev --webpack`)
  webpack: (config) => {
    // Remove existing SVG handling (so we can define ours)
    const fileLoaderRule = config.module.rules.find(
      (rule: any) => rule.test && rule.test.test && rule.test.test(".svg")
    );
    if (fileLoaderRule) {
      fileLoaderRule.exclude = /\.svg$/i;
    }

    // Emit SVGs as separate files instead of inlining
    config.module.rules.push({
      test: /\.svg$/i,
      type: "asset/resource",
      generator: {
        filename: "static/media/[name].[contenthash][ext]",
      },
      parser: {
        dataUrlCondition: {
          maxSize: 0, // never inline
        },
      },
    });

    return config;
  },
};

export default nextConfig;