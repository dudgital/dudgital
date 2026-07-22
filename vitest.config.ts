import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const root = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      '@dudgital/shared': path.join(root, 'shared/src/index.ts'),
      '@dudgital/engine': path.join(root, 'engine/src/index.ts'),
      '@dudgital/framework-nextjs': path.join(root, 'frameworks/nextjs/src/index.ts'),
      '@dudgital/framework-laravel': path.join(root, 'frameworks/laravel/src/index.ts'),
      '@dudgital/module-auth': path.join(root, 'modules/auth/src/index.ts'),
      '@dudgital/module-notify': path.join(root, 'modules/notify/src/index.ts'),
      '@dudgital/provider-clerk': path.join(root, 'providers/clerk/src/index.ts'),
      '@dudgital/provider-better-auth': path.join(root, 'providers/better-auth/src/index.ts'),
      '@dudgital/provider-resend': path.join(root, 'providers/resend/src/index.ts'),
    },
  },
  test: {
    include: ['tests/**/*.test.ts'],
    testTimeout: 30_000,
  },
})
