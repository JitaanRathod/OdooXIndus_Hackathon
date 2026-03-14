import { useState } from 'react'
import LoadingSpinner from './LoadingSpinner'

export default function DataTable({ columns, data, onRowClick, loading, pageSize = 20 }) {
  const [page, setPage] = useState(1)
  const total = data?.length || 0
  const totalPages = Math.ceil(total / pageSize)
  const rows = data?.slice((page - 1) * pageSize, page * pageSize) || []

  if (loading) return <LoadingSpinner center />

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
        <table className="min-w-full divide-y divide-gray-100 text-sm">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-12 text-gray-400">
                  No records found
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => (
                <tr
                  key={row.id || idx}
                  onClick={() => onRowClick?.(row)}
                  className={`transition-colors ${onRowClick ? 'cursor-pointer hover:bg-primary-50' : 'hover:bg-gray-50'} ${row._highlight ? 'bg-amber-50' : ''}`}
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3 whitespace-nowrap text-gray-800">
                      {col.render ? col.render(row[col.key], row) : row[col.key] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
          <span>{total} total records</span>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
            >
              ← Prev
            </button>
            <span className="px-3 py-1.5">Page {page} of {totalPages}</span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}