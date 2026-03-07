import fs from "fs";
import path from "path";

/*
Minecraft type codes (adjust as needed):
  biomes = 1
  blocks = 2
  effects = 3
  enchantments = 4
  foods = 5

Rule: id = typeCode * 1000 + sequence (1-based)
Filter: keep only entries whose displayName has at most 2 words.
Output shape: [{ id, displayName }] only.
*/

const MC_TYPE_CODES: Record<string, number> = {
  biomes: 1,
  blocks: 2,
  effects: 3,
  enchantments: 4,
  foods: 5,
};

function usage() {
  console.log(
    "Usage: tsx nerdle/minecraft_related/scripts/cleanAndTypeCode.ts <file1.json> [file2.json ...] [--no-backup]"
  );
}

const args = process.argv.slice(2);
if (args.length === 0) {
  usage();
  process.exit(1);
}

let doBackup = true;
const files: string[] = [];
for (const a of args) {
  if (a === "--no-backup") doBackup = false;
  else if (a.endsWith(".json")) files.push(path.resolve(process.cwd(), a));
  else {
    console.error(`Unknown argument or non-JSON file: ${a}`);
    usage();
    process.exit(1);
  }
}

if (files.length === 0) {
  console.error("No JSON files provided.");
  usage();
  process.exit(1);
}

function wordCount(s: unknown): number {
  if (typeof s !== "string") return 0;
  const trimmed = s.trim();
  if (!trimmed) return 0;
  // Split on whitespace; treat multiple spaces as one; apostrophes/hyphens kept within a word
  return trimmed.split(/\s+/).length;
}

for (const inputPath of files) {
  if (!fs.existsSync(inputPath)) {
    console.error(`File not found: ${inputPath}`);
    continue;
  }
  const raw = fs.readFileSync(inputPath, "utf8");
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    console.error(`Failed to parse JSON for ${inputPath}:`, (e as Error).message);
    continue;
  }
  if (!Array.isArray(data)) {
    console.error(`Expected JSON array in ${inputPath}`);
    continue;
  }

  const baseName = path.basename(inputPath, ".json");
  const typeCode = MC_TYPE_CODES[baseName];
  if (!typeCode) {
    console.error(`Unknown type for file ${inputPath}. Expected one of: ${Object.keys(MC_TYPE_CODES).join(", ")}`);
    continue;
  }

  const arr = data as Array<Record<string, any>>;
  // Filter by displayName word count
  const filtered = arr.filter((item) => wordCount(item.displayName) > 0 && wordCount(item.displayName) <= 2);

  // Map to only id/displayName and recode ids
  const updated = filtered.map((item, idx) => ({
    id: typeCode * 1000 + (idx + 1),
    displayName: item.displayName,
  }));

  if (doBackup) {
    const backupPath = `${inputPath}.bak`;
    if (!fs.existsSync(backupPath)) {
      fs.writeFileSync(backupPath, raw, "utf8");
      console.log(`Backup written: ${backupPath}`);
    } else {
      console.log(`Backup exists, not overwriting: ${backupPath}`);
    }
  }

  const pretty = JSON.stringify(updated, null, 2) + "\n";
  fs.writeFileSync(inputPath, pretty, "utf8");
  console.log(
    `Updated: ${inputPath} -> kept ${updated.length}/${arr.length} (typeCode: ${typeCode})`
  );
}
