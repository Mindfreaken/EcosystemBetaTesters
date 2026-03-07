"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Box from "@mui/material/Box";
import LeaderboardModal from "./LeaderboardModal";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { useMutation, useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { themeVar } from "@/theme/registry";

type NerdlePuzzle = {
  // The answer the player must guess. For Valorant data, this is typically the displayName; for terminology it is the term
  answer: string;
  // Category shown as the primary hint (e.g., Agents, Buddies, Terminology)
  category: string;
  // Optional secondary hint (e.g., Agents role like "Initiator")
  secondaryHint?: string | null;
  // Optional label for the secondary hint (defaults to "Hint")
  secondaryHintLabel?: string;
};

// Shared statuses
type TileStatus = "correct" | "present" | "absent" | "hint";
type KeyboardStatus = "correct" | "present" | "absent";

function inferCategoryFromId(game?: string, id?: number): string | null {
  if (typeof id !== 'number') return null;
  const k = Math.floor(id / 1000);
  if (game === 'minecraft') {
    switch (k) {
      case 1: return "Biomes";
      case 2: return "Blocks";
      case 3: return "Effects";
      case 4: return "Enchantments";
      case 5: return "Foods";
      default: return null;
    }
  }
  switch (k) {
    case 1: return "Skins";
    case 2: return "Agents";
    case 3: return "Buddies";
    case 4: return "Bundles";
    case 5: return "Gamemodes";
    case 6: return "Maps";
    case 7: return "Titles";
    case 8: return "Terminology";
    default: return null;
  }
}

export default function NerdleGameBoard({
  puzzle,
  baseGuesses = 6,
  nextRolloverAt,
  game,
  date,
  wordId,
  themeColor = "primary",
}: {
  puzzle: NerdlePuzzle;
  baseGuesses?: number;
  nextRolloverAt?: number;
  game?: string;
  date?: string;
  wordId?: number;
  themeColor?: "primary" | "secondary";
}) {
  const keysRow1 = ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"];
  const keysRow2 = ["A", "S", "D", "F", "G", "H", "J", "K", "L"];
  const keysRow3 = ["Enter", "Z", "X", "C", "V", "B", "N", "M", "⌫"];

  const [usedPrimaryHint, setUsedPrimaryHint] = useState(false);

  // Basic input state (no validation/scoring yet)
  const [guesses, setGuesses] = useState<string[]>([]); // committed guesses
  const [currentGuess, setCurrentGuess] = useState<string>("");
  const [currentRow, setCurrentRow] = useState<number>(0);
  const [currentCol, setCurrentCol] = useState<number>(0);
  const [scores, setScores] = useState<Array<Array<TileStatus>>>([]);
  const [gameOver, setGameOver] = useState(false);
  const [didWin, setDidWin] = useState(false);
  const [keyStatuses, setKeyStatuses] = useState<Record<string, KeyboardStatus | undefined>>({});
  // Timer state
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const [rolloverRemainingMs, setRolloverRemainingMs] = useState<number | null>(null);
  const [guessCount, setGuessCount] = useState<number>(0);
  const [started, setStarted] = useState<boolean>(false);
  const [finished, setFinished] = useState<boolean>(false);
  const [lastGuessIndex, setLastGuessIndex] = useState<number | null>(null);
  const [lastGuessText, setLastGuessText] = useState<string | null>(null);
  const [showResults, setShowResults] = useState<boolean>(false);
  const [showLeaderboard, setShowLeaderboard] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [validating, setValidating] = useState<boolean>(false);
  // Hint confirmation state
  const [confirmHint, setConfirmHint] = useState(false);
  const confirmHintTimeout = useRef<number | null>(null);

  // Using a hint increases remaining guesses by +1. This models: have 2 guesses, use hint -> now 3 guesses
  const burnHintRow = () => {
    // Consume the current row visually with a red hint row
    setScores((prev) => {
      const next = [...prev];
      next[currentRow] = Array(lettersOnlyCount).fill("hint");
      return next;
    });
    setGuesses((prev) => {
      const next = [...prev];
      // Put a visible placeholder so the user sees the hint row
      const label = "HINT";
      const padded = (label + " ").repeat(Math.ceil(lettersOnlyCount / (label.length + 1))).slice(0, lettersOnlyCount);
      next[currentRow] = padded.toUpperCase();
      return next;
    });
    // Clear any partially typed input since the hint consumed this row
    setCurrentGuess("");
    setCurrentRow((r) => r + 1);
    setCurrentCol(0);
  };

  // Auto-cancel confirm state after 3 seconds
  useEffect(() => {
    if (confirmHint) {
      if (confirmHintTimeout.current) window.clearTimeout(confirmHintTimeout.current);
      confirmHintTimeout.current = window.setTimeout(() => {
        setConfirmHint(false);
        confirmHintTimeout.current = null;
      }, 3000);
    }
    return () => {
      if (confirmHintTimeout.current) {
        window.clearTimeout(confirmHintTimeout.current);
        confirmHintTimeout.current = null;
      }
    };
  }, [confirmHint]);

  // Timer effect with 10-minute cap and millisecond precision
  useEffect(() => {
    if (!startTime || gameOver) return;
    const MAX_MS = 10 * 60 * 1000; // 10 minutes
    const id = window.setInterval(() => {
      const ms = Date.now() - startTime;
      const clamped = ms >= MAX_MS ? MAX_MS : ms;
      setElapsedMs(clamped);
      if (clamped >= MAX_MS) {
        window.clearInterval(id);
      }
    }, 50); // update ~20 times/sec for smooth ms display
    return () => window.clearInterval(id);
  }, [startTime, gameOver]);

  useEffect(() => {
    if (gameOver) setShowResults(true);
  }, [gameOver]);

  const fmtTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60)
      .toString()
      .padStart(2, "0");
    const s = (totalSec % 60).toString().padStart(2, "0");
    const msPart = (ms % 1000).toString().padStart(3, "0");
    return `${m}:${s}.${msPart}`;
  };

  const fmtCountdown = (ms: number) => {
    if (ms < 0) ms = 0;
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600).toString().padStart(2, "0");
    const m = Math.floor((totalSec % 3600) / 60).toString().padStart(2, "0");
    const s = (totalSec % 60).toString().padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  useEffect(() => {
    if (!nextRolloverAt) {
      setRolloverRemainingMs(null);
      return;
    }
    const update = () => setRolloverRemainingMs(nextRolloverAt - Date.now());
    update();
    const id = window.setInterval(update, 1000);
    return () => window.clearInterval(id);
  }, [nextRolloverAt]);

  // Convex mutations for play tracking
  const startPlay = useMutation(api.dailies.nerdle.plays.start);
  const finishPlay = useMutation(api.dailies.nerdle.plays.finish);
  const progressPlay = useMutation(api.dailies.nerdle.plays.progress);
  const existingPlay = useQuery(
    api.dailies.nerdle.plays.getPlay,
    game && date && typeof wordId === "number" ? { game, date, wordId } : "skip"
  );

  const checkWords = useMutation(api.dailies.nerdle.words.checkWords);

  // Start when board is viewed with a valid word
  useEffect(() => {
    if (!started && game && date && typeof wordId === "number") {
      void startPlay({ game, date, wordId })
        .then(() => setStarted(true))
        .catch(() => { });
    }
  }, [started, game, date, wordId, startPlay]);

  // Finish on game over
  useEffect(() => {
    if (!gameOver || finished) return;
    if (game && date && typeof wordId === "number") {
      void finishPlay({
        game,
        date,
        wordId,
        win: didWin,
        guesses: guessCount,
        usedHint: usedPrimaryHint,
        lastGuessIndex: lastGuessIndex ?? undefined,
        lastGuessText: lastGuessText ?? undefined,
      })
        .then(() => setFinished(true))
        .catch(() => { });
    }
  }, [gameOver, finished, game, date, wordId, didWin, guessCount, usedPrimaryHint, lastGuessIndex, lastGuessText, finishPlay]);

  // No client-side DNF on unmount; DNFs are only backfilled for past days

  const usePrimaryHint = () => {
    if (usedPrimaryHint || gameOver) return;
    if (!startTime) setStartTime(Date.now());
    setUsedPrimaryHint(true);
    // Hint consumes a row AND counts as a guess
    const nextCount = guessCount + 1;
    setGuessCount(nextCount);
    burnHintRow();
    // persist hint usage and incremented guesses for in-progress game
    if (game && date && typeof wordId === "number") {
      // Persist a sentinel guess text so hydration can reconstruct the hint row
      void progressPlay({ game, date, wordId, guesses: nextCount, usedHint: true, guessIndex: currentRow, guessText: "__HINT__" }).catch(() => { });
    }
  };
  // Secondary hints removed: only one hint (category)

  // For display layout: break the answer into characters; only A–Z count as letters the player must type
  const answerChars = useMemo(() => Array.from(puzzle.answer), [puzzle.answer]);
  const normalizedAnswer = useMemo(
    () => puzzle.answer.replace(/[^A-Za-z]/g, "").toUpperCase(),
    [puzzle.answer]
  );
  const lettersOnlyCount = normalizedAnswer.length;
  const tokenLengths = useMemo(() => {
    return puzzle.answer
      .split(/\s+/)
      .filter(Boolean)
      .map(w => w.replace(/[^A-Za-z]/g, "").length)
      .filter(len => len > 0);
  }, [puzzle.answer]);

  // Dynamic tile sizing for long phrases
  const tileDims = useMemo(() => {
    // default
    let w = 44, h = 52;
    if (lettersOnlyCount > 28) { w = 32; h = 40; }
    else if (lettersOnlyCount > 22) { w = 36; h = 44; }
    else if (lettersOnlyCount > 18) { w = 40; h = 48; }
    return { w, h };
  }, [lettersOnlyCount]);
  const spaceGapPx = Math.max(10, Math.round(tileDims.w * 0.28));

  // Total rows are fixed to the base number of guesses.
  const totalRows = baseGuesses;
  const rows = useMemo(() => Array.from({ length: totalRows }), [totalRows]);
  const remainingTries = Math.max(totalRows - currentRow, 0);

  // Hydrate from Convex play if available and not finished locally
  useEffect(() => {
    if (!existingPlay) return;
    // If server says finished, reflect that immediately
    if (existingPlay.status && existingPlay.status !== 'started') {
      setGameOver(true);
      setDidWin(existingPlay.status === 'win');
      setFinished(true);
      if (typeof existingPlay.durationMs === 'number') {
        setElapsedMs(existingPlay.durationMs);
      }
    }
    // If in progress, seed the client timer with server startedAt
    if (existingPlay.status === 'started' && typeof existingPlay.startedAt === 'number') {
      setStartTime(existingPlay.startedAt);
      const now = Date.now();
      const ms = Math.max(0, now - existingPlay.startedAt);
      setElapsedMs(ms);
    }
    // Build guesses list from guess1..guess6
    const texts = [existingPlay.guess1, existingPlay.guess2, existingPlay.guess3, existingPlay.guess4, existingPlay.guess5, existingPlay.guess6]
      .filter((g): g is string => typeof g === 'string' && g.length > 0);
    if (texts.length === 0) return;
    const clamped = texts.slice(0, totalRows);
    // Set guesses and scores
    setGuesses(clamped.map(t => {
      if (t === "__HINT__") {
        const label = "HINT";
        const padded = (label + " ").repeat(Math.ceil(lettersOnlyCount / (label.length + 1))).slice(0, lettersOnlyCount);
        return padded.toUpperCase();
      }
      return t.toUpperCase();
    }));
    setGuessCount(Math.max(existingPlay.guesses ?? clamped.length, clamped.length));
    const computedScores: Array<Array<TileStatus>> = [];
    clamped.forEach((t) => {
      if (t === "__HINT__") {
        computedScores.push(Array(lettersOnlyCount).fill("hint"));
        return;
      }
      const normalized = t.replace(/[^A-Za-z]/g, "").toUpperCase();
      if (normalized.length === lettersOnlyCount) {
        const rowScore = ((): Array<TileStatus> => {
          const res: Array<TileStatus> = Array(lettersOnlyCount).fill("absent");
          const ansArr = Array.from(normalizedAnswer);
          const used: boolean[] = Array(lettersOnlyCount).fill(false);
          const gArr = Array.from(normalized);
          for (let i = 0; i < lettersOnlyCount; i++) {
            if (gArr[i] === ansArr[i]) { res[i] = "correct"; used[i] = true; gArr[i] = "\u0000"; }
          }
          for (let i = 0; i < lettersOnlyCount; i++) {
            if (res[i] === "correct") continue;
            const ch = gArr[i];
            if (!ch || ch === "\u0000") continue;
            let found = -1;
            for (let j = 0; j < lettersOnlyCount; j++) {
              if (!used[j] && ansArr[j] === ch) { found = j; break; }
            }
            if (found !== -1) { res[i] = "present"; used[found] = true; }
          }
          return res;
        })();
        computedScores.push(rowScore);
      } else {
        // Not full length: treat as empty row for now
        computedScores.push([] as any);
      }
    });
    setScores(computedScores);
    setCurrentRow(clamped.length);
    // Rebuild keyboard statuses
    const rebuilt: Record<string, KeyboardStatus | undefined> = {};
    computedScores.forEach((row, idx) => {
      const guess = clamped[idx].toUpperCase();
      row.forEach((st, i) => {
        if (st === 'hint') return;
        const ch = guess.replace(/[^A-Za-z]/g, "").toUpperCase()[i];
        if (!ch) return;
        const prev = rebuilt[ch];
        if (prev === 'correct') return;
        if (st === 'correct') rebuilt[ch] = 'correct';
        else if (st === 'present') { if (rebuilt[ch] !== 'correct') rebuilt[ch] = 'present'; }
        else if (st === 'absent') { if (!prev) rebuilt[ch] = 'absent'; }
      });
    });
    setKeyStatuses(rebuilt);
    setUsedPrimaryHint(!!existingPlay.usedHint);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingPlay?._id]);

  // Input handlers
  const canType = currentRow < totalRows && !gameOver;
  const handleChar = (ch: string) => {
    if (!canType) return;
    if (!/^[A-Za-z]$/.test(ch)) return;
    if (currentCol < 0 || currentCol >= lettersOnlyCount) return;
    const upper = ch.toUpperCase();
    setCurrentGuess((prev) => {
      const arr = prev.toUpperCase().split("");
      while (arr.length < lettersOnlyCount) arr.push("");
      arr[currentCol] = upper;
      const next = arr.join("").replace(/\s+$/g, "");
      return next;
    });
    setCurrentCol((c) => Math.min(lettersOnlyCount - 1, c + 1));
  };
  const handleDelete = () => {
    if (!canType) return;
    setCurrentCol((c) => {
      const nextCol = c > 0 ? c - 1 : 0;
      setCurrentGuess((prev) => {
        const arr = prev.toUpperCase().split("");
        while (arr.length < lettersOnlyCount) arr.push("");
        arr[nextCol] = "";
        const next = arr.join("").replace(/\s+$/g, "");
        return next;
      });
      return nextCol;
    });
  };
  const scoreGuess = (guess: string): Array<TileStatus> => {
    const res: Array<TileStatus> = Array(lettersOnlyCount).fill("absent");
    const ansArr = Array.from(normalizedAnswer);
    const used: boolean[] = Array(lettersOnlyCount).fill(false);
    const gArr = Array.from(guess.toUpperCase());
    // pass 1: correct
    for (let i = 0; i < lettersOnlyCount; i++) {
      if (gArr[i] === ansArr[i]) {
        res[i] = "correct";
        used[i] = true;
        gArr[i] = "\u0000"; // mark consumed
      }
    }
    // pass 2: present
    for (let i = 0; i < lettersOnlyCount; i++) {
      if (res[i] === "correct") continue;
      const ch = gArr[i];
      if (!ch || ch === "\u0000") continue;
      let found = -1;
      for (let j = 0; j < lettersOnlyCount; j++) {
        if (!used[j] && ansArr[j] === ch) {
          found = j; break;
        }
      }
      if (found !== -1) {
        res[i] = "present";
        used[found] = true;
      }
    }
    return res;
  };

  const handleEnter = async () => {
    if (!canType || validating) return;
    if (currentGuess.length !== lettersOnlyCount) return; // require full length for now
    // Skip external dictionary validation so any full-length guess is allowed.
    setValidationError(null);
    setValidating(false);
    if (!startTime) setStartTime(Date.now());
    const guess = currentGuess.toUpperCase();
    const rowScore = scoreGuess(guess);
    const isWin = guess === normalizedAnswer;
    const nextCount = guessCount + 1;
    setGuessCount(nextCount);
    setGuesses((prev) => {
      const next = [...prev];
      next[currentRow] = guess;
      return next;
    });
    setScores((prev) => {
      const next = [...prev];
      next[currentRow] = rowScore;
      return next;
    });
    // Update keyboard statuses with precedence: correct > present > absent
    setKeyStatuses((prev) => {
      const updated: Record<string, KeyboardStatus | undefined> = { ...prev };
      for (let i = 0; i < rowScore.length; i++) {
        const ch = guess[i];
        const status = rowScore[i];
        if (status === "hint") continue; // do not affect keyboard from hint rows
        const prevStatus = updated[ch];
        if (prevStatus === "correct") continue;
        if (status === "correct") {
          updated[ch] = "correct";
        } else if (status === "present") {
          if (updated[ch] !== "correct") updated[ch] = "present";
        } else if (status === "absent") {
          if (!prevStatus) updated[ch] = "absent";
        }
      }
      return updated;
    });
    const nextRow = currentRow + 1;
    const willGameOver = isWin || nextRow >= totalRows;
    setDidWin(isWin);
    if (willGameOver) {
      setLastGuessIndex(currentRow);
      setLastGuessText(guess);
    }
    setGameOver(willGameOver);
    setCurrentRow(nextRow);
    setCurrentGuess("");
    setCurrentCol(0);

    // Persist progress on each guess; finish call will handle terminal state
    if (game && date && typeof wordId === "number") {
      const guessIndex = currentRow; // index of the row we just committed
      const guessText = guess;       // persist the raw guess text
      if (!willGameOver) {
        void progressPlay({ game, date, wordId, guesses: nextCount, usedHint: usedPrimaryHint, guessIndex, guessText }).catch(() => { });
      }
    }
  };

  // Physical keyboard listener
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key;
      if (!canType) return;
      if (key === "ArrowLeft" || key === "ArrowRight") {
        e.preventDefault();
        return;
      }
      if (key === "Backspace") {
        e.preventDefault();
        handleDelete();
        return;
      }
      if (key === "Enter") {
        e.preventDefault();
        handleEnter();
        return;
      }
      if (/^[a-zA-Z]$/.test(key)) {
        e.preventDefault();
        handleChar(key);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [canType, lettersOnlyCount, currentGuess.length, currentRow, totalRows]);

  return (
    <div className="flex-1 min-h-0 overflow-y-auto" style={{ position: "relative" }}>
      {/* Ambient background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background: `radial-gradient(1200px 600px at 10% 0%, color-mix(in oklab, ${themeVar(themeColor ?? "primary")}, transparent 88%), transparent 65%), radial-gradient(900px 500px at 90% 10%, color-mix(in oklab, ${themeVar("secondary")}, transparent 88%), transparent 60%)`,
          maskImage: "linear-gradient(to bottom, rgba(0,0,0,.85), rgba(0,0,0,.15))",
        }}
      />

      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          p: { xs: 2, sm: 3 },
          display: "grid",
          gap: 2,
          justifyItems: "center",
          width: "100%",
        }}
      >
        {/* Removed nerdle title header for a cleaner layout */}

        {/* Information Box: Tries left, Letters, Use Hint */}
        <Box
          sx={{
            display: 'grid',
            gridAutoFlow: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            borderRadius: 2,
            px: 2,
            py: 1,
            border: `1px solid ${themeVar("border")}`,
            background: `linear-gradient(180deg, color-mix(in oklab, ${themeVar("card")}, transparent 85%), transparent)`
          }}
        >
          <Typography variant="body2" sx={{ color: themeVar("textSecondary"), fontWeight: 600 }}>Tries left: <span style={{ color: themeVar("textLight") }}>{remainingTries}</span></Typography>
          <Typography variant="body2" sx={{ color: themeVar("textSecondary"), fontWeight: 600 }}>Letters: <span style={{ color: themeVar("textLight") }}>{lettersOnlyCount}</span></Typography>
          {typeof rolloverRemainingMs === "number" && (
            <Typography variant="body2" sx={{ color: themeVar("textSecondary"), fontWeight: 600 }}>
              Next word in: <strong style={{ color: themeVar(themeColor ?? "primary") }}>{fmtCountdown(rolloverRemainingMs)}</strong>
            </Typography>
          )}
          {/* Revealed hints */}
          {usedPrimaryHint && typeof wordId === 'number' && (
            (() => {
              const c = inferCategoryFromId(game, wordId); return c ? (
                <Typography variant="body2" sx={{ color: themeVar("textSecondary"), fontWeight: 600 }}>
                  Hint: <strong style={{ color: themeVar("highlight") }}>{c}</strong>
                </Typography>
              ) : null;
            })()
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {didWin ? (
              <Button
                size="small"
                variant="outlined"
                onClick={() => setShowLeaderboard(true)}
                sx={{
                  borderColor: themeVar("border"),
                  color: themeVar("textLight"),
                  textTransform: "none",
                  fontWeight: 700,
                  "&:hover": { borderColor: themeVar("highlight"), background: `color-mix(in oklab, ${themeVar("highlight")}, transparent 90%)` }
                }}
              >
                View statistics
              </Button>
            ) : (
              <>
                {!usedPrimaryHint && (
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      if (usedPrimaryHint || gameOver) return;
                      if (!confirmHint) {
                        setConfirmHint(true);
                        return;
                      }
                      setConfirmHint(false);
                      if (confirmHintTimeout.current) {
                        window.clearTimeout(confirmHintTimeout.current);
                        confirmHintTimeout.current = null;
                      }
                      usePrimaryHint();
                    }}
                    sx={{
                      borderColor: confirmHint ? themeVar("danger") : themeVar("border"),
                      color: confirmHint ? themeVar("danger") : themeVar("textLight"),
                      textTransform: "none",
                      fontWeight: 700,
                      "&:hover": {
                        borderColor: confirmHint ? themeVar("danger") : themeVar("highlight"),
                        background: confirmHint
                          ? `color-mix(in oklab, ${themeVar("danger")}, transparent 90%)`
                          : `color-mix(in oklab, ${themeVar("highlight")}, transparent 90%)`
                      }
                    }}
                  >
                    {confirmHint ? 'Confirm (burns 1 row)' : 'Use Hint'}
                  </Button>
                )}
                {confirmHint && (
                  <Button
                    size="small"
                    variant="text"
                    onClick={() => setConfirmHint(false)}
                    sx={{ color: themeVar("textSecondary"), textTransform: "none" }}
                  >
                    Cancel
                  </Button>
                )}
              </>
            )}
          </Box>
        </Box>
        {/* Only category hint is supported */}

        {/* Board: rows adapt to answer length and spaces */}
        <Box sx={{ display: "grid", gap: 1.1, justifyContent: "center", mt: 1, width: "100%" }}>
          {rows.map((_, rIdx) => (
            <Box
              key={rIdx}
              sx={{
                display: "flex",
                gap: 8 / 8, // 1px logical gap baseline
                justifyContent: "center",
                flexWrap: "nowrap", // keep the answer on a single line
                mx: "auto",
                px: 1,
              }}
            >
              {(() => {
                let letterPos = 0; // counts non-space positions
                return answerChars.map((ch, idx) => {
                  const isAlpha = /[A-Za-z]/.test(ch);
                  if (!isAlpha) {
                    // Render punctuation/space as a small visual gap
                    return <Box key={idx} sx={{ width: spaceGapPx, height: spaceGapPx }} />;
                  }
                  const guessedRowString = rIdx < guesses.length ? (guesses[rIdx] || "") : (rIdx === currentRow ? currentGuess.toUpperCase() : "");
                  const charToShow = guessedRowString[letterPos] || "";
                  const status = rIdx < scores.length ? scores[rIdx]?.[letterPos] : undefined;
                  const colIndex = letterPos;
                  const isCursor = rIdx === currentRow && colIndex === currentCol;
                  const tile = (
                    <Tile
                      key={idx}
                      ch={charToShow}
                      status={status}
                      isActiveRow={rIdx === currentRow}
                      isCursor={isCursor}
                      w={tileDims.w}
                      h={tileDims.h}
                      themeColor={themeColor}
                    />
                  );
                  letterPos += 1;
                  return tile;
                });
              })()}
            </Box>
          ))}
        </Box>

        {/* Keyboard (compact) */}
        {!gameOver && !showResults && (
          <Box sx={{ display: "grid", gap: 1, justifyContent: "center", mt: 2 }}>
            <Box
              sx={{
                display: "grid",
                gap: 0.5,
                gridTemplateColumns: "repeat(10, minmax(0, 1fr))",
                width: { xs: 340, sm: 380, md: 420 },
                maxWidth: "100%",
              }}
            >
              {keysRow1.map((k) => (
                <Key key={k} label={k} status={keyStatuses[k]} themeColor={themeColor} onClick={() => handleChar(k)} />)
              )}
            </Box>
            <Box
              sx={{
                display: "grid",
                gap: 0.5,
                gridTemplateColumns: "repeat(9, minmax(0, 1fr))",
                width: { xs: 320, sm: 360, md: 400 },
                maxWidth: "100%",
              }}
            >
              {keysRow2.map((k) => (
                <Key key={k} label={k} status={keyStatuses[k]} themeColor={themeColor} onClick={() => handleChar(k)} />)
              )}
            </Box>
            <Box
              sx={{
                display: "grid",
                gap: 0.5,
                gridTemplateColumns: "repeat(11, minmax(0, 1fr))",
                width: { xs: 340, sm: 380, md: 420 },
                maxWidth: "100%",
              }}
            >
              {keysRow3.map((k) => (
                <Key
                  key={k}
                  label={k}
                  wide={k === "Enter" || k === "⌫"}
                  themeColor={themeColor}
                  status={/^[A-Z]$/.test(k) ? keyStatuses[k] : undefined}
                  onClick={() => {
                    if (k === "Enter") return handleEnter();
                    if (k === "⌫") return handleDelete();
                    handleChar(k);
                  }}
                />)
              )}
            </Box>
          </Box>
        )}
      </Box>
      {showResults && (
        <Box sx={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", p: 2 }}>
          <Box
            onClick={() => setShowResults(false)}
            sx={{ position: "absolute", inset: 0, bgcolor: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)" }}
          />
          <Box
            sx={{
              position: "relative",
              width: "100%",
              maxWidth: 440,
              background: `linear-gradient(180deg, ${themeVar("card")}, ${themeVar("background")})`,
              border: `1px solid ${themeVar("border")}`,
              borderRadius: 4,
              p: 4,
              textAlign: "center",
              boxShadow: `0 24px 48px -12px rgba(0,0,0,0.5)`,
              overflow: "hidden",
            }}
          >
            {/* Success Glow */}
            <Box
              sx={{
                position: "absolute",
                top: -40,
                left: "50%",
                transform: "translateX(-50%)",
                width: 200,
                height: 100,
                background: themeVar(didWin ? (themeColor ?? "primary") : "danger"),
                filter: "blur(60px)",
                opacity: 0.3,
              }}
            />

            <Typography
              variant="h4"
              sx={{ fontWeight: 900, color: themeVar("textLight"), mb: 1, letterSpacing: "-0.01em" }}
            >
              {didWin ? 'VICTORY' : 'DEFEAT'}
            </Typography>
            <Typography variant="body2" sx={{ color: themeVar("textSecondary"), mb: 4 }}>
              {didWin ? 'System successfully decrypted.' : 'Maximum attempts reached.'}
            </Typography>

            <Box sx={{ display: "grid", gap: 2, mb: 4 }}>
              <Box sx={{ p: 2, borderRadius: 2, bgcolor: `color-mix(in oklab, ${themeVar("backgroundAlt")}, transparent 40%)`, border: `1px solid ${themeVar("border")}` }}>
                <Typography variant="caption" sx={{ color: themeVar("textSecondary"), display: "block", mb: 0.5, fontWeight: 700 }}>THE WORD WAS</Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: themeVar(themeColor ?? "primary"), letterSpacing: 2 }}>{puzzle.answer.toUpperCase()}</Typography>
              </Box>

              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: `color-mix(in oklab, ${themeVar("backgroundAlt")}, transparent 60%)`, border: `1px solid ${themeVar("border")}` }}>
                  <Typography variant="caption" sx={{ color: themeVar("textSecondary"), display: "block", mb: 0.5 }}>GUESSES</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>{guessCount}</Typography>
                </Box>
                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: `color-mix(in oklab, ${themeVar("backgroundAlt")}, transparent 60%)`, border: `1px solid ${themeVar("border")}` }}>
                  <Typography variant="caption" sx={{ color: themeVar("textSecondary"), display: "block", mb: 0.5 }}>TIME</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>{fmtTime(elapsedMs)}</Typography>
                </Box>
              </Box>
            </Box>

            <Box sx={{ display: "grid", gap: 1.5 }}>
              <Button
                fullWidth
                variant="contained"
                onClick={() => setShowLeaderboard(true)}
                sx={{
                  bgcolor: themeVar(themeColor ?? "primary"),
                  "&:hover": { bgcolor: `color-mix(in oklab, ${themeVar(themeColor ?? "primary")}, #fff 10%)` },
                  fontWeight: 800,
                  py: 1.5,
                  borderRadius: 2,
                }}
              >
                VIEW RANKINGS
              </Button>
              <Button
                fullWidth
                onClick={() => setShowResults(false)}
                sx={{ color: themeVar("textSecondary"), fontWeight: 700 }}
              >
                CLOSE
              </Button>
            </Box>
          </Box>
        </Box>
      )}
      <LeaderboardModal open={showLeaderboard} onClose={() => setShowLeaderboard(false)} game={game ?? "valorant"} />
    </div>
  );
}

