import { useState } from 'react'
import type { RefilePointer } from '../global'

// ── Helpers ──────────────────────────────────────────────────────

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`
  return `${(bytes / 1024 ** 3).toFixed(1)} GB`
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// ── Media viewer ─────────────────────────────────────────────────

function MediaViewer({ pointer }: { pointer: RefilePointer }) {
  const { mime, url, name } = pointer

  if (mime.startsWith('image/')) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <img
          src={url}
          alt={name}
          className="max-w-full max-h-full object-contain rounded"
          draggable={false}
        />
      </div>
    )
  }

  if (mime.startsWith('video/')) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <video
          src={url}
          controls
          autoPlay
          className="max-w-full max-h-full rounded"
        />
      </div>
    )
  }

  if (mime.startsWith('audio/')) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6">
        <div className="w-32 h-32 rounded-2xl bg-zinc-900 flex items-center justify-center">
          <svg className="w-16 h-16 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
          </svg>
        </div>
        <p className="text-sm text-zinc-300">{name}</p>
        <audio src={url} controls autoPlay className="w-80" />
      </div>
    )
  }

  // Generic file
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <div className="w-24 h-24 rounded-2xl bg-zinc-900 flex items-center justify-center">
        <svg className="w-12 h-12 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      </div>
      <p className="text-sm text-zinc-300">{name}</p>
      <p className="text-xs text-zinc-500">{mime}</p>
    </div>
  )
}

// ── Main viewer ──────────────────────────────────────────────────

interface Props {
  pointer: RefilePointer
  filePath: string
  onOpenAnother: () => void
}

export function Viewer({ pointer, onOpenAnother }: Props) {
  const [downloading, setDownloading] = useState(false)

  const handleDownload = async () => {
    setDownloading(true)
    try {
      await window.refileAPI.saveFile(pointer.url, pointer.name)
    } finally {
      setDownloading(false)
    }
  }

  const handleOpenUrl = () => {
    window.refileAPI.openExternal(pointer.url)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <MediaViewer pointer={pointer} />
      </div>

      {/* Metadata bar */}
      <div className="border-t border-zinc-800/50 px-4 py-2.5 flex items-center gap-4 text-xs shrink-0">
        <div className="flex-1 min-w-0">
          <p className="text-zinc-300 truncate font-medium">{pointer.name}</p>
          <p className="text-zinc-600 mt-0.5">
            {formatSize(pointer.size)} &middot; {pointer.mime} &middot; {formatDate(pointer.createdAt)}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={onOpenAnother}
            className="px-3 py-1.5 rounded bg-zinc-800/50 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
            title="Open another file (Ctrl+O)"
          >
            Open...
          </button>
          <button
            onClick={handleOpenUrl}
            className="px-3 py-1.5 rounded bg-zinc-800/50 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
          >
            URL
          </button>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:text-blue-300 text-white transition-colors cursor-pointer"
          >
            {downloading ? 'Saving...' : 'Download'}
          </button>
        </div>
      </div>
    </div>
  )
}
