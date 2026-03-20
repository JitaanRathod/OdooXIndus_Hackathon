import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import StatusBadge from '../components/StatusBadge'
import StepIndicator from '../components/StepIndicator'
import ConfirmDialog from '../components/ConfirmDialog'
import FilterBar from '../components/FilterBar'
import api from '../lib/api'
import toast from 'react-hot-toast'
import { Plus, Package } from 'lucide-react'
import { motion } from 'framer-motion'

const STEPS = ['Draft', 'Picking', 'Packing', 'Done']
const STEP_INDEX = { draft: 0, picking: 1, packing: 2, done: 3, cancelled: -1 }
const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'picking', label: 'Picking' },
  { value: 'packing', label: 'Packing' },
  { value: 'done', label: 'Done' },
  { value: 'cancelled', label: 'Cancelled' },
]

export default function Deliveries() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [deliveries, setDeliveries] = useState([])
  const [products, setProducts] = useState([])
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [detail, setDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [form, setForm] = useState({ customer_name: '', notes: '', lines: [{ product_id: '', location_id: '', qty: '' }] })
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
    Promise.all([api.get('/deliveries'), api.get('/products'), api.get('/locations')])
      .then(([d, p, l]) => { setDeliveries(d.data.data); setProducts(p.data.data); setLocations(l.data.data) })
      .catch(() => toast.error('Failed to load deliveries'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { if (user) load() }, [user])

  const openDetail = async (row) => {
    setModal('detail'); setDetailLoading(true); setDetail(null)
    try {
      const { data } = await api.get(`/deliveries/${row.id}`)
      setDetail(data.data)
    } catch { toast.error('Failed to load delivery details') }
    finally { setDetailLoading(false) }
  }

  const handleCreate = async () => {
    setSaving(true); setError('')
    try {
      await api.post('/deliveries', form)
      toast.success('Delivery created successfully')
      setModal(null); load()
    } catch (err) { setError(err.response?.data?.message || 'Failed to create') }
    finally { setSaving(false) }
  }

  const doAction = async (row, action) => {
    if (action === 'cancel') {
      setConfirm({
        title: `Cancel delivery ${row.reference_no}?`,
        message: 'This cannot be undone.',
        confirmLabel: 'Cancel Delivery',
        onConfirm: () => _doAction(row, action),
      })
      return
    }
    _doAction(row, action)
  }

  const _doAction = async (row, action) => {
    setActionLoading(prev => ({ ...prev, [row.id + action]: true }))
    try {
      await api.post(`/deliveries/${row.id}/${action}`)
      const labels = { pick: 'Picking started', pack: 'Packed', validate: 'Delivery validated', cancel: 'Delivery cancelled' }
      toast.success(labels[action] || `${action} successful`)
      load()
    } catch (err) { toast.error(err.response?.data?.message || `${action} failed`) }
    finally { setActionLoading(prev => ({ ...prev, [row.id + action]: false })) }
  }

  const addLine = () => setForm({ ...form, lines: [...form.lines, { product_id: '', location_id: '', qty: '' }] })
  const updateLine = (i, f, v) => { const lines = form.lines.map((l, idx) => idx === i ? { ...l, [f]: v } : l); setForm({ ...form, lines }) }
  const removeLine = (i) => setForm({ ...form, lines: form.lines.filter((_, idx) => idx !== i) })

  const filtered = deliveries.filter(d => {
    if (filters.status && d.status !== filters.status) return false
    if (search) return d.reference_no?.toLowerCase().includes(search.toLowerCase()) || d.customer_name?.toLowerCase().includes(search.toLowerCase())
    return true
  })

  const canCreate = ['admin', 'inventory_manager', 'dispatcher'].includes(user?.role)

  const cols = [
    { key: 'reference_no', label: 'Reference', render: (v) => <span className="font-mono text-xs font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded-lg">{v}</span> },
    { key: 'customer_name', label: 'Customer' },
    { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
    {
      key: 'workflow', label: 'Progress', render: (_, row) => row.status !== 'cancelled' && (
        <StepIndicator steps={STEPS} current={STEP_INDEX[row.status] ?? 0} />
      )
    },
    { key: 'creator', label: 'Created by', render: (_, row) => row.creator?.name || '—' },
    { key: 'createdAt', label: 'Date', render: (v) => new Date(v).toLocaleDateString() },
    {
      key: 'actions', label: '', render: (_, row) => (
        <div className="flex gap-2 items-center">
          {['admin', 'inventory_manager', 'warehouse_staff', 'dispatcher'].includes(user?.role) && row.status === 'draft' && (
            <button onClick={(e) => { e.stopPropagation(); doAction(row, 'pick') }} disabled={actionLoading[row.id + 'pick']}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 disabled:opacity-50 transition-colors">
              {actionLoading[row.id + 'pick'] ? '…' : 'Pick'}
            </button>
          )}
          {['admin', 'inventory_manager', 'warehouse_staff', 'dispatcher'].includes(user?.role) && row.status === 'picking' && (
            <button onClick={(e) => { e.stopPropagation(); doAction(row, 'pack') }} disabled={actionLoading[row.id + 'pack']}
              className="text-xs font-semibold text-purple-600 hover:text-purple-800 disabled:opacity-50 transition-colors">
              {actionLoading[row.id + 'pack'] ? '…' : 'Pack'}
            </button>
          )}
          {['admin', 'inventory_manager'].includes(user?.role) && row.status === 'packing' && (
            <button onClick={(e) => { e.stopPropagation(); doAction(row, 'validate') }} disabled={actionLoading[row.id + 'validate']}
              className="text-xs font-semibold text-green-600 hover:text-green-800 disabled:opacity-50 transition-colors">
              {actionLoading[row.id + 'validate'] ? '…' : '✓ Validate'}
            </button>
          )}
          {['admin'].includes(user?.role) && !['done', 'cancelled'].includes(row.status) && (
            <button onClick={(e) => { e.stopPropagation(); doAction(row, 'cancel') }}
              className="text-xs font-semibold text-red-500 hover:text-red-700 transition-colors">
              Cancel
            </button>
          )}
        </div>
      )
    },
  ]

  return (
    <Layout title="Deliveries">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <FilterBar
          filters={[{ key: 'status', label: 'All Statuses', options: STATUS_OPTIONS }]}
          values={filters} onChange={(k, v) => setFilters({ ...filters, [k]: v })}
          onSearch={setSearch} searchValue={search} searchPlaceholder="Search by ref or customer…"
        />
        {canCreate && (
          <button onClick={() => { setForm({ customer_name: '', notes: '', lines: [{ product_id: '', location_id: '', qty: '' }] }); setError(''); setModal('create') }} className="btn-primary">
            <Plus className="w-4 h-4" /> New Delivery
          </button>
        )}
      </div>

      <DataTable columns={cols} data={filtered} loading={loading} onRowClick={openDetail} />

      {/* Create modal */}
      {modal === 'create' && (
        <Modal title="New Delivery" onClose={() => setModal(null)} onConfirm={handleCreate} confirmLabel="Create" loading={saving} size="lg">
          <div className="space-y-4">
            {error && <p className="text-red-600 text-sm bg-red-50 rounded-xl px-3 py-2">{error}</p>}
            <div>
              <label className="label">Customer Name</label>
              <input className="input" value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} required />
            </div>
            <div>
              <label className="label">Notes</label>
              <textarea className="input" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <div>
              <label className="label">Product Lines</label>
              <div className="space-y-2">
                {form.lines.map((line, idx) => (
                  <motion.div key={idx} className="flex gap-2 items-center bg-gray-50 rounded-xl p-3"
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                    <select className="flex-1 input" value={line.product_id} onChange={(e) => updateLine(idx, 'product_id', e.target.value)}>
                      <option value="">Select product</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                    </select>
                    <select className="flex-1 input" value={line.location_id} onChange={(e) => updateLine(idx, 'location_id', e.target.value)}>
                      <option value="">From location</option>
                      {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                    <input type="number" min="0.01" step="0.01" value={line.qty} onChange={(e) => updateLine(idx, 'qty', e.target.value)} placeholder="Qty" className="w-24 input" />
                    <button onClick={() => removeLine(idx)} className="text-red-400 hover:text-red-600 text-xl font-bold px-1 transition-colors">×</button>
                  </motion.div>
                ))}
              </div>
              <button onClick={addLine} className="mt-2 text-sm text-primary-600 hover:text-primary-800 font-medium flex items-center gap-1 transition-colors">
                <span className="text-lg">+</span> Add product line
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Detail modal */}
      {modal === 'detail' && (
        <Modal title={detail ? `Delivery ${detail.reference_no}` : 'Loading…'} onClose={() => { setModal(null); setDetail(null) }} size="lg">
          {detailLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full" />
            </div>
          ) : detail && (
            <div className="space-y-5">
              {detail.status !== 'cancelled' && (
                <div className="flex justify-center py-2">
                  <StepIndicator steps={STEPS} current={STEP_INDEX[detail.status] ?? 0} />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-gray-500">Customer</span><p className="font-semibold mt-0.5">{detail.customer_name || '—'}</p></div>
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
                        <th className="px-4 py-2.5 text-left">From Location</th>
                        <th className="px-4 py-2.5 text-right">Qty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {detail.lines?.map((line, i) => (
                        <tr key={i}>
                          <td className="px-4 py-3">
                            <p className="font-medium">{line.product?.name}</p>
                            <p className="text-xs text-gray-400 font-mono">{line.product?.sku}</p>
                          </td>
                          <td className="px-4 py-3 text-gray-600">{line.location?.name || '—'}</td>
                          <td className="px-4 py-3 text-right font-mono font-semibold text-red-600">−{line.qty}</td>
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