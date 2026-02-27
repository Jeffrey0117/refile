export interface FallbackUploadResult {
  readonly url: string
  readonly provider: string
}

export interface FallbackProvider {
  readonly name: string
  readonly maxSize: number
  upload(data: ArrayBuffer, filename: string, mime: string): Promise<FallbackUploadResult>
}

export async function runFallbackChain(
  providers: readonly FallbackProvider[],
  data: ArrayBuffer,
  filename: string,
  mime: string,
): Promise<FallbackUploadResult> {
  const errors: string[] = []

  for (const provider of providers) {
    if (data.byteLength > provider.maxSize) {
      errors.push(`${provider.name}: file too large (${data.byteLength} > ${provider.maxSize})`)
      continue
    }

    try {
      return await provider.upload(data, filename, mime)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      errors.push(`${provider.name}: ${message}`)
    }
  }

  throw new Error(`All fallback providers failed:\n${errors.join('\n')}`)
}
