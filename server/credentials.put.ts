import { defineGcsExtensionRouteHandler, GcsExtensionUserError, lockGcsExtensionLifecycleScope, setEncryptedExtensionSecret } from '@gcs-ssc/extensions/server'
import type { Kysely } from 'kysely'
import { credentialKey, credentialSchema, extensionKey } from './openai'

export default defineGcsExtensionRouteHandler(async context => {
  const input = credentialSchema.safeParse(await context.readBody())
  const rootKey = process.env.GCS_EXTENSION_SECRETS_KEY
  const agencyId = context.params.agencyId
  const auth = context.writeAuthorization
  if (!input.success || !rootKey || !agencyId || !auth) {
    throw new GcsExtensionUserError({
      code: 'OPENAI_CREDENTIALS_UNAVAILABLE',
      message: { en: 'OpenAI credentials could not be saved.', fr: 'Les identifiants OpenAI n’ont pas pu être enregistrés.' }
    })
  }

  const database = context.db as Kysely<never>
  await database.transaction().execute(async trx => {
    await auth.lockAuthState(trx)
    await lockGcsExtensionLifecycleScope(trx as never, extensionKey, agencyId)
    await (auth.authorizeCurrentScope ?? auth.authorizeCurrentEntity)(trx)
    await setEncryptedExtensionSecret(trx as never, {
      rootKey, extensionKey, ownerType: 'agency', ownerId: agencyId, secretKey: credentialKey,
      value: input.data, metadata: { configured: true }
    })
  })
  return { configured: true }
})
