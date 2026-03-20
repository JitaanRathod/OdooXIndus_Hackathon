import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { Loader2 } from 'lucide-react'

export default function Modal({ title, children, onClose, onConfirm, confirmLabel = 'Save', loading = false, size = 'md', danger = false }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose?.() }
    document.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const sizes = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-2xl', xl: 'max-w-4xl' }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />

        {/* Panel */}
        <motion.div
          className={`relative bg-white rounded-2xl shadow-2xl w-full ${sizes[size]} flex flex-col max-h-[90vh] overflow-hidden`}
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 12 }}
          transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        >
          {/* Decorative top accent */}
          <div className={`h-1 w-full ${danger ? 'bg-gradient-to-r from-red-400 to-red-600' : 'bg-gradient-to-r from-primary-500 to-purple-500'} rounded-t-2xl`} />

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-1 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="overflow-y-auto px-6 py-5 flex-1">
            {children}
          </div>

          {/* Footer */}
          {onConfirm && (
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
              <button
                onClick={onClose}
                disabled={loading}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={loading}
                className={danger ? 'btn-danger' : 'btn-primary'}
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {confirmLabel}
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  )
}