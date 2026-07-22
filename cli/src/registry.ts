import {
  createRegistry,
  registerFramework,
  registerModule,
  registerProvider,
  type Registry,
} from '@dudgital/engine'
import { nextjsIntegration } from '@dudgital/framework-nextjs'
import { laravelIntegration } from '@dudgital/framework-laravel'
import { authModule } from '@dudgital/module-auth'
import { notifyModule } from '@dudgital/module-notify'
import { clerkProvider } from '@dudgital/provider-clerk'
import { betterAuthProvider } from '@dudgital/provider-better-auth'
import { resendProvider } from '@dudgital/provider-resend'

export function buildRegistry(): Registry {
  const reg = createRegistry()
  registerFramework(reg, nextjsIntegration)
  registerFramework(reg, laravelIntegration)
  registerModule(reg, authModule)
  registerModule(reg, notifyModule)
  registerProvider(reg, clerkProvider)
  registerProvider(reg, betterAuthProvider)
  registerProvider(reg, resendProvider)
  return reg
}
