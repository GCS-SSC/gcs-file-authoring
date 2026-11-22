import { defineGcsExtensionRouteHandler, getEncryptedExtensionSecret } from '@gcs-ssc/extensions/server'
import { credentialKey, credentialSchema, extensionKey } from './openai'

export default defineGcsExtensionRouteHandler(async context => {
  const rootKey = process.env.GCS_EXTENSION_SECRETS_KEY
  const agencyId = context.params.agencyId
  if (!rootKey || !agencyId) return { configured: false }
  const saved = credentialSchema.safeParse(await getEncryptedExtensionSecret(context.db as never, {
    rootKey, extensionKey, ownerType: 'agency', ownerId: agencyId, secretKey: credentialKey
  }))
  return { configured: saved.success, model: saved.data?.model }
})
