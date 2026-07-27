import type { DoctorCheck, FrameworkId } from '@dudgital/shared'
import { runDoctorCheck } from '../execute.js'
import type { Registry } from '../registry.js'
import { readState } from '../state.js'

export function collectChecksForProvider(
  reg: Registry,
  framework: FrameworkId,
  providerId: string,
): DoctorCheck[] {
  const provider = reg.providers.get(providerId)
  if (!provider) return []
  return provider.doctor?.[framework] ?? []
}

/** Prefer `.dudgital/state.json`; fall back to package heuristics. */
export function collectDoctorChecks(reg: Registry, cwd: string, framework: FrameworkId): {
  checks: DoctorCheck[]
  fromState: boolean
  modules: string[]
} {
  const state = readState(cwd)
  if (state && Object.keys(state.modules).length > 0) {
    const checks: DoctorCheck[] = []
    const modules = Object.keys(state.modules)
    for (const [moduleId, meta] of Object.entries(state.modules)) {
      void moduleId
      checks.push(...collectChecksForProvider(reg, framework, meta.provider))
    }
    return { checks, fromState: true, modules }
  }

  const checks: DoctorCheck[] = []
  const modules: string[] = []
  for (const provider of reg.providers.values()) {
    if (!provider.frameworks.includes(framework)) continue
    const providerChecks = provider.doctor?.[framework] ?? []
    const npm = provider.npmPackages?.[framework] ?? []
    const composer = provider.composerPackages ?? []
    let installed = false
    if (npm.length) {
      installed = runDoctorCheck(cwd, { type: 'packageJsonDep', packages: npm }).ok
    }
    if (composer.length && framework === 'laravel') {
      installed = installed || runDoctorCheck(cwd, { type: 'composerDep', packages: composer }).ok
    }
    if (installed) {
      checks.push(...providerChecks)
      modules.push(...provider.modules)
    }
  }
  return { checks, fromState: false, modules: [...new Set(modules)] }
}

/** @deprecated use collectDoctorChecks */
export function collectInstalledDoctorChecks(
  reg: Registry,
  cwd: string,
  framework: FrameworkId,
): DoctorCheck[] {
  return collectDoctorChecks(reg, cwd, framework).checks
}
