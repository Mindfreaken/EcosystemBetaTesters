import fs from "fs";
import path from "path";

function usage() {
  console.log(
    "Usage: tsx nerdle/valorant_related_words/scripts/removeTextAndUuidToId.ts <file1.json> [file2.json ...] [--no-backup]"
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

  const arr = data as Array<Record<string, any>>;
  arr.forEach((item, idx) => {
    if (Object.prototype.hasOwnProperty.call(item, "uuid")) {
      delete (item as any).uuid;
    }
    if (Object.prototype.hasOwnProperty.call(item, "text")) {
      delete (item as any).text;
    }
    (item as any).id = idx + 1;
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

  const pretty = JSON.stringify(arr, null, 2) + "\n";
  fs.writeFileSync(inputPath, pretty, "utf8");
  console.log(`Updated: ${inputPath} (records: ${arr.length})`);
}
