import fs from "fs";
import path from "path";

/*
Type code mapping (fixed):
  skins = 1
  agents = 2
  buddies = 3
  bundles = 4
  gamemodes = 5
  maps = 6
  titles = 7
  terminology = 8

Rule: id = typeCode * 1000 + sequence (1-based)
Special handling for terminology: rename `term` -> `displayName` (preserve `definition`).
Other files: remove `uuid` if present; keep other fields as-is.
*/

const TYPE_CODES: Record<string, number> = {
  skins: 1,
  agents: 2,
  buddies: 3,
  bundles: 4,
  gamemodes: 5,
  maps: 6,
  titles: 7,
  terminology: 8,
};

function usage() {
  console.log(
    "Usage: tsx nerdle/valorant_related_words/scripts/setTypeCodedIds.ts <file1.json> [file2.json ...] [--no-backup]"
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
  if (a === "--no-backup") {
    doBackup = false;
  } else if (a.endsWith(".json")) {
    files.push(path.resolve(process.cwd(), a));
  } else {
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
  const typeCode = TYPE_CODES[baseName];
  if (!typeCode) {
    console.error(`Unknown type for file ${inputPath}. Expected one of: ${Object.keys(TYPE_CODES).join(", ")}`);
    continue;
  }

  const arr = data as Array<Record<string, any>>;
  const updated = arr.map((item, idx) => {
    const out: Record<string, any> = { ...item };

    // Remove uuid if present
    if (Object.prototype.hasOwnProperty.call(out, "uuid")) delete out.uuid;

    // Special handling for terminology: term -> displayName
    if (baseName === "terminology") {
      if (typeof out.term === "string" && !out.displayName) {
        out.displayName = out.term;
      }
      if (Object.prototype.hasOwnProperty.call(out, "term")) delete out.term;
      // Keep definition as-is
    }

    // Assign type-coded id
    out.id = typeCode * 1000 + (idx + 1);

    return out;
  });

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
  console.log(`Updated: ${inputPath} (records: ${updated.length}, typeCode: ${typeCode})`);
}
