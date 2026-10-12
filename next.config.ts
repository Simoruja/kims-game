import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  // The home page and the games are static pages in public/. These rewrites serve them at short
  // URLs; they run after Next.js has looked for a matching page or file.
  rewrites: async () => [
    { source: "/", destination: "/hub/index.html" },
    { source: "/game", destination: "/game/index.html" },
    { source: "/match", destination: "/match/index.html" },
    { source: "/word", destination: "/word/index.html" },
    { source: "/blocks", destination: "/blocks/index.html" },
  ],
  partialPrefetching: true,
};

export default nextConfig;
