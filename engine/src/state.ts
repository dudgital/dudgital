import fs from 'node:fs'
import path from 'node:path'
import type { DudgitalState, FrameworkId, HistoryEntry } from '@dudgital/shared'

export function dudgitalDir(cwd: string): string {
  return path.join(cwd, '.dudgital')
}

export function ensureDudgitalDir(cwd: string): void {
  fs.mkdirSync(dudgitalDir(cwd), { recursive: true })
}

export function readState(cwd: string): DudgitalState | null {
  const p = path.join(dudgitalDir(cwd), 'state.json')
  if (!fs.existsSync(p)) return null
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8')) as DudgitalState
  } catch {
    return null
  }
}

export function writeState(cwd: string, state: DudgitalState): void {
  ensureDudgitalDir(cwd)
  fs.writeFileSync(path.join(dudgitalDir(cwd), 'state.json'), `${JSON.stringify(state, null, 2)}\n`)
}

export function recordModuleInstall(
  cwd: string,
  framework: FrameworkId,
  moduleId: string,
  providerId: string,
): DudgitalState {
  const prev = readState(cwd) ?? {
    version: 1 as const,
    modules: {},
    updatedAt: new Date().toISOString(),
  }
  const next: DudgitalState = {
    version: 1,
    framework,
    modules: {
      ...prev.modules,
      [moduleId]: { provider: providerId, updatedAt: new Date().toISOString() },
    },
    updatedAt: new Date().toISOString(),
  }
  writeState(cwd, next)
  return next
}

export function appendHistory(cwd: string, entry: HistoryEntry): void {
  ensureDudgitalDir(cwd)
  const p = path.join(dudgitalDir(cwd), 'history.json')
  let list: HistoryEntry[] = []
  if (fs.existsSync(p)) {
    try {
      list = JSON.parse(fs.readFileSync(p, 'utf8')) as HistoryEntry[]
      if (!Array.isArray(list)) list = []
    } catch {
      list = []
    }
  }
  list.push(entry)
  fs.writeFileSync(p, `${JSON.stringify(list, null, 2)}\n`)
}
