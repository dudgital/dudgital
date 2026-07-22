import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  addModule,
  detectFramework,
  planAddModule,
  readState,
  runAddModule,
} from '@dudgital/engine'
import { buildRegistry } from '../cli/src/registry.ts'

const tmpDirs: string[] = []

function copyFixture(name: string): string {
  const src = path.join(process.cwd(), 'fixtures', name)
  const dest = fs.mkdtempSync(path.join(os.tmpdir(), `dudgital-${name}-`))
  fs.cpSync(src, dest, { recursive: true })
  tmpDirs.push(dest)
  return dest
}

afterEach(() => {
  for (const dir of tmpDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true })
  }
})

describe('detect', () => {
  it('detects next app router', async () => {
    const cwd = copyFixture('next-app-router')
    const reg = buildRegistry()
    const result = await detectFramework(reg, cwd)
    expect(result.detected).toBe(true)
    expect(result.framework).toBe('nextjs')
    expect(result.meta?.router).toMatch(/app|mixed/)
  })

  it('detects laravel', async () => {
    const cwd = copyFixture('laravel-app')
    const reg = buildRegistry()
    const result = await detectFramework(reg, cwd)
    expect(result.detected).toBe(true)
    expect(result.framework).toBe('laravel')
  })

  it('rejects pages router on add auth', async () => {
    const cwd = copyFixture('next-pages-router')
    const reg = buildRegistry()
    process.env.DUDGITAL_SKIP_INSTALL = '1'
    await expect(addModule(reg, 'auth', 'clerk', { cwd, yes: true })).rejects.toThrow(/Pages Router/)
  })
})

describe('plan / Mutation[]', () => {
  it('planAddModule produces mutations without writing files', async () => {
    const cwd = copyFixture('next-app-router')
    const reg = buildRegistry()
    const plan = await planAddModule(reg, 'auth', 'clerk', { cwd, dryRun: true, yes: true })
    expect(plan.operation).toBe('AddModule')
    expect(plan.mutations.length).toBeGreaterThan(2)
    expect(plan.mutations.every((m) => m.kind !== undefined)).toBe(true)
    expect(fs.existsSync(path.join(cwd, 'middleware.ts'))).toBe(false)
    expect(fs.existsSync(path.join(cwd, '.dudgital', 'state.json'))).toBe(false)
  })
})

describe('add auth clerk next', () => {
  it('installs clerk pipeline idempotently and records state', async () => {
    const cwd = copyFixture('next-app-router')
    const reg = buildRegistry()
    process.env.DUDGITAL_SKIP_INSTALL = '1'

    const first = await runAddModule(reg, 'auth', 'clerk', { cwd, yes: true })
    expect(first.verifyOk).toBe(true)
    expect(fs.existsSync(path.join(cwd, 'middleware.ts'))).toBe(true)
    expect(fs.existsSync(path.join(cwd, '.env.local'))).toBe(true)

    const state = readState(cwd)
    expect(state?.modules.auth?.provider).toBe('clerk')
    expect(fs.existsSync(path.join(cwd, '.dudgital', 'history.json'))).toBe(true)

    const second = await runAddModule(reg, 'auth', 'clerk', { cwd, yes: true })
    expect(second.verifyOk).toBe(true)
  })
})

describe('doctor from state', () => {
  it('records modules so doctor can read state', async () => {
    const cwd = copyFixture('next-app-router')
    const reg = buildRegistry()
    process.env.DUDGITAL_SKIP_INSTALL = '1'
    await runAddModule(reg, 'auth', 'clerk', { cwd, yes: true })
    const state = readState(cwd)
    expect(state?.modules.auth).toBeTruthy()
    expect(Object.keys(state!.modules)).toContain('auth')
  })
})

describe('add auth better-auth', () => {
  it('wires better-auth on next', async () => {
    const cwd = copyFixture('next-app-router')
    const reg = buildRegistry()
    process.env.DUDGITAL_SKIP_INSTALL = '1'
    const result = await runAddModule(reg, 'auth', 'better-auth', { cwd, yes: true })
    expect(result.verifyOk).toBe(true)
    expect(fs.existsSync(path.join(cwd, 'src/lib/auth.ts'))).toBe(true)
  })
})

describe('add notify resend', () => {
  it('wires resend on next', async () => {
    const cwd = copyFixture('next-app-router')
    const reg = buildRegistry()
    process.env.DUDGITAL_SKIP_INSTALL = '1'
    const result = await runAddModule(reg, 'notify', 'resend', { cwd, yes: true })
    expect(result.verifyOk).toBe(true)
    expect(fs.existsSync(path.join(cwd, 'src/lib/mail.ts'))).toBe(true)
  })
})

describe('conflicts', () => {
  it('still completes clerk add when custom middleware exists', async () => {
    const cwd = copyFixture('next-existing-middleware')
    const reg = buildRegistry()
    process.env.DUDGITAL_SKIP_INSTALL = '1'
    const result = await runAddModule(reg, 'auth', 'clerk', { cwd, yes: true })
    expect(result.verifyOk).toBe(true)
  })
})

describe('laravel auth clerk', () => {
  it('wires clerk middleware stub on laravel', async () => {
    const cwd = copyFixture('laravel-app')
    const reg = buildRegistry()
    process.env.DUDGITAL_SKIP_INSTALL = '1'
    const result = await runAddModule(reg, 'auth', 'clerk', { cwd, yes: true })
    expect(result.plan.project.framework).toBe('laravel')
    expect(result.verifyOk).toBe(true)
    expect(fs.existsSync(path.join(cwd, 'app/Http/Middleware/ClerkAuthenticate.php'))).toBe(true)
  })
})
