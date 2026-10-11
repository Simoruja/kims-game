import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  // The home page and the two games are static pages in public/. These rewrites serve them at short
  // URLs; they run after Next.js has looked for a matching page or file, so /classic stays a Next.js page.
  rewrites: async () => [
    { source: "/", destination: "/hub/index.html" },
    { source: "/game", destination: "/game/index.html" },
    { source: "/match", destination: "/match/index.html" },
  ],
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
