import fs from "fs";
import path from "path";

/*
Generates per-day word schedules for two games (minecraft, valorant) across periods:
- test: 2025-10-17 .. 2025-10-31
- beta: 2025-11-01 .. 2026-12-31
- season1: 2027-01-01 .. 2027-03-31
- season2: 2027-04-01 .. 2027-06-30
- season3: 2027-07-01 .. 2027-09-30
- season4: 2027-10-01 .. 2027-12-31
- season5: 2028-01-01 .. 2028-03-31
- season6: 2028-04-01 .. 2028-06-30

Rules:
- Per-game 90-day no-reuse window: a word cannot be assigned if used within the previous 90 days for that same game, even across periods.
- Output tables include only: { date: YYYY-MM-DD, id: number, displayName: string }
- Default pools (can override via CLI):
  minecraft: nerdle/minecraft_related/api/{biomes,blocks,effects,enchantments,foods}.json
  valorant: nerdle/valorant_related_words/api/{agents,titles,skins,maps,buddies,bundles,gamemodes,terminology}.json

CLI (all optional):
  --mc <file1.json,file2.json,...>
  --val <file1.json,file2.json,...>
  --seed <number>   Deterministic shuffle seed.
  --out <dir>       Output directory root (default: nerdle/schedules)
*/

type PoolItem = { id: number; displayName: string };

const DEFAULT_MC_FILES = [
  "nerdle/minecraft_related/api/biomes.json",
  "nerdle/minecraft_related/api/blocks.json",
  "nerdle/minecraft_related/api/effects.json",
  "nerdle/minecraft_related/api/enchantments.json",
  "nerdle/minecraft_related/api/foods.json",
];

const DEFAULT_VAL_FILES = [
  "nerdle/valorant_related_words/api/agents.json",
  "nerdle/valorant_related_words/api/skins.json",
  "nerdle/valorant_related_words/api/maps.json",
  "nerdle/valorant_related_words/api/buddies.json",
  "nerdle/valorant_related_words/api/bundles.json",
  "nerdle/valorant_related_words/api/gamemodes.json",
  "nerdle/valorant_related_words/api/terminology.json",
];

const PERIODS: { key: string; start: string; end: string }[] = [
  { key: "test", start: "2025-10-17", end: "2025-10-31" },
  { key: "beta", start: "2025-11-01", end: "2026-12-31" },
  { key: "season1", start: "2027-01-01", end: "2027-03-31" },
  { key: "season2", start: "2027-04-01", end: "2027-06-30" },
  { key: "season3", start: "2027-07-01", end: "2027-09-30" },
  { key: "season4", start: "2027-10-01", end: "2027-12-31" },
  { key: "season5", start: "2028-01-01", end: "2028-03-31" },
  { key: "season6", start: "2028-04-01", end: "2028-06-30" },
];

const args = process.argv.slice(2);
function getArg(name: string): string | undefined {
  const idx = args.indexOf(name);
  if (idx >= 0 && idx + 1 < args.length) return args[idx + 1];
  return undefined;
}

const mcArg = getArg("--mc");
const valArg = getArg("--val");
const seedArg = getArg("--seed");
const outArg = getArg("--out");

const OUT_DIR = path.resolve(process.cwd(), outArg ?? "nerdle/schedules");
const MC_FILES = (mcArg ? mcArg.split(",") : DEFAULT_MC_FILES).map((p) => path.resolve(process.cwd(), p));
const VAL_FILES = (valArg ? valArg.split(",") : DEFAULT_VAL_FILES).map((p) => path.resolve(process.cwd(), p));

function readPool(files: string[]): PoolItem[] {
  const out: PoolItem[] = [];
  for (const f of files) {
    if (!fs.existsSync(f)) continue;
    try {
      const content = fs.readFileSync(f, "utf8");
      const arr = JSON.parse(content);
      if (Array.isArray(arr)) {
        for (const item of arr) {
          if (
            item &&
            typeof item.id === "number" &&
            typeof item.displayName === "string" &&
            item.displayName.trim().length > 0
          ) {
            out.push({ id: item.id, displayName: item.displayName });
          }
        }
      }
    } catch (e) {
      console.warn(`Skipping unreadable file ${f}: ${(e as Error).message}`);
    }
  }
  return out;
}

