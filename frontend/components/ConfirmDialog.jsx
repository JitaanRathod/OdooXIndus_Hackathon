import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'

/**
 * ConfirmDialog — replaces all window.confirm() / window.alert() calls.
 * Usage:
 *   const [confirm, setConfirm] = useState(null)
 *   setConfirm({ message: 'Delete this?', onConfirm: () => doDelete() })
 *   <ConfirmDialog config={confirm} onClose={() => setConfirm(null)} />
 */
export default function ConfirmDialog({ config, onClose }) {
    const cancelRef = useRef(null)

    useEffect(() => {
        if (config) cancelRef.current?.focus()
        const handler = (e) => { if (e.key === 'Escape' && config) onClose() }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [config, onClose])

    const handleConfirm = () => {
        config?.onConfirm?.()
        onClose()
    }

    return (
        <AnimatePresence>
            {config && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <motion.div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />
                    <motion.div
                        className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 z-10"
                        initial={{ opacity: 0, scale: 0.92, y: 16 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92, y: 8 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    >
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                                <AlertTriangle className="w-5 h-5 text-red-500" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-base font-semibold text-gray-900">
                                    {config.title || 'Are you sure?'}
                                </h3>
                                <p className="mt-1 text-sm text-gray-500 leading-relaxed">
                                    {config.message}
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                ref={cancelRef}
                                onClick={onClose}
                                className="btn-secondary"
                            >
                                {config.cancelLabel || 'Cancel'}
                            </button>
                            <button
                                onClick={handleConfirm}
                                className={config.danger !== false ? 'btn-danger' : 'btn-primary'}
                            >
                                {config.confirmLabel || 'Confirm'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
