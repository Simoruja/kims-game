import type { MetadataRoute } from "next";

// One installable app for the whole platform: the home page and every game.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Asita's Games",
    short_name: "Asita's Games",
    description:
      "Memory, word and puzzle games for phones, tablets and computers: Asita's Game, Asita's Match, Asita's Word and Asita's Blocks.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f4ee",
    theme_color: "#1c2233",
    icons: [
      { src: "/shared/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/shared/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/shared/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
