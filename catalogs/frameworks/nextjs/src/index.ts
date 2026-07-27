import fs from 'node:fs'
import path from 'node:path'
import type { FrameworkIntegration } from '@dudgital/operations'
import type { DetectResult } from '@dudgital/shared'

type NextRouterMode = 'app' | 'pages' | 'mixed' | 'unknown'

function getRouterMode(projectRoot: string): NextRouterMode {
  const appPaths = [path.join(projectRoot, 'app'), path.join(projectRoot, 'src', 'app')]
  const pagesPaths = [path.join(projectRoot, 'pages'), path.join(projectRoot, 'src', 'pages')]
  const hasApp = appPaths.some((candidate) => fs.existsSync(candidate))
  const hasPages = pagesPaths.some((candidate) => fs.existsSync(candidate))
  if (hasApp && hasPages) return 'mixed'
  if (hasApp) return 'app'
  if (hasPages) return 'pages'
  return 'unknown'
}

function hasNextDependency(projectRoot: string): boolean {
  const pkgPath = path.join(projectRoot, 'package.json')
  if (!fs.existsSync(pkgPath)) return false
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8')) as {
      dependencies?: Record<string, string>
      devDependencies?: Record<string, string>
    }
    return Boolean(pkg.dependencies?.next || pkg.devDependencies?.next)
  } catch {
    return false
  }
}

function hasNextConfig(projectRoot: string): boolean {
  return ['next.config.js', 'next.config.mjs', 'next.config.ts', 'next.config.cjs'].some((name) =>
    fs.existsSync(path.join(projectRoot, name)),
  )
}

export function detectNextjs(projectRoot: string): DetectResult {
  const routerMode = getRouterMode(projectRoot)
  const dep = hasNextDependency(projectRoot)
  const config = hasNextConfig(projectRoot)
  const detected = dep || config || routerMode !== 'unknown'
  const confidence = dep && config ? 0.97 : detected ? 0.9 : 0
  return {
    framework: 'nextjs',
    detected,
    confidence,
    reason: detected
      ? routerMode === 'mixed'
        ? 'nextjs detected (mixed router; defaulting to app router)'
        : `nextjs detected (${routerMode} router)`
      : 'nextjs not detected',
    meta: { router: routerMode === 'unknown' ? 'unknown' : routerMode },
  }
}

export const nextjsIntegration: FrameworkIntegration = {
  id: 'nextjs',
  detect: detectNextjs,
  assertSupported(detect) {
    const router = detect.meta?.router
    if (router === 'pages') {
      throw new Error(
        'Pages Router is not supported by Dudgital MVP. Use a Next.js App Router project (app/ or src/app/).',
      )
    }
  },
}

export { getRouterMode }
