import type {
  FrameworkId,
  ModuleDefinition,
  Mutation,
  OperationResult,
  Plan,
  ProviderDefinition,
  RunOptions,
} from '@dudgital/shared'
import { detectFramework, type Registry } from '../registry.js'
import { executeMutations, verifyPlan } from '../execute.js'
import { appendHistory, recordModuleInstall } from '../state.js'

export function planMutationsFromProvider(
  module: ModuleDefinition,
  provider: ProviderDefinition,
  framework: FrameworkId,
): { mutations: Mutation[]; checks: Plan['checks']; nextSteps?: string[] } {
  if (!module.providers.includes(provider.id)) {
    throw new Error(`Provider "${provider.id}" is not valid for module "${module.id}"`)
  }
  if (!provider.modules.includes(module.id)) {
    throw new Error(`Provider "${provider.id}" does not support module "${module.id}"`)
  }
  if (!provider.frameworks.includes(framework)) {
    throw new Error(`Provider "${provider.id}" does not support framework "${framework}"`)
  }

  const mutations: Mutation[] = []
  const npm = provider.npmPackages?.[framework]
  if (npm?.length) {
    mutations.push({
      id: 'install-npm',
      kind: 'InstallPackage',
      packageManager: 'npm',
      description: `Install npm packages: ${npm.join(', ')}`,
      packages: npm,
    })
  }
  const composer = provider.composerPackages
  if (framework === 'laravel' && composer?.length) {
    mutations.push({
      id: 'install-composer',
      kind: 'InstallPackage',
      packageManager: 'composer',
      description: `Install composer packages: ${composer.join(', ')}`,
      packages: composer,
    })
  }

  const env = provider.env?.[framework]
  if (env && Object.keys(env).length) {
    mutations.push({
      id: 'merge-env',
      kind: 'MergeEnv',
      description: `Merge env keys into ${framework === 'nextjs' ? '.env.local' : '.env'}`,
      env,
      envFile: framework === 'nextjs' ? '.env.local' : '.env',
    })
  }

  const files = provider.files?.[framework] ?? []
  for (const [i, file] of files.entries()) {
    mutations.push({
      id: `file-${i}-${file.path}`,
      kind: file.mode === 'ensure' ? 'UpdateFile' : 'WriteFile',
      description: `${file.mode === 'ensure' ? 'Ensure' : 'Write'} ${file.path}`,
      path: file.path,
      content: file.content,
      marker: file.marker,
    })
  }

  return {
    mutations,
    checks: provider.doctor?.[framework] ?? [],
    nextSteps: provider.nextSteps,
  }
}

export async function planAddModule(
  reg: Registry,
  moduleId: string,
  providerId: string | undefined,
  options: RunOptions,
): Promise<Plan> {
  const mod = reg.modules.get(moduleId)
  if (!mod) throw new Error(`Unknown module: ${moduleId}`)

  const detect = await detectFramework(reg, options.cwd)
  if (!detect.detected || detect.framework === 'unknown') {
    throw new Error(`Could not detect a supported framework in ${options.cwd}: ${detect.reason}`)
  }
  const fw = reg.frameworks.get(detect.framework)
  fw?.assertSupported?.(detect)

  const resolvedProvider = providerId ?? mod.defaultProvider ?? mod.providers[0]
  if (!resolvedProvider) throw new Error(`No provider available for module ${moduleId}`)
  const provider = reg.providers.get(resolvedProvider)
  if (!provider) throw new Error(`Unknown provider: ${resolvedProvider}`)

  const { mutations, checks, nextSteps } = planMutationsFromProvider(mod, provider, detect.framework)

  return {
    operation: 'AddModule',
    project: { cwd: options.cwd, framework: detect.framework },
    moduleId,
    providerId: resolvedProvider,
    mutations,
    checks,
    nextSteps,
  }
}

export async function executeAddModule(
  reg: Registry,
  plan: Plan,
  options: RunOptions,
): Promise<OperationResult> {
  const dryRun = Boolean(options.dryRun)
  const results = executeMutations(reg, plan.project.framework, plan.mutations, options.cwd, dryRun)

  let verifyOk = true
  let verifyMessages: string[] = []
  if (!dryRun) {
    const verified = verifyPlan(options.cwd, plan)
    verifyOk = verified.ok && !results.some((r) => r.status === 'failed')
    verifyMessages = verified.messages

    if (verifyOk && plan.moduleId && plan.providerId) {
      recordModuleInstall(options.cwd, plan.project.framework, plan.moduleId, plan.providerId)
    }
    appendHistory(options.cwd, {
      timestamp: new Date().toISOString(),
      operation: plan.operation,
      moduleId: plan.moduleId,
      providerId: plan.providerId,
      framework: plan.project.framework,
      dryRun: false,
      mutationIds: plan.mutations.map((m) => m.id),
      verifyOk,
    })

    if (plan.nextSteps?.length) {
      console.log(`\nNext steps:\n${plan.nextSteps.map((s) => `  • ${s}`).join('\n')}\n`)
    }
  }

  return { plan, results, verifyOk: dryRun ? true : verifyOk, verifyMessages }
}

/** Full Operation: plan → execute → verify (+ state). */
export async function runAddModule(
  reg: Registry,
  moduleId: string,
  providerId: string | undefined,
  options: RunOptions,
): Promise<OperationResult> {
  const plan = await planAddModule(reg, moduleId, providerId, options)
  return executeAddModule(reg, plan, options)
}
