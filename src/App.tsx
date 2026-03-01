import { useState, useEffect, useCallback } from 'react'
import { TitleBar } from './components/TitleBar'
import { DropZone } from './components/DropZone'
import { Viewer } from './components/Viewer'
import type { RefilePointer } from './global'

export function App() {
  const [pointer, setPointer] = useState<RefilePointer | null>(null)
  const [filePath, setFilePath] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const openFile = useCallback(async (path: string) => {
    const result = await window.refileAPI.readPointer(path)
    if (result.success && result.data) {
      setPointer(result.data)
      setFilePath(result.path ?? path)
      setError(null)
    } else {
      setError(result.error ?? 'Failed to read file')
      setPointer(null)
      setFilePath(null)
    }
  }, [])

  // Listen for files opened from OS (file association / second instance)
  useEffect(() => {
    return window.refileAPI.onOpenFile(openFile)
  }, [openFile])

  // Ctrl+O shortcut
  useEffect(() => {
    const handler = async (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'o') {
        e.preventDefault()
        const path = await window.refileAPI.openFileDialog()
        if (path) openFile(path)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [openFile])

  const handleOpenDialog = useCallback(async () => {
    const path = await window.refileAPI.openFileDialog()
    if (path) openFile(path)
  }, [openFile])

  const handleBack = useCallback(() => {
    setPointer(null)
    setFilePath(null)
    setError(null)
  }, [])

  // Drag & drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file?.path) openFile(file.path)
  }, [openFile])

  return (
    <div
      className="h-screen flex flex-col bg-zinc-950 text-zinc-100"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      <TitleBar fileName={pointer?.name} onBack={pointer ? handleBack : undefined} />
      <main className="flex-1 overflow-hidden">
        {pointer ? (
          <Viewer pointer={pointer} filePath={filePath!} onOpenAnother={handleOpenDialog} />
        ) : (
          <DropZone onOpen={handleOpenDialog} error={error} />
        )}
      </main>
    </div>
  )
}
