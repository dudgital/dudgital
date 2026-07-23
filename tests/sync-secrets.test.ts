import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { planSyncSecrets, executeSyncSecrets, createRegistry } from '@dudgital/engine'
import { nextjsIntegration } from '@dudgital/framework-nextjs'
import { laravelIntegration } from '@dudgital/framework-laravel'
import { registerFramework } from '@dudgital/engine'

const tmpDirs: string[] = []

function copyFixture(name: string): string {
  const src = path.join(process.cwd(), 'fixtures', name)
  const dest = fs.mkdtempSync(path.join(os.tmpdir(), `dudgital-${name}-`))
  fs.cpSync(src, dest, { recursive: true })
  tmpDirs.push(dest)
  return dest
}

function buildReg() {
  const reg = createRegistry()
  registerFramework(reg, nextjsIntegration)
  registerFramework(reg, laravelIntegration)
  return reg
}

afterEach(() => {
  for (const dir of tmpDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true })
  }
})

describe('SyncSecrets Operation', () => {
  it('plans DownloadSecret + MergeEnv for next', async () => {
    const cwd = copyFixture('next-app-router')
    const plan = await planSyncSecrets(buildReg(), { cwd })
    expect(plan.operation).toBe('SyncSecrets')
    expect(plan.mutations.map((m) => m.kind)).toEqual(['DownloadSecret', 'MergeEnv'])
    expect(plan.mutations.find((m) => m.kind === 'MergeEnv')?.envFile).toBe('.env.local')
  })

  it('executes fetch + merge and records history', async () => {
    const cwd = copyFixture('next-app-router')
    const reg = buildReg()
    const plan = await planSyncSecrets(reg, { cwd })
    const result = await executeSyncSecrets(reg, plan, {
      cwd,
      fetchSecrets: async () => ({
        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_test_from_op',
        CLERK_SECRET_KEY: 'sk_test_from_op',
      }),
    })
    expect(result.verifyOk).toBe(true)
    expect(result.secretCount).toBe(2)
    const env = fs.readFileSync(path.join(cwd, '.env.local'), 'utf8')
    expect(env).toContain('pk_test_from_op')
    expect(fs.existsSync(path.join(cwd, '.dudgital', 'history.json'))).toBe(true)
  })
})
