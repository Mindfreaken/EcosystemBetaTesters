import fs from "fs";
import path from "path";

/*
Reads schedules from nerdle/schedules/{minecraft,valorant}/{period}.json
and uploads them in bulk to Convex HTTP endpoint /schedules/upload.

Usage:
  tsx nerdle/scripts/uploadSchedulesToConvex.ts --url <CONVEX_HTTP_BASE> [--root <schedulesDir>] [--replace]

Examples:
  tsx nerdle/scripts/uploadSchedulesToConvex.ts \
    --url https://<your-convex-deployment>.convex.site \
    --root nerdle/schedules \
    --replace

Notes:
- --replace causes existing rows for the same (period, game) to be deleted first.
- Endpoint is defined in convex/http.ts at path /schedules/upload
*/

function getArg(name: string): string | undefined {
  const idx = process.argv.indexOf(name);
  if (idx >= 0 && idx + 1 < process.argv.length) return process.argv[idx + 1];
  return undefined;
}

const url = getArg("--url");
const rootArg = getArg("--root");
const replace = process.argv.includes("--replace");

if (!url) {
  console.error("--url <CONVEX_HTTP_BASE> is required, e.g. https://<deployment>.convex.site");
  process.exit(1);
}

const ROOT = path.resolve(process.cwd(), rootArg ?? "nerdle/schedules");
const GAMES = ["minecraft", "valorant"] as const;

function readJson<T = any>(p: string): T | null {
  try {
    const s = fs.readFileSync(p, "utf8");
    return JSON.parse(s);
  } catch (e) {
    return null;
  }
}

async function upload(entries: any[]) {
  const endpoint = new URL("/schedules/upload", url).toString();
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ entries, replace }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Upload failed: ${res.status} ${res.statusText} ${text}`);
  }
  const json = await res.json();
  console.log("Upload result:", json);
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

  await upload(entries);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
