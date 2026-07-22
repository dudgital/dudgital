import fs from 'node:fs'
import path from 'node:path'
import {
  addModule,
  collectInstalledDoctorChecks,
  detectFramework,
  runDoctorOnly,
} from '@dudgital/engine'
import { buildRegistry } from './registry.js'

const VERSION = '0.1.0'

function printHelp(): void {
  console.log(`Dudgital CLI (dude / dg) v${VERSION}

Usage:
  dg detect [--cwd <path>]
  dg doctor [--cwd <path>]
  dg add <module> [--provider <id>] [--yes] [--dry-run] [--cwd <path>]
  dg update <module> [--provider <id>] [--yes] [--dry-run] [--cwd <path>]
  dg login
  dg link [--project <id>]
  dg secrets pull [--cwd <path>]
  dg --help

Modules: auth, notify
Providers: clerk, better-auth, resend
`)
}

function parseArgs(argv: string[]) {
  const args = [...argv]
  const flags: Record<string, string | boolean> = {}
  const positional: string[] = []
  while (args.length) {
    const a = args.shift()!
    if (a === '--yes' || a === '-y') flags.yes = true
    else if (a === '--dry-run') flags.dryRun = true
    else if (a === '--help' || a === '-h') flags.help = true
    else if (a.startsWith('--')) {
      const key = a.slice(2)
      const next = args[0]
      if (next && !next.startsWith('--')) {
        flags[key] = args.shift()!
      } else {
        flags[key] = true
      }
    } else positional.push(a)
  }
  return { flags, positional }
}

function dudgitalDir(cwd: string): string {
  return path.join(cwd, '.dudgital')
}

function ensureDudgitalDir(cwd: string): void {
  fs.mkdirSync(dudgitalDir(cwd), { recursive: true })
}

function detectConflicts(cwd: string, moduleId: string): string[] {
  const warnings: string[] = []
  if (moduleId === 'auth') {
    const mw = path.join(cwd, 'middleware.ts')
    if (fs.existsSync(mw)) {
      const text = fs.readFileSync(mw, 'utf8')
      if (!text.includes('@dudgital/') && (text.includes('auth') || text.includes('clerk') || text.includes('NextAuth'))) {
        warnings.push(
          'Existing middleware.ts looks auth-related. Dudgital will ensure its own middleware only if marker missing — review conflicts.',
        )
      }
    }
    const pkgPath = path.join(cwd, 'package.json')
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8')) as {
        dependencies?: Record<string, string>
      }
      const deps = pkg.dependencies ?? {}
      for (const name of ['next-auth', '@auth/core', '@clerk/nextjs', 'better-auth']) {
        if (deps[name]) warnings.push(`Project already depends on ${name}`)
      }
    }
  }
  return warnings
}

function loadLink(cwd: string): { projectId?: string; token?: string } {
  const p = path.join(dudgitalDir(cwd), 'link.json')
  if (!fs.existsSync(p)) return {}
  return JSON.parse(fs.readFileSync(p, 'utf8')) as { projectId?: string; token?: string }
}

function dashboardBase(): string {
  return process.env.DUDGITAL_DASHBOARD_URL ?? 'http://127.0.0.1:8787'
}

