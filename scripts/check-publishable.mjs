#!/usr/bin/env node
/**
 * Verifies @dudgital/dude is npm-publishable: packed tarball has no workspace:* deps
 * and ships a self-contained dist/bin.js.
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const cliRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'cli')
const pkgPath = path.join(cliRoot, 'package.json')
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))

function assertNoWorkspace(map, label) {
  if (!map) return
  for (const [name, version] of Object.entries(map)) {
    if (String(version).startsWith('workspace:')) {
      throw new Error(`${label} still has workspace protocol: ${name}@${version}`)
    }
  }
}

assertNoWorkspace(pkg.dependencies, 'dependencies')
assertNoWorkspace(pkg.optionalDependencies, 'optionalDependencies')
assertNoWorkspace(pkg.peerDependencies, 'peerDependencies')

const binJs = path.join(cliRoot, 'dist', 'bin.js')
if (!fs.existsSync(binJs)) {
  throw new Error('dist/bin.js missing — run pnpm --filter @dudgital/dude build first')
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'dudgital-pack-'))
const pack = spawnSync('npm', ['pack', '--pack-destination', tmp, '--json'], {
  cwd: cliRoot,
  encoding: 'utf8',
  shell: process.platform === 'win32',
})
if (pack.status !== 0) {
  throw new Error(`npm pack failed: ${pack.stderr || pack.stdout}`)
}

const packed = JSON.parse(pack.stdout.trim())
const tarball = path.join(tmp, packed[0]?.filename ?? '')
if (!fs.existsSync(tarball)) {
  throw new Error(`packed tarball not found in ${tmp}`)
}

const list = spawnSync('tar', ['-tzf', tarball], { encoding: 'utf8' })
if (list.status !== 0) throw new Error(list.stderr)
const files = list.stdout.split('\n').filter(Boolean)
const hasBin = files.some((f) => f.endsWith('/dist/bin.js') || f === 'package/dist/bin.js')
if (!hasBin) throw new Error('tarball missing dist/bin.js')

console.log(
  `Publishable OK — ${path.basename(tarball)} (${files.length} files, no workspace:* runtime deps)`,
)
fs.rmSync(tmp, { recursive: true, force: true })
