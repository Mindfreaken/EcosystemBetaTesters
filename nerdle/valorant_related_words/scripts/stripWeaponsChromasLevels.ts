import fs from "fs";
import path from "path";

function usage() {
  console.log(
    "Usage: tsx nerdle/valorant_related_words/scripts/stripWeaponsChromasLevels.ts [inputPath] [--out outputPath] [--no-backup]"
  );
}

const DEFAULT_INPUT = path.resolve(
  process.cwd(),
  "nerdle/valorant_related_words/api/weapons.json"
);

const args = process.argv.slice(2);
let inputPath = DEFAULT_INPUT;
let outPath: string | null = null;
let doBackup = true;

for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === "--out") {
    const next = args[i + 1];
    if (!next) {
      console.error("--out requires a path");
      usage();
      process.exit(1);
    }
    outPath = path.resolve(process.cwd(), next);
    i++;
  } else if (a === "--no-backup") {
    doBackup = false;
  } else if (!a.startsWith("-")) {
    inputPath = path.resolve(process.cwd(), a);
  } else {
    console.error(`Unknown argument: ${a}`);
    usage();
    process.exit(1);
  }
}

if (!fs.existsSync(inputPath)) {
  console.error(`Input file not found: ${inputPath}`);
  process.exit(1);
}

const raw = fs.readFileSync(inputPath, "utf8");
let data: unknown;
try {
  data = JSON.parse(raw);
} catch (e) {
  // Fallback: strip trailing commas before '}' or ']' and try again
  const sanitized = raw
    // remove trailing commas before object/array closers
    .replace(/,\s*(\}|\])/g, "$1")
    // remove any leading BOM just in case
    .replace(/^\uFEFF/, "");
  try {
    data = JSON.parse(sanitized);
    console.warn(
      "Warning: Input JSON was malformed (likely trailing commas). Parsed after sanitizing."
    );
  } catch (e2) {
    console.error("Failed to parse JSON even after sanitizing:", (e2 as Error).message);
    process.exit(1);
  }
}

if (!Array.isArray(data)) {
  console.error("Expected top-level JSON array.");
  process.exit(1);
}

let skinsVisited = 0;
let chromasRemoved = 0;
let levelsRemoved = 0;

for (const weapon of data as any[]) {
  const skins = weapon?.skins;
  if (!Array.isArray(skins)) continue;
  for (const skin of skins) {
    skinsVisited++;
    if (Object.prototype.hasOwnProperty.call(skin, "chromas")) {
      delete skin.chromas;
      chromasRemoved++;
    }
    if (Object.prototype.hasOwnProperty.call(skin, "levels")) {
      delete skin.levels;
      levelsRemoved++;
    }
  }
}

const outputPath = outPath ?? inputPath;

if (!outPath && doBackup) {
  const backupPath = `${inputPath}.bak`;
  if (!fs.existsSync(backupPath)) {
    fs.writeFileSync(backupPath, raw, "utf8");
    console.log(`Backup written: ${backupPath}`);
  } else {
    console.log(`Backup exists, not overwriting: ${backupPath}`);
  }
}

const pretty = JSON.stringify(data, null, 2) + "\n";
fs.writeFileSync(outputPath, pretty, "utf8");

console.log("Done.");
console.log(`Skins visited: ${skinsVisited}`);
console.log(`Removed fields -> chromas: ${chromasRemoved}, levels: ${levelsRemoved}`);
console.log(`Output: ${outputPath}`);
