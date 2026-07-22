export type FrameworkId = 'nextjs' | 'laravel' | 'unknown'

export type RouterMode = 'app' | 'pages' | 'mixed' | 'unknown'

export interface DetectResult {
  framework: FrameworkId
  detected: boolean
  confidence: number
  reason: string
  meta?: Record<string, string>
}

/** Host application Dudgital mutates. */
export interface Project {
  cwd: string
  framework: FrameworkId
}

/** Seven mutation kinds for v0 — add only when a second Operation needs it. */
export type MutationKind =
  | 'InstallPackage'
  | 'WriteFile'
  | 'UpdateFile'
  | 'MergeEnv'
  | 'RunCommand'
  | 'DownloadSecret'
  | 'DeleteFile'

export type PackageManager = 'npm' | 'composer'

export interface Mutation {
  id: string
  kind: MutationKind
  description: string
  /** InstallPackage */
  packageManager?: PackageManager
  packages?: string[]
  /** MergeEnv */
  env?: Record<string, string>
  envFile?: string
  /** WriteFile / UpdateFile / DeleteFile */
  path?: string
  content?: string
  /** skip write if file exists and contains marker (UpdateFile / ensure semantics) */
  marker?: string
  /** RunCommand */
  command?: string
  args?: string[]
  /** DownloadSecret — key names to pull */
  secretKeys?: string[]
}

export interface DoctorCheck {
  type: 'fileExists' | 'envKeysNamed' | 'packageJsonDep' | 'composerDep' | 'custom'
  path?: string
  keys?: string[]
  packages?: string[]
  message?: string
}

/** Plan is Mutation[] plus operation context — not an IR. */
export interface Plan {
  operation: string
  project: Project
  moduleId?: string
  providerId?: string
  mutations: Mutation[]
  checks: DoctorCheck[]
  nextSteps?: string[]
}

export interface ModuleDefinition {
  id: string
  name: string
  description: string
  providers: string[]
  defaultProvider?: string
}

export interface ProviderDefinition {
  id: string
  name: string
  modules: string[]
  frameworks: FrameworkId[]
  npmPackages?: Partial<Record<FrameworkId, string[]>>
  composerPackages?: string[]
  env?: Partial<Record<FrameworkId, Record<string, string>>>
  files?: Partial<
    Record<
      FrameworkId,
      Array<{ path: string; content: string; marker?: string; mode?: 'write' | 'ensure' }>
    >
  >
  doctor?: Partial<Record<FrameworkId, DoctorCheck[]>>
  nextSteps?: string[]
}

export interface RunOptions {
  cwd: string
  dryRun?: boolean
  yes?: boolean
}

export interface MutationResult {
  mutationId: string
  status: 'ok' | 'skipped' | 'failed' | 'dry-run'
  detail?: string
}

export interface OperationResult {
  plan: Plan
  results: MutationResult[]
  verifyOk: boolean
  verifyMessages: string[]
}

/** Recorded Dudgital state under .dudgital/state.json */
export interface DudgitalState {
  version: 1
  framework?: FrameworkId
  modules: Record<
    string,
    {
      provider: string
      updatedAt: string
    }
  >
  updatedAt: string
}

export interface HistoryEntry {
  timestamp: string
  operation: string
  moduleId?: string
  providerId?: string
  framework?: FrameworkId
  dryRun: boolean
  mutationIds: string[]
  verifyOk?: boolean
}

/** @deprecated use Mutation */
export type Task = Mutation
/** @deprecated use MutationResult */
export type TaskResult = MutationResult
/** @deprecated use OperationResult */
export interface PipelineResult {
  framework: FrameworkId
  moduleId: string
  providerId: string
  tasks: Mutation[]
  results: Array<{ taskId: string; status: MutationResult['status']; detail?: string }>
  doctorOk: boolean
  doctorMessages: string[]
}
