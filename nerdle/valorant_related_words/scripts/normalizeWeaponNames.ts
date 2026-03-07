import fs from "fs";
import path from "path";

function usage() {
  console.log(
    "Usage: tsx nerdle/valorant_related_words/scripts/normalizeWeaponNames.ts [inputPath] [--out outputPath] [--no-backup] [--keep-special]"
  );
  console.log("- Strips trailing weapon type words (e.g., 'Divergence Judge' -> 'Divergence').");
  console.log("- Removes special characters/diacritics unless --keep-special is provided.");
  console.log("- Dedupe identical names and resequence ids starting at 1.");
}

const DEFAULT_INPUT = path.resolve(
  process.cwd(),
  "nerdle/valorant_related_words/api/weapons.names.json"
);
const DEFAULT_OUTPUT = path.resolve(
  process.cwd(),
  "nerdle/valorant_related_words/api/weapons.names.normalized.json"
);

const args = process.argv.slice(2);
let inputPath = DEFAULT_INPUT;
let outputPath = DEFAULT_OUTPUT;
let doBackup = true;
let keepSpecial = false;

for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === "--out") {
    const next = args[i + 1];
    if (!next) {
      console.error("--out requires a path");
      usage();
      process.exit(1);
    }
    outputPath = path.resolve(process.cwd(), next);
    i++;
  } else if (a === "--no-backup") {
    doBackup = false;
  } else if (a === "--keep-special") {
    keepSpecial = true;
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
let list: any[];
try {
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error("Expected an array");
  list = parsed;
} catch (e) {
  console.error("Failed to parse JSON:", (e as Error).message);
  process.exit(1);
}

// Multi-word suffixes must be checked first
const multiWordSuffixes = [
  "BASEBALL BAT",
  "BUTTERFLY KNIFE",
  "COMBAT KNIFE",
  "LIGHT STICK",
  "CANDY CANE",
  "BIO-ATOMIZERS",
  "BIO HARVESTER",
  "ENERGY SWORD",
  "SHOCK GAUNTLET",
  "ELECTROBLADE",
  "ARC (BOW)",
  "STONE DAGGERS",
];

const singleWordSuffixes = [
  "ODIN",
  "BULLDOG",
  "PHANTOM",
  "JUDGE",
  "BUCKY",
  "FRENZY",
  "CLASSIC",
  "GHOST",
  "SHERIFF",
  "SHORTY",
  "OPERATOR",
  "GUARDIAN",
  "OUTLAW",
  "MARSHAL",
  "SPECTRE",
  "STINGER",
  // melee and misc
  "KNIFE",
  "BLADE",
  "KARAMBIT",
  "DAGGER",
  "STAFF",
  "AXE",
  "HAMMER",
  "SWORD",
  "FAN",
  "GAUNTLET",
  "GAUNTLETS",
  "BATON",
  "SCYTHE",
  "KUNAI",
  "Balisong".toUpperCase(),
  "EDGE",
  "WAND",
  "MACE",
  "RELIC",
];

function stripSuffix(name: string): string {
  let s = name.trim();
  const upper = s.toUpperCase();
  // try multi-word first
  for (const suf of multiWordSuffixes) {
    if (upper.endsWith(" " + suf)) {
      return s.slice(0, upper.length - (suf.length + 1)).trim();
    }
  }
  // then single word
  const m = /\s+([A-Z0-9][A-Z0-9'\-]*)$/.exec(upper);
  if (m) {
    const last = m[1];
    if (singleWordSuffixes.includes(last)) {
      return s.slice(0, upper.length - (last.length + 1)).trim();
    }
  }
  return s;
}

function removeSpecial(name: string): string {
  // Normalize and drop diacritics
  let t = name.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
  // Replace any non alnum/space with space
  t = t.replace(/[^A-Za-z0-9 ]+/g, " ");
  // Collapse whitespace
  t = t.replace(/\s+/g, " ").trim();
  // Title Case (preserve common all-caps like VCT)? We'll heuristic: if all uppercase after removing spaces and length>2 keep uppercase, else title case
  const compact = t.replace(/\s+/g, "");
  if (compact.length > 2 && compact === compact.toUpperCase()) return t.toUpperCase();
  return t
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// Process
const outArr: { id: number; displayName: string }[] = [];
const seen = new Set<string>();
let removedSuffixCount = 0;
let specialChangedCount = 0;
let dedupedCount = 0;

for (const item of list) {
  if (!item || typeof item.displayName !== "string") continue;
  let name = item.displayName;
  const beforeSuffix = name;
  name = stripSuffix(name);
  if (name !== beforeSuffix) removedSuffixCount++;

  const beforeSpecial = name;
  if (!keepSpecial) name = removeSpecial(name);
  if (name !== beforeSpecial) specialChangedCount++;

  if (!name) continue;

  const key = name.toUpperCase();
  if (seen.has(key)) {
    dedupedCount++;
    continue;
  }
  seen.add(key);
  outArr.push({ id: 0, displayName: name });
}

// Resequence ids
outArr.forEach((rec, i) => (rec.id = i + 1));

const outputJson = JSON.stringify(outArr, null, 2) + "\n";

if (!outputPath) {
  console.log(outputJson);
  process.exit(0);
}

if (!path.isAbsolute(outputPath)) {
  outputPath = path.resolve(process.cwd(), outputPath);
}

if (!outputPath.endsWith(".json")) {
  console.error("Output path should be a .json file");
  process.exit(1);
}

if (!outputPath || outputPath === inputPath) {
  if (doBackup) {
    const backupPath = `${inputPath}.bak`;
    if (!fs.existsSync(backupPath)) {
      fs.writeFileSync(backupPath, raw, "utf8");
      console.log(`Backup written: ${backupPath}`);
    } else {
      console.log(`Backup exists, not overwriting: ${backupPath}`);
    }
  }
}

fs.writeFileSync(outputPath, outputJson, "utf8");

console.log("Done.");
console.log(`Input records: ${list.length}`);
console.log(`Output records: ${outArr.length}`);
console.log(`Removed trailing type: ${removedSuffixCount}`);
console.log(`Sanitized special chars: ${specialChangedCount}`);
console.log(`Deduped: ${dedupedCount}`);
console.log(`Output: ${outputPath}`);
