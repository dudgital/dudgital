import type { ProviderDefinition } from '@dudgital/shared'

const mailer = `import { Resend } from 'resend'

// @dudgital/provider-resend
export const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendDemoEmail(to: string) {
  return resend.emails.send({
    from: process.env.RESEND_FROM ?? 'onboarding@resend.dev',
    to,
    subject: 'Hello from Dudgital',
    html: '<p>Your notify module is wired.</p>',
  })
}
`

export const resendProvider: ProviderDefinition = {
  id: 'resend',
  name: 'Resend',
  modules: ['notify'],
  frameworks: ['nextjs', 'laravel'],
  npmPackages: {
    nextjs: ['resend'],
  },
  composerPackages: ['resend/resend-laravel'],
  env: {
    nextjs: {
      RESEND_API_KEY: 're_REPLACE_ME',
      RESEND_FROM: 'onboarding@resend.dev',
    },
    laravel: {
      RESEND_API_KEY: 're_REPLACE_ME',
      MAIL_MAILER: 'resend',
    },
  },
  files: {
    nextjs: [
      {
        path: 'src/lib/mail.ts',
        content: mailer,
        marker: '@dudgital/provider-resend',
        mode: 'ensure',
      },
    ],
    laravel: [
      {
        path: 'config/dudgital-resend.php',
        content: `<?php\n// @dudgital/provider-resend\nreturn [\n    'api_key' => env('RESEND_API_KEY'),\n];\n`,
        marker: '@dudgital/provider-resend',
        mode: 'ensure',
      },
    ],
  },
  doctor: {
    nextjs: [
      { type: 'packageJsonDep', packages: ['resend'] },
      { type: 'envKeysNamed', path: '.env.local', keys: ['RESEND_API_KEY'] },
      { type: 'fileExists', path: 'src/lib/mail.ts' },
    ],
    laravel: [
      { type: 'composerDep', packages: ['resend/resend-laravel'] },
      { type: 'envKeysNamed', path: '.env', keys: ['RESEND_API_KEY'] },
      { type: 'fileExists', path: 'config/dudgital-resend.php' },
    ],
  },
  nextSteps: [
    'Create an API key at https://resend.com',
    'Verify your sending domain',
    'Run: dg doctor',
  ],
}
