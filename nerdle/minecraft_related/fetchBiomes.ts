/*
  Fetch Minecraft biomes data from PrismarineJS and trim to desired fields.
  Output: nerdle/minecraft_related/api/biomes.trimmed.json
*/

import { writeFile, mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'

const RAW_URL = 'https://raw.githubusercontent.com/PrismarineJS/minecraft-data/master/data/pc/1.21.7/biomes.json'

async function main() {
  const res = await fetch(RAW_URL)
  if (!res.ok) {
    throw new Error(`Failed to fetch biomes: ${res.status} ${res.statusText}`)
  }
  const biomes: Array<any> = await res.json()

  const trimmed = biomes.map((b) => {
    const { id, name, category, dimension, displayName } = b
    return { id, name, category, dimension, displayName }
  })

  const outDir = resolve(__dirname, 'api')
  await mkdir(outDir, { recursive: true })
  const outPath = resolve(outDir, 'biomes.trimmed.json')
  await writeFile(outPath, JSON.stringify(trimmed, null, 2), 'utf-8')
  console.log(`Wrote ${trimmed.length} biomes to ${outPath}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
