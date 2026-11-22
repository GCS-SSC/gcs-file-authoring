import { defineGcsAuditOwnership, defineGcsExtension } from '@gcs-ssc/extensions'
import { extensionKey } from './server/openai'

export default defineGcsExtension({
  key: extensionKey,
  sdkVersion: '^0.4.0',
  configurationAccess: 'manager',
  configurationScope: 'agency',
  name: { en: 'Author from files', fr: 'Création à partir de fichiers' },
  description: {
    en: 'Generate draft checklists, assessments, recommendation schemas, and approval templates from files using OpenAI.',
    fr: 'Générez des ébauches de listes de vérification, d’évaluations, de schémas de recommandation et de modèles d’approbation à partir de fichiers avec OpenAI.'
  },
  requiredHostCapabilities: [
    'agency-config', 'agency-only-configuration', 'configuration-access', 'audit-ownership',
    'extension-ui', 'extension-api-client', 'server-handlers', 'server-handler-rbac', 'extension-secrets'
  ],
  auditOwnership: defineGcsAuditOwnership([]),
  admin: { agency: { path: './components/OpenAiCredentials.vue' } },
  serverHandlers: [
    {
      route: '/agencies/[agencyId]/credentials',
      method: 'get',
      rbac: { subject: 'agency', action: 'delete', agency: { param: 'agencyId' } },
      path: './server/credentials.get.ts'
    },
    {
      route: '/agencies/[agencyId]/credentials',
      method: 'put',
      rbac: { subject: 'agency', action: 'delete', agency: { param: 'agencyId' } },
      path: './server/credentials.put.ts'
    }
  ]
})
