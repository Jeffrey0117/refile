import type { FallbackProvider, FallbackUploadResult } from './chain'

const PIXELDRAIN_API = 'https://pixeldrain.com/api/file'
const MAX_SIZE = 10 * 1024 * 1024 * 1024 // 10 GB practical limit

export interface PixeldrainConfig {
  readonly apiKey?: string
}

export function createPixeldrainProvider(config: PixeldrainConfig = {}): FallbackProvider {
  return {
    name: 'pixeldrain',
    maxSize: MAX_SIZE,

    async upload(data: ArrayBuffer, filename: string, _mime: string): Promise<FallbackUploadResult> {
      const headers: Record<string, string> = {}

      if (config.apiKey) {
        headers['Authorization'] = `Basic ${btoa(`:${config.apiKey}`)}`
      }

      const response = await fetch(`${PIXELDRAIN_API}/${encodeURIComponent(filename)}`, {
        method: 'PUT',
        headers: {
          ...headers,
          'Content-Type': 'application/octet-stream',
        },
        body: data,
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(`Pixeldrain upload failed: HTTP ${response.status} — ${text.slice(0, 200)}`)
      }

      const json = await response.json() as { id: string }

      if (!json.id) {
        throw new Error('Pixeldrain returned no file ID')
      }

      return {
        url: `https://pixeldrain.com/api/file/${json.id}`,
        provider: 'pixeldrain',
      }
    },
  }
}
