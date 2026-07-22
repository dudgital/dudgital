import type { ModuleDefinition } from '@dudgital/shared'

export const authModule: ModuleDefinition = {
  id: 'auth',
  name: 'Auth',
  description: 'Authentication setup for your application',
  providers: ['clerk', 'better-auth'],
  defaultProvider: 'clerk',
}
