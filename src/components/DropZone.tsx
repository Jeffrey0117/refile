interface Props {
  onOpen: () => void
  error: string | null
}

export function DropZone({ onOpen, error }: Props) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6">
      <button
        onClick={onOpen}
        className="w-52 h-52 rounded-2xl border-2 border-dashed border-zinc-700 hover:border-zinc-500 flex flex-col items-center justify-center gap-4 transition-colors cursor-pointer group"
      >
        <svg
          className="w-14 h-14 text-zinc-600 group-hover:text-zinc-400 transition-colors"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
        <span className="text-sm text-zinc-500 group-hover:text-zinc-300 transition-colors">
          Drop or click to open
        </span>
      </button>

      <p className="text-xs text-zinc-600">
        .refile &middot; .repic &middot; .revid &middot; .remusic
      </p>

      {error && (
        <p className="text-xs text-red-400/80 max-w-xs text-center">{error}</p>
      )}
    </div>
  )
}
