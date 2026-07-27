import { defineConfig } from 'tsup'

/** Bundle all @dudgital/* workspace packages into the CLI so npm install works without workspace:*. */
export default defineConfig({
  entry: {
    bin: 'src/bin.ts',
    index: 'src/index.ts',
  },
  format: ['esm'],
  platform: 'node',
  target: 'node20',
  clean: true,
  sourcemap: true,
  dts: {
    entry: { index: 'src/index.ts' },
  },
  splitting: false,
  shims: true,
  noExternal: [/^@dudgital\//],
})
