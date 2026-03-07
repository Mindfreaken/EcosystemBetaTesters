import fs from "fs";
import path from "path";

// Splices Valorant beta schedule in-place from a cutoff date.
// Keeps all entries before cutoff from the original file and
// replaces entries on/after cutoff with entries from a regenerated file.
//
// Usage (example):
//   tsx nerdle/scripts/spliceValorantBetaFromDate.ts \
//     --cutoff 2025-12-19 \
//     --orig nerdle/schedules/valorant/beta.json \
//     --regen nerdle/schedules_no_titles/valorant/beta.json
//
// After running this, use your existing upload script, e.g.:
//   tsx nerdle/scripts/uploadSchedulesToConvex.ts --url <CONVEX_HTTP_BASE> --root nerdle/schedules --replace

function getArg(name: string): string | undefined {
  const idx = process.argv.indexOf(name);
  if (idx >= 0 && idx + 1 < process.argv.length) return process.argv[idx + 1];
  return undefined;
}

const cutoff = getArg("--cutoff") ?? "2025-12-19";
const origPath = path.resolve(process.cwd(), getArg("--orig") ?? "nerdle/schedules/valorant/beta.json");
const regenPath = path.resolve(process.cwd(), getArg("--regen") ?? "nerdle/schedules_no_titles/valorant/beta.json");

if (!fs.existsSync(origPath)) {
  console.error("Original beta.json not found:", origPath);
  process.exit(1);
}
if (!fs.existsSync(regenPath)) {
  console.error("Regenerated beta.json not found:", regenPath);
  process.exit(1);
}

function readJsonArray(p: string): Array<{ date: string; id: number; displayName: string }> {
  const raw = fs.readFileSync(p, "utf8");
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error(`Expected array in ${p}`);
  return parsed;
}

function main() {
  const orig = readJsonArray(origPath);
  const regen = readJsonArray(regenPath);

  const regenByDate = new Map<string, { date: string; id: number; displayName: string }>();
  for (const row of regen) {
    if (!row || typeof row.date !== "string") continue;
    regenByDate.set(row.date, row);
  }

  // Build new schedule: keep < cutoff from orig, >= cutoff from regen (fall back to orig if missing)
  const result: { date: string; id: number; displayName: string }[] = [];
  for (const row of orig) {
    if (!row || typeof row.date !== "string") continue;
    if (row.date < cutoff) {
      result.push(row);
    } else {
      const replacement = regenByDate.get(row.date) ?? row;
      result.push(replacement);
    }
  }

  fs.writeFileSync(origPath, JSON.stringify(result, null, 2) + "\n", "utf8");
  console.log(`Spliced beta schedule written to ${origPath} with cutoff ${cutoff}`);
}

main();
