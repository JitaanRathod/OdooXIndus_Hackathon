import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown } from 'lucide-react'

function useCountUp(target, duration = 800) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (target == null || isNaN(target)) return
    const num = Number(target)
    const start = Date.now()
    const tick = () => {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // ease-out-cubic
      setCount(Math.round(eased * num))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [target, duration])
  return count
}

const VARIANT_STYLES = {
  default: {
    card: 'bg-white border-gray-100',
    icon: 'bg-primary-50 text-primary-600',
    label: 'text-gray-500',
    value: 'text-gray-900',
  },
  danger: {
    card: 'bg-red-50 border-red-100',
    icon: 'bg-red-100 text-red-600',
    label: 'text-red-600',
    value: 'text-red-900',
  },
  warning: {
    card: 'bg-amber-50 border-amber-100',
    icon: 'bg-amber-100 text-amber-600',
    label: 'text-amber-600',
    value: 'text-amber-900',
  },
  success: {
    card: 'bg-green-50 border-green-100',
    icon: 'bg-green-100 text-green-600',
    label: 'text-green-600',
    value: 'text-green-900',
  },
}

export default function KPICard({ label, value, Icon, trend, variant = 'default', delay = 0 }) {
  const styles = VARIANT_STYLES[variant] || VARIANT_STYLES.default
  const countValue = useCountUp(typeof value === 'number' ? value : null)
  const displayVal = typeof value === 'number' ? countValue : (value ?? '—')

  return (
    <motion.div
      className={`card ${styles.card} p-5 flex items-start gap-4 cursor-default group`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: 'easeOut' }}
      whileHover={{ y: -2, boxShadow: '0 8px 20px -4px rgba(0,0,0,0.10)' }}
    >
      {Icon && (
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${styles.icon} transition-transform duration-200 group-hover:scale-110`}>
          <Icon className="w-5 h-5" />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <p className={`text-[11px] font-semibold uppercase tracking-widest ${styles.label}`}>
          {label}
        </p>
        <p className={`text-2xl font-bold mt-1 leading-none tabular-nums ${styles.value}`}>
          {displayVal}
        </p>
        {trend != null && (
          <div className={`flex items-center gap-1 mt-1.5 text-xs font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {trend >= 0
              ? <TrendingUp className="w-3 h-3" />
              : <TrendingDown className="w-3 h-3" />}
            <span>{Math.abs(trend)}% vs last week</span>
          </div>
        )}
      </div>
    </motion.div>
  )
}