import type { ModuleDefinition } from '@dudgital/shared'

export const notifyModule: ModuleDefinition = {
  id: 'notify',
  name: 'Notify',
  description: 'Transactional email / notifications',
  providers: ['resend'],
  defaultProvider: 'resend',
}
