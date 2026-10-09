"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Category, GameObject, Phase, RecallTile, RoundResult } from "@/lib/types";
import { CATEGORY_LABEL, nextCategoryQueue } from "@/lib/categories";
import {
  TOTAL_ROUNDS,
  buildRound,
  memorizeSecondsForCount,
  recallSecondsForCount,
} from "@/lib/rounds";
import Tray from "./Tray";
import ObjectTile from "./ObjectTile";

export default function GameApp() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [round, setRound] = useState(1);
  const [categoryQueue, setCategoryQueue] = useState<Category[]>([]);
  const [lastCategory, setLastCategory] = useState<Category | undefined>();

  const [category, setCategory] = useState<Category>("emoji");
  const [itemCount, setItemCount] = useState(5);
  const [changeCount, setChangeCount] = useState(2);
  const [originals, setOriginals] = useState<GameObject[]>([]);
  const [recallTiles, setRecallTiles] = useState<RecallTile[]>([]);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [lastTimedOut, setLastTimedOut] = useState(false);

  const [secondsLeft, setSecondsLeft] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const secondsRef = useRef(0);
  const phaseRef = useRef<Phase>(phase);
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  // Always-latest refs so the interval callback (set up once per phase/round)
  // never acts on a stale closure of these handlers.
  const goToShufflingRef = useRef<() => void>(() => {});
  const finishRoundRef = useRef<(timedOut: boolean) => void>(() => {});

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => clearTimer, [clearTimer]);

  const setupRound = useCallback(
    (roundNumber: number, queue: Category[]) => {
      let activeQueue = queue;
      if (activeQueue.length === 0) {
        activeQueue = nextCategoryQueue(lastCategory);
      }
      const [picked, ...rest] = activeQueue;
      const setup = buildRound(roundNumber, picked);

      setCategory(setup.category);
      setItemCount(setup.itemCount);
      setChangeCount(setup.changeCount);
      setOriginals(setup.originals);
      setRecallTiles(setup.recallTiles);
      setCategoryQueue(rest);
      setLastCategory(picked);
      setLastTimedOut(false);

      const memSeconds = memorizeSecondsForCount(setup.itemCount);
      secondsRef.current = memSeconds;
      setSecondsLeft(memSeconds);
      setTotalSeconds(memSeconds);
      setPhase("memorize");
    },
    [lastCategory]
  );

  const startGame = useCallback(() => {
    setResults([]);
    setRound(1);
    setupRound(1, nextCategoryQueue());
  }, [setupRound]);

  const goToShuffling = useCallback(() => {
    clearTimer();
    setPhase("shuffling");
    window.setTimeout(() => {
      const recSeconds = recallSecondsForCount(itemCount);
      secondsRef.current = recSeconds;
      setSecondsLeft(recSeconds);
      setTotalSeconds(recSeconds);
      setPhase("recall");
    }, 700);
  }, [clearTimer, itemCount]);

  const finishRound = useCallback(
    (timedOut: boolean) => {
      clearTimer();
      setLastTimedOut(timedOut);
      const correctCount = recallTiles.filter((t) => t.selected === t.isNew).length;
      const result: RoundResult = {
        round,
        category,
        itemCount,
        changeCount,
        tiles: recallTiles,
        correctCount,
        timedOut,
      };
      setResults((prev) => [...prev, result]);
      setPhase("roundResult");
    },
    [category, changeCount, clearTimer, itemCount, recallTiles, round]
  );

  useEffect(() => {
    goToShufflingRef.current = goToShuffling;
  }, [goToShuffling]);
  useEffect(() => {
    finishRoundRef.current = finishRound;
  }, [finishRound]);

  // Countdown ticker for memorize + recall phases. secondsRef is the source
  // of truth; the expiry transition fires from inside the interval callback
  // (an async timer tick, not the effect's synchronous body).
  useEffect(() => {
    if (phase !== "memorize" && phase !== "recall") return;
    clearTimer();
    timerRef.current = setInterval(() => {
      secondsRef.current -= 1;
      if (secondsRef.current <= 0) {
        secondsRef.current = 0;
        setSecondsLeft(0);
        clearTimer();
        if (phaseRef.current === "memorize") {
          goToShufflingRef.current();
        } else if (phaseRef.current === "recall") {
          finishRoundRef.current(true);
        }
      } else {
        setSecondsLeft(secondsRef.current);
      }
    }, 1000);
    return clearTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, round]);

  const toggleTile = (id: string) => {
    setRecallTiles((tiles) =>
      tiles.map((t) => (t.id === id ? { ...t, selected: !t.selected } : t))
    );
  };

  const goNextRound = () => {
    if (round >= TOTAL_ROUNDS) {
      setPhase("gameOver");
      return;
    }
    const nextRoundNumber = round + 1;
    setRound(nextRoundNumber);
    setupRound(nextRoundNumber, categoryQueue);
  };

  const totalCorrect = results.reduce((sum, r) => sum + r.correctCount, 0);
  const totalTiles = results.reduce((sum, r) => sum + r.itemCount, 0);

  return (
    <div className="min-h-dvh flex flex-col bg-gradient-to-b from-violet-50 via-white to-indigo-50">
      <Header
        phase={phase}
        round={round}
        totalRounds={TOTAL_ROUNDS}
        totalCorrect={totalCorrect}
        totalTiles={totalTiles}
        onRestart={phase === "intro" ? undefined : startGame}
      />

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-6 gap-6">
        {phase === "intro" && <IntroScreen onStart={startGame} />}

        {phase === "memorize" && (
          <MemorizeScreen
            category={category}
            items={originals}
            secondsLeft={secondsLeft}
            totalSeconds={totalSeconds}
            onReady={goToShuffling}
          />
        )}

        {phase === "shuffling" && <ShufflingScreen />}

        {phase === "recall" && (
          <RecallScreen
            category={category}
            tiles={recallTiles}
            secondsLeft={secondsLeft}
            totalSeconds={totalSeconds}
            onToggle={toggleTile}
            onSubmit={() => finishRound(false)}
          />
        )}

        {phase === "roundResult" && (
          <RoundResultScreen
            round={round}
            totalRounds={TOTAL_ROUNDS}
            category={category}
            tiles={recallTiles}
            timedOut={lastTimedOut}
            onNext={goNextRound}
          />
        )}

        {phase === "gameOver" && (
          <GameOverScreen
            results={results}
            totalCorrect={totalCorrect}
            totalTiles={totalTiles}
            onRestart={startGame}
          />
        )}
      </main>

      <footer className="text-center text-xs text-slate-400 pb-4">
        Works on phones, tablets, and desktops — tap or click to play.
      </footer>
    </div>
  );
}

