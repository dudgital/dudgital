import fs from 'node:fs'
import path from 'node:path'
import {
  collectDoctorChecks,
  detectFramework,
  planAddModule,
  executeAddModule,
  planSyncSecrets,
  executeSyncSecrets,
  runDoctorOnly,
  readState,
} from '@dudgital/operations'
import { buildRegistry } from './registry.js'

const VERSION = '0.1.0'

function printHelp(): void {
  console.log(`Dudgital CLI (dude / dg) v${VERSION}

Dudgital is a project automation engine that plans and applies
safe, repeatable changes to existing software projects.

Usage:
  dg detect [--cwd <path>]
  dg doctor [--cwd <path>]
  dg add <module> [--provider <id>] [--yes] [--dry-run] [--cwd <path>]
  dg update <module> [--provider <id>] [--yes] [--dry-run] [--cwd <path>]
  dg login
  dg link [--project <id>]
  dg secrets pull [--dry-run] [--cwd <path>]
  dg --help

Spine: Command → Operation → plan() → Mutation[] → execute() → verify()

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
          'Existing middleware.ts looks auth-related. Review conflicts after apply.',
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
      const { checks, fromState, modules } = collectDoctorChecks(reg, cwd, detect.framework)
      const state = readState(cwd)
      if (fromState && state) {
        console.log(`doctor: recorded modules — ${modules.join(', ') || '(none)'}`)
      }
      if (!checks.length) {
        console.log('doctor: no Dudgital modules detected yet. Run: dg add auth')
        return 0
      }
      const { ok, messages } = runDoctorOnly(cwd, checks)
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
      const warnings = detectConflicts(cwd, moduleId)
      for (const w of warnings) console.warn(`warning: ${w}`)
      if (cmd === 'update') {
        console.log(`Updating module "${moduleId}" (safe re-apply)…`)
      }

      const plan = await planAddModule(reg, moduleId, provider, {
        cwd,
        dryRun: Boolean(flags.dryRun),
        yes: Boolean(flags.yes),
      })

      if (flags.dryRun) {
        console.log(
          `[dry-run] operation=${plan.operation} framework=${plan.project.framework} module=${plan.moduleId} provider=${plan.providerId}`,
        )
        console.log('Mutations:')
        for (const m of plan.mutations) {
          console.log(`  ${m.kind.padEnd(16)} ${m.id} — ${m.description}`)
        }
        if (plan.checks.length) {
          console.log(`Verify checks: ${plan.checks.length}`)
        }
        return 0
      }

      const result = await executeAddModule(reg, plan, { cwd, yes: Boolean(flags.yes) })
      if (process.env.DUDGITAL_TELEMETRY === '1') {
        console.error(
          `[telemetry] framework=${plan.project.framework} module=${plan.moduleId} provider=${plan.providerId} success=${result.verifyOk ? '1' : '0'}`,
        )
      }
      console.log(
        `framework=${plan.project.framework} module=${plan.moduleId} provider=${plan.providerId}`,
      )
      for (const r of result.results) {
        console.log(`  ${r.status.padEnd(8)} ${r.mutationId}${r.detail ? ` — ${r.detail}` : ''}`)
      }
      for (const m of result.verifyMessages) console.log(`  verify: ${m}`)
      if (!result.verifyOk) {
        console.error('verify failed')
        return 1
      }
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

      const plan = await planSyncSecrets(reg, { cwd, dryRun: Boolean(flags.dryRun) })
      if (flags.dryRun) {
        console.log(
          `[dry-run] operation=${plan.operation} framework=${plan.project.framework}`,
        )
        console.log('Mutations:')
        for (const m of plan.mutations) {
          console.log(`  ${m.kind.padEnd(16)} ${m.id} — ${m.description}`)
        }
        return 0
      }

      const result = await executeSyncSecrets(reg, plan, {
        cwd,
        fetchSecrets: async () => {
          const res = await fetch(`${dashboardBase()}/api/projects/${link.projectId}/secrets`, {
            headers: { authorization: `Bearer ${link.token}` },
          })
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          return (await res.json()) as Record<string, string>
        },
      })

      for (const r of result.results) {
        console.log(`  ${r.status.padEnd(8)} ${r.mutationId}${r.detail ? ` — ${r.detail}` : ''}`)
      }
      for (const m of result.verifyMessages) console.log(`  verify: ${m}`)
      if (!result.verifyOk) {
        console.error('verify failed')
        return 1
      }
      console.log(`Pulled ${result.secretCount} secret(s) via SyncSecrets Operation`)
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
