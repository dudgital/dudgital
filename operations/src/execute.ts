import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import type { DoctorCheck, FrameworkId, Mutation, MutationResult, Plan } from '@dudgital/shared'
import type { Registry } from './registry.js'

function mergeEnvFile(filePath: string, env: Record<string, string>, dryRun: boolean): string {
  const existing = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : ''
  const lines = existing.split(/\r?\n/)
  const keys = new Set(
    lines
      .map((l) => l.match(/^([A-Za-z_][A-Za-z0-9_]*)=/)?.[1])
      .filter((k): k is string => Boolean(k)),
  )
  const additions: string[] = []
  for (const [key, value] of Object.entries(env)) {
    if (!keys.has(key)) additions.push(`${key}=${value}`)
  }
  if (!additions.length) return 'no new keys'
  if (dryRun) return `would add: ${additions.map((a) => a.split('=')[0]).join(', ')}`
  const next = existing.trimEnd()
  const body = `${next ? `${next}\n` : ''}${additions.join('\n')}\n`
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, body, 'utf8')
  return `added ${additions.length} key(s)`
}

function writeProjectFile(
  cwd: string,
  rel: string,
  content: string,
  kind: 'WriteFile' | 'UpdateFile',
  marker: string | undefined,
  dryRun: boolean,
): string {
  const target = path.join(cwd, rel)
  const exists = fs.existsSync(target)
  if (kind === 'UpdateFile' && exists) {
    if (marker) {
      const current = fs.readFileSync(target, 'utf8')
      if (current.includes(marker)) return 'already present'
    } else {
      return 'already exists (skipped)'
    }
  }
  if (kind === 'WriteFile' && exists && marker) {
    const current = fs.readFileSync(target, 'utf8')
    if (current.includes(marker)) return 'marker present (skipped)'
  }
  if (dryRun) return exists ? 'would update' : 'would create'
  fs.mkdirSync(path.dirname(target), { recursive: true })
  fs.writeFileSync(target, content, 'utf8')
  return exists ? 'updated' : 'created'
}

function defaultNpmInstall(cwd: string, packages: string[], dryRun: boolean): void {
  if (dryRun) return
  const pkgJson = path.join(cwd, 'package.json')
  if (!fs.existsSync(pkgJson)) throw new Error('package.json not found')
  const raw = JSON.parse(fs.readFileSync(pkgJson, 'utf8')) as {
    dependencies?: Record<string, string>
    devDependencies?: Record<string, string>
  }
  raw.dependencies ??= {}
  for (const name of packages) {
    if (!raw.dependencies[name] && !raw.devDependencies?.[name]) {
      raw.dependencies[name] = 'latest'
    }
  }
  fs.writeFileSync(pkgJson, `${JSON.stringify(raw, null, 2)}\n`, 'utf8')
  const hasNpm =
    fs.existsSync(path.join(cwd, 'package-lock.json')) || !fs.existsSync(path.join(cwd, 'pnpm-lock.yaml'))
  if (process.env.DUDGITAL_SKIP_INSTALL === '1') return
  const cmd = hasNpm ? 'npm' : 'pnpm'
  const args = hasNpm ? ['install', ...packages, '--no-fund', '--no-audit'] : ['add', ...packages]
  const result = spawnSync(cmd, args, { cwd, encoding: 'utf8', shell: process.platform === 'win32' })
  if (result.status !== 0) {
    console.warn(`[dudgital] ${cmd} install soft-failed; package.json updated. ${result.stderr || ''}`)
  }
}

function defaultComposerRequire(cwd: string, packages: string[], dryRun: boolean): void {
  if (dryRun) return
  const composerPath = path.join(cwd, 'composer.json')
  if (!fs.existsSync(composerPath)) throw new Error('composer.json not found')
  const raw = JSON.parse(fs.readFileSync(composerPath, 'utf8')) as { require?: Record<string, string> }
  raw.require ??= {}
  for (const name of packages) {
    if (!raw.require[name]) raw.require[name] = '*'
  }
  fs.writeFileSync(composerPath, `${JSON.stringify(raw, null, 2)}\n`, 'utf8')
  if (process.env.DUDGITAL_SKIP_INSTALL === '1') return
  const result = spawnSync('composer', ['require', ...packages, '--no-interaction'], {
    cwd,
    encoding: 'utf8',
    shell: process.platform === 'win32',
  })
  if (result.status !== 0) {
    console.warn(`[dudgital] composer require soft-failed; composer.json updated.`)
  }
}

