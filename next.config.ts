import type { NextConfig } from "next";

// GitHub Pages build: `PAGES_BASE=/mine-quest-web npm run build` makes a static export in out/.
// Static export can't use Cache Components / Partial Prefetching, so those stay on for dev only.
const pages = process.env.PAGES_BASE !== undefined;
const base = process.env.PAGES_BASE ?? "";

const nextConfig: NextConfig = {
  ...(pages ? { output: "export", basePath: base, assetPrefix: base || undefined, images: { unoptimized: true }, trailingSlash: true } : {}),
  cacheComponents: !pages,
  // drei <Html> labels each own a React root; dev Strict Mode double-mounts them and throws removeChild errors
  reactStrictMode: false,
  partialPrefetching: !pages,
  turbopack: {
    root: process.cwd(),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
