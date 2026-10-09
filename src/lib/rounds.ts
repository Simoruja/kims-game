import { Category, GameObject, RecallTile } from "./types";
import { generateObjects, shuffle } from "./categories";

export const TOTAL_ROUNDS = 5;

export function itemCountForRound(round: number): number {
  return Math.min(4 + round, 9);
}

export function changeCountForRound(round: number, itemCount: number): number {
  const base = 2 + Math.floor((round - 1) / 2);
  return Math.min(Math.max(base, 1), itemCount - 1);
}

export function memorizeSecondsForCount(itemCount: number): number {
  return itemCount + 4;
}

export function recallSecondsForCount(itemCount: number): number {
  return itemCount * 3;
}

export interface RoundSetup {
  category: Category;
  itemCount: number;
  changeCount: number;
  originals: GameObject[];
  recallTiles: RecallTile[];
}

export function buildRound(round: number, category: Category): RoundSetup {
  const itemCount = itemCountForRound(round);
  const originals = generateObjects(category, itemCount);
  const changeCount = changeCountForRound(round, itemCount);

  const replaceIndices = new Set(
    shuffle(originals.map((_, i) => i)).slice(0, changeCount)
  );

  const excludeKeys = new Set(originals.map((o) => o.key));
  const distractors = generateObjects(category, changeCount, excludeKeys);

  let distractorCursor = 0;
  const combined: RecallTile[] = originals.map((original, i) => {
    if (replaceIndices.has(i)) {
      const distractor = distractors[distractorCursor++];
      return {
        ...distractor,
        id: `${distractor.key}-${i}`,
        isNew: true,
        selected: false,
      };
    }
    return {
      ...original,
      id: `${original.key}-${i}`,
      isNew: false,
      selected: false,
    };
  });

  const recallTiles = shuffle(combined);

  return { category, itemCount, changeCount, originals, recallTiles };
}
