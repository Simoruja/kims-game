import { Category, GameObject, ShapeKind } from "./types";

const COLORS: { name: string; hex: string }[] = [
  { name: "Red", hex: "#ef4444" },
  { name: "Orange", hex: "#f97316" },
  { name: "Amber", hex: "#f59e0b" },
  { name: "Yellow", hex: "#eab308" },
  { name: "Lime", hex: "#84cc16" },
  { name: "Green", hex: "#22c55e" },
  { name: "Emerald", hex: "#10b981" },
  { name: "Teal", hex: "#14b8a6" },
  { name: "Cyan", hex: "#06b6d4" },
  { name: "Sky", hex: "#0ea5e9" },
  { name: "Blue", hex: "#3b82f6" },
  { name: "Indigo", hex: "#6366f1" },
  { name: "Violet", hex: "#8b5cf6" },
  { name: "Purple", hex: "#a855f7" },
  { name: "Pink", hex: "#ec4899" },
  { name: "Rose", hex: "#f43f5e" },
];

const SHAPES: ShapeKind[] = [
  "circle",
  "square",
  "triangle",
  "star",
  "hexagon",
  "pentagon",
  "diamond",
  "heart",
];

const EMOJIS: string[] = [
  "🐶", "🐱", "🐵", "🦊", "🐸", "🐼", "🐷", "🐥", "🦁", "🐮",
  "🍎", "🍌", "🍇", "🍉", "🍓", "🍍", "🥑", "🍕", "🍩", "🍪",
  "⚽", "🏀", "🎸", "🎲", "🎁", "🚀", "🚗", "✈️", "⛵", "🚲",
  "🌟", "🌈", "☀️", "🌙", "⚡", "❄️", "🔥", "🌸", "🍀", "🌵",
  "🎧", "📷", "💡", "🔑", "🧩", "🎯", "🪀", "🎺", "⏰", "🧸",
];

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export const ALL_CATEGORIES: Category[] = [
  "emoji",
  "shapes",
  "numbers",
  "letters",
  "colors",
];

export const CATEGORY_LABEL: Record<Category, string> = {
  emoji: "Emoji",
  shapes: "Shapes",
  numbers: "Numbers",
  letters: "Letters",
  colors: "Colors",
};

/**
 * Generates `count` unique GameObjects for a category, preferring keys not
 * present in `exclude` so repeated tiles are avoided whenever the pool is
 * big enough.
 */
export function generateObjects(
  category: Category,
  count: number,
  exclude: Set<string> = new Set()
): GameObject[] {
  switch (category) {
    case "emoji": {
      const pool = shuffle(EMOJIS).filter((e) => !exclude.has(e));
      const chosen = (pool.length >= count ? pool : shuffle(EMOJIS)).slice(0, count);
      return chosen.map((emoji) => ({
        key: emoji,
        category,
        label: emoji,
        emoji,
      }));
    }
    case "shapes": {
      const combos = shuffle(
        SHAPES.flatMap((shape) => COLORS.map((c) => ({ shape, color: c })))
      );
      const filtered = combos.filter(
        (c) => !exclude.has(`${c.shape}-${c.color.name}`)
      );
      const source = filtered.length >= count ? filtered : combos;
      return source.slice(0, count).map(({ shape, color }) => ({
        key: `${shape}-${color.name}`,
        category,
        label: `${color.name} ${shape[0].toUpperCase()}${shape.slice(1)}`,
        shape,
        color: color.hex,
        colorName: color.name,
      }));
    }
    case "numbers": {
      const nums = new Set<number>();
      while (nums.size < count) {
        const n = randomInt(10, 99);
        if (!exclude.has(String(n))) nums.add(n);
      }
      return [...nums].map((n) => ({
        key: String(n),
        category,
        label: String(n),
        text: String(n),
      }));
    }
    case "letters": {
      const alphabet = shuffle("ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""));
      const filtered = alphabet.filter((l) => !exclude.has(l));
      const source = filtered.length >= count ? filtered : alphabet;
      return source.slice(0, count).map((letter) => ({
        key: letter,
        category,
        label: letter,
        text: letter,
      }));
    }
    case "colors": {
      const pool = shuffle(COLORS).filter((c) => !exclude.has(c.name));
      const source = pool.length >= count ? pool : shuffle(COLORS);
      return source.slice(0, count).map((c) => ({
        key: c.name,
        category,
        label: c.name,
        color: c.hex,
        colorName: c.name,
      }));
    }
  }
}

/** A shuffled queue of categories with no immediate repeat when it refills. */
export function nextCategoryQueue(previous?: Category): Category[] {
  const queue = shuffle(ALL_CATEGORIES);
  if (previous && queue[0] === previous) {
    [queue[0], queue[1]] = [queue[1], queue[0]];
  }
  return queue;
}

export { shuffle };
