import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import StatusBadge from '../components/StatusBadge'
import StepIndicator from '../components/StepIndicator'
import ProductLineForm from '../components/ProductLineForm'
import api from '../lib/api'

const STEPS = ['Pick', 'Pack', 'Done']
const STATUS_STEP = { draft: 0, picking: 1, packing: 2, done: 3, cancelled: -1 }
const EMPTY_FORM = { customer_name: '', notes: '', lines: [{ product_id: '', location_id: '', qty: '' }] }

export default function Deliveries() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [deliveries, setDeliveries] = useState([])
  const [products, setProducts]     = useState([])
  const [locations, setLocations]   = useState([])
  const [loading, setLoading]       = useState(true)
  const [modal, setModal]           = useState(null)
  const [form, setForm]             = useState(EMPTY_FORM)
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState('')

  useEffect(() => {
    if (!authLoading && !user) router.push('/login')
  }, [user, authLoading])

  const load = () => {
    setLoading(true)
    Promise.all([api.get('/deliveries'), api.get('/products'), api.get('/locations')])
      .then(([d, p, l]) => { setDeliveries(d.data.data); setProducts(p.data.data); setLocations(l.data.data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { if (user) load() }, [user])

  const doAction = async (row, action) => {
    try { await api.post(`/deliveries/${row.id}/${action}`); load() }
    catch (err) { alert(err.response?.data?.message || `${action} failed`) }
  }

  const handleCreate = async () => {
    setSaving(true); setError('')
    try {
      await api.post('/deliveries', {
        customer_name: form.customer_name,
        notes: form.notes,
        lines: form.lines,
      })
      setModal(null); load()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create delivery')
    } finally { setSaving(false) }
  }

  // FIX: dispatcher CAN create deliveries (per route fix)
  // warehouse_staff cannot create, only pick/pack
  const canCreate   = ['admin', 'inventory_manager', 'dispatcher'].includes(user?.role)
  const canPickPack = ['admin', 'inventory_manager', 'warehouse_staff', 'dispatcher'].includes(user?.role)
  const canValidate = ['admin', 'inventory_manager'].includes(user?.role)
  const canCancel   = user?.role === 'admin'

  const cols = [
    { key: 'reference_no',  label: 'Reference',  render: (v) => <span className="font-mono text-xs font-semibold">{v}</span> },
    { key: 'customer_name', label: 'Customer' },
    { key: 'status',        label: 'Status',     render: (v) => <StatusBadge status={v} /> },
    { key: 'progress',      label: 'Progress',   render: (_, row) => (
      row.status !== 'cancelled'
        ? <StepIndicator steps={STEPS} current={Math.max(0, STATUS_STEP[row.status] - 1)} />
        : <span className="text-xs text-red-500 font-medium">Cancelled</span>
    )},
    { key: 'creator',       label: 'Created By', render: (_, row) => row.creator?.name || '—' },
    { key: 'createdAt',     label: 'Date',       render: (v) => new Date(v).toLocaleDateString() },
    { key: 'actions',       label: '',           render: (_, row) => (
      <div className="flex gap-2 flex-wrap">
        {canPickPack && row.status === 'draft' && (
          <button onClick={(e) => { e.stopPropagation(); doAction(row, 'pick') }}
            className="text-xs text-indigo-600 hover:underline font-medium">Pick</button>
        )}
        {canPickPack && row.status === 'picking' && (
          <button onClick={(e) => { e.stopPropagation(); doAction(row, 'pack') }}
            className="text-xs text-purple-600 hover:underline font-medium">Pack</button>
        )}
        {canValidate && row.status === 'packing' && (
          <button onClick={(e) => { e.stopPropagation(); doAction(row, 'validate') }}
            className="text-xs text-green-600 hover:underline font-medium">Validate</button>
        )}
        {canCancel && !['done','cancelled'].includes(row.status) && (
          <button onClick={(e) => { e.stopPropagation(); doAction(row, 'cancel') }}
            className="text-xs text-red-500 hover:underline">Cancel</button>
        )}
      </div>
    )},
  ]

  return (
    <Layout title="Deliveries">
      <div className="flex justify-end mb-4">
        {canCreate && (
          <button onClick={() => { setForm(EMPTY_FORM); setError(''); setModal('create') }} className="btn-primary">
            + New Delivery
          </button>
        )}
      </div>

      <DataTable columns={cols} data={deliveries} loading={loading} />

      {modal === 'create' && (
        <Modal title="New Delivery" onClose={() => setModal(null)} onConfirm={handleCreate} confirmLabel="Create" loading={saving} size="lg">
          <div className="space-y-4">
            {error && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}
            <div>
              <label className="label">Customer Name</label>
              <input className="input" value={form.customer_name}
                onChange={(e) => setForm({ ...form, customer_name: e.target.value })} required />
            </div>
            <div>
              <label className="label">Notes</label>
              <textarea className="input" rows={2} value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <div>
              <label className="label">Product Lines</label>
              <ProductLineForm
                lines={form.lines}
                onChange={(lines) => setForm({ ...form, lines })}
                products={products}
                locations={locations}
              />
            </div>
          </div>
        </Modal>
      )}
    </Layout>
  )
}