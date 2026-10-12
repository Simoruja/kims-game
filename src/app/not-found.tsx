import type { Metadata } from "next";

export const metadata: Metadata = { title: "Page not found" };

// Same colours as the home page, in light and dark.
const css = `
  .nf { --bg: #f7f4ee; --text: #1e1a12; --muted: rgba(30,26,18,.66); --navy: #1c2233; --on-navy: #f7f4ee; }
  @media (prefers-color-scheme: dark) {
    .nf { --bg: #141824; --text: #f0ebe0; --muted: rgba(240,235,224,.7); --navy: #f0e8d8; --on-navy: #141824; }
  }
  .nf { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 24px; text-align: center;
        background: var(--bg); color: var(--text); font-family: system-ui, -apple-system, "Segoe UI", sans-serif; }
  .nf h1 { font-family: Georgia, serif; font-weight: 600; font-size: 40px; color: var(--navy); margin: 0 0 8px; }
  .nf p { color: var(--muted); margin: 0 0 22px; }
  .nf a { display: inline-block; padding: 12px 26px; border-radius: 999px; background: var(--navy);
          color: var(--on-navy); font-weight: 500; text-decoration: none; }
`;

export default function NotFound() {
  return (
    <main className="nf">
      <style>{css}</style>
      <div>
        <h1>Page not found</h1>
        <p>This page isn&apos;t part of Asita&apos;s Games.</p>
        {/* "/" is the static home page, not a Next.js route, so a plain link */}
        <a href="/">Go to all games</a>
      </div>
    </main>
  );
}
