import { useState, useEffect } from 'react'

interface Props {
  fileName?: string
  onBack?: () => void
}

export function TitleBar({ fileName, onBack }: Props) {
  const [maximized, setMaximized] = useState(false)

  useEffect(() => {
    window.refileAPI.windowIsMaximized().then(setMaximized)
  }, [])

  const title = fileName ? `ReFile — ${fileName}` : 'ReFile'

  return (
    <div
      className="flex items-center h-8 bg-zinc-950 border-b border-zinc-800/50 select-none shrink-0"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {onBack && (
        <button
          className="w-8 h-8 flex items-center justify-center hover:bg-zinc-800 text-zinc-500 hover:text-zinc-200 transition-colors"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          onClick={onBack}
          title="Back"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}
      <span className="ml-3 text-xs text-zinc-500 truncate flex-1">{title}</span>
      <div className="flex" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <button
          className="w-11 h-8 flex items-center justify-center hover:bg-zinc-800 text-zinc-500 hover:text-zinc-200 transition-colors"
          onClick={() => window.refileAPI.windowMinimize()}
        >
          <svg className="w-3 h-0.5" fill="currentColor" viewBox="0 0 12 2"><rect width="12" height="2" /></svg>
        </button>
        <button
          className="w-11 h-8 flex items-center justify-center hover:bg-zinc-800 text-zinc-500 hover:text-zinc-200 transition-colors"
          onClick={async () => {
            await window.refileAPI.windowMaximize()
            setMaximized(await window.refileAPI.windowIsMaximized())
          }}
        >
          {maximized ? (
            <svg className="w-3 h-3" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={1.2}>
              <rect x="2.5" y="0.5" width="9" height="9" rx="1" />
              <rect x="0.5" y="2.5" width="9" height="9" rx="1" fill="#09090b" />
            </svg>
          ) : (
            <svg className="w-3 h-3" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={1.2}>
              <rect x="0.5" y="0.5" width="11" height="11" rx="1" />
            </svg>
          )}
        </button>
        <button
          className="w-11 h-8 flex items-center justify-center hover:bg-red-600 text-zinc-500 hover:text-white transition-colors"
          onClick={() => window.refileAPI.windowClose()}
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={1.5}>
            <path d="M1 1l10 10M11 1L1 11" />
          </svg>
        </button>
      </div>
    </div>
  )
}
