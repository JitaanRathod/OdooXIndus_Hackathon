import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import StatusBadge from '../components/StatusBadge'
import api from '../lib/api'

const EMPTY_FORM = { location_id: '', reason: '', lines: [{ product_id: '', qty_counted: '' }] }

export default function Adjustments() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [adjustments, setAdjustments] = useState([])
  const [products, setProducts]       = useState([])
  const [locations, setLocations]     = useState([])
  const [loading, setLoading]         = useState(true)
  const [modal, setModal]             = useState(null)
  const [form, setForm]               = useState(EMPTY_FORM)
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState('')

  useEffect(() => {
    if (!authLoading && !user) router.push('/login')
    if (!authLoading && user?.role === 'dispatcher') router.push('/deliveries')
  }, [user, authLoading])

  const load = () => {
    setLoading(true)
    Promise.all([api.get('/adjustments'), api.get('/products'), api.get('/locations')])
      .then(([a, p, l]) => { setAdjustments(a.data.data); setProducts(p.data.data); setLocations(l.data.data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { if (user) load() }, [user])

  const handleCreate = async () => {
    setSaving(true); setError('')
    try {
      await api.post('/adjustments', form)
      setModal(null); load()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create adjustment')
    } finally { setSaving(false) }
  }

  const handleApply = async (row) => {
    if (!confirm(`Apply adjustment ${row.reference_no}?`)) return
    try { await api.post(`/adjustments/${row.id}/apply`); load() }
    catch (err) { alert(err.response?.data?.message || 'Apply failed') }
  }

  const addLine = () => setForm({ ...form, lines: [...form.lines, { product_id: '', qty_counted: '' }] })
  const updateLine = (idx, f, v) => {
    const lines = form.lines.map((l, i) => i === idx ? { ...l, [f]: v } : l)
    setForm({ ...form, lines })
  }
  const removeLine = (idx) => setForm({ ...form, lines: form.lines.filter((_, i) => i !== idx) })

  const cols = [
    { key: 'reference_no', label: 'Reference',  render: (v) => <span className="font-mono text-xs font-semibold">{v}</span> },
    { key: 'location',     label: 'Location',   render: (_, row) => row.location?.name || '—' },
    { key: 'reason',       label: 'Reason' },
    { key: 'status',       label: 'Status',     render: (v) => <StatusBadge status={v} /> },
    { key: 'created_by',   label: 'Created By', render: (_, row) => row.creator?.name || '—' },
    { key: 'createdAt',    label: 'Date',       render: (v) => new Date(v).toLocaleDateString() },
    { key: 'actions',      label: '',           render: (_, row) => (
      ['warehouse_staff', 'admin'].includes(user?.role) && row.status === 'draft' && (
        <button onClick={(e) => { e.stopPropagation(); handleApply(row) }}
          className="text-xs text-green-600 hover:underline font-medium">Apply</button>
      )
    )},
  ]

  return (
    <Layout title="Stock Adjustments">
      <div className="flex justify-end mb-4">
        {['admin', 'warehouse_staff'].includes(user?.role) && (
          <button onClick={() => { setForm(EMPTY_FORM); setError(''); setModal('create') }} className="btn-primary">
            + New Adjustment
          </button>
        )}
      </div>

      <DataTable columns={cols} data={adjustments} loading={loading} />

      {modal === 'create' && (
        <Modal title="New Stock Adjustment" onClose={() => setModal(null)} onConfirm={handleCreate} confirmLabel="Create" loading={saving} size="lg">
          <div className="space-y-4">
            {error && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Location</label>
                <select className="input" value={form.location_id} onChange={(e) => setForm({ ...form, location_id: e.target.value })}>
                  <option value="">Select location</option>
                  {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Reason</label>
                <input className="input" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="e.g. Annual count" />
              </div>
            </div>

            {/* Lines */}
            <div>
              <label className="label">Product Lines (Expected vs Counted)</label>
              <div className="space-y-2">
                {form.lines.map((line, idx) => (
                  <div key={idx} className="flex gap-2 items-center bg-gray-50 rounded-lg p-3">
                    <select className="flex-1 input" value={line.product_id}
                      onChange={(e) => updateLine(idx, 'product_id', e.target.value)}>
                      <option value="">Select product</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                    </select>
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-xs text-gray-400">Counted</span>
                      <input type="number" min="0" step="0.01" value={line.qty_counted}
                        onChange={(e) => updateLine(idx, 'qty_counted', e.target.value)}
                        className="input w-24 text-center" placeholder="0" />
                    </div>
                    <button onClick={() => removeLine(idx)} className="text-red-400 hover:text-red-600 font-bold text-lg">×</button>
                  </div>
                ))}
              </div>
              <button onClick={addLine} className="mt-2 text-sm text-primary-700 hover:text-primary-800 font-medium flex items-center gap-1">
                <span className="text-lg leading-none">+</span> Add line
              </button>
            </div>
          </div>
        </Modal>
      )}
    </Layout>
  )
}