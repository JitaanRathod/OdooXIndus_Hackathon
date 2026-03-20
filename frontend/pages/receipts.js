import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import StatusBadge from '../components/StatusBadge'
import ConfirmDialog from '../components/ConfirmDialog'
import FilterBar from '../components/FilterBar'
import api from '../lib/api'
import toast from 'react-hot-toast'
import { Plus, Package } from 'lucide-react'
import { motion } from 'framer-motion'

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'done', label: 'Done' },
  { value: 'cancelled', label: 'Cancelled' },
]

export default function Receipts() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [receipts, setReceipts] = useState([])
  const [products, setProducts] = useState([])
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // 'create' | 'detail'
  const [selected, setSelected] = useState(null)
  const [detail, setDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [form, setForm] = useState({ supplier_name: '', notes: '', lines: [{ product_id: '', location_id: '', qty: '' }] })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({})
  const [confirm, setConfirm] = useState(null)
  const [actionLoading, setActionLoading] = useState({})

  useEffect(() => {
    if (!authLoading && !user) router.push('/login')
  }, [user, authLoading])

  const load = () => {
    setLoading(true)
    Promise.all([api.get('/receipts'), api.get('/products'), api.get('/locations')])
      .then(([r, p, l]) => { setReceipts(r.data.data); setProducts(p.data.data); setLocations(l.data.data) })
      .catch(() => toast.error('Failed to load receipts'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { if (user) load() }, [user])

  const openDetail = async (row) => {
    setModal('detail'); setDetailLoading(true); setDetail(null)
    try {
      const { data } = await api.get(`/receipts/${row.id}`)
      setDetail(data.data)
    } catch { toast.error('Failed to load receipt details') }
    finally { setDetailLoading(false) }
  }

  const handleCreate = async () => {
    setSaving(true); setError('')
    try {
      await api.post('/receipts', form)
      toast.success('Receipt created successfully')
      setModal(null); load()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create receipt')
    } finally { setSaving(false) }
  }

  const doAction = async (row, action) => {
    const label = action === 'validate' ? 'Validate' : 'Cancel'
    if (action === 'cancel') {
      setConfirm({
        title: `Cancel receipt ${row.reference_no}?`,
        message: 'This action cannot be undone. The receipt will be permanently cancelled.',
        confirmLabel: 'Cancel Receipt',
        onConfirm: () => _doAction(row, action),
      })
      return
    }
    _doAction(row, action)
  }

  const _doAction = async (row, action) => {
    setActionLoading(prev => ({ ...prev, [row.id + action]: true }))
    try {
      await api.post(`/receipts/${row.id}/${action}`)
      toast.success(`Receipt ${action === 'validate' ? 'validated' : 'cancelled'} successfully`)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || `${action} failed`)
    } finally {
      setActionLoading(prev => ({ ...prev, [row.id + action]: false }))
    }
  }

  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value })
  const addLine = () => setForm({ ...form, lines: [...form.lines, { product_id: '', location_id: '', qty: '' }] })
  const updateLine = (idx, field, value) => {
    const lines = form.lines.map((l, i) => i === idx ? { ...l, [field]: value } : l)
    setForm({ ...form, lines })
  }
  const removeLine = (idx) => setForm({ ...form, lines: form.lines.filter((_, i) => i !== idx) })

  const filtered = receipts.filter(r => {
    if (filters.status && r.status !== filters.status) return false
    if (search) return r.reference_no?.toLowerCase().includes(search.toLowerCase()) || r.supplier_name?.toLowerCase().includes(search.toLowerCase())
    return true
  })

  const cols = [
    { key: 'reference_no', label: 'Reference', render: (v) => <span className="font-mono text-xs font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded-lg">{v}</span> },
    { key: 'supplier_name', label: 'Supplier' },
    { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
    { key: 'creator', label: 'Created by', render: (_, row) => row.creator?.name || '—' },
    { key: 'createdAt', label: 'Date', render: (v) => new Date(v).toLocaleDateString() },
    {
      key: 'actions', label: '', render: (_, row) => (
        <div className="flex gap-2">
          {['admin', 'inventory_manager'].includes(user?.role) && row.status === 'draft' && (
            <button
              onClick={(e) => { e.stopPropagation(); doAction(row, 'validate') }}
              disabled={actionLoading[row.id + 'validate']}
              className="text-xs font-semibold text-green-600 hover:text-green-800 disabled:opacity-50 flex items-center gap-1 transition-colors"
            >
              {actionLoading[row.id + 'validate'] ? '…' : '✓ Validate'}
            </button>
          )}
          {['admin', 'inventory_manager'].includes(user?.role) && !['done', 'cancelled'].includes(row.status) && (
            <button
              onClick={(e) => { e.stopPropagation(); doAction(row, 'cancel') }}
              disabled={actionLoading[row.id + 'cancel']}
              className="text-xs font-semibold text-red-500 hover:text-red-700 disabled:opacity-50 transition-colors"
            >
              {actionLoading[row.id + 'cancel'] ? '…' : 'Cancel'}
            </button>
          )}
        </div>
      )
    },
  ]

  return (
    <Layout title="Receipts">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <FilterBar
          filters={[{ key: 'status', label: 'All Statuses', options: STATUS_OPTIONS }]}
          values={filters}
          onChange={(k, v) => setFilters({ ...filters, [k]: v })}
          onSearch={setSearch}
          searchValue={search}
          searchPlaceholder="Search by ref or supplier…"
        />
        {['admin', 'inventory_manager', 'warehouse_staff'].includes(user?.role) && (
          <button
            onClick={() => { setForm({ supplier_name: '', notes: '', lines: [{ product_id: '', location_id: '', qty: '' }] }); setError(''); setModal('create') }}
            className="btn-primary"
          >
            <Plus className="w-4 h-4" /> New Receipt
          </button>
        )}
      </div>

      <DataTable columns={cols} data={filtered} loading={loading} onRowClick={openDetail} />

      {/* Create modal */}
      {modal === 'create' && (
        <Modal title="New Receipt" onClose={() => setModal(null)} onConfirm={handleCreate} confirmLabel="Create" loading={saving} size="lg">
          <div className="space-y-4">
            {error && <p className="text-red-600 text-sm bg-red-50 rounded-xl px-3 py-2">{error}</p>}
            <div>
              <label className="label">Supplier Name</label>
              <input className="input" value={form.supplier_name} onChange={set('supplier_name')} required />
            </div>
            <div>
              <label className="label">Notes</label>
              <textarea className="input" rows={2} value={form.notes} onChange={set('notes')} />
            </div>
            <div>
              <label className="label">Product Lines</label>
              <div className="space-y-2">
                {form.lines.map((line, idx) => (
                  <motion.div key={idx} className="flex gap-2 items-center bg-gray-50 rounded-xl p-3"
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}>
                    <select className="flex-1 input" value={line.product_id} onChange={(e) => updateLine(idx, 'product_id', e.target.value)}>
                      <option value="">Select product</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                    </select>
                    <select className="flex-1 input" value={line.location_id} onChange={(e) => updateLine(idx, 'location_id', e.target.value)}>
                      <option value="">Select destination</option>
                      {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                    <input type="number" min="0.01" step="0.01" value={line.qty} onChange={(e) => updateLine(idx, 'qty', e.target.value)}
                      placeholder="Qty" className="w-24 input" />
                    <button type="button" onClick={() => removeLine(idx)} className="text-red-400 hover:text-red-600 text-xl font-bold px-1 transition-colors">×</button>
                  </motion.div>
                ))}
              </div>
              <button type="button" onClick={addLine} className="mt-2 text-sm text-primary-600 hover:text-primary-800 font-medium flex items-center gap-1 transition-colors">
                <span className="text-lg">+</span> Add product line
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Detail modal */}
      {modal === 'detail' && (
        <Modal title={detail ? `Receipt ${detail.reference_no}` : 'Loading…'} onClose={() => { setModal(null); setDetail(null) }} size="lg">
          {detailLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full" />
            </div>
          ) : detail && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-gray-500">Supplier</span><p className="font-semibold mt-0.5">{detail.supplier_name || '—'}</p></div>
                <div><span className="text-gray-500">Status</span><div className="mt-0.5"><StatusBadge status={detail.status} /></div></div>
                <div><span className="text-gray-500">Created by</span><p className="font-semibold mt-0.5">{detail.creator?.name || '—'}</p></div>
                <div><span className="text-gray-500">Date</span><p className="font-semibold mt-0.5">{new Date(detail.createdAt).toLocaleDateString()}</p></div>
                {detail.notes && <div className="col-span-2"><span className="text-gray-500">Notes</span><p className="font-medium mt-0.5">{detail.notes}</p></div>}
              </div>

              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Package className="w-3.5 h-3.5" /> Product Lines
                </h3>
                <div className="border border-gray-100 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-xs text-gray-500 uppercase font-semibold">
                      <tr>
                        <th className="px-4 py-2.5 text-left">Product</th>
                        <th className="px-4 py-2.5 text-left">Location</th>
                        <th className="px-4 py-2.5 text-right">Expected</th>
                        <th className="px-4 py-2.5 text-right">Received</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {detail.lines?.map((line, i) => (
                        <tr key={i} className="hover:bg-gray-50/60">
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-800">{line.product?.name}</p>
                            <p className="text-xs text-gray-400 font-mono">{line.product?.sku}</p>
                          </td>
                          <td className="px-4 py-3 text-gray-600">{line.location?.name || '—'}</td>
                          <td className="px-4 py-3 text-right font-mono">{line.qty_expected}</td>
                          <td className="px-4 py-3 text-right font-mono font-semibold text-green-700">{line.qty_received ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </Modal>
      )}

      <ConfirmDialog config={confirm} onClose={() => setConfirm(null)} />
    </Layout>
  )
}