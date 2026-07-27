import fs from 'node:fs'
import path from 'node:path'
import type { FrameworkIntegration } from '@dudgital/operations'
import type { DetectResult } from '@dudgital/shared'

export function detectLaravel(projectRoot: string): DetectResult {
  const artisan = fs.existsSync(path.join(projectRoot, 'artisan'))
  const composerPath = path.join(projectRoot, 'composer.json')
  let laravelDep = false
  if (fs.existsSync(composerPath)) {
    try {
      const raw = JSON.parse(fs.readFileSync(composerPath, 'utf8')) as {
        require?: Record<string, string>
      }
      laravelDep = Boolean(raw.require?.['laravel/framework'])
    } catch {
      laravelDep = false
    }
  }
  const detected = artisan || laravelDep
  return {
    framework: 'laravel',
    detected,
    confidence: artisan && laravelDep ? 0.98 : detected ? 0.9 : 0,
    reason: detected
      ? artisan
        ? 'laravel detected (artisan + composer markers)'
        : 'laravel detected (composer laravel/framework)'
      : 'laravel not detected',
  }
}

export const laravelIntegration: FrameworkIntegration = {
  id: 'laravel',
  detect: detectLaravel,
}
