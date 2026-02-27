/**
 * refile round-trip test
 * 1. 自動設定 urusai.cc backend
 * 2. 建一張測試圖
 * 3. push → 變成 .refile 指標
 * 4. pull → 還原回來
 * 5. 比對 hash 確認一模一樣
 */
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const PROJECT_ROOT = path.dirname(fileURLToPath(import.meta.url))
const TSX = path.join(PROJECT_ROOT, 'node_modules', '.bin', 'tsx')
const CLI = path.join(PROJECT_ROOT, 'src', 'index.ts')
const TEST_DIR = path.join(os.tmpdir(), 'refile-test-' + Date.now())

function run(args: string): string {
  try {
    return execFileSync(TSX, [CLI, ...args.split(' ')], {
      cwd: PROJECT_ROOT,
      encoding: 'utf-8',
      timeout: 30_000,
      shell: true,
    })
  } catch (err: unknown) {
    const e = err as { stdout?: string; stderr?: string }
    return (e.stdout ?? '') + (e.stderr ?? '')
  }
}

function step(label: string): void {
  console.log(`\n--- ${label} ---`)
}

// Setup
step('1. Setup config + test file')
fs.mkdirSync(TEST_DIR, { recursive: true })

// Write config directly (skip interactive init)
const configDir = path.join(os.homedir(), '.config', 'refile')
fs.mkdirSync(configDir, { recursive: true })
const config = {
  defaultBackend: 'http-upload',
  backends: {
    'http-upload': {
      type: 'http-upload',
      endpoint: 'https://api.urusai.cc/v1/upload',
      fieldName: 'file',
      responseUrlPath: 'data.url_direct',
    },
  },
}
fs.writeFileSync(path.join(configDir, 'config.json'), JSON.stringify(config, null, 2))
console.log('Config written to ~/.config/refile/config.json')

// Create a small test file (a 1x1 red PNG)
const PNG_HEADER = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG signature
  0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1
  0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xde, // 8-bit RGB
  0x00, 0x00, 0x00, 0x0c, 0x49, 0x44, 0x41, 0x54, // IDAT chunk
  0x08, 0xd7, 0x63, 0xf8, 0xcf, 0xc0, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01,
  0xe2, 0x21, 0xbc, 0x33,
  0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, // IEND chunk
  0xae, 0x42, 0x60, 0x82,
])

const testFile = path.join(TEST_DIR, 'test-image.png')
fs.writeFileSync(testFile, PNG_HEADER)
const originalSize = fs.statSync(testFile).size
console.log(`Test file: ${testFile} (${originalSize} bytes)`)

// Compute original hash
import { hashFile } from './src/core/hasher.js'
const originalHash = await hashFile(testFile)
console.log(`Original hash: ${originalHash}`)

// Push
step('2. refile push')
const pushOutput = run(`push ${testFile} --yes`)
console.log(pushOutput)

const refilePath = testFile + '.refile'
if (!fs.existsSync(refilePath)) {
  console.error('FAIL: .refile pointer not created!')
  process.exit(1)
}
if (fs.existsSync(testFile)) {
  console.error('FAIL: original file still exists after push!')
  process.exit(1)
}

// Show pointer content
step('3. .refile pointer content')
const pointer = JSON.parse(fs.readFileSync(refilePath, 'utf-8'))
console.log(JSON.stringify(pointer, null, 2))

// Status
step('4. refile status')
const statusOutput = run('status')
console.log(statusOutput)

// Pull
step('5. refile pull')
const pullOutput = run(`pull ${refilePath} --yes`)
console.log(pullOutput)

if (!fs.existsSync(testFile)) {
  console.error('FAIL: original file not restored after pull!')
  process.exit(1)
}
if (fs.existsSync(refilePath)) {
  console.error('FAIL: .refile pointer still exists after pull!')
  process.exit(1)
}

// Verify hash
step('6. Verify hash')
const restoredHash = await hashFile(testFile)
console.log(`Restored hash: ${restoredHash}`)

if (originalHash === restoredHash) {
  console.log('\n=== PASS: Round-trip successful! Hash matches. ===')
} else {
  console.error(`\nFAIL: Hash mismatch!\n  Original: ${originalHash}\n  Restored: ${restoredHash}`)
  process.exit(1)
}

// Cleanup
fs.rmSync(TEST_DIR, { recursive: true, force: true })
console.log(`\nCleaned up ${TEST_DIR}`)
