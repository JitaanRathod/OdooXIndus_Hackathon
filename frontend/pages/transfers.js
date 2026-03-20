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

const EMPTY_FORM = { from_location_id: '', to_location_id: '', notes: '', lines: [{ product_id: '', qty: '' }] }

export default function Transfers() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [transfers, setTransfers] = useState([])
  const [products, setProducts] = useState([])
  const [locations, setLocations] = useState([])
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
    Promise.all([api.get('/transfers'), api.get('/products'), api.get('/locations')])
      .then(([t, p, l]) => { setTransfers(t.data.data); setProducts(p.data.data); setLocations(l.data.data) })
      .catch(() => toast.error('Failed to load transfers'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { if (user) load() }, [user])

  const handleCreate = async () => {
    setSaving(true); setError('')
    const payload = { ...form, lines: form.lines.map(({ product_id, qty }) => ({ product_id, qty })) }
    try {
      await api.post('/transfers', payload)
      toast.success('Transfer created successfully')
      setModal(null); load()
    } catch (err) { setError(err.response?.data?.message || 'Failed to create transfer') }
    finally { setSaving(false) }
  }

  const doAction = async (row, action) => {
    if (action === 'cancel') {
      setConfirm({ title: `Cancel transfer ${row.reference_no}?`, message: 'This cannot be undone.', confirmLabel: 'Cancel Transfer', onConfirm: () => _doAction(row, action) })
      return
    }
    _doAction(row, action)
  }

  const _doAction = async (row, action) => {
    setActionLoading(prev => ({ ...prev, [row.id + action]: true }))
    try {
      await api.post(`/transfers/${row.id}/${action}`)
      toast.success(action === 'confirm' ? 'Transfer confirmed & stock moved' : 'Transfer cancelled')
      load()
    } catch (err) { toast.error(err.response?.data?.message || `${action} failed`) }
    finally { setActionLoading(prev => ({ ...prev, [row.id + action]: false })) }
  }

  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value })
  const addLine = () => setForm({ ...form, lines: [...form.lines, { product_id: '', qty: '' }] })
  const updateLine = (idx, field, value) => { const lines = form.lines.map((l, i) => i === idx ? { ...l, [field]: value } : l); setForm({ ...form, lines }) }
  const removeLine = (idx) => setForm({ ...form, lines: form.lines.filter((_, i) => i !== idx) })

  const canAct = ['warehouse_staff', 'admin', 'inventory_manager'].includes(user?.role)

  const cols = [
    { key: 'reference_no', label: 'Reference', render: (v) => <span className="font-mono text-xs font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded-lg">{v}</span> },
    { key: 'from', label: 'From', render: (_, row) => row.fromLocation?.name || '—' },
    { key: 'to', label: 'To', render: (_, row) => row.toLocation?.name || '—' },
    { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
    { key: 'creator', label: 'Created by', render: (_, row) => row.creator?.name || '—' },
    { key: 'createdAt', label: 'Date', render: (v) => new Date(v).toLocaleDateString() },
    {
      key: 'actions', label: '', render: (_, row) => (
        <div className="flex gap-2">
          {canAct && row.status === 'draft' && (
            <button onClick={(e) => { e.stopPropagation(); doAction(row, 'confirm') }} disabled={actionLoading[row.id + 'confirm']}
              className="text-xs font-semibold text-green-600 hover:text-green-800 disabled:opacity-50 transition-colors">
              {actionLoading[row.id + 'confirm'] ? '…' : '✓ Confirm'}
            </button>
          )}
          {user?.role === 'admin' && !['confirmed', 'cancelled'].includes(row.status) && (
            <button onClick={(e) => { e.stopPropagation(); doAction(row, 'cancel') }}
              className="text-xs font-semibold text-red-500 hover:text-red-700 transition-colors">Cancel</button>
          )}
        </div>
      )
    },
  ]

  return (
    <Layout title="Internal Transfers">
      <div className="flex justify-end mb-5">
        {canAct && (
          <button onClick={() => { setForm(EMPTY_FORM); setError(''); setModal('create') }} className="btn-primary">
            <Plus className="w-4 h-4" /> New Transfer
          </button>
        )}
      </div>

      <DataTable columns={cols} data={transfers} loading={loading} />

      {modal === 'create' && (
        <Modal title="New Transfer" onClose={() => setModal(null)} onConfirm={handleCreate} confirmLabel="Create" loading={saving} size="lg">
          <div className="space-y-4">
            {error && <p className="text-red-600 text-sm bg-red-50 rounded-xl px-3 py-2">{error}</p>}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">From Location</label>
                <select className="input" value={form.from_location_id} onChange={set('from_location_id')}>
                  <option value="">Select source</option>
                  {locations.map(l => <option key={l.id} value={l.id}>{l.name}{l.warehouse?.name ? ` — ${l.warehouse.name}` : ''}</option>)}
                </select>
              </div>
              <div>
                <label className="label">To Location</label>
                <select className="input" value={form.to_location_id} onChange={set('to_location_id')}>
                  <option value="">Select destination</option>
                  {locations.filter(l => l.id != form.from_location_id).map(l => <option key={l.id} value={l.id}>{l.name}{l.warehouse?.name ? ` — ${l.warehouse.name}` : ''}</option>)}
                </select>
              </div>
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
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                    <select value={line.product_id} onChange={(e) => updateLine(idx, 'product_id', e.target.value)} className="flex-1 input">
                      <option value="">Select product</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                    </select>
                    <input type="number" min="0.01" step="0.01" value={line.qty} onChange={(e) => updateLine(idx, 'qty', e.target.value)} placeholder="Qty" className="w-28 input" />
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

      <ConfirmDialog config={confirm} onClose={() => setConfirm(null)} />
    </Layout>
  )
}