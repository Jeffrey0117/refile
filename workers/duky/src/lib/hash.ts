export async function sha256(data: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

export function sha256Short(hash: string): string {
  return hash.slice(0, 16) // 8 bytes = 64 bits, collision-safe up to ~4 billion uploads
}
