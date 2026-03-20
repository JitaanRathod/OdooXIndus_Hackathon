import { useState } from 'react'
import { Search, X, SlidersHorizontal } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function FilterBar({ filters = [], values = {}, onChange, onSearch, searchValue = '', searchPlaceholder = 'Search…' }) {
  const [focused, setFocused] = useState(false)
  const hasActiveFilters = Object.values(values).some(v => v)

  const clearAll = () => {
    filters.forEach(f => onChange(f.key, ''))
    onSearch?.('')
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Search */}
      <div className={`relative flex items-center transition-all duration-200 ${focused ? 'ring-2 ring-primary-300 rounded-xl' : ''}`}>
        <Search className={`absolute left-3 w-4 h-4 transition-all duration-200 ${focused ? 'text-primary-500 rotate-0' : 'text-gray-400'}`} />
        <input
          type="text"
          value={searchValue}
          onChange={(e) => onSearch?.(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={searchPlaceholder}
          className="input pl-9 pr-8 w-56 focus:ring-0"
          style={{ boxShadow: 'none' }}
        />
        <AnimatePresence>
          {searchValue && (
            <motion.button
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ duration: 0.15 }}
              onClick={() => onSearch?.('')}
              className="absolute right-2.5 text-gray-400 hover:text-gray-600"
            >
              <X className="w-3.5 h-3.5" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Filter selects */}
      {filters.map((f) => (
        <div key={f.key} className="relative">
          <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          <select
            value={values[f.key] || ''}
            onChange={(e) => onChange(f.key, e.target.value)}
            className={`input pl-8 pr-8 w-auto appearance-none cursor-pointer ${values[f.key] ? 'border-primary-400 text-primary-700 bg-primary-50' : ''}`}
          >
            <option value="">{f.label}</option>
            {f.options.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      ))}

      {/* Clear filters button */}
      <AnimatePresence>
        {(hasActiveFilters || searchValue) && (
          <motion.button
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            onClick={clearAll}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-500 transition-colors font-medium"
          >
            <X className="w-3.5 h-3.5" />
            Clear
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}