import "dotenv/config";
import fs from "fs";
import path from "path";

/*
Uploads schedules via Convex HTTP Actions (no custom HTTP route), mirroring
english_word/scripts/uploadCorpusWords.ts style.

Reads from nerdle/schedules/{minecraft,valorant}/{period}.json and calls
path: dailies/nerdle/schedulesIngest:ingest

Usage:
  tsx nerdle/scripts/uploadSchedulesViaAction.ts [--root nerdle/schedules] [--replace] [--chunk 1000]

Env:
  CONVEX_URL or NEXT_PUBLIC_CONVEX_URL or VITE_CONVEX_URL must be set.
*/

function getArg(name: string): string | undefined {
  const idx = process.argv.indexOf(name);
  if (idx >= 0 && idx + 1 < process.argv.length) return process.argv[idx + 1];
  return undefined;
}

const rootArg = getArg("--root");
const replace = process.argv.includes("--replace");
const chunkSize = parseInt(getArg("--chunk") ?? "1000", 10);
const clientChunkSize = parseInt(getArg("--client-chunk") ?? "1000", 10);

const convexUrl = process.env.CONVEX_URL ?? process.env.NEXT_PUBLIC_CONVEX_URL ?? process.env.VITE_CONVEX_URL;
if (!convexUrl) {
  console.error("Missing CONVEX_URL (or NEXT_PUBLIC_CONVEX_URL / VITE_CONVEX_URL)");
  process.exit(1);
}

const ROOT = path.resolve(process.cwd(), rootArg ?? "nerdle/schedules");
const GAMES = ["minecraft", "valorant"] as const;

function readJson<T = any>(p: string): T | null {
  try {
    const s = fs.readFileSync(p, "utf8");
    return JSON.parse(s);
  } catch {
    return null;
  }
}

async function callAction(entries: any[]) {
  const endpoint = new URL("/api/action", convexUrl).toString();
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      path: "dailies/nerdle/schedulesIngest:ingest",
      args: { entries, replace, chunkSize },
      format: "json",
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    console.error(`Action failed with ${res.status}: ${body}`);
    process.exit(1);
  }
  const json = await res.json();
  if (json.status === "error") {
    // Log the entire response to expose errorMessage and other fields
    console.error(`Action returned error: ${JSON.stringify(json)}`);
    process.exit(1);
  }
  const value = json.value ?? json;
  console.log(`Uploaded via action: inserted=${value.inserted}, batches=${value.batches}`);
}

async function main() {
  const entries: { game: string; period: string; date: string; wordId: number; displayName: string }[] = [];

  for (const game of GAMES) {
    const dir = path.join(ROOT, game);
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
    for (const f of files) {
      const period = path.basename(f, ".json");
      const arr = readJson<Array<{ date: string; id: number; displayName: string }>>(path.join(dir, f));
      if (!arr) continue;
      for (const row of arr) {
        if (!row || typeof row.date !== "string" || typeof row.id !== "number") continue;
        entries.push({ game, period, date: row.date, wordId: row.id, displayName: row.displayName });
      }
    }
  }

  if (entries.length === 0) {
    console.error("No schedule entries found under", ROOT);
    process.exit(1);
  }

  // Client-side batching to avoid long-running Convex action timeouts
  let totalInserted = 0;
  let totalBatches = 0;
  for (let i = 0; i < entries.length; i += clientChunkSize) {
    const batch = entries.slice(i, i + clientChunkSize);
    const isFirst = i === 0;
    const endpoint = new URL("/api/action", convexUrl).toString();
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: "dailies/nerdle/schedulesIngest:ingest",
        args: { entries: batch, replace: isFirst ? replace : false, chunkSize },
        format: "json",
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error(`Action failed with ${res.status}: ${body}`);
      process.exit(1);
    }
    const json = await res.json();
    if (json.status === "error") {
      console.error(`Action returned error: ${JSON.stringify(json)}`);
      process.exit(1);
    }
    const value = json.value ?? json;
    totalInserted += value.inserted ?? 0;
    totalBatches += value.batches ?? 1;
    console.log(`Client batch ${Math.floor(i / clientChunkSize) + 1}: inserted=${value.inserted}, actionBatches=${value.batches}`);
  }
  console.log(`All done. Inserted=${totalInserted}, clientBatches=${Math.ceil(entries.length / clientChunkSize)}, actionBatchesTotal=${totalBatches}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
