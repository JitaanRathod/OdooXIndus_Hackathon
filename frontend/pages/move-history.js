import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import DataTable from '../components/DataTable'
import FilterBar from '../components/FilterBar'
import StatusBadge from '../components/StatusBadge'
import api from '../lib/api'

const TYPE_OPTIONS = [
  { value: 'receipt',    label: 'Receipt' },
  { value: 'delivery',   label: 'Delivery' },
  { value: 'transfer',   label: 'Transfer' },
  { value: 'adjustment', label: 'Adjustment' },
]

// Type-aware location rendering:
// receipt    → FROM is always external (show "Supplier"), TO is the warehouse location
// delivery   → FROM is the warehouse location, TO is always external (show "Customer")
// transfer   → both FROM and TO are real locations
// adjustment → show the location on whichever side has a value, other side shows "—"
const renderFrom = (row) => {
  if (row.type === 'receipt')  return <span className="text-gray-400 italic text-xs">Supplier</span>
  if (row.type === 'delivery') return row.fromLocation?.name || <span className="text-gray-400">—</span>
  if (row.type === 'transfer') return row.fromLocation?.name || <span className="text-gray-400">—</span>
  // adjustment
  return row.fromLocation?.name || <span className="text-gray-400">—</span>
}

const renderTo = (row) => {
  if (row.type === 'receipt')  return row.toLocation?.name || <span className="text-gray-400">—</span>
  if (row.type === 'delivery') return <span className="text-gray-400 italic text-xs">Customer</span>
  if (row.type === 'transfer') return row.toLocation?.name || <span className="text-gray-400">—</span>
  // adjustment
  return row.toLocation?.name || <span className="text-gray-400">—</span>
}

export default function MoveHistory() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [moves, setMoves]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [filters, setFilters]     = useState({})
  const [dateFrom, setDateFrom]   = useState('')
  const [dateTo, setDateTo]       = useState('')

  useEffect(() => {
    if (!authLoading && !user) router.push('/login')
    if (!authLoading && user?.role === 'dispatcher') router.push('/deliveries')
  }, [user, authLoading])

  useEffect(() => {
    if (!user) return
    setLoading(true)
    const params = new URLSearchParams()
    if (filters.type) params.append('type', filters.type)
    if (dateFrom)     params.append('from', dateFrom)
    if (dateTo)       params.append('to', dateTo)
    api.get(`/stock-moves?${params}`)
      .then(({ data }) => setMoves(data.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [user, filters, dateFrom, dateTo])

  const filtered = moves.filter(m => {
    if (!search) return true
    return m.product?.name?.toLowerCase().includes(search.toLowerCase()) ||
           m.product?.sku?.toLowerCase().includes(search.toLowerCase())
  })

  const cols = [
    { key: 'product',    label: 'Product',   render: (_, row) => (
      <div>
        <p className="font-medium text-gray-800">{row.product?.name || '—'}</p>
        <p className="text-xs text-gray-400 font-mono">{row.product?.sku}</p>
      </div>
    )},
    { key: 'type',       label: 'Type',      render: (v) => <StatusBadge status={v} /> },
    // FIX screenshot issue 2 — show meaningful labels instead of raw dashes
    { key: 'from',       label: 'From',      render: (_, row) => renderFrom(row) },
    { key: 'to',         label: 'To',        render: (_, row) => renderTo(row) },
    { key: 'qty',        label: 'Qty',       render: (_, row) => (
      <span className={`font-mono font-semibold ${row.type === 'delivery' ? 'text-red-600' : 'text-green-700'}`}>
        {row.type === 'delivery' ? '−' : '+'}{parseFloat(row.qty).toFixed(2)}
      </span>
    )},
    { key: 'notes',      label: 'Reference', render: (_, row) => (
      <span className="text-xs text-gray-500 font-mono">{row.notes?.split(' ')[0] + ' ' + (row.notes?.split(' ')[1] || '') || '—'}</span>
    )},
    { key: 'user',       label: 'User',      render: (_, row) => row.user?.name || '—' },
    { key: 'createdAt',  label: 'Timestamp', render: (v) => (
      <span className="text-xs">{new Date(v).toLocaleString()}</span>
    )},
  ]

  return (
    <Layout title="Stock Move History">
      <div className="flex flex-wrap gap-3 items-center mb-4">
        <FilterBar
          filters={[{ key: 'type', label: 'Type', options: TYPE_OPTIONS }]}
          values={filters}
          onChange={(k, v) => setFilters({ ...filters, [k]: v })}
          onSearch={setSearch}
          searchValue={search}
          searchPlaceholder="Search by product name or SKU"
        />
        <div className="flex items-center gap-2 ml-auto">
          <label className="text-xs text-gray-500">From</label>
          <input type="date" className="input w-36" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          <label className="text-xs text-gray-500">To</label>
          <input type="date" className="input w-36" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          {(dateFrom || dateTo || filters.type) && (
            <button onClick={() => { setFilters({}); setDateFrom(''); setDateTo('') }}
              className="text-xs text-gray-500 hover:text-red-500 underline">Clear</button>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 mb-3 text-xs text-gray-500">
        <span><span className="text-green-700 font-semibold">+</span> = stock added</span>
        <span><span className="text-red-600 font-semibold">−</span> = stock removed</span>
        <span className="italic">Supplier / Customer = external party</span>
      </div>

      <DataTable columns={cols} data={filtered} loading={loading} pageSize={20} />
    </Layout>
  )
}