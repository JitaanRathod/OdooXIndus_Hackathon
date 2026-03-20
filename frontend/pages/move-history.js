import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import DataTable from '../components/DataTable'
import FilterBar from '../components/FilterBar'
import StatusBadge from '../components/StatusBadge'
import api from '../lib/api'
import toast from 'react-hot-toast'

const TYPE_OPTIONS = [
  { value: 'receipt', label: 'Receipt' },
  { value: 'delivery', label: 'Delivery' },
  { value: 'transfer', label: 'Transfer' },
  { value: 'adjustment', label: 'Adjustment' },
]

const renderFrom = (row) => {
  if (row.type === 'receipt') return <span className="text-gray-400 italic text-xs">Supplier</span>
  if (row.type === 'delivery') return row.fromLocation?.name || <span className="text-gray-400">—</span>
  return row.fromLocation?.name || <span className="text-gray-400">—</span>
}

const renderTo = (row) => {
  if (row.type === 'delivery') return <span className="text-gray-400 italic text-xs">Customer</span>
  if (row.type === 'receipt') return row.toLocation?.name || <span className="text-gray-400">—</span>
  return row.toLocation?.name || <span className="text-gray-400">—</span>
}

export default function MoveHistory() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [moves, setMoves] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({})
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  useEffect(() => {
    if (!authLoading && !user) router.push('/login')
    if (!authLoading && user?.role === 'dispatcher') router.push('/deliveries')
  }, [user, authLoading])

  const fetchMoves = useCallback(() => {
    if (!user) return
    setLoading(true)
    const params = new URLSearchParams()
    if (filters.type) params.append('type', filters.type)
    if (dateFrom) params.append('from', dateFrom)
    if (dateTo) params.append('to', dateTo)
    if (search) params.append('search', search) // pass search to backend
    api.get(`/stock-moves?${params}`)
      .then(({ data }) => { setMoves(data.data); setTotalCount(data.data?.length || 0) })
      .catch(() => toast.error('Failed to load stock moves'))
      .finally(() => setLoading(false))
  }, [user, filters, dateFrom, dateTo, search])

  useEffect(() => { fetchMoves() }, [fetchMoves])

  const cols = [
    {
      key: 'product', label: 'Product', render: (_, row) => (
        <div>
          <p className="font-semibold text-gray-800">{row.product?.name || '—'}</p>
          <p className="text-xs text-gray-400 font-mono">{row.product?.sku}</p>
        </div>
      )
    },
    { key: 'type', label: 'Type', render: (v) => <StatusBadge status={v} /> },
    { key: 'from', label: 'From', render: (_, row) => renderFrom(row) },
    { key: 'to', label: 'To', render: (_, row) => renderTo(row) },
    {
      key: 'qty', label: 'Qty', render: (_, row) => (
        <span className={`font-mono font-bold ${row.type === 'delivery' ? 'text-red-600' : 'text-green-600'}`}>
          {row.type === 'delivery' ? '−' : '+'}{parseFloat(row.qty).toFixed(2)}
        </span>
      )
    },
    {
      key: 'reference', label: 'Reference', render: (_, row) => (
        <span className="text-xs text-gray-500 font-mono">{(row.notes || '').split(' ').slice(0, 2).join(' ') || '—'}</span>
      )
    },
    { key: 'user', label: 'User', render: (_, row) => row.user?.name || '—' },
    { key: 'createdAt', label: 'Timestamp', render: (v) => <span className="text-xs">{new Date(v).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span> },
  ]

  return (
    <Layout title="Stock Move History">
      <div className="flex flex-wrap gap-3 items-center mb-5">
        <FilterBar
          filters={[{ key: 'type', label: 'All Types', options: TYPE_OPTIONS }]}
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
        </div>
      </div>

      <div className="flex gap-4 mb-3 text-xs text-gray-500 items-center">
        <span><span className="text-green-600 font-bold">+</span> = stock added</span>
        <span><span className="text-red-600 font-bold">−</span> = stock removed</span>
        <span className="italic">Supplier / Customer = external party</span>
        {!loading && <span className="ml-auto font-medium text-gray-400">{totalCount} records shown</span>}
      </div>

      <DataTable columns={cols} data={moves} loading={loading} pageSize={20} />
    </Layout>
  )
}