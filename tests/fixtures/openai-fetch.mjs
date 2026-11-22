const originalFetch = globalThis.fetch

/**
 * Intercepts only the OpenAI endpoint used by the production provider adapter.
 * @param url - Outbound URL.
 * @param options - Outbound request options.
 * @returns The deterministic provider response or original fetch response.
 */
globalThis.fetch = async (url, options) => {
  if (url !== 'https://api.openai.com/v1/responses') return originalFetch(url, options)
  if (options?.headers?.Authorization !== 'Bearer browser-fixture-key') {
    return Response.json({ error: { message: 'Unexpected fixture key' } }, { status: 401 })
  }
  const request = JSON.parse(options.body)
  const [instructions, file] = request.input[0].content
  if (file.filename === 'unreadable.bin') return Response.json({}, { status: 400 })
  const draft = {
    notices: [{ message: 'Confirm the eligibility wording.', source: 'Page 1' }],
    payload: {
      egcs_cn_entitytype: 'applicantrecipient',
      egcs_cn_name_en: 'Intake eligibility checklist',
      egcs_cn_name_fr: 'Liste de vérification de l’admissibilité',
      egcs_cn_outcomename_en: 'Eligibility',
      egcs_cn_outcomename_fr: 'Admissibilité',
      egcs_cn_checklistschema: {
        sections: [{
          key: 'eligibility', label: { en: 'Eligibility', fr: 'Admissibilité' },
          subSections: [{
            key: 'applications', label: { en: 'Applications', fr: 'Demandes' },
            questions: [{
              key: 'deadline', question: { en: 'Was the application received by the deadline?', fr: 'La demande a-t-elle été reçue avant la date limite?' },
              required: true, commentPolicy: 'optional'
            }]
          }]
        }]
      }
    }
  }
  if (file.filename === 'incomplete.txt') {
    draft.payload.egcs_cn_name_en = 'Incomplete intake checklist'
    draft.payload.egcs_cn_name_fr = ''
  }
  if (!instructions.text.includes('GCS checklist draft')) return Response.json({}, { status: 400 })
  return Response.json({ status: 'completed', output: [{ content: [{ type: 'output_text', text: JSON.stringify(draft) }] }] })
}
