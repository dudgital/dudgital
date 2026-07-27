import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const root = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      '@dudgital/shared': path.join(root, 'shared/src/index.ts'),
      '@dudgital/operations': path.join(root, 'operations/src/index.ts'),
      '@dudgital/framework-nextjs': path.join(root, 'catalogs/frameworks/nextjs/src/index.ts'),
      '@dudgital/framework-laravel': path.join(root, 'catalogs/frameworks/laravel/src/index.ts'),
      '@dudgital/module-auth': path.join(root, 'catalogs/modules/auth/src/index.ts'),
      '@dudgital/module-notify': path.join(root, 'catalogs/modules/notify/src/index.ts'),
      '@dudgital/provider-clerk': path.join(root, 'catalogs/providers/clerk/src/index.ts'),
      '@dudgital/provider-better-auth': path.join(root, 'catalogs/providers/better-auth/src/index.ts'),
      '@dudgital/provider-resend': path.join(root, 'catalogs/providers/resend/src/index.ts'),
    },
  },
  test: {
    include: ['tests/**/*.test.ts'],
    testTimeout: 30_000,
  },
})