// Simple seeded RNG (Mulberry32)
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(arr: T[], rnd: () => number): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function toDate(s: string): Date {
  const [y, m, d] = s.split("-").map((n) => parseInt(n, 10));
  return new Date(Date.UTC(y, m - 1, d));
}

function formatDate(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function dateRangeInclusive(startISO: string, endISO: string): string[] {
  const start = toDate(startISO);
  const end = toDate(endISO);
  const days: string[] = [];
  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    days.push(formatDate(d));
  }
  return days;
}

function daysBetween(aISO: string, bISO: string): number {
  const a = toDate(aISO).getTime();
  const b = toDate(bISO).getTime();
  return Math.floor((b - a) / (1000 * 60 * 60 * 24));
}

function ensureDir(p: string) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function assignSchedule(
  game: "minecraft" | "valorant",
  pool: PoolItem[],
  periods: { key: string; start: string; end: string }[],
  rnd: () => number
) {
  // Track last used date for id per game
  const lastUsed = new Map<number, string>();
  const outByPeriod: Record<string, { date: string; id: number; displayName: string }[]> = {};

  // Pre-shuffle pool for variety but determinism
  const basePool = shuffle(pool, rnd);

  for (const p of periods) {
    const days = dateRangeInclusive(p.start, p.end);
    const entries: { date: string; id: number; displayName: string }[] = [];

    for (const day of days) {
      // Build candidate list: not used in last 90 days
      const candidates = basePool.filter((item) => {
        const last = lastUsed.get(item.id);
        if (!last) return true;
        return daysBetween(last, day) >= 90; // 90-day cooldown
      });

      if (candidates.length === 0) {
        throw new Error(
          `Not enough unique words to satisfy 90-day rule for ${game} on ${day}. Pool size=${basePool.length}. Consider expanding the pool.`
        );
      }

      // Pick one deterministically by consuming from a second shuffle based on day
      const dailyIndex = Math.floor(rnd() * candidates.length);
      const choice = candidates[dailyIndex];

      entries.push({ date: day, id: choice.id, displayName: choice.displayName });
      lastUsed.set(choice.id, day);
    }

    outByPeriod[p.key] = entries;
  }

  return outByPeriod;
}

function main() {
  const seed = seedArg ? parseInt(seedArg, 10) : 1337;
  const rnd = mulberry32(seed);

  const mcPool = readPool(MC_FILES);
  const valPool = readPool(VAL_FILES);

  if (mcPool.length === 0) {
    console.error("Minecraft pool is empty. Check input files or cleaning step.");
    process.exit(1);
  }
  if (valPool.length === 0) {
    console.error("Valorant pool is empty. Check input files or cleaning step.");
    process.exit(1);
  }

  const mcSchedules = assignSchedule("minecraft", mcPool, PERIODS, rnd);
  const valSchedules = assignSchedule("valorant", valPool, PERIODS, rnd);

  // Write outputs
  const mcOutDir = path.join(OUT_DIR, "minecraft");
  const valOutDir = path.join(OUT_DIR, "valorant");
  ensureDir(mcOutDir);
  ensureDir(valOutDir);

  for (const p of PERIODS) {
    fs.writeFileSync(
      path.join(mcOutDir, `${p.key}.json`),
      JSON.stringify(mcSchedules[p.key], null, 2) + "\n",
      "utf8"
    );
    fs.writeFileSync(
      path.join(valOutDir, `${p.key}.json`),
      JSON.stringify(valSchedules[p.key], null, 2) + "\n",
      "utf8"
    );
  }

  // Write index file with period metadata
  const index = {
    periods: PERIODS,
    generatedAt: new Date().toISOString(),
    outDir: OUT_DIR,
  };
  fs.writeFileSync(path.join(OUT_DIR, `index.json`), JSON.stringify(index, null, 2) + "\n", "utf8");

  console.log(`Schedules written to: ${OUT_DIR}`);
}

main();