function Tile({
  ch,
  status,
  isActiveRow = false,
  isCursor = false,
  w = 44,
  h = 52,
  onClick,
  themeColor = "primary"
}: {
  ch?: string;
  status?: TileStatus;
  isActiveRow?: boolean;
  isCursor?: boolean;
  w?: number;
  h?: number;
  onClick?: () => void;
  themeColor?: "primary" | "secondary";
}) {
  let bg = `linear-gradient(180deg, color-mix(in oklab, ${themeVar("card")}, transparent 80%), transparent)`;
  let border = `1px solid color-mix(in oklab, ${themeVar("border")}, transparent 22%)`;

  if (status === "correct") {
    bg = `linear-gradient(180deg, color-mix(in oklab, #16a34a, transparent 75%), color-mix(in oklab, #16a34a, transparent 92%))`;
    border = `1px solid color-mix(in oklab, #16a34a, transparent 15%)`;
  } else if (status === "present") {
    bg = `linear-gradient(180deg, color-mix(in oklab, #f59e0b, transparent 75%), color-mix(in oklab, #f59e0b, transparent 92%))`;
    border = `1px solid color-mix(in oklab, #f59e0b, transparent 15%)`;
  } else if (status === "absent") {
    bg = `linear-gradient(180deg, color-mix(in oklab, ${themeVar("backgroundAlt")}, transparent 80%), transparent)`;
    border = `1px solid color-mix(in oklab, ${themeVar("border")}, transparent 35%)`;
  } else if (status === "hint") {
    bg = `linear-gradient(180deg, color-mix(in oklab, #ef4444, transparent 75%), color-mix(in oklab, #ef4444, transparent 92%))`;
    border = `1px solid color-mix(in oklab, #ef4444, transparent 15%)`;
  }

  const isHighlighted = isCursor && !status;
  const highlightColor = themeVar(themeColor);

  return (
    <Box
      sx={{
        width: w,
        height: h,
        borderRadius: 2,
        display: "grid",
        placeItems: "center",
        fontWeight: 800,
        fontSize: "1.2rem",
        color: themeVar("textLight"),
        background: bg,
        border: isHighlighted
          ? `1px solid ${highlightColor}`
          : border,
        boxShadow: isHighlighted
          ? `0 0 0 1px ${highlightColor}, 0 0 20px color-mix(in oklab, ${highlightColor}, transparent 60%)`
          : "inset 0 0 0 1px rgba(255,255,255,0.02)",
        transition: "all 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
        transform: isHighlighted ? "translateY(-2px) scale(1.05)" : "none",
        zIndex: isHighlighted ? 10 : 1,
      }}
      onClick={onClick}
    >
      {status === "hint" ? "🔥" : (ch || "")}
    </Box>
  );
}