export async function runCli(argv: string[]): Promise<number> {
  const { flags, positional } = parseArgs(argv)
  if (flags.help || positional.length === 0) {
    printHelp()
    return 0
  }

  const cwd = path.resolve(String(flags.cwd ?? process.cwd()))
  const reg = buildRegistry()
  const cmd = positional[0]

  try {
    if (cmd === 'detect') {
      const result = await detectFramework(reg, cwd)
      console.log(JSON.stringify(result, null, 2))
      return result.detected ? 0 : 1
    }

    if (cmd === 'doctor') {
      const detect = await detectFramework(reg, cwd)
      if (!detect.detected || detect.framework === 'unknown') {
        console.error(`doctor: no framework detected (${detect.reason})`)
        return 1
      }
      const checks = collectInstalledDoctorChecks(reg, cwd, detect.framework)
      if (!checks.length) {
        console.log('doctor: no Dudgital modules detected yet. Run: dg add auth')
        return 0
      }
      const { ok, messages } = runDoctorOnly(reg, cwd, checks)
      for (const m of messages) console.log(`- ${m}`)
      console.log(ok ? 'doctor: ok' : 'doctor: failed')
      return ok ? 0 : 1
    }

    if (cmd === 'add' || cmd === 'update') {
      const moduleId = positional[1]
      if (!moduleId) {
        console.error('Usage: dg add <module> [--provider <id>]')
        return 1
      }
      const provider = flags.provider ? String(flags.provider) : undefined
      if (!flags.yes && !flags.dryRun) {
        // non-interactive default when --yes missing still proceeds (automation CLI)
      }
      const warnings = detectConflicts(cwd, moduleId)
      for (const w of warnings) console.warn(`warning: ${w}`)
      if (cmd === 'update') {
        console.log(`Updating module "${moduleId}" (safe re-apply)…`)
      }
      const result = await addModule(reg, moduleId, provider, {
        cwd,
        dryRun: Boolean(flags.dryRun),
        yes: Boolean(flags.yes),
      })
      if (process.env.DUDGITAL_TELEMETRY === '1') {
        console.error(
          `[telemetry] framework=${result.framework} module=${result.moduleId} provider=${result.providerId} success=${result.doctorOk && !flags.dryRun ? '1' : flags.dryRun ? 'dry-run' : '0'}`,
        )
      }
      console.log(
        `${flags.dryRun ? '[dry-run] ' : ''}framework=${result.framework} module=${result.moduleId} provider=${result.providerId}`,
      )
      for (const t of result.results) {
        console.log(`  ${t.status.padEnd(8)} ${t.taskId}${t.detail ? ` — ${t.detail}` : ''}`)
      }
      if (!flags.dryRun && !result.doctorOk) {
        console.error('doctor checks failed')
        return 1
      }
      ensureDudgitalDir(cwd)
      fs.writeFileSync(
        path.join(dudgitalDir(cwd), 'modules.json'),
        JSON.stringify(
          {
            [result.moduleId]: { provider: result.providerId, updatedAt: new Date().toISOString() },
          },
          null,
          2,
        ) + '\n',
      )
      return 0
    }

    if (cmd === 'login') {
      ensureDudgitalDir(cwd)
      const token = `dev_${Buffer.from(`user:${Date.now()}`).toString('base64url')}`
      fs.writeFileSync(
        path.join(dudgitalDir(cwd), 'auth.json'),
        JSON.stringify({ token, loggedInAt: new Date().toISOString() }, null, 2) + '\n',
      )
      console.log(`Logged in (local stub). Token stored in .dudgital/auth.json`)
      console.log(`Dashboard: ${dashboardBase()}`)
      return 0
    }

    if (cmd === 'link') {
      ensureDudgitalDir(cwd)
      const projectId = String(flags.project ?? `proj_${Date.now().toString(36)}`)
      const authPath = path.join(dudgitalDir(cwd), 'auth.json')
      if (!fs.existsSync(authPath)) {
        console.error('Not logged in. Run: dg login')
        return 1
      }
      const auth = JSON.parse(fs.readFileSync(authPath, 'utf8')) as { token: string }
      fs.writeFileSync(
        path.join(dudgitalDir(cwd), 'link.json'),
        JSON.stringify({ projectId, token: auth.token, linkedAt: new Date().toISOString() }, null, 2) +
          '\n',
      )
      // Best-effort register with local dashboard
      try {
        await fetch(`${dashboardBase()}/api/projects`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', authorization: `Bearer ${auth.token}` },
          body: JSON.stringify({ id: projectId, name: path.basename(cwd) }),
        })
      } catch {
        console.warn('Dashboard unreachable — link saved locally only.')
      }
      console.log(`Linked project ${projectId}`)
      return 0
    }

    if (cmd === 'secrets' && positional[1] === 'pull') {
      const link = loadLink(cwd)
      if (!link.projectId || !link.token) {
        console.error('Project not linked. Run: dg login && dg link')
        return 1
      }
      let secrets: Record<string, string> = {}
      try {
        const res = await fetch(`${dashboardBase()}/api/projects/${link.projectId}/secrets`, {
          headers: { authorization: `Bearer ${link.token}` },
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        secrets = (await res.json()) as Record<string, string>
      } catch (err) {
        console.error(`Failed to pull secrets: ${err instanceof Error ? err.message : err}`)
        return 1
      }
      const envPath = path.join(cwd, fs.existsSync(path.join(cwd, 'artisan')) ? '.env' : '.env.local')
      const existing = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : ''
      const keys = new Set(
        existing
          .split(/\r?\n/)
          .map((l) => l.match(/^([A-Za-z_][A-Za-z0-9_]*)=/)?.[1])
          .filter((k): k is string => Boolean(k)),
      )
      const additions: string[] = []
      for (const [k, v] of Object.entries(secrets)) {
        if (!keys.has(k)) additions.push(`${k}=${v}`)
      }
      if (additions.length) {
        fs.writeFileSync(envPath, `${existing.trimEnd()}${existing ? '\n' : ''}${additions.join('\n')}\n`)
      }
      console.log(`Pulled ${Object.keys(secrets).length} secret(s); added ${additions.length} new key(s) to ${path.basename(envPath)}`)
      return 0
    }

    console.error(`Unknown command: ${cmd}`)
    printHelp()
    return 1
  } catch (err) {
    console.error(err instanceof Error ? err.message : err)
    return 1
  }
}

export { buildRegistry }
