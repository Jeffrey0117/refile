import fs from 'node:fs'
import path from 'node:path'

export interface WalkOptions {
  readonly recursive?: boolean
  readonly includeHidden?: boolean
  readonly exclude?: readonly string[]
}

export function walkFiles(targetPath: string, options: WalkOptions = {}): string[] {
  const { recursive = true, includeHidden = false, exclude = [] } = options
  const resolved = path.resolve(targetPath)

  const stat = fs.statSync(resolved, { throwIfNoEntry: false })
  if (!stat) return []

  if (stat.isFile()) {
    return [resolved]
  }

  if (!stat.isDirectory()) return []

  const results: string[] = []
  const entries = fs.readdirSync(resolved, { withFileTypes: true })

  for (const entry of entries) {
    if (!includeHidden && entry.name.startsWith('.')) continue
    if (exclude.some((pattern) => entry.name.includes(pattern))) continue

    const fullPath = path.join(resolved, entry.name)

    if (entry.isFile()) {
      results.push(fullPath)
    } else if (entry.isDirectory() && recursive) {
      results.push(...walkFiles(fullPath, options))
    }
  }

  return results
}
