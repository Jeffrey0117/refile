import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import type { RefileConfig } from './types.js'

function getConfigDir(): string {
  return path.join(os.homedir(), '.config', 'refile')
}

function getConfigPath(): string {
  return path.join(getConfigDir(), 'config.json')
}

export function loadConfig(): RefileConfig | null {
  const configPath = getConfigPath()
  try {
    const raw = fs.readFileSync(configPath, 'utf-8')
    return JSON.parse(raw) as RefileConfig
  } catch {
    return null
  }
}

export function saveConfig(config: RefileConfig): void {
  const dir = getConfigDir()
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(getConfigPath(), JSON.stringify(config, null, 2), 'utf-8')
}

export { getConfigPath }
