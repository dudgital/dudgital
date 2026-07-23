export {
  createRegistry,
  registerModule,
  registerProvider,
  registerFramework,
  detectFramework,
  type Registry,
  type FrameworkIntegration,
} from './registry.js'

export { executeMutations, verifyPlan, runDoctorCheck, runDoctorOnly } from './execute.js'
export {
  readState,
  writeState,
  recordModuleInstall,
  appendHistory,
  dudgitalDir,
  ensureDudgitalDir,
} from './state.js'

export {
  planAddModule,
  executeAddModule,
  runAddModule,
  planMutationsFromProvider,
} from './operations/add-module.js'

export { planSyncSecrets, executeSyncSecrets, type SyncSecretsOptions } from './operations/sync-secrets.js'

export { collectDoctorChecks, collectInstalledDoctorChecks } from './operations/doctor.js'

import type { OperationResult, PipelineResult, RunOptions } from '@dudgital/shared'
import type { Registry } from './registry.js'
import { runAddModule } from './operations/add-module.js'

/** @deprecated use runAddModule — thin wrapper for older call sites */
export async function addModule(
  reg: Registry,
  moduleId: string,
  providerId: string | undefined,
  options: RunOptions,
): Promise<PipelineResult> {
  const result: OperationResult = await runAddModule(reg, moduleId, providerId, options)
  return {
    framework: result.plan.project.framework,
    moduleId: result.plan.moduleId ?? moduleId,
    providerId: result.plan.providerId ?? providerId ?? '',
    tasks: result.plan.mutations,
    results: result.results.map((r) => ({
      taskId: r.mutationId,
      status: r.status,
      detail: r.detail,
    })),
    doctorOk: result.verifyOk,
    doctorMessages: result.verifyMessages,
  }
}

/** @deprecated use planAddModule */
export { planMutationsFromProvider as composeTasks } from './operations/add-module.js'
