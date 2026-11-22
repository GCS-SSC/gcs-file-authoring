<script setup lang="ts">
import { computed, onScopeDispose, ref, watch } from 'vue'
import type { GcsExtensionJsonConfig } from '@gcs-ssc/extensions'
import {
  ExtensionFormField, ExtensionInput, ExtensionSaveButton, useExtensionApi, useExtensionI18n
} from '@gcs-ssc/extensions/ui'
import { messages } from '../i18n/messages'

const { agencyId, persistedConfig, enabled = true, disabled = false, readOnly = false } = defineProps<{
  agencyId: string
  persistedConfig?: GcsExtensionJsonConfig
  enabled?: boolean
  disabled?: boolean
  readOnly?: boolean
}>()
defineModel<GcsExtensionJsonConfig>({ required: true })
const { t } = useExtensionI18n(messages)
const api = useExtensionApi('gcs-file-authoring')
const route = computed(() => `/agencies/${encodeURIComponent(agencyId)}/credentials`)
const unavailable = computed(() => !enabled || disabled || readOnly || persistedConfig === undefined)
const configured = ref<boolean | null>(null)
const apiKey = ref('')
const model = ref('gpt-4.1')
const status = ref<'idle' | 'saving' | 'failed'>('idle')
let generation = 0
let saving = false

watch([route, unavailable], async ([path, blocked], _, onCleanup) => {
  const owner = ++generation
  const controller = new AbortController()
  onCleanup(() => controller.abort())
  apiKey.value = ''
  configured.value = null
  model.value = 'gpt-4.1'
  status.value = 'idle'
  if (blocked) return
  try {
    const result = await api.get<{ configured: boolean; model?: string }>(path, { signal: controller.signal })
    if (owner !== generation || saving) return
    configured.value = result.configured
    if (result.model) model.value = result.model
  } catch {
    if (owner === generation && !controller.signal.aborted) status.value = 'failed'
  }
}, { immediate: true, flush: 'sync' })

onScopeDispose(() => {
  generation += 1
})

/** Saves credentials for the current configuration opening. */
const save = async () => {
  if (unavailable.value || saving || !apiKey.value.trim() || !model.value.trim()) return
  const owner = ++generation
  saving = true
  status.value = 'saving'
  try {
    await api.put(route.value, { apiKey: apiKey.value, model: model.value })
    if (owner !== generation) return
    apiKey.value = ''
    configured.value = true
    status.value = 'idle'
  } catch {
    if (owner === generation) status.value = 'failed'
  } finally {
    saving = false
  }
}
</script>

<template>
  <div class="space-y-4">
    <p v-if="!enabled">
      {{ t('enableFirst') }}
    </p>
    <p v-if="configured !== null" role="status">
      {{ configured ? t('configured') : t('missing') }}
    </p>
    <ExtensionFormField data-ui-target="extension.gcs-file-authoring.agency-config.api-key" :label="t('apiKey')" :description="t('keyHelp')" :required="false">
      <ExtensionInput v-model="apiKey" type="password" autocomplete="new-password" :disabled="unavailable || status === 'saving'" />
    </ExtensionFormField>
    <ExtensionFormField data-ui-target="extension.gcs-file-authoring.agency-config.model" :label="t('model')" :required="false">
      <ExtensionInput v-model="model" :disabled="unavailable || status === 'saving'" />
    </ExtensionFormField>
    <ExtensionSaveButton
      type="button"
      :label="t('save')"
      :disabled="unavailable || !apiKey.trim() || !model.trim()"
      :loading="status === 'saving'"
      @click="save" />
    <p v-if="status === 'failed'" role="alert">
      {{ t('failed') }}
    </p>
  </div>
</template>
