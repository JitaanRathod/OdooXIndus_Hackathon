import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import StatusBadge from '../components/StatusBadge'
import api from '../lib/api'

// FIX #5 — transfer lines only need product_id + qty, NOT location_id
// location is set at the transfer level (from_location_id / to_location_id)
const EMPTY_FORM = { from_location_id: '', to_location_id: '', notes: '', lines: [{ product_id: '', qty: '' }] }

export default function Transfers() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [transfers, setTransfers]   = useState([])
  const [products, setProducts]     = useState([])
  const [locations, setLocations]   = useState([])
  const [loading, setLoading]       = useState(true)
  const [modal, setModal]           = useState(null)
  const [form, setForm]             = useState(EMPTY_FORM)
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState('')

  useEffect(() => {
    if (!authLoading && !user) router.push('/login')
    if (!authLoading && user?.role === 'dispatcher') router.push('/deliveries')
  }, [user, authLoading])

  const load = () => {
    setLoading(true)
    Promise.all([api.get('/transfers'), api.get('/products'), api.get('/locations')])
      .then(([t, p, l]) => { setTransfers(t.data.data); setProducts(p.data.data); setLocations(l.data.data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { if (user) load() }, [user])

  const handleCreate = async () => {
    setSaving(true); setError('')
    // Strip any stray location_id from lines before sending
    const payload = {
      ...form,
      lines: form.lines.map(({ product_id, qty }) => ({ product_id, qty })),
    }
    try {
      await api.post('/transfers', payload)
      setModal(null); load()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create transfer')
    } finally { setSaving(false) }
  }

  const doAction = async (row, action) => {
    try { await api.post(`/transfers/${row.id}/${action}`); load() }
    catch (err) { alert(err.response?.data?.message || `${action} failed`) }
  }

  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value })

  // Line management — no location_id per line
  const addLine = () => setForm({ ...form, lines: [...form.lines, { product_id: '', qty: '' }] })
  const updateLine = (idx, field, value) => {
    const lines = form.lines.map((l, i) => i === idx ? { ...l, [field]: value } : l)
    setForm({ ...form, lines })
  }
  const removeLine = (idx) => setForm({ ...form, lines: form.lines.filter((_, i) => i !== idx) })

  const cols = [
    { key: 'reference_no',  label: 'Reference', render: (v) => <span className="font-mono text-xs font-semibold">{v}</span> },
    { key: 'from_location', label: 'From',       render: (_, row) => row.fromLocation?.name || '—' },
    { key: 'to_location',   label: 'To',         render: (_, row) => row.toLocation?.name || '—' },
    { key: 'status',        label: 'Status',     render: (v) => <StatusBadge status={v} /> },
    { key: 'creator',       label: 'Created by', render: (_, row) => row.creator?.name || '—' },
    { key: 'createdAt',     label: 'Date',       render: (v) => new Date(v).toLocaleDateString() },
    { key: 'actions',       label: '',           render: (_, row) => (
      <div className="flex gap-2">
        {['warehouse_staff','admin'].includes(user?.role) && row.status === 'draft' && (
          <button onClick={(e) => { e.stopPropagation(); doAction(row, 'confirm') }}
            className="text-xs text-green-600 hover:underline font-medium">Confirm</button>
        )}
        {user?.role === 'admin' && !['confirmed','cancelled'].includes(row.status) && (
          <button onClick={(e) => { e.stopPropagation(); doAction(row, 'cancel') }}
            className="text-xs text-red-500 hover:underline">Cancel</button>
        )}
      </div>
    )},
  ]

  return (
    <Layout title="Internal Transfers">
      <div className="flex justify-end mb-4">
        {['admin','warehouse_staff'].includes(user?.role) && (
          <button onClick={() => { setForm(EMPTY_FORM); setError(''); setModal('create') }} className="btn-primary">
            + New Transfer
          </button>
        )}
      </div>

      <DataTable columns={cols} data={transfers} loading={loading} />

      {modal === 'create' && (
        <Modal title="New Transfer" onClose={() => setModal(null)} onConfirm={handleCreate} confirmLabel="Create" loading={saving} size="lg">
          <div className="space-y-4">
            {error && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">From Location</label>
                <select className="input" value={form.from_location_id} onChange={set('from_location_id')}>
                  <option value="">Select source location</option>
                  {locations.map(l => <option key={l.id} value={l.id}>{l.name}{l.warehouse?.name ? ` — ${l.warehouse.name}` : ''}</option>)}
                </select>
              </div>
              <div>
                <label className="label">To Location</label>
                <select className="input" value={form.to_location_id} onChange={set('to_location_id')}>
                  <option value="">Select destination location</option>
                  {locations.filter(l => l.id != form.from_location_id).map(l =>
                    <option key={l.id} value={l.id}>{l.name}{l.warehouse?.name ? ` — ${l.warehouse.name}` : ''}</option>
                  )}
                </select>
              </div>
            </div>

            <div>
              <label className="label">Notes</label>
              <textarea className="input" rows={2} value={form.notes} onChange={set('notes')} />
            </div>

            {/* FIX #5 — lines only have product + qty, no location dropdown */}
            <div>
              <label className="label">Product Lines</label>
              <div className="space-y-2">
                {form.lines.map((line, idx) => (
                  <div key={idx} className="flex gap-2 items-center bg-gray-50 rounded-lg p-3">
                    <select
                      value={line.product_id}
                      onChange={(e) => updateLine(idx, 'product_id', e.target.value)}
                      className="flex-1 input"
                    >
                      <option value="">Select product</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                    </select>
                    <input
                      type="number" min="0.01" step="0.01"
                      value={line.qty}
                      onChange={(e) => updateLine(idx, 'qty', e.target.value)}
                      placeholder="Qty"
                      className="w-28 input"
                    />
                    <button type="button" onClick={() => removeLine(idx)}
                      className="text-red-400 hover:text-red-600 font-bold text-xl leading-none px-1">×</button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={addLine}
                className="mt-2 text-sm text-primary-700 hover:text-primary-800 font-medium flex items-center gap-1">
                <span className="text-lg">+</span> Add product line
              </button>
            </div>
          </div>
        </Modal>
      )}
    </Layout>
  )
}