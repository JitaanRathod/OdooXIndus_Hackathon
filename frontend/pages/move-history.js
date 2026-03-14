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

export default function MoveHistory() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [moves, setMoves]     = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [filters, setFilters] = useState({})
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo]     = useState('')

  useEffect(() => {
    if (!authLoading && !user) router.push('/login')
    if (!authLoading && user?.role === 'dispatcher') router.push('/deliveries')
  }, [user, authLoading])

  useEffect(() => {
    if (!user) return
    setLoading(true)
    const params = new URLSearchParams()
    if (filters.type)  params.append('type', filters.type)
    if (dateFrom)      params.append('from', dateFrom)
    if (dateTo)        params.append('to', dateTo)
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
    { key: 'product',       label: 'Product',       render: (_, row) => row.product?.name || '—' },
    { key: 'sku',           label: 'SKU',            render: (_, row) => <span className="font-mono text-xs">{row.product?.sku}</span> },
    { key: 'type',          label: 'Type',           render: (v) => <StatusBadge status={v} /> },
    { key: 'from_location', label: 'From',           render: (_, row) => row.fromLocation?.name || '—' },
    { key: 'to_location',   label: 'To',             render: (_, row) => row.toLocation?.name || '—' },
    { key: 'qty',           label: 'Qty',            render: (v) => <span className="font-mono font-semibold">{v}</span> },
    { key: 'user',          label: 'User',           render: (_, row) => row.user?.name || '—' },
    { key: 'createdAt',     label: 'Timestamp',      render: (v) => new Date(v).toLocaleString() },
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
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500">From</label>
          <input type="date" className="input w-36" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          <label className="text-xs text-gray-500">To</label>
          <input type="date" className="input w-36" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
      </div>

      <DataTable columns={cols} data={filtered} loading={loading} pageSize={20} />
    </Layout>
  )
}