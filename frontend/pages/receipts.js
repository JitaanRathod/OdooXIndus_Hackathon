import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import StatusBadge from '../components/StatusBadge'
import ProductLineForm from '../components/ProductLineForm'
import api from '../lib/api'

const EMPTY_FORM = { supplier_name: '', notes: '', lines: [{ product_id: '', location_id: '', qty: '' }] }

export default function Receipts() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [receipts, setReceipts]   = useState([])
  const [products, setProducts]   = useState([])
  const [locations, setLocations] = useState([])
  const [loading, setLoading]     = useState(true)
  const [modal, setModal]         = useState(null)
  const [form, setForm]           = useState(EMPTY_FORM)
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')

  useEffect(() => {
    if (!authLoading && !user) router.push('/login')
    if (!authLoading && user?.role === 'dispatcher') router.push('/deliveries')
  }, [user, authLoading])

  const load = () => {
    setLoading(true)
    Promise.all([api.get('/receipts'), api.get('/products'), api.get('/locations')])
      .then(([r, p, l]) => { setReceipts(r.data.data); setProducts(p.data.data); setLocations(l.data.data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { if (user) load() }, [user])

  const handleCreate = async () => {
    setSaving(true); setError('')
    try {
      await api.post('/receipts', { supplier_name: form.supplier_name, notes: form.notes, lines: form.lines })
      setModal(null); load()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create receipt')
    } finally { setSaving(false) }
  }

  const handleValidate = async (row) => {
    if (!confirm(`Validate receipt ${row.reference_no}?`)) return
    try { await api.post(`/receipts/${row.id}/validate`); load() }
    catch (err) { alert(err.response?.data?.message || 'Validation failed') }
  }

  const handleCancel = async (row) => {
    if (!confirm(`Cancel receipt ${row.reference_no}?`)) return
    try { await api.post(`/receipts/${row.id}/cancel`); load() }
    catch (err) { alert(err.response?.data?.message || 'Cancel failed') }
  }

  const canValidate = ['admin', 'inventory_manager'].includes(user?.role)
  const canCancel   = user?.role === 'admin'
  const canCreate   = ['admin', 'inventory_manager', 'warehouse_staff'].includes(user?.role)

  const cols = [
    { key: 'reference_no',   label: 'Reference',  render: (v) => <span className="font-mono text-xs font-semibold">{v}</span> },
    { key: 'supplier_name',  label: 'Supplier' },
    { key: 'status',         label: 'Status',     render: (v) => <StatusBadge status={v} /> },
    { key: 'created_by',     label: 'Created By', render: (_, row) => row.creator?.name || '—' },
    { key: 'createdAt',      label: 'Date',       render: (v) => new Date(v).toLocaleDateString() },
    { key: 'actions',        label: '',           render: (_, row) => (
      <div className="flex gap-2">
        {canValidate && row.status !== 'done' && row.status !== 'cancelled' && (
          <button onClick={(e) => { e.stopPropagation(); handleValidate(row) }}
            className="text-xs text-green-600 hover:underline font-medium">Validate</button>
        )}
        {canCancel && row.status !== 'done' && row.status !== 'cancelled' && (
          <button onClick={(e) => { e.stopPropagation(); handleCancel(row) }}
            className="text-xs text-red-500 hover:underline">Cancel</button>
        )}
      </div>
    )},
  ]

  return (
    <Layout title="Receipts">
      <div className="flex justify-end mb-4">
        {canCreate && (
          <button onClick={() => { setForm(EMPTY_FORM); setError(''); setModal('create') }} className="btn-primary">
            + New Receipt
          </button>
        )}
      </div>

      <DataTable columns={cols} data={receipts} loading={loading} />

      {modal === 'create' && (
        <Modal title="New Receipt" onClose={() => setModal(null)} onConfirm={handleCreate} confirmLabel="Create" loading={saving} size="lg">
          <div className="space-y-4">
            {error && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}
            <div>
              <label className="label">Supplier Name</label>
              <input className="input" value={form.supplier_name}
                onChange={(e) => setForm({ ...form, supplier_name: e.target.value })} required />
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