import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  turbopack: {
    root: path.resolve(__dirname, "."),
  },
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