import type { Metadata } from "next";
import GameApp from "@/components/GameApp";

export const metadata: Metadata = {
  title: "Kim's Game (original)",
};

export default function Classic() {
  return (
    <>
      <nav aria-label="Asita's Games" className="px-4 pt-4">
        {/* "/" is the static home page, not a Next.js route, so a plain link */}
        <a
          href="/"
          className="inline-flex min-h-10 items-center gap-1 rounded-full border border-violet-200 bg-white px-4 text-sm font-medium text-violet-900 hover:border-violet-400"
        >
          <span aria-hidden="true">←</span> All games
        </a>
      </nav>
      <GameApp />
    </>
  );
}
