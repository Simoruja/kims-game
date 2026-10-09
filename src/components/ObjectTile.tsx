"use client";

import { GameObject, RecallTile } from "@/lib/types";
import ShapeIcon from "./ShapeIcon";

type ResultState = "correct" | "incorrect" | null;

export default function ObjectTile({
  item,
  selected = false,
  onClick,
  resultState = null,
  resultBadge,
  disabled = false,
}: {
  item: GameObject | RecallTile;
  selected?: boolean;
  onClick?: () => void;
  resultState?: ResultState;
  resultBadge?: string;
  disabled?: boolean;
}) {
  const interactive = Boolean(onClick) && !disabled;

  const base =
    "relative aspect-square w-full rounded-2xl border-2 flex items-center justify-center select-none transition-transform duration-150 ease-out";

  let stateClasses = "border-slate-200 bg-white";
  if (selected) {
    stateClasses = "border-violet-500 bg-violet-50 scale-95 shadow-inner";
  }
  if (resultState === "correct") {
    stateClasses = "border-emerald-500 bg-emerald-50";
  } else if (resultState === "incorrect") {
    stateClasses = "border-rose-500 bg-rose-50";
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      aria-label={item.label}
      className={`${base} ${stateClasses} ${
        interactive ? "active:scale-90 cursor-pointer touch-manipulation" : "cursor-default"
      }`}
    >
      <TileContent item={item} />

      {resultBadge && (
        <span
          className={`absolute -top-2 -right-2 text-[10px] sm:text-xs font-bold px-1.5 py-0.5 rounded-full shadow ${
            resultState === "correct"
              ? "bg-emerald-500 text-white"
              : resultState === "incorrect"
              ? "bg-rose-500 text-white"
              : "bg-slate-500 text-white"
          }`}
        >
          {resultBadge}
        </span>
      )}

      {resultState === "correct" && (
        <span className="absolute bottom-1 right-1 text-emerald-600 text-base sm:text-lg leading-none">
          ✅
        </span>
      )}
      {resultState === "incorrect" && (
        <span className="absolute bottom-1 right-1 text-rose-600 text-base sm:text-lg leading-none">
          ❌
        </span>
      )}
    </button>
  );
}

function TileContent({ item }: { item: GameObject | RecallTile }) {
  if (item.category === "emoji") {
    return <span className="text-3xl sm:text-4xl md:text-5xl leading-none">{item.emoji}</span>;
  }
  if (item.category === "shapes" && item.shape && item.color) {
    return <ShapeIcon shape={item.shape} color={item.color} className="w-3/5 h-3/5" />;
  }
  if (item.category === "colors" && item.color) {
    return (
      <div className="flex flex-col items-center gap-1 w-full h-full justify-center">
        <div
          className="w-2/3 h-2/3 rounded-xl shadow-inner border border-black/10"
          style={{ backgroundColor: item.color }}
        />
        <span className="text-[10px] sm:text-xs font-medium text-slate-600 truncate px-1">
          {item.colorName}
        </span>
      </div>
    );
  }
  return (
    <span className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-700">
      {item.text}
    </span>
  );
}
