import { useEffect } from 'react'

export default function Modal({ title, children, onClose, onConfirm, confirmLabel = 'Save', loading = false, size = 'md' }) {
  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const sizes = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-2xl', xl: 'max-w-4xl' }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      {/* Panel */}
      <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${sizes[size]} flex flex-col max-h-[90vh]`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none font-bold">×</button>
        </div>
        {/* Body */}
        <div className="overflow-y-auto px-6 py-4 flex-1">
          {children}
        </div>
        {/* Footer */}
        {onConfirm && (
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="px-4 py-2 text-sm rounded-lg bg-primary-700 hover:bg-primary-800 text-white disabled:opacity-60 flex items-center gap-2"
            >
              {loading && (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                </svg>
              )}
              {confirmLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}