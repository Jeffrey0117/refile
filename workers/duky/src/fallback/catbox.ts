import type { FallbackProvider, FallbackUploadResult } from './chain'

const CATBOX_API = 'https://catbox.moe/user/api.php'
const MAX_SIZE = 200 * 1024 * 1024 // 200 MB
const EXPECTED_HOST = 'files.catbox.moe'

export const catboxProvider: FallbackProvider = {
  name: 'catbox',
  maxSize: MAX_SIZE,

  async upload(data: ArrayBuffer, filename: string, _mime: string): Promise<FallbackUploadResult> {
    const formData = new FormData()
    formData.append('reqtype', 'fileupload')
    formData.append('fileToUpload', new File([data], filename))

    const response = await fetch(CATBOX_API, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`Catbox upload failed: HTTP ${response.status}`)
    }

    const url = await response.text()
    const trimmed = url.trim()

    // Validate returned URL is from expected Catbox domain
    try {
      const parsed = new URL(trimmed)
      if (parsed.protocol !== 'https:' || parsed.hostname !== EXPECTED_HOST) {
        throw new Error(`Catbox returned unexpected URL host: ${parsed.hostname}`)
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes('unexpected URL host')) throw err
      throw new Error(`Catbox returned invalid URL: ${trimmed.slice(0, 100)}`)
    }

    return { url: trimmed, provider: 'catbox' }
  },
}
