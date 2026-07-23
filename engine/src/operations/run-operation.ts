import type { MutationResult, OperationResult, Plan, RunOptions } from '@dudgital/shared'
import { executeMutations, verifyPlan } from '../execute.js'
import type { Registry } from '../registry.js'
import { appendHistory } from '../state.js'

export type ExecutePlanContext = {
  plan: Plan
  cwd: string
  results: MutationResult[]
  verifyOk: boolean
  verifyMessages: string[]
}

export type ExecutePlanOptions = RunOptions & {
  /** Runs after mutations + verify when not dry-run (before history append). */
  beforeHistory?: (ctx: ExecutePlanContext) => void
  /** Skip appending history.json (default: append on non-dry-run). */
  skipHistory?: boolean
}

/**
 * Shared Operation execute path: mutations → verify → optional hooks → history.
 * Used by AddModule, SyncSecrets, and future Operations (DUDG-005).
 */
export function executePlan(
  reg: Registry,
  plan: Plan,
  options: ExecutePlanOptions,
): OperationResult {
  const dryRun = Boolean(options.dryRun)
  const results = executeMutations(reg, plan.project.framework, plan.mutations, options.cwd, dryRun)

  if (dryRun) {
    return { plan, results, verifyOk: true, verifyMessages: [] }
  }

  const verified = verifyPlan(options.cwd, plan)
  const verifyOk = verified.ok && !results.some((r) => r.status === 'failed')
  const verifyMessages = verified.messages
  const ctx: ExecutePlanContext = {
    plan,
    cwd: options.cwd,
    results,
    verifyOk,
    verifyMessages,
  }

  options.beforeHistory?.(ctx)

  if (!options.skipHistory) {
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
  }

  return { plan, results, verifyOk, verifyMessages }
}
