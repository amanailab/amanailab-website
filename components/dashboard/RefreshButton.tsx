'use client'

export default function RefreshButton() {
  return (
    <button
      type="button"
      onClick={() => window.location.reload()}
      className="text-xs font-semibold text-yellow-400 hover:text-yellow-300 transition-colors shrink-0"
    >
      Refresh
    </button>
  )
}