function Header({
  phase,
  round,
  totalRounds,
  totalCorrect,
  totalTiles,
  onRestart,
}: {
  phase: Phase;
  round: number;
  totalRounds: number;
  totalCorrect: number;
  totalTiles: number;
  onRestart?: () => void;
}) {
  return (
    <header className="flex items-center justify-between gap-2 px-4 py-3 border-b border-slate-200 bg-white/70 backdrop-blur sticky top-0 z-10">
      <div className="flex items-center gap-2 font-bold text-slate-800">
        <span className="text-2xl">🧠</span>
        <span className="text-base sm:text-lg">Kim&apos;s Game</span>
      </div>
      <div className="flex items-center gap-2 text-xs sm:text-sm">
        {phase !== "intro" && (
          <span className="px-2.5 py-1 rounded-full bg-violet-100 text-violet-700 font-semibold">
            Round {round}/{totalRounds}
          </span>
        )}
        {totalTiles > 0 && (
          <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 font-semibold">
            Score {totalCorrect}/{totalTiles}
          </span>
        )}
        {onRestart && (
          <button
            onClick={onRestart}
            className="px-2.5 py-1 rounded-full border border-slate-300 text-slate-500 hover:bg-slate-100 active:scale-95 transition"
          >
            Restart
          </button>
        )}
      </div>
    </header>
  );
}

function IntroScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="max-w-md text-center space-y-5">
      <h1 className="text-3xl font-extrabold text-slate-800">Kim&apos;s Game</h1>
      <p className="text-slate-600">
        Study the tray of objects, then watch closely as it changes. Tap every
        object that&apos;s <span className="font-semibold text-violet-600">new</span> —
        the ones that weren&apos;t there before.
      </p>
      <p className="text-sm text-slate-500">
        Every round mixes things up with emoji, shapes, numbers, letters, or
        colors, so you&apos;ll never see the same tray twice. After each round
        you&apos;ll see exactly what you got right and wrong.
      </p>
      <button
        onClick={onStart}
        className="px-8 py-3 rounded-full bg-violet-600 text-white font-bold text-lg shadow-lg hover:bg-violet-700 active:scale-95 transition touch-manipulation"
      >
        Start Game
      </button>
    </div>
  );
}

function TimerBar({ secondsLeft, totalSeconds }: { secondsLeft: number; totalSeconds: number }) {
  const pct = totalSeconds > 0 ? Math.max(0, Math.min(100, (secondsLeft / totalSeconds) * 100)) : 0;
  return (
    <div className="w-full max-w-md h-2 rounded-full bg-slate-200 overflow-hidden">
      <div
        className="h-full bg-violet-500 transition-all duration-500 ease-linear"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function MemorizeScreen({
  category,
  items,
  secondsLeft,
  totalSeconds,
  onReady,
}: {
  category: Category;
  items: GameObject[];
  secondsLeft: number;
  totalSeconds: number;
  onReady: () => void;
}) {
  return (
    <div className="w-full flex flex-col items-center gap-4">
      <p className="text-slate-600 text-sm sm:text-base text-center">
        Memorize these <span className="font-semibold">{CATEGORY_LABEL[category]}</span> —{" "}
        <span className="font-mono text-violet-600">{secondsLeft}s</span> left
      </p>
      <TimerBar secondsLeft={secondsLeft} totalSeconds={totalSeconds} />
      <Tray>
        {items.map((item) => (
          <ObjectTile key={item.key} item={item} />
        ))}
      </Tray>
      <button
        onClick={onReady}
        className="px-6 py-2.5 rounded-full bg-slate-800 text-white font-semibold shadow hover:bg-slate-900 active:scale-95 transition touch-manipulation"
      >
        I&apos;m ready — hide the tray
      </button>
    </div>
  );
}

function ShufflingScreen() {
  return (
    <div className="flex flex-col items-center gap-3 text-slate-500">
      <div className="text-5xl animate-bounce">🔀</div>
      <p className="font-medium">Changing the tray…</p>
    </div>
  );
}

function RecallScreen({
  category,
  tiles,
  secondsLeft,
  totalSeconds,
  onToggle,
  onSubmit,
}: {
  category: Category;
  tiles: RecallTile[];
  secondsLeft: number;
  totalSeconds: number;
  onToggle: (id: string) => void;
  onSubmit: () => void;
}) {
  const selectedCount = tiles.filter((t) => t.selected).length;
  return (
    <div className="w-full flex flex-col items-center gap-4">
      <p className="text-slate-600 text-sm sm:text-base text-center">
        Tap every <span className="font-semibold text-violet-600">new</span>{" "}
        {CATEGORY_LABEL[category].toLowerCase()} —{" "}
        <span className="font-mono text-violet-600">{secondsLeft}s</span> left
      </p>
      <TimerBar secondsLeft={secondsLeft} totalSeconds={totalSeconds} />
      <Tray>
        {tiles.map((tile) => (
          <ObjectTile
            key={tile.id}
            item={tile}
            selected={tile.selected}
            onClick={() => onToggle(tile.id)}
          />
        ))}
      </Tray>
      <button
        onClick={onSubmit}
        className="px-6 py-2.5 rounded-full bg-violet-600 text-white font-semibold shadow hover:bg-violet-700 active:scale-95 transition touch-manipulation"
      >
        Submit answer{selectedCount > 0 ? ` (${selectedCount} selected)` : ""}
      </button>
    </div>
  );
}

function RoundResultScreen({
  round,
  totalRounds,
  category,
  tiles,
  timedOut,
  onNext,
}: {
  round: number;
  totalRounds: number;
  category: Category;
  tiles: RecallTile[];
  timedOut: boolean;
  onNext: () => void;
}) {
  const correctCount = tiles.filter((t) => t.selected === t.isNew).length;
  const isLastRound = round >= totalRounds;

  return (
    <div className="w-full flex flex-col items-center gap-4">
      <h2 className="text-xl font-bold text-slate-800">
        Round {round} results — {CATEGORY_LABEL[category]}
      </h2>
      {timedOut && (
        <p className="text-xs text-amber-600 font-medium">⏱ Time ran out — answer auto-submitted.</p>
      )}
      <p className="text-slate-600">
        You got{" "}
        <span className="font-bold text-violet-600">
          {correctCount}/{tiles.length}
        </span>{" "}
        correct
      </p>

      <Tray>
        {tiles.map((tile) => {
          const correct = tile.selected === tile.isNew;
          return (
            <ObjectTile
              key={tile.id}
              item={tile}
              selected={tile.selected}
              resultState={correct ? "correct" : "incorrect"}
              resultBadge={tile.isNew ? "NEW" : "ORIG"}
              disabled
            />
          );
        })}
      </Tray>

      <p className="text-xs text-slate-500 text-center max-w-md">
        ✅ = you called it right · ❌ = you called it wrong · badge shows whether
        the object was NEW or already on the original tray.
      </p>

      <button
        onClick={onNext}
        className="px-6 py-2.5 rounded-full bg-slate-800 text-white font-semibold shadow hover:bg-slate-900 active:scale-95 transition touch-manipulation"
      >
        {isLastRound ? "See final results" : "Next round"}
      </button>
    </div>
  );
}

function GameOverScreen({
  results,
  totalCorrect,
  totalTiles,
  onRestart,
}: {
  results: RoundResult[];
  totalCorrect: number;
  totalTiles: number;
  onRestart: () => void;
}) {
  const pct = totalTiles > 0 ? Math.round((totalCorrect / totalTiles) * 100) : 0;

  return (
    <div className="w-full max-w-md flex flex-col items-center gap-5 text-center">
      <h2 className="text-2xl font-extrabold text-slate-800">🏁 Game Over</h2>
      <p className="text-slate-600">
        Final score:{" "}
        <span className="font-bold text-violet-600">
          {totalCorrect}/{totalTiles}
        </span>{" "}
        ({pct}%)
      </p>

      <div className="w-full divide-y divide-slate-200 rounded-xl border border-slate-200 overflow-hidden bg-white">
        {results.map((r) => (
          <div key={r.round} className="flex items-center justify-between px-4 py-2.5 text-sm">
            <span className="text-slate-500">
              Round {r.round} · {CATEGORY_LABEL[r.category]}
            </span>
            <span className="font-semibold text-slate-800">
              {r.correctCount}/{r.itemCount}
            </span>
          </div>
        ))}
      </div>

      <button
        onClick={onRestart}
        className="px-8 py-3 rounded-full bg-violet-600 text-white font-bold text-lg shadow-lg hover:bg-violet-700 active:scale-95 transition touch-manipulation"
      >
        Play again
      </button>
    </div>
  );
}
