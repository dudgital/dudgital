import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import type {
  DetectResult,
  DoctorCheck,
  FrameworkId,
  ModuleDefinition,
  PipelineResult,
  ProviderDefinition,
  RunOptions,
  Task,
  TaskResult,
} from '@dudgital/shared'

export type FrameworkIntegration = {
  id: FrameworkId
  detect: (cwd: string) => DetectResult | Promise<DetectResult>
  assertSupported?: (detect: DetectResult) => void
  runNpmInstall?: (cwd: string, packages: string[], dryRun: boolean) => void
  runComposerRequire?: (cwd: string, packages: string[], dryRun: boolean) => void
}

export interface Registry {
  modules: Map<string, ModuleDefinition>
  providers: Map<string, ProviderDefinition>
  frameworks: Map<FrameworkId, FrameworkIntegration>
}

export function createRegistry(): Registry {
  return {
    modules: new Map(),
    providers: new Map(),
    frameworks: new Map(),
  }
}

export function registerModule(reg: Registry, mod: ModuleDefinition): void {
  reg.modules.set(mod.id, mod)
}

export function registerProvider(reg: Registry, provider: ProviderDefinition): void {
  reg.providers.set(provider.id, provider)
}

export function registerFramework(reg: Registry, fw: FrameworkIntegration): void {
  reg.frameworks.set(fw.id, fw)
}

export async function detectFramework(reg: Registry, cwd: string): Promise<DetectResult> {
  const order: FrameworkId[] = ['nextjs', 'laravel']
  let best: DetectResult = {
    framework: 'unknown',
    detected: false,
    confidence: 0,
    reason: 'no known framework markers',
  }
  for (const id of order) {
    const fw = reg.frameworks.get(id)
    if (!fw) continue
    const result = await fw.detect(cwd)
    if (result.detected && result.confidence >= best.confidence) {
      best = result
    }
  }
  return best
}

