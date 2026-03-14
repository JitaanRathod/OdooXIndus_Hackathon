export default function AlertBanner({ count, onDismiss }) {
  if (!count || count === 0) return null
  return (
    <div className="flex items-center justify-between bg-amber-50 border border-amber-300 text-amber-800 rounded-lg px-4 py-3 mb-4 text-sm">
      <div className="flex items-center gap-2">
        <span className="text-lg">⚠️</span>
        <span>
          <strong>{count} product{count > 1 ? 's' : ''}</strong> {count > 1 ? 'are' : 'is'} below reorder point. Restock soon.
        </span>
      </div>
      {onDismiss && (
        <button onClick={onDismiss} className="text-amber-600 hover:text-amber-800 ml-4 font-bold text-lg leading-none">
          ×
        </button>
      )}
    </div>
  )
}