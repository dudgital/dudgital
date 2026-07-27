import type { DetectResult, FrameworkId, ModuleDefinition, ProviderDefinition } from '@dudgital/shared'

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
