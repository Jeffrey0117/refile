import fs from 'node:fs'
import path from 'node:path'
import chalk from 'chalk'
import type { Command } from 'commander'
import { readRefilePointer, isRefilePath } from '../core/refile-format.js'
import { walkFiles } from '../core/file-walker.js'
import { log } from '../utils/logger.js'
import { formatBytes } from '../utils/format.js'

export function registerStatusCommand(program: Command): void {
  program
    .command('status [path]')
    .description('Show virtualization status and space savings')
    .option('--json', 'Output as JSON')
    .action((targetPath: string | undefined, options: { json?: boolean }) => {
      const resolved = path.resolve(targetPath ?? '.')

      const allFiles = walkFiles(resolved, { recursive: true })
      const refileFiles = allFiles.filter(isRefilePath)
      const realFiles = allFiles.filter((f) => !isRefilePath(f))

      const realSize = realFiles.reduce((sum, f) => {
        try { return sum + fs.statSync(f).size } catch { return sum }
      }, 0)

      const pointerDiskSize = refileFiles.reduce((sum, f) => {
        try { return sum + fs.statSync(f).size } catch { return sum }
      }, 0)

      // Read pointer data for original sizes
      const pointers = refileFiles.map(readRefilePointer).filter((p) => p !== null)
      const originalSize = pointers.reduce((sum, p) => sum + p.size, 0)
      const savedBytes = originalSize - pointerDiskSize

      // Group by MIME type
      const byMime = new Map<string, { count: number; size: number }>()
      for (const p of pointers) {
        const existing = byMime.get(p.mime) ?? { count: 0, size: 0 }
        byMime.set(p.mime, { count: existing.count + 1, size: existing.size + p.size })
      }

      if (options.json) {
        const output = {
          realFiles: realFiles.length,
          realSize,
          virtualizedFiles: pointers.length,
          originalSize,
          pointerDiskSize,
          savedBytes,
          byMime: Object.fromEntries(byMime),
        }
        console.log(JSON.stringify(output, null, 2))
        return
      }

      console.log('')
      console.log(chalk.bold('  refile status'))
      console.log(chalk.dim('  ─────────────────────────────────'))
      console.log(`  Real files:        ${realFiles.length} (${formatBytes(realSize)})`)
      console.log(`  Virtualized:       ${chalk.cyan(String(pointers.length))} (${formatBytes(originalSize)} original)`)
      console.log(`  Pointer disk use:  ${formatBytes(pointerDiskSize)}`)
      console.log(`  ${chalk.green('Space saved:')}       ${chalk.green.bold(formatBytes(savedBytes))}`)

      if (byMime.size > 0) {
        console.log('')
        console.log(chalk.dim('  By type:'))
        const sorted = [...byMime.entries()].sort(([, a], [, b]) => b.size - a.size)
        for (const [mimeType, { count, size }] of sorted) {
          console.log(`    ${mimeType.padEnd(30)} ${String(count).padStart(4)} files  ${formatBytes(size).padStart(10)}`)
        }
      }

      console.log('')
    })
}
