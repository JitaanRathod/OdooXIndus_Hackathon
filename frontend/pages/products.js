import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import FilterBar from '../components/FilterBar'
import LoadingSpinner from '../components/LoadingSpinner'
import api from '../lib/api'

const EMPTY = { name: '', sku: '', category_id: '', unit_of_measure: '', reorder_point: 0 }

export default function Products() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [products, setProducts]     = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [filters, setFilters]       = useState({})
  const [modal, setModal]           = useState(null) // null | 'create' | 'edit'
  const [selected, setSelected]     = useState(null)
  const [form, setForm]             = useState(EMPTY)
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState('')

  useEffect(() => {
    if (!authLoading && !user) router.push('/login')
    if (!authLoading && user?.role === 'dispatcher') router.push('/deliveries')
  }, [user, authLoading])

  const load = () => {
    setLoading(true)
    Promise.all([api.get('/products'), api.get('/categories')])
      .then(([p, c]) => { setProducts(p.data.data); setCategories(c.data.data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { if (user) load() }, [user])

  const openCreate = () => { setForm(EMPTY); setError(''); setModal('create') }
  const openEdit   = (row) => { setSelected(row); setForm({ ...row }); setError(''); setModal('edit') }

  const handleSave = async () => {
    setSaving(true); setError('')
    try {
      if (modal === 'create') await api.post('/products', form)
      else                    await api.put(`/products/${selected.id}`, form)
      setModal(null); load()
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (row) => {
    if (!confirm(`Delete "${row.name}"?`)) return
    try { await api.delete(`/products/${row.id}`); load() }
    catch (err) { alert(err.response?.data?.message || 'Delete failed') }
  }

  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value })

  const filtered = products
    .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()))
    .filter(p => !filters.category_id || p.category_id == filters.category_id)
    .map(p => ({ ...p, _highlight: p.qty_on_hand <= p.reorder_point && p.qty_on_hand > 0 }))

  const cols = [
    { key: 'name',          label: 'Name' },
    { key: 'sku',           label: 'SKU',      render: (v) => <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{v}</span> },
    { key: 'category',      label: 'Category', render: (_, row) => row.category?.name || '—' },
    { key: 'unit_of_measure', label: 'Unit' },
    { key: 'qty_on_hand',   label: 'Stock',    render: (v, row) => (
      <span className={v <= row.reorder_point ? 'text-amber-600 font-semibold' : 'text-gray-800'}>{v ?? 0}</span>
    )},
    { key: 'reorder_point', label: 'Reorder Pt' },
    { key: 'actions',       label: '',         render: (_, row) => (
      <div className="flex gap-2">
        <button onClick={(e) => { e.stopPropagation(); openEdit(row) }} className="text-xs text-primary-700 hover:underline">Edit</button>
        {user?.role === 'admin' && (
          <button onClick={(e) => { e.stopPropagation(); handleDelete(row) }} className="text-xs text-red-500 hover:underline">Delete</button>
        )}
      </div>
    )},
  ]

  return (
    <Layout title="Products">
      <div className="flex justify-between items-center mb-4">
        <FilterBar
          filters={[{ key: 'category_id', label: 'Category', options: categories.map(c => ({ value: c.id, label: c.name })) }]}
          values={filters}
          onChange={(k, v) => setFilters({ ...filters, [k]: v })}
          onSearch={setSearch}
          searchValue={search}
          searchPlaceholder="Search by name or SKU"
        />
        {['admin', 'inventory_manager'].includes(user?.role) && (
          <button onClick={openCreate} className="btn-primary">+ New Product</button>
        )}
      </div>

      <DataTable columns={cols} data={filtered} loading={loading} />

      {modal && (
        <Modal
          title={modal === 'create' ? 'New Product' : 'Edit Product'}
          onClose={() => setModal(null)}
          onConfirm={handleSave}
          confirmLabel="Save"
          loading={saving}
        >
          <div className="space-y-4">
            {error && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Name</label>
                <input className="input" value={form.name} onChange={set('name')} required />
              </div>
              <div>
                <label className="label">SKU</label>
                <input className="input font-mono" value={form.sku} onChange={set('sku')} required />
              </div>
              <div>
                <label className="label">Category</label>
                <select className="input" value={form.category_id} onChange={set('category_id')}>
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Unit of Measure</label>
                <input className="input" value={form.unit_of_measure} onChange={set('unit_of_measure')} placeholder="pcs, kg, litres" />
              </div>
              <div>
                <label className="label">Reorder Point</label>
                <input className="input" type="number" min="0" value={form.reorder_point} onChange={set('reorder_point')} />
              </div>
            </div>
          </div>
        </Modal>
      )}
    </Layout>
  )
}