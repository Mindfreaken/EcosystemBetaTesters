import fs from "fs";
import path from "path";

function usage() {
  console.log(
    "Usage: tsx nerdle/valorant_related_words/scripts/addAcceptableVariants.ts [inputPath] [--out outputPath] [--no-backup]"
  );
}

const DEFAULT_INPUT = path.resolve(
  process.cwd(),
  "nerdle/valorant_related_words/api/weapons.names.json"
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

function toAcceptable(s: string): string {
  let t = s.normalize("NFKD");
  // remove diacritic combining marks
  t = t.replace(/[\u0300-\u036f]/g, "");
  // map some common special letters that don't decompose as desired
  t = t
    .replace(/[Øø]/g, "O")
    .replace(/[Æ]/g, "AE")
    .replace(/[æ]/g, "ae")
    .replace(/[Ð]/g, "D")
    .replace(/[ð]/g, "d")
    .replace(/[Þ]/g, "TH")
    .replace(/[þ]/g, "th")
    .replace(/[Ł]/g, "L")
    .replace(/[ł]/g, "l")
    .replace(/[Š]/g, "S")
    .replace(/[š]/g, "s")
    .replace(/[Ž]/g, "Z")
    .replace(/[ž]/g, "z")
    .replace(/[Ç]/g, "C")
    .replace(/[ç]/g, "c");
  // strip non-alphanumeric except spaces
  t = t.replace(/[^A-Za-z0-9 ]+/g, "");
  // collapse whitespace
  t = t.replace(/\s+/g, " ").trim();
  // standardize to uppercase to make answer checking case-insensitive upstream if desired
  t = t.toUpperCase();
  return t;
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
  console.error("Failed to parse JSON:", (e as Error).message);
  process.exit(1);
}

if (!Array.isArray(data)) {
  console.error("Expected top-level JSON array of {id, displayName}.");
  process.exit(1);
}

let updated = 0;
for (const rec of data as any[]) {
  const name = typeof rec?.displayName === "string" ? rec.displayName : "";
  if (!name) continue;
  const acceptable = toAcceptable(name);
  // Only add when it differs from original (case-insensitive compare ignoring punctuation)
  const originalKey = name.replace(/[^A-Za-z0-9 ]+/g, "").replace(/\s+/g, " ").trim().toUpperCase();
  if (acceptable && acceptable !== originalKey) {
    if (!rec.acceptable) {
      rec.acceptable = acceptable;
      updated++;
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
console.log(`Records processed: ${(data as any[]).length}`);
console.log(`Records updated (acceptable added): ${updated}`);
console.log(`Output: ${outputPath}`);
