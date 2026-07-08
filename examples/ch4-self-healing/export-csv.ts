/**
 * CH4 — Task D runner: export the locator store as a diff-friendly CSV snapshot.
 *
 *   npx tsx examples/ch4-self-healing/export-csv.ts
 *
 * Reads the existing locator-memory.json, emits locator-memory.csv (one line per
 * entry: key,selector,healCount,lastVerified) that you can commit and diff.
 */
import * as fs from 'fs'
import * as path from 'path'
import { LocatorStore } from './locator-store'

const store = new LocatorStore('./locator-memory.json')
const csv = store.toCsv()

const outPath = path.resolve('./locator-memory.csv')
fs.writeFileSync(outPath, csv + '\n', 'utf-8')

console.log(csv)
console.log(`\n[export-csv] wrote ${store.all().length} entries → ${outPath}`)
