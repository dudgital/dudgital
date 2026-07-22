#!/usr/bin/env node
import { runCli } from './index.js'

const code = await runCli(process.argv.slice(2))
process.exit(code)
