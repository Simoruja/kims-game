import { ReactNode } from "react";

export default function Tray({ children }: { children: ReactNode }) {
  return (
    <div
      className="grid gap-3 sm:gap-4 w-full max-w-2xl mx-auto"
      style={{ gridTemplateColumns: "repeat(auto-fit, minmax(84px, 1fr))" }}
    >
      {children}
    </div>
  );
}
