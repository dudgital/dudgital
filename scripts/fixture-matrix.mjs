#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const fixturesDir = path.join(root, 'fixtures')

const REQUIRED = [
  { id: 'next-app-router', expect: ['package.json', 'src/app'] },
  { id: 'next-pages-router', expect: ['package.json', 'src/pages'] },
  { id: 'next-existing-middleware', expect: ['package.json', 'middleware.ts'] },
  { id: 'laravel-app', expect: ['artisan', 'composer.json'] },
]

let failed = false
console.log('Dudgital fixture matrix\n')

for (const fixture of REQUIRED) {
  const base = path.join(fixturesDir, fixture.id)
  const missing = []
  if (!fs.existsSync(base)) {
    missing.push('(fixture directory)')
  } else {
    for (const rel of fixture.expect) {
      if (!fs.existsSync(path.join(base, rel))) missing.push(rel)
    }
  }
  if (missing.length) {
    failed = true
    console.log(`FAIL  ${fixture.id} — missing: ${missing.join(', ')}`)
  } else {
    console.log(`OK    ${fixture.id}`)
  }
}

console.log('')
if (failed) {
  console.error('Fixture matrix failed.')
  process.exit(1)
}
console.log('Fixture matrix OK (Pages Router rejection covered by vitest).')
