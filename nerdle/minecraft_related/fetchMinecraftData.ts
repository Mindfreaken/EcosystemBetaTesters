/*
  Generic one-shot fetcher for Minecraft data from PrismarineJS.
  Add entries to the RESOURCES array to fetch/trim additional datasets.
*/

import { writeFile, mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'

// Define the resources to fetch and how to trim them
const RESOURCES: Array<{
  name: string
  url: string
  outFile: string
  picker: (item: any) => any
}> = [
  {
    name: 'biomes',
    url: 'https://raw.githubusercontent.com/PrismarineJS/minecraft-data/master/data/pc/1.21.7/biomes.json',
    outFile: 'biomes.trimmed.json',
    picker: (b) => {
      const { id, name, category, dimension, displayName } = b
      return { id, name, category, dimension, displayName }
    },
  },
  {
    name: 'blocks',
    url: 'https://raw.githubusercontent.com/PrismarineJS/minecraft-data/master/data/pc/1.21.7/blocks.json',
    outFile: 'blocks.trimmed.json',
    picker: (b) => {
      const { id, name, displayName, stackSize, diggable, material } = b
      return { id, name, displayName, stackSize, diggable, material }
    },
  },
  {
    name: 'effects',
    url: 'https://raw.githubusercontent.com/PrismarineJS/minecraft-data/master/data/pc/1.21.7/effects.json',
    outFile: 'effects.json',
    picker: (e) => e, // keep as-is
  },
  {
    name: 'enchantments',
    url: 'https://raw.githubusercontent.com/PrismarineJS/minecraft-data/master/data/pc/1.21.7/enchantments.json',
    outFile: 'enchantments.trimmed.json',
    picker: (e) => {
      const { id, name, displayName, treasureOnly, category, tradeable, discoverable } = e
      return { id, name, displayName, treasureOnly, category, tradeable, discoverable }
    },
  },
  {
    name: 'foods',
    url: 'https://raw.githubusercontent.com/PrismarineJS/minecraft-data/master/data/pc/1.21.7/foods.json',
    outFile: 'foods.trimmed.json',
    picker: (f) => {
      const { id, name, displayName, foodPoints, saturation } = f
      return { id, name, displayName, foodPoints, saturation }
    },
  },
]

async function fetchAndTrim(name: string, url: string, outFile: string, picker: (x: any) => any) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch ${name}: ${res.status} ${res.statusText}`)
  const arr: Array<any> = await res.json()
  const trimmed = arr.map(picker)
  const outDir = resolve(__dirname, 'api')
  await mkdir(outDir, { recursive: true })
  const outPath = resolve(outDir, outFile)
  await writeFile(outPath, JSON.stringify(trimmed, null, 2), 'utf-8')
  console.log(`✔ ${name}: ${trimmed.length} items -> ${outPath}`)
}

async function main() {
  for (const r of RESOURCES) {
    await fetchAndTrim(r.name, r.url, r.outFile, r.picker)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
