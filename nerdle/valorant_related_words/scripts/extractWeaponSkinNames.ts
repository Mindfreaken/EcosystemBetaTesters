import fs from "fs";
import path from "path";

function usage() {
  console.log(
    "Usage: tsx nerdle/valorant_related_words/scripts/extractWeaponSkinNames.ts [inputPath] [--out outputPath] [--dedupe]"
  );
}

const DEFAULT_INPUT = path.resolve(
  process.cwd(),
  "nerdle/valorant_related_words/api/weapons.stripped.json"
);
const DEFAULT_OUTPUT = path.resolve(
  process.cwd(),
  "nerdle/valorant_related_words/api/weapons.names.json"
);

const args = process.argv.slice(2);
let inputPath = DEFAULT_INPUT;
let outputPath = DEFAULT_OUTPUT;
let dedupe = false;

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
  } else if (a === "--dedupe") {
    dedupe = true;
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

const names: string[] = [];
for (const weapon of data as any[]) {
  const skins = weapon?.skins;
  if (!Array.isArray(skins)) continue;
  for (const skin of skins) {
    const name = typeof skin?.displayName === "string" ? skin.displayName.trim() : "";
    if (name) names.push(name);
  }
}

let finalNames = names;
if (dedupe) {
  const seen = new Set<string>();
  finalNames = [];
  for (const n of names) {
    if (!seen.has(n)) {
      seen.add(n);
      finalNames.push(n);
    }
  }
}

const out = finalNames.map((displayName, idx) => ({ id: idx + 1, displayName }));

const pretty = JSON.stringify(out, null, 2) + "\n";
fs.writeFileSync(outputPath, pretty, "utf8");

console.log("Done.");
console.log(`Input skins: ${names.length}`);
console.log(`Output records: ${out.length}`);
console.log(`Output: ${outputPath}`);
