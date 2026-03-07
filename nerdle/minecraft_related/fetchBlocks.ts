/*
  Fetch Minecraft blocks data from PrismarineJS and trim to desired fields.
  Output: nerdle/minecraft_related/api/blocks.trimmed.json
*/

import { writeFile, mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'

const RAW_URL = 'https://raw.githubusercontent.com/PrismarineJS/minecraft-data/master/data/pc/1.21.7/blocks.json'

async function main() {
  const res = await fetch(RAW_URL)
  if (!res.ok) {
    throw new Error(`Failed to fetch blocks: ${res.status} ${res.statusText}`)
  }
  const blocks: Array<any> = await res.json()

  const trimmed = blocks.map((b) => {
    const { id, name, displayName, stackSize, diggable, material } = b
    return { id, name, displayName, stackSize, diggable, material }
  })

  const outDir = resolve(__dirname, 'api')
  await mkdir(outDir, { recursive: true })
  const outPath = resolve(outDir, 'blocks.trimmed.json')
  await writeFile(outPath, JSON.stringify(trimmed, null, 2), 'utf-8')
  console.log(`Wrote ${trimmed.length} blocks to ${outPath}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
