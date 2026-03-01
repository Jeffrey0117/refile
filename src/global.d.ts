export interface RefilePointer {
  v: number
  type: string
  mime: string
  url: string
  hash: string
  size: number
  name: string
  createdAt: number
  backend?: string
  meta?: Record<string, unknown>
}

export interface ReadPointerResult {
  success: boolean
  data?: RefilePointer
  path?: string
  error?: string
}

export interface SaveResult {
  success: boolean
  path?: string
  error?: string
}

declare global {
  // Electron adds `path` to File objects from drag & drop
  interface File {
    readonly path: string
  }

  interface Window {
    refileAPI: {
      readPointer: (filePath: string) => Promise<ReadPointerResult>
      openFileDialog: () => Promise<string | null>
      openExternal: (url: string) => Promise<void>
      saveFile: (url: string, defaultName: string) => Promise<SaveResult>
      windowMinimize: () => Promise<void>
      windowMaximize: () => Promise<void>
      windowClose: () => Promise<void>
      windowIsMaximized: () => Promise<boolean>
      onOpenFile: (callback: (filePath: string) => void) => () => void
    }
  }
}
