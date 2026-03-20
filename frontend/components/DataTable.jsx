import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronUp, ChevronDown, ChevronsUpDown, Inbox } from 'lucide-react'

function SkeletonRow({ cols }) {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-gray-100 rounded-lg" style={{ width: `${60 + (i * 13) % 40}%` }} />
        </td>
      ))}
    </tr>
  )
}

export default function DataTable({ columns, data, onRowClick, loading, pageSize = 20 }) {
  const [page, setPage] = useState(1)
  const [sortKey, setSortKey] = useState(null)
  const [sortDir, setSortDir] = useState('asc')

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
    setPage(1)
  }

  const sorted = [...(data || [])].sort((a, b) => {
    if (!sortKey) return 0
    const av = a[sortKey]; const bv = b[sortKey]
    if (av == null) return 1; if (bv == null) return -1
    const cmp = av < bv ? -1 : av > bv ? 1 : 0
    return sortDir === 'asc' ? cmp : -cmp
  })

  const total = sorted.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const rows = sorted.slice((page - 1) * pageSize, page * pageSize)
  const sortable = columns.filter(c => !c.render)

  const SortIcon = ({ colKey }) => {
    if (sortKey !== colKey) return <ChevronsUpDown className="w-3 h-3 text-gray-300" />
    return sortDir === 'asc'
      ? <ChevronUp className="w-3 h-3 text-primary-500" />
      : <ChevronDown className="w-3 h-3 text-primary-500" />
  }

  return (
    <div>
      <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm bg-white">
        <table className="min-w-full divide-y divide-gray-50 text-sm">
          <thead className="bg-gray-50/70">
            <tr>
              {columns.map((col) => {
                const isSortable = !col.render && col.key !== 'actions'
                return (
                  <th
                    key={col.key}
                    className={`px-4 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap select-none ${isSortable ? 'cursor-pointer hover:text-gray-800 hover:bg-gray-100 transition-colors' : ''}`}
                    onClick={() => isSortable && handleSort(col.key)}
                  >
                    <div className="flex items-center gap-1.5">
                      {col.label}
                      {isSortable && <SortIcon colKey={col.key} />}
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-50">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <SkeletonRow key={i} cols={columns.length} />
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-14 text-center">
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <Inbox className="w-9 h-9 opacity-40" />
                    <span className="text-sm font-medium">No records found</span>
                  </div>
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => {
                const variant = row._rowVariant // 'danger' | 'warning' | undefined
                const rowClass = [
                  'group transition-colors',
                  onRowClick ? 'cursor-pointer' : '',
                  variant === 'danger'
                    ? 'bg-red-50 hover:bg-red-100 border-l-4 border-l-red-500'
                    : variant === 'warning'
                      ? 'bg-amber-50 hover:bg-amber-100 border-l-4 border-l-amber-400'
                      : onRowClick ? 'hover:bg-primary-50/60' : 'hover:bg-gray-50/80',
                ].join(' ')
                return (
                  <motion.tr
                    key={row.id || idx}
                    onClick={() => onRowClick?.(row)}
                    className={rowClass}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.12, delay: Math.min(idx * 0.015, 0.1) }}
                  >
                    {columns.map((col) => (
                      <td key={col.key} className="px-4 py-3 text-gray-800 whitespace-nowrap">
                        {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                      </td>
                    ))}
                  </motion.tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
          <span>{total} records · Page {page} of {totalPages}</span>
          <div className="flex gap-1.5">
            <button
              disabled={page === 1}
              onClick={() => setPage(1)}
              className="px-2.5 py-1.5 rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-gray-50 text-xs font-medium transition-colors"
            >«</button>
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-gray-50 font-medium transition-colors"
            >← Prev</button>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-gray-50 font-medium transition-colors"
            >Next →</button>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(totalPages)}
              className="px-2.5 py-1.5 rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-gray-50 text-xs font-medium transition-colors"
            >»</button>
          </div>
        </div>
      )}
    </div>
  )
}