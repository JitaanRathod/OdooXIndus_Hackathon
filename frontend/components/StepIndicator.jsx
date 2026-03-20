import { motion } from 'framer-motion'
import { Check } from 'lucide-react'

export default function StepIndicator({ steps, current }) {
  return (
    <div className="flex items-center gap-0">
      {steps.map((step, i) => {
        const done = i < current
        const active = i === current

        return (
          <div key={step} className="flex items-center">
            {/* Step node */}
            <div className="flex flex-col items-center gap-1">
              <motion.div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300 ${done
                    ? 'bg-primary-600 border-primary-600 text-white'
                    : active
                      ? 'bg-white border-primary-500 text-primary-600 shadow-sm shadow-primary-200'
                      : 'bg-white border-gray-200 text-gray-400'
                  }`}
                animate={active ? { scale: [1, 1.08, 1] } : {}}
                transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
              >
                {done ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </motion.div>
              <span className={`text-[10px] font-semibold whitespace-nowrap ${done ? 'text-primary-600' : active ? 'text-primary-500' : 'text-gray-400'
                }`}>
                {step}
              </span>
            </div>

            {/* Connector line between steps */}
            {i < steps.length - 1 && (
              <div className="relative w-10 h-0.5 bg-gray-200 mx-1 -translate-y-2.5 overflow-hidden">
                <motion.div
                  className="absolute inset-y-0 left-0 bg-primary-500"
                  initial={{ width: 0 }}
                  animate={{ width: done ? '100%' : '0%' }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}