function Key({
  label,
  status,
  wide,
  onClick,
  themeColor = "primary"
}: {
  label: string;
  status?: KeyboardStatus;
  wide?: boolean;
  onClick?: () => void;
  themeColor?: "primary" | "secondary";
}) {
  let bg = `linear-gradient(180deg, color-mix(in oklab, ${themeVar("card")}, transparent 80%), transparent)`;
  let border = `1px solid color-mix(in oklab, ${themeVar("border")}, transparent 25%)`;
  let color = themeVar("textSecondary");

  if (status === "correct") {
    bg = `linear-gradient(180deg, #16a34a, color-mix(in oklab, #16a34a, transparent 30%))`;
    border = `1px solid color-mix(in oklab, #16a34a, transparent 20%)`;
    color = "#fff";
  } else if (status === "present") {
    bg = `linear-gradient(180deg, #f59e0b, color-mix(in oklab, #f59e0b, transparent 30%))`;
    border = `1px solid color-mix(in oklab, #f59e0b, transparent 20%)`;
    color = "#fff";
  } else if (status === "absent") {
    bg = `color-mix(in oklab, ${themeVar("background")}, transparent 20%)`;
    border = `1px solid ${themeVar("border")}`;
    color = `color-mix(in oklab, ${themeVar("text")}, transparent 60%)`;
  }

  const highlightColor = themeVar(themeColor);

  return (
    <Box
      sx={{
        height: { xs: 32, sm: 38 },
        borderRadius: 1.5,
        display: "grid",
        placeItems: "center",
        fontSize: "0.85rem",
        fontWeight: 800,
        color: status ? color : themeVar("textLight"),
        cursor: status === "absent" ? "not-allowed" : "pointer",
        userSelect: "none",
        background: bg,
        border: border,
        px: wide ? 2 : 0,
        gridColumn: wide ? "span 2" : "span 1",
        transition: "all 0.1s ease",
        "&:hover": {
          background: status ? bg : `color-mix(in oklab, ${highlightColor}, transparent 90%)`,
          borderColor: status ? border : highlightColor,
          transform: status === "absent" ? "none" : "translateY(-2px)",
          boxShadow: status === "absent" ? "none" : `0 4px 12px color-mix(in oklab, ${highlightColor}, transparent 80%)`,
        },
        "&:active": {
          transform: status === "absent" ? "none" : "translateY(0)",
        },
      }}
      onClick={onClick}
    >
      {label}
    </Box>
  );
}
