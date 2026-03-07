import fs from "fs";
import path from "path";

function usage() {
  console.log(
    "Usage: tsx nerdle/valorant_related_words/scripts/resequenceIds.ts [inputPath] [--out outputPath] [--no-backup]"
  );
}

const DEFAULT_INPUT = path.resolve(
  process.cwd(),
  "nerdle/valorant_related_words/api/weapons.names.normalized.json"
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
  console.error("Failed to parse JSON:", (e as Error).message);
  process.exit(1);
}

if (!Array.isArray(data)) {
  console.error("Expected top-level JSON array.");
  process.exit(1);
}

const arr = data as Array<{ id?: number; displayName: string }>;
arr.forEach((item, idx) => {
  item.id = idx + 1;
});

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

const pretty = JSON.stringify(arr, null, 2) + "\n";
fs.writeFileSync(outputPath, pretty, "utf8");

console.log("Done.");
console.log(`Records: ${arr.length}`);
console.log(`Output: ${outputPath}`);
