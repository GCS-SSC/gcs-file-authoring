import { defineGcsExtensionMessages } from '@gcs-ssc/extensions'

export const messages = defineGcsExtensionMessages({
  en: {
    enableFirst: 'Enable the extension before setting credentials.',
    configured: 'An OpenAI key is configured.',
    missing: 'No OpenAI key is configured.',
    apiKey: 'OpenAI API key',
    keyHelp: 'Enter a key to set or rotate the agency’s credentials.',
    model: 'OpenAI model',
    save: 'Save credentials',
    failed: 'OpenAI credentials could not be saved.'
  },
  fr: {
    enableFirst: 'Activez l’extension avant de définir les identifiants.',
    configured: 'Une clé OpenAI est configurée.',
    missing: 'Aucune clé OpenAI n’est configurée.',
    apiKey: 'Clé API OpenAI',
    keyHelp: 'Saisissez une clé pour définir ou renouveler les identifiants de l’organisation.',
    model: 'Modèle OpenAI',
    save: 'Enregistrer les identifiants',
    failed: 'Impossible d’enregistrer les identifiants OpenAI.'
  }
})