export function runDoctorCheck(cwd: string, check: DoctorCheck): { ok: boolean; message: string } {
  switch (check.type) {
    case 'fileExists': {
      const p = path.join(cwd, check.path ?? '')
      const ok = fs.existsSync(p)
      return { ok, message: ok ? `found ${check.path}` : `missing ${check.path}` }
    }
    case 'envKeysNamed': {
      const envFile = check.path ?? '.env.local'
      const full = path.join(cwd, envFile)
      if (!fs.existsSync(full)) return { ok: false, message: `missing ${envFile}` }
      const text = fs.readFileSync(full, 'utf8')
      const missing = (check.keys ?? []).filter((k) => !new RegExp(`^${k}=`, 'm').test(text))
      return {
        ok: missing.length === 0,
        message: missing.length ? `missing env keys: ${missing.join(', ')}` : `env keys present in ${envFile}`,
      }
    }
    case 'packageJsonDep': {
      const pkgPath = path.join(cwd, 'package.json')
      if (!fs.existsSync(pkgPath)) return { ok: false, message: 'missing package.json' }
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8')) as {
        dependencies?: Record<string, string>
        devDependencies?: Record<string, string>
      }
      const missing = (check.packages ?? []).filter(
        (name) => !pkg.dependencies?.[name] && !pkg.devDependencies?.[name],
      )
      return {
        ok: missing.length === 0,
        message: missing.length ? `missing deps: ${missing.join(', ')}` : 'npm deps present',
      }
    }
    case 'composerDep': {
      const composerPath = path.join(cwd, 'composer.json')
      if (!fs.existsSync(composerPath)) return { ok: false, message: 'missing composer.json' }
      const raw = JSON.parse(fs.readFileSync(composerPath, 'utf8')) as {
        require?: Record<string, string>
        'require-dev'?: Record<string, string>
      }
      const missing = (check.packages ?? []).filter(
        (name) => !raw.require?.[name] && !raw['require-dev']?.[name],
      )
      return {
        ok: missing.length === 0,
        message: missing.length ? `missing composer deps: ${missing.join(', ')}` : 'composer deps present',
      }
    }
    default:
      return { ok: true, message: check.message ?? 'custom ok' }
  }
}

export function executeMutations(
  reg: Registry,
  frameworkId: FrameworkId,
  mutations: Mutation[],
  cwd: string,
  dryRun: boolean,
): MutationResult[] {
  const fw = reg.frameworks.get(frameworkId)
  const results: MutationResult[] = []

  for (const m of mutations) {
    try {
      if (m.kind === 'InstallPackage') {
        if (dryRun) {
          results.push({ mutationId: m.id, status: 'dry-run', detail: m.packages?.join(', ') })
        } else if (m.packageManager === 'composer') {
          ;(fw?.runComposerRequire ?? defaultComposerRequire)(cwd, m.packages ?? [], false)
          results.push({ mutationId: m.id, status: 'ok', detail: m.packages?.join(', ') })
        } else {
          ;(fw?.runNpmInstall ?? defaultNpmInstall)(cwd, m.packages ?? [], false)
          results.push({ mutationId: m.id, status: 'ok', detail: m.packages?.join(', ') })
        }
      } else if (m.kind === 'MergeEnv') {
        const file = path.join(cwd, m.envFile ?? '.env.local')
        const detail = mergeEnvFile(file, m.env ?? {}, dryRun)
        results.push({ mutationId: m.id, status: dryRun ? 'dry-run' : 'ok', detail })
      } else if (m.kind === 'WriteFile' || m.kind === 'UpdateFile') {
        const detail = writeProjectFile(cwd, m.path ?? '', m.content ?? '', m.kind, m.marker, dryRun)
        results.push({
          mutationId: m.id,
          status: dryRun
            ? 'dry-run'
            : detail.includes('skipped') || detail.includes('present')
              ? 'skipped'
              : 'ok',
          detail,
        })
      } else if (m.kind === 'DeleteFile') {
        const target = path.join(cwd, m.path ?? '')
        if (dryRun) {
          results.push({
            mutationId: m.id,
            status: 'dry-run',
            detail: fs.existsSync(target) ? 'would delete' : 'missing',
          })
        } else if (fs.existsSync(target)) {
          fs.unlinkSync(target)
          results.push({ mutationId: m.id, status: 'ok', detail: 'deleted' })
        } else {
          results.push({ mutationId: m.id, status: 'skipped', detail: 'missing' })
        }
      } else if (m.kind === 'RunCommand') {
        if (dryRun) {
          results.push({
            mutationId: m.id,
            status: 'dry-run',
            detail: [m.command, ...(m.args ?? [])].join(' '),
          })
        } else {
          const result = spawnSync(m.command ?? '', m.args ?? [], {
            cwd,
            encoding: 'utf8',
            shell: process.platform === 'win32',
          })
          results.push({
            mutationId: m.id,
            status: result.status === 0 ? 'ok' : 'failed',
            detail: result.status === 0 ? 'ok' : result.stderr || `exit ${result.status}`,
          })
        }
      } else if (m.kind === 'DownloadSecret') {
        if (dryRun) {
          results.push({
            mutationId: m.id,
            status: 'dry-run',
            detail: m.secretKeys?.length ? m.secretKeys.join(', ') : 'would download secrets',
          })
        } else if (m.env !== undefined) {
          results.push({
            mutationId: m.id,
            status: 'ok',
            detail: `${Object.keys(m.env).length} secret(s)`,
          })
        } else {
          results.push({
            mutationId: m.id,
            status: 'failed',
            detail: 'no secrets provided — Operation must fetch before execute',
          })
        }
      }
    } catch (err) {
      results.push({
        mutationId: m.id,
        status: 'failed',
        detail: err instanceof Error ? err.message : String(err),
      })
    }
  }

  return results
}

export function verifyPlan(cwd: string, plan: Plan): { ok: boolean; messages: string[] } {
  const messages: string[] = []
  let ok = true
  for (const check of plan.checks) {
    const outcome = runDoctorCheck(cwd, check)
    messages.push(outcome.message)
    if (!outcome.ok) ok = false
  }
  return { ok, messages }
}

export function runDoctorOnly(cwd: string, checks: DoctorCheck[]): { ok: boolean; messages: string[] } {
  return verifyPlan(cwd, {
    operation: 'Doctor',
    project: { cwd, framework: 'unknown' },
    mutations: [],
    checks,
  })
}
