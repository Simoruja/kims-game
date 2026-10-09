export type Category = "emoji" | "shapes" | "numbers" | "letters" | "colors";

export type ShapeKind =
  | "circle"
  | "square"
  | "triangle"
  | "star"
  | "hexagon"
  | "pentagon"
  | "diamond"
  | "heart";

export interface GameObject {
  /** Stable identity key used for equality/dedup (unique within a round). */
  key: string;
  category: Category;
  /** Human-readable label, used in results and for accessibility. */
  label: string;
  /** Emoji glyph, when category === "emoji". */
  emoji?: string;
  /** Shape + color, when category === "shapes". */
  shape?: ShapeKind;
  color?: string;
  colorName?: string;
  /** Text content, when category is "numbers" or "letters". */
  text?: string;
}

export interface RecallTile extends GameObject {
  /** Unique instance id for React keys (position in the recall grid). */
  id: string;
  /** Ground truth: was this object NOT present in the memorize tray? */
  isNew: boolean;
  /** Did the player tap this tile as "new"? */
  selected: boolean;
}

export interface RoundResult {
  round: number;
  category: Category;
  itemCount: number;
  changeCount: number;
  tiles: RecallTile[];
  correctCount: number;
  timedOut: boolean;
}

export type Phase =
  | "intro"
  | "memorize"
  | "shuffling"
  | "recall"
  | "roundResult"
  | "gameOver";
