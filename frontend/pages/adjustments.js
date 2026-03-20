import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import StatusBadge from '../components/StatusBadge'
import ConfirmDialog from '../components/ConfirmDialog'
import api from '../lib/api'
import toast from 'react-hot-toast'
import { Plus } from 'lucide-react'
import { motion } from 'framer-motion'

const EMPTY_FORM = { location_id: '', reason: '', lines: [{ product_id: '', qty_counted: '' }] }

export default function Adjustments() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [adjustments, setAdjustments] = useState([])
  const [products, setProducts] = useState([])
  const [locations, setLocations] = useState([])
  const [inventory, setInventory] = useState({}) // { product_id+location_id -> qty }
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [confirm, setConfirm] = useState(null)
  const [actionLoading, setActionLoading] = useState({})

  useEffect(() => {
    if (!authLoading && !user) router.push('/login')
    if (!authLoading && user?.role === 'dispatcher') router.push('/deliveries')
  }, [user, authLoading])

  const load = () => {
    setLoading(true)
    Promise.all([api.get('/adjustments'), api.get('/products'), api.get('/locations')])
      .then(([a, p, l]) => { setAdjustments(a.data.data); setProducts(p.data.data); setLocations(l.data.data) })
      .catch(() => toast.error('Failed to load adjustments'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { if (user) load() }, [user])

  // Fetch inventory for selected location so we can show expected qty in form
  const fetchInventory = async (locationId) => {
    if (!locationId) { setInventory({}); return }
    try {
      const { data } = await api.get(`/inventory?location_id=${locationId}`)
      const map = {}
        ; (data.data || []).forEach(inv => { map[inv.product_id] = parseFloat(inv.qty_on_hand) })
      setInventory(map)
    } catch { /* non-critical */ }
  }

  const handleCreate = async () => {
    setSaving(true); setError('')
    try {
      await api.post('/adjustments', form)
      toast.success('Adjustment created')
      setModal(null); load()
    } catch (err) { setError(err.response?.data?.message || 'Failed to create adjustment') }
    finally { setSaving(false) }
  }

  const handleApply = (row) => {
    setConfirm({
      title: `Apply adjustment ${row.reference_no}?`,
      message: 'This will update inventory quantities based on counted values. This cannot be undone.',
      confirmLabel: 'Apply Adjustment',
      danger: false,
      onConfirm: () => _apply(row),
    })
  }

  const _apply = async (row) => {
    setActionLoading(prev => ({ ...prev, [row.id]: true }))
    try {
      await api.post(`/adjustments/${row.id}/apply`)
      toast.success('Adjustment applied — inventory updated')
      load()
    } catch (err) { toast.error(err.response?.data?.message || 'Apply failed') }
    finally { setActionLoading(prev => ({ ...prev, [row.id]: false })) }
  }

  const addLine = () => setForm({ ...form, lines: [...form.lines, { product_id: '', qty_counted: '' }] })
  const updateLine = (idx, f, v) => { const lines = form.lines.map((l, i) => i === idx ? { ...l, [f]: v } : l); setForm({ ...form, lines }) }
  const removeLine = (idx) => setForm({ ...form, lines: form.lines.filter((_, i) => i !== idx) })

  const canAct = ['warehouse_staff', 'admin', 'inventory_manager'].includes(user?.role)

  const cols = [
    { key: 'reference_no', label: 'Reference', render: (v) => <span className="font-mono text-xs font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded-lg">{v}</span> },
    { key: 'location', label: 'Location', render: (_, row) => row.location?.name || '—' },
    { key: 'reason', label: 'Reason' },
    { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
    { key: 'creator', label: 'Created By', render: (_, row) => row.creator?.name || '—' },
    { key: 'createdAt', label: 'Date', render: (v) => new Date(v).toLocaleDateString() },
    {
      key: 'actions', label: '', render: (_, row) => canAct && row.status === 'draft' && (
        <button onClick={(e) => { e.stopPropagation(); handleApply(row) }} disabled={actionLoading[row.id]}
          className="text-xs font-semibold text-green-600 hover:text-green-800 disabled:opacity-50 transition-colors">
          {actionLoading[row.id] ? '…' : '✓ Apply'}
        </button>
      )
    },
  ]

  return (
    <Layout title="Stock Adjustments">
      <div className="flex justify-end mb-5">
        {canAct && (
          <button onClick={() => { setForm(EMPTY_FORM); setInventory({}); setError(''); setModal('create') }} className="btn-primary">
            <Plus className="w-4 h-4" /> New Adjustment
          </button>
        )}
      </div>

      <DataTable columns={cols} data={adjustments} loading={loading} />

      {modal === 'create' && (
        <Modal title="New Stock Adjustment" onClose={() => setModal(null)} onConfirm={handleCreate} confirmLabel="Create" loading={saving} size="lg">
          <div className="space-y-4">
            {error && <p className="text-red-600 text-sm bg-red-50 rounded-xl px-3 py-2">{error}</p>}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Location</label>
                <select className="input" value={form.location_id} onChange={(e) => { setForm({ ...form, location_id: e.target.value }); fetchInventory(e.target.value) }}>
                  <option value="">Select location</option>
                  {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Reason</label>
                <input className="input" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="e.g. Annual count" />
              </div>
            </div>

            <div>
              <label className="label">Product Lines (Expected vs Counted)</label>
              <div className="space-y-2">
                {form.lines.map((line, idx) => {
                  const expectedQty = line.product_id && inventory[line.product_id] != null
                    ? inventory[line.product_id] : null
                  return (
                    <motion.div key={idx} className="flex gap-2 items-center bg-gray-50 rounded-xl p-3"
                      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                      <select className="flex-1 input" value={line.product_id} onChange={(e) => updateLine(idx, 'product_id', e.target.value)}>
                        <option value="">Select product</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                      </select>
                      {/* Show system expected qty */}
                      <div className="flex flex-col items-center gap-0.5 w-24">
                        <span className="text-[10px] text-gray-400 font-medium">System</span>
                        <div className="input w-full text-center bg-gray-100 text-gray-500 select-none text-sm font-mono">
                          {expectedQty != null ? expectedQty : '—'}
                        </div>
                      </div>
                      <div className="flex flex-col items-center gap-0.5 w-24">
                        <span className="text-[10px] text-gray-400 font-medium">Counted</span>
                        <input type="number" min="0" step="0.01" value={line.qty_counted}
                          onChange={(e) => updateLine(idx, 'qty_counted', e.target.value)}
                          className={`input w-full text-center text-sm font-mono ${expectedQty != null && line.qty_counted !== '' && parseFloat(line.qty_counted) !== expectedQty
                              ? 'border-amber-400 bg-amber-50'
                              : ''
                            }`}
                          placeholder="0" />
                      </div>
                      <button onClick={() => removeLine(idx)} className="text-red-400 hover:text-red-600 text-xl font-bold px-1 transition-colors">×</button>
                    </motion.div>
                  )
                })}
              </div>
              <button onClick={addLine} className="mt-2 text-sm text-primary-600 hover:text-primary-800 font-medium flex items-center gap-1 transition-colors">
                <span className="text-lg">+</span> Add line
              </button>
            </div>
          </div>
        </Modal>
      )}

      <ConfirmDialog config={confirm} onClose={() => setConfirm(null)} />
    </Layout>
  )
}