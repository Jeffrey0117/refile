import fs from 'node:fs'
import path from 'node:path'
import type { Command } from 'commander'
import { loadConfig } from '../config/config.js'
import { createBackend } from '../backends/registry.js'
import { verifyHash } from '../core/hasher.js'
import { readRefilePointer, isRefilePath, getOriginalPath } from '../core/refile-format.js'
import { walkFiles } from '../core/file-walker.js'
import { restoreFileMeta } from '../core/file-meta.js'
import { log } from '../utils/logger.js'
import { formatBytes } from '../utils/format.js'
import { createSpinner } from '../utils/progress.js'

export function registerPullCommand(program: Command): void {
  program
    .command('pull <path>')
    .description('Download files from storage and restore from .refile pointers')
    .option('--dry-run', 'Show what would happen without doing it')
    .option('-y, --yes', 'Skip confirmation prompt')
    .option('--force', 'Skip hash verification')
    .action(async (targetPath: string, options: { dryRun?: boolean; yes?: boolean; force?: boolean }) => {
      const config = loadConfig()
      if (!config) {
        log.error('No config found. Run "refile init" first.')
        process.exit(1)
      }

      const resolved = path.resolve(targetPath)

      // Collect .refile files
      const allFiles = walkFiles(resolved, { recursive: true })
      const refileFiles = allFiles.filter(isRefilePath)

      if (refileFiles.length === 0) {
        log.warn('No .refile pointers found.')
        return
      }

      const totalOriginalSize = refileFiles.reduce((sum, f) => {
        const pointer = readRefilePointer(f)
        return sum + (pointer?.size ?? 0)
      }, 0)

      log.info(`Found ${refileFiles.length} pointers (${formatBytes(totalOriginalSize)} original)`)

      if (options.dryRun) {
        for (const f of refileFiles) {
          const pointer = readRefilePointer(f)
          if (pointer) {
            log.dim(`  ${pointer.name}  (${formatBytes(pointer.size)})`)
          }
        }
        log.info('Dry run — no files were downloaded.')
        return
      }

      if (!options.yes) {
        const readline = await import('node:readline')
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
        const answer = await new Promise<string>((resolve) => {
          rl.question(`Pull ${refileFiles.length} files (${formatBytes(totalOriginalSize)})? [y/N] `, resolve)
        })
        rl.close()
        if (answer.toLowerCase() !== 'y') {
          log.info('Cancelled.')
          return
        }
      }

      let pulled = 0
      let failed = 0

      for (const refilePath of refileFiles) {
        const pointer = readRefilePointer(refilePath)
        if (!pointer) {
          log.error(`Invalid pointer: ${refilePath}`)
          failed++
          continue
        }

        const relPath = path.relative(process.cwd(), refilePath)
        const spinner = createSpinner(`Pulling ${pointer.name}`)
        spinner.start()

        try {
          // Determine backend for download
          const backendName = pointer.backend ?? config.defaultBackend
          const backendConfig = config.backends[backendName]
          if (!backendConfig) {
            throw new Error(`Backend "${backendName}" not configured`)
          }
          const backend = createBackend(backendConfig)

          const { buffer } = await backend.download(pointer.url)

          // Verify hash
          if (!options.force) {
            if (!verifyHash(buffer, pointer.hash)) {
              throw new Error('Hash mismatch — file may be corrupted. Use --force to skip verification.')
            }
          }

          // Write the original file
          const originalPath = getOriginalPath(refilePath)
          fs.writeFileSync(originalPath, buffer)

          // Restore metadata
          if (pointer.meta) {
            restoreFileMeta(originalPath, {
              mode: pointer.meta.mode ?? 0o644,
              mtime: pointer.meta.mtime ?? Date.now(),
              atime: pointer.meta.atime ?? Date.now(),
            })
          }

          // Delete the pointer
          fs.unlinkSync(refilePath)
          pulled++
          spinner.succeed(`${pointer.name} (${formatBytes(pointer.size)})`)
        } catch (err) {
          failed++
          spinner.fail(`${relPath} — ${err instanceof Error ? err.message : String(err)}`)
        }
      }

      console.log('')
      log.success(`Pulled: ${pulled}  Failed: ${failed}`)
    })
}
