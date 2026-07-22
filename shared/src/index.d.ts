export type FrameworkId = 'nextjs' | 'laravel' | 'unknown';
export type RouterMode = 'app' | 'pages' | 'mixed' | 'unknown';
export interface DetectResult {
    framework: FrameworkId;
    detected: boolean;
    confidence: number;
    reason: string;
    meta?: Record<string, string>;
}
export type TaskKind = 'npmInstall' | 'composerRequire' | 'envMerge' | 'writeFile' | 'ensureFile' | 'doctorCheck' | 'print';
export interface Task {
    id: string;
    kind: TaskKind;
    description: string;
    /** npm package names or composer packages */
    packages?: string[];
    /** env key → placeholder value */
    env?: Record<string, string>;
    envFile?: string;
    /** relative path from project root */
    path?: string;
    content?: string;
    /** skip write if file exists and contains marker */
    marker?: string;
    /** doctor assertion */
    check?: DoctorCheck;
}
export interface DoctorCheck {
    type: 'fileExists' | 'envKeysNamed' | 'packageJsonDep' | 'composerDep' | 'custom';
    path?: string;
    keys?: string[];
    packages?: string[];
    message?: string;
}
export interface ModuleDefinition {
    id: string;
    name: string;
    description: string;
    providers: string[];
    defaultProvider?: string;
}
export interface ProviderDefinition {
    id: string;
    name: string;
    modules: string[];
    frameworks: FrameworkId[];
    npmPackages?: Partial<Record<FrameworkId, string[]>>;
    composerPackages?: string[];
    env?: Partial<Record<FrameworkId, Record<string, string>>>;
    files?: Partial<Record<FrameworkId, Array<{
        path: string;
        content: string;
        marker?: string;
        mode?: 'write' | 'ensure';
    }>>>;
    doctor?: Partial<Record<FrameworkId, DoctorCheck[]>>;
    nextSteps?: string[];
}
export interface RunOptions {
    cwd: string;
    dryRun?: boolean;
    yes?: boolean;
}
export interface TaskResult {
    taskId: string;
    status: 'ok' | 'skipped' | 'failed' | 'dry-run';
    detail?: string;
}
export interface PipelineResult {
    framework: FrameworkId;
    moduleId: string;
    providerId: string;
    tasks: Task[];
    results: TaskResult[];
    doctorOk: boolean;
    doctorMessages: string[];
}
//# sourceMappingURL=index.d.ts.map