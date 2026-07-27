import type { FrameworkId, Mutation, OperationResult, Plan, RunOptions } from '@dudgital/shared'
import { detectFramework, type Registry } from '../registry.js'
import { executePlan } from './run-operation.js'

export type SyncSecretsOptions = RunOptions & {
  fetchSecrets?: () => Promise<Record<string, string>>
}

export type SyncSecretsResult = OperationResult & {
  secretCount: number
}

function envFileFor(framework: FrameworkId): string {
  return framework === 'laravel' ? '.env' : '.env.local'
}

export async function planSyncSecrets(reg: Registry, options: RunOptions): Promise<Plan> {
  const detect = await detectFramework(reg, options.cwd)
  if (!detect.detected || detect.framework === 'unknown') {
    throw new Error(`Could not detect a supported framework in ${options.cwd}: ${detect.reason}`)
  }

  const envFile = envFileFor(detect.framework)
  const mutations: Mutation[] = [
    {
      id: 'download-secrets',
      kind: 'DownloadSecret',
      description: 'Download secrets from Dudgital dashboard',
    },
    {
      id: 'merge-secret-env',
      kind: 'MergeEnv',
      description: `Merge pulled secrets into ${envFile}`,
      env: {},
      envFile,
    },
  ]

  return {
    operation: 'SyncSecrets',
    project: { cwd: options.cwd, framework: detect.framework },
    mutations,
    checks: [],
  }
}

export async function executeSyncSecrets(
  reg: Registry,
  plan: Plan,
  options: SyncSecretsOptions,
): Promise<SyncSecretsResult> {
  const dryRun = Boolean(options.dryRun)
  let secrets: Record<string, string> = {}
  let working = plan

  if (!dryRun) {
    if (!options.fetchSecrets) {
      throw new Error('fetchSecrets is required to execute SyncSecrets')
    }
    secrets = await options.fetchSecrets()
    const envFile = envFileFor(plan.project.framework)
    working = {
      ...plan,
      mutations: [
        {
          id: 'download-secrets',
          kind: 'DownloadSecret',
          description: `Downloaded ${Object.keys(secrets).length} secret(s)`,
          secretKeys: Object.keys(secrets),
          env: secrets,
        },
        {
          id: 'merge-secret-env',
          kind: 'MergeEnv',
          description: `Merge pulled secrets into ${envFile}`,
          env: secrets,
          envFile,
        },
      ],
      checks:
        Object.keys(secrets).length > 0
          ? [
              {
                type: 'envKeysNamed',
                path: envFile,
                keys: Object.keys(secrets),
              },
            ]
          : [],
    }
  }

  const result = executePlan(reg, working, options)
  return { ...result, secretCount: Object.keys(secrets).length }
}
