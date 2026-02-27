export const MAX_UPLOAD_BYTES = 100 * 1024 * 1024 // 100 MB (CF Workers limit)

export const URL_PREFIX = 'f' // /f/{id}/{filename}

export const TRUSTED_HOSTS = new Set([
  'files.catbox.moe',
  'litter.catbox.moe',
  'pixeldrain.com',
])

// dukbox accepts all file types — no MIME restriction
export function isAllowedMime(_mime: string): boolean {
  return true
}

export function isTrustedUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' && TRUSTED_HOSTS.has(parsed.hostname)
  } catch {
    return false
  }
}