export function composeTasks(
  module: ModuleDefinition,
  provider: ProviderDefinition,
  framework: FrameworkId,
): Task[] {
  if (!module.providers.includes(provider.id)) {
    throw new Error(`Provider "${provider.id}" is not valid for module "${module.id}"`)
  }
  if (!provider.modules.includes(module.id)) {
    throw new Error(`Provider "${provider.id}" does not support module "${module.id}"`)
  }
  if (!provider.frameworks.includes(framework)) {
    throw new Error(`Provider "${provider.id}" does not support framework "${framework}"`)
  }

  const tasks: Task[] = []
  const npm = provider.npmPackages?.[framework]
  if (npm?.length) {
    tasks.push({
      id: 'npm-install',
      kind: 'npmInstall',
      description: `Install npm packages: ${npm.join(', ')}`,
      packages: npm,
    })
  }
  const composer = provider.composerPackages
  if (framework === 'laravel' && composer?.length) {
    tasks.push({
      id: 'composer-require',
      kind: 'composerRequire',
      description: `Install composer packages: ${composer.join(', ')}`,
      packages: composer,
    })
  }

  const env = provider.env?.[framework]
  if (env && Object.keys(env).length) {
    tasks.push({
      id: 'env-merge',
      kind: 'envMerge',
      description: `Merge env keys into ${framework === 'nextjs' ? '.env.local' : '.env'}`,
      env,
      envFile: framework === 'nextjs' ? '.env.local' : '.env',
    })
  }

  const files = provider.files?.[framework] ?? []
  for (const [i, file] of files.entries()) {
    tasks.push({
      id: `file-${i}-${file.path}`,
      kind: file.mode === 'ensure' ? 'ensureFile' : 'writeFile',
      description: `${file.mode === 'ensure' ? 'Ensure' : 'Write'} ${file.path}`,
      path: file.path,
      content: file.content,
      marker: file.marker,
    })
  }

  const checks = provider.doctor?.[framework] ?? []
  for (const [i, check] of checks.entries()) {
    tasks.push({
      id: `doctor-${i}`,
      kind: 'doctorCheck',
      description: check.message ?? `Doctor: ${check.type}`,
      check,
    })
  }

  if (provider.nextSteps?.length) {
    tasks.push({
      id: 'next-steps',
      kind: 'print',
      description: 'Print next steps',
      content: provider.nextSteps.map((s) => `  • ${s}`).join('\n'),
    })
  }

  return tasks
}

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
    if (!keys.has(key)) {
      additions.push(`${key}=${value}`)
    }
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
  kind: 'writeFile' | 'ensureFile',
  marker: string | undefined,
  dryRun: boolean,
): string {
  const target = path.join(cwd, rel)
  const exists = fs.existsSync(target)
  if (kind === 'ensureFile' && exists) {
    if (marker) {
      const current = fs.readFileSync(target, 'utf8')
      if (current.includes(marker)) return 'already present'
    } else {
      return 'already exists (skipped)'
    }
  }
  if (kind === 'writeFile' && exists && marker) {
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
  if (!fs.existsSync(pkgJson)) {
    throw new Error('package.json not found')
  }
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
  // Prefer real install when lockfile tooling exists; fall back to package.json pin.
  const hasNpm = fs.existsSync(path.join(cwd, 'package-lock.json')) || !fs.existsSync(path.join(cwd, 'pnpm-lock.yaml'))
  if (process.env.DUDGITAL_SKIP_INSTALL === '1') return
  const cmd = hasNpm ? 'npm' : 'pnpm'
  const args = hasNpm ? ['install', ...packages, '--no-fund', '--no-audit'] : ['add', ...packages]
  const result = spawnSync(cmd, args, { cwd, encoding: 'utf8', shell: process.platform === 'win32' })
  if (result.status !== 0) {
    // package.json already updated — doctor can still pass on dep names
    console.warn(`[dudgital] ${cmd} install soft-failed; package.json updated. ${result.stderr || ''}`)
  }
}

function defaultComposerRequire(cwd: string, packages: string[], dryRun: boolean): void {
  if (dryRun) return
  const composerPath = path.join(cwd, 'composer.json')
  if (!fs.existsSync(composerPath)) throw new Error('composer.json not found')
  const raw = JSON.parse(fs.readFileSync(composerPath, 'utf8')) as {
    require?: Record<string, string>
  }
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

export async function runTasks(
  reg: Registry,
  frameworkId: FrameworkId,
  tasks: Task[],
  options: RunOptions,
): Promise<{ results: TaskResult[]; doctorOk: boolean; doctorMessages: string[] }> {
  const fw = reg.frameworks.get(frameworkId)
  const results: TaskResult[] = []
  const doctorMessages: string[] = []
  let doctorOk = true
  const dryRun = Boolean(options.dryRun)

  for (const task of tasks) {
    try {
      if (task.kind === 'npmInstall') {
        if (dryRun) {
          results.push({ taskId: task.id, status: 'dry-run', detail: task.packages?.join(', ') })
        } else {
          ;(fw?.runNpmInstall ?? defaultNpmInstall)(options.cwd, task.packages ?? [], false)
          results.push({ taskId: task.id, status: 'ok', detail: task.packages?.join(', ') })
        }
      } else if (task.kind === 'composerRequire') {
        if (dryRun) {
          results.push({ taskId: task.id, status: 'dry-run', detail: task.packages?.join(', ') })
        } else {
          ;(fw?.runComposerRequire ?? defaultComposerRequire)(options.cwd, task.packages ?? [], false)
          results.push({ taskId: task.id, status: 'ok', detail: task.packages?.join(', ') })
        }
      } else if (task.kind === 'envMerge') {
        const file = path.join(options.cwd, task.envFile ?? '.env.local')
        const detail = mergeEnvFile(file, task.env ?? {}, dryRun)
        results.push({ taskId: task.id, status: dryRun ? 'dry-run' : 'ok', detail })
      } else if (task.kind === 'writeFile' || task.kind === 'ensureFile') {
        const detail = writeProjectFile(
          options.cwd,
          task.path ?? '',
          task.content ?? '',
          task.kind,
          task.marker,
          dryRun,
        )
        results.push({
          taskId: task.id,
          status: dryRun ? 'dry-run' : detail.includes('skipped') || detail.includes('present') ? 'skipped' : 'ok',
          detail,
        })
      } else if (task.kind === 'doctorCheck') {
        if (dryRun) {
          results.push({ taskId: task.id, status: 'dry-run', detail: task.description })
        } else {
          const outcome = runDoctorCheck(options.cwd, task.check!)
          doctorMessages.push(outcome.message)
          if (!outcome.ok) doctorOk = false
          results.push({
            taskId: task.id,
            status: outcome.ok ? 'ok' : 'failed',
            detail: outcome.message,
          })
        }
      } else if (task.kind === 'print') {
        if (!dryRun && task.content) console.log(`\nNext steps:\n${task.content}\n`)
        results.push({ taskId: task.id, status: dryRun ? 'dry-run' : 'ok' })
      }
    } catch (err) {
      results.push({
        taskId: task.id,
        status: 'failed',
        detail: err instanceof Error ? err.message : String(err),
      })
      doctorOk = false
    }
  }

  return { results, doctorOk, doctorMessages }
}

export async function addModule(
  reg: Registry,
  moduleId: string,
  providerId: string | undefined,
  options: RunOptions,
): Promise<PipelineResult> {
  const mod = reg.modules.get(moduleId)
  if (!mod) throw new Error(`Unknown module: ${moduleId}`)

  const detect = await detectFramework(reg, options.cwd)
  if (!detect.detected || detect.framework === 'unknown') {
    throw new Error(`Could not detect a supported framework in ${options.cwd}: ${detect.reason}`)
  }
  const fw = reg.frameworks.get(detect.framework)
  fw?.assertSupported?.(detect)

  const resolvedProvider =
    providerId ??
    mod.defaultProvider ??
    mod.providers[0]
  if (!resolvedProvider) throw new Error(`No provider available for module ${moduleId}`)
  const provider = reg.providers.get(resolvedProvider)
  if (!provider) throw new Error(`Unknown provider: ${resolvedProvider}`)

  const tasks = composeTasks(mod, provider, detect.framework)
  const { results, doctorOk, doctorMessages } = await runTasks(reg, detect.framework, tasks, options)

  return {
    framework: detect.framework,
    moduleId,
    providerId: resolvedProvider,
    tasks,
    results,
    doctorOk: options.dryRun ? true : doctorOk,
    doctorMessages,
  }
}

export function runDoctorOnly(reg: Registry, cwd: string, checks: DoctorCheck[]): {
  ok: boolean
  messages: string[]
} {
  const messages: string[] = []
  let ok = true
  for (const check of checks) {
    const outcome = runDoctorCheck(cwd, check)
    messages.push(outcome.message)
    if (!outcome.ok) ok = false
  }
  return { ok, messages }
}

/** Aggregate doctor checks from all registered providers that appear installed. */
export function collectInstalledDoctorChecks(reg: Registry, cwd: string, framework: FrameworkId): DoctorCheck[] {
  const checks: DoctorCheck[] = []
  for (const provider of reg.providers.values()) {
    if (!provider.frameworks.includes(framework)) continue
    const providerChecks = provider.doctor?.[framework] ?? []
    // Include if any package from provider is present
    const npm = provider.npmPackages?.[framework] ?? []
    const composer = provider.composerPackages ?? []
    let installed = false
    if (npm.length) {
      const r = runDoctorCheck(cwd, { type: 'packageJsonDep', packages: npm })
      installed = r.ok
    }
    if (composer.length && framework === 'laravel') {
      const r = runDoctorCheck(cwd, { type: 'composerDep', packages: composer })
      installed = installed || r.ok
    }
    if (installed) checks.push(...providerChecks)
  }
  return checks
}
