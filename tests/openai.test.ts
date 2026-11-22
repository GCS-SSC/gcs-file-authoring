import { afterEach, describe, expect, it, vi } from 'vitest'
import { requestOpenAiAuthoring } from '../server/openai'

const input = {
  apiKey: 'test-key',
  file: { name: 'review.doc', type: 'application/msword', data: Buffer.from([0, 255, 42]) },
  instructions: 'Return JSON for this source.'
}

afterEach(() => vi.unstubAllGlobals())

describe('OpenAI file authoring', () => {
  it('sends document bytes without changing the format', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(Response.json({
      status: 'completed',
      output: [{ content: [{ type: 'output_text', text: '{"payload": {}}' }] }]
    }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(requestOpenAiAuthoring(input)).resolves.toEqual({ payload: {} })
    const [url, request] = fetchMock.mock.calls[0] ?? []
    expect(url).toBe('https://api.openai.com/v1/responses')
    expect(request?.headers).toMatchObject({ Authorization: 'Bearer test-key' })
    expect(JSON.parse(String(request?.body))).toMatchObject({
      store: false,
      input: [{ content: [
        { type: 'input_text', text: input.instructions },
        { type: 'input_file', filename: 'review.doc', file_data: 'data:application/msword;base64,AP8q' }
      ] }]
    })
  })

  it('sends JPEG bytes as an image input regardless of browser MIME metadata', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(Response.json({
      status: 'completed',
      output: [{ content: [{ type: 'output_text', text: '{}' }] }]
    }))
    vi.stubGlobal('fetch', fetchMock)
    await requestOpenAiAuthoring({ ...input, file: { ...input.file, name: 'photo.JPEG', type: '' } })

    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toMatchObject({
      input: [{ content: [expect.anything(), { type: 'input_image', image_url: 'data:image/jpeg;base64,AP8q' }] }]
    })
  })

  it('classifies provider errors without revealing provider response contents', async () => {
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockResolvedValue(new Response('private source excerpt', { status: 400 })))
    await expect(requestOpenAiAuthoring(input)).rejects.toMatchObject({ kind: 'rejected', message: 'rejected' })
  })
})
