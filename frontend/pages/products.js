import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import FilterBar from '../components/FilterBar'
import LoadingSpinner from '../components/LoadingSpinner'
import api from '../lib/api'

const EMPTY = { name: '', sku: '', category_id: '', unit_of_measure: '', reorder_point: 0 }

const parseCSV = (text) => {
  const lines = text.trim().split('\n')
  if (lines.length < 2) throw new Error('CSV must have a header row and at least one data row')
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_'))
  const required = ['name', 'sku', 'unit_of_measure']
  for (const r of required) {
    if (!headers.includes(r)) throw new Error(`CSV missing required column: ${r}`)
  }
  return lines.slice(1).filter(l => l.trim()).map(line => {
    const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''))
    const obj = {}
    headers.forEach((h, i) => { obj[h] = values[i] || '' })
    return obj
  })
}

export default function Products() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const fileRef = useRef(null)

  const [products, setProducts]       = useState([])
  const [categories, setCategories]   = useState([])
  const [locations, setLocations]     = useState([])
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState('')
  const [filters, setFilters]         = useState({})
  const [modal, setModal]             = useState(null)
  const [selected, setSelected]       = useState(null)
  const [form, setForm]               = useState(EMPTY)
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState('')

  // CSV import
  const [importRows, setImportRows]   = useState([])
  const [importError, setImportError] = useState('')
  const [importDone, setImportDone]   = useState(null)

  // Restock
  const [restockForm, setRestockForm] = useState({ supplier_name: '', location_id: '', qty: '' })
  const [restockDone, setRestockDone] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) router.push('/login')
    if (!authLoading && user?.role === 'dispatcher') router.push('/deliveries')
  }, [user, authLoading])

  const load = () => {
    setLoading(true)
    Promise.all([api.get('/products'), api.get('/categories'), api.get('/locations')])
      .then(([p, c, l]) => {
        setProducts(p.data.data)
        setCategories(c.data.data)
        setLocations(l.data.data)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { if (user) load() }, [user])

  const openCreate  = () => { setForm(EMPTY); setError(''); setModal('create') }
  const openEdit    = (row) => { setSelected(row); setForm({ ...row }); setError(''); setModal('edit') }
  const openRestock = (row) => {
    setSelected(row)
    setRestockForm({
      supplier_name: '',
      location_id:   locations[0]?.id?.toString() || '',
      qty:           row.reorder_point > 0 ? String(row.reorder_point) : '',
    })
    setRestockDone(false)
    setError('')
    setModal('restock')
  }

  const handleSave = async () => {
    setSaving(true); setError('')
    try {
      if (modal === 'create') await api.post('/products', form)
      else                    await api.put(`/products/${selected.id}`, form)
      setModal(null); load()
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed')
    } finally { setSaving(false) }
  }

  const handleDelete = async (row) => {
    if (!confirm(`Delete "${row.name}"?`)) return
    try { await api.delete(`/products/${row.id}`); load() }
    catch (err) { alert(err.response?.data?.message || 'Delete failed') }
  }

  const handleRestock = async () => {
    if (!restockForm.supplier_name.trim()) { setError('Supplier name is required'); return }
    if (!restockForm.location_id)          { setError('Please select a destination location'); return }
    if (!restockForm.qty || Number(restockForm.qty) <= 0) { setError('Please enter a valid quantity'); return }

    setSaving(true); setError('')
    try {
      await api.post('/receipts', {
        supplier_name: restockForm.supplier_name,
        notes: `Quick restock for ${selected.name} (${selected.sku})`,
        lines: [{
          product_id:  selected.id,
          location_id: parseInt(restockForm.location_id),
          qty:         parseFloat(restockForm.qty),
        }],
      })
      setRestockDone(true)
      load()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create restock receipt')
    } finally { setSaving(false) }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]; if (!file) return
    setImportError(''); setImportRows([]); setImportDone(null)
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const rows = parseCSV(ev.target.result)
        setImportRows(rows.map(r => ({
          name:            r.name,
          sku:             r.sku,
          unit_of_measure: r.unit_of_measure,
          reorder_point:   parseFloat(r.reorder_point) || 0,
          category_id:     categories.find(c => c.name.toLowerCase() === r.category?.toLowerCase())?.id || '',
        })))
      } catch (err) { setImportError(err.message) }
    }
    reader.readAsText(file); e.target.value = ''
  }

  const handleImport = async () => {
    setSaving(true); setImportError(''); setImportDone(null)
    let success = 0, failed = 0
    for (const row of importRows) {
      try { await api.post('/products', row); success++ } catch { failed++ }
    }
    setImportDone({ success, failed }); setSaving(false)
    if (success > 0) load()
  }

  const downloadTemplate = () => {
    const csv = 'name,sku,category,unit_of_measure,reorder_point\nSteel Rods,RM-001,Raw Materials,kg,100'
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'products_template.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value })

  const filtered = products
    .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()))
    .filter(p => !filters.category_id || p.category_id == filters.category_id)
    .filter(p => {
      if (filters.stock_status === 'low') return p.qty_on_hand > 0 && p.qty_on_hand <= p.reorder_point
      if (filters.stock_status === 'out') return p.qty_on_hand === 0
      if (filters.stock_status === 'ok')  return p.qty_on_hand > p.reorder_point
      return true
    })

  const lowStockCount   = products.filter(p => p.qty_on_hand > 0 && p.qty_on_hand <= p.reorder_point).length
  const outOfStockCount = products.filter(p => p.qty_on_hand === 0).length
  const canRestock      = ['admin','inventory_manager','warehouse_staff'].includes(user?.role)
  const canEdit         = ['admin','inventory_manager'].includes(user?.role)

  const cols = [
    { key: 'name', label: 'Name', render: (v, row) => (
      <div className="flex items-center gap-2">
        <span className="font-medium">{v}</span>
        {row.qty_on_hand === 0
          ? <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-700 rounded-full font-medium">Out of stock</span>
          : row.qty_on_hand <= row.reorder_point
          ? <span className="text-xs px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full font-medium">Low stock</span>
          : null}
      </div>
    )},
    { key: 'sku',             label: 'SKU',      render: (v) => <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{v}</span> },
    { key: 'category',        label: 'Category', render: (_, row) => row.category?.name || '—' },
    { key: 'unit_of_measure', label: 'Unit' },
    { key: 'qty_on_hand',     label: 'Stock',    render: (v, row) => (
      <span className={v === 0 ? 'text-red-600 font-bold' : v <= row.reorder_point ? 'text-amber-600 font-semibold' : 'text-gray-800'}>
        {v ?? 0}
      </span>
    )},
    { key: 'reorder_point', label: 'Reorder Pt' },
    { key: 'actions', label: '', render: (_, row) => (
      <div className="flex gap-2 items-center flex-wrap">
        {canRestock && row.qty_on_hand <= row.reorder_point && (
          <button
            onClick={(e) => { e.stopPropagation(); openRestock(row) }}
            className="text-xs px-2 py-1 bg-green-50 text-green-700 border border-green-200 rounded-md hover:bg-green-100 font-medium transition-colors"
          >
            ↑ Restock
          </button>
        )}
        {canEdit && (
          <button onClick={(e) => { e.stopPropagation(); openEdit(row) }} className="text-xs text-primary-700 hover:underline">Edit</button>
        )}
        {user?.role === 'admin' && (
          <button onClick={(e) => { e.stopPropagation(); handleDelete(row) }} className="text-xs text-red-500 hover:underline">Delete</button>
        )}
      </div>
    )},
  ]

  return (
    <Layout title="Products">

      {(lowStockCount > 0 || outOfStockCount > 0) && (
        <div className="flex gap-3 mb-4">
          {outOfStockCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <span className="font-semibold">{outOfStockCount}</span> out of stock
            </div>
          )}
          {lowStockCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
              <span className="font-semibold">{lowStockCount}</span> low stock
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
        <FilterBar
          filters={[
            { key: 'category_id',  label: 'Category',    options: categories.map(c => ({ value: c.id, label: c.name })) },
            { key: 'stock_status', label: 'Stock Status', options: [
              { value: 'ok',  label: 'In Stock' },
              { value: 'low', label: 'Low Stock' },
              { value: 'out', label: 'Out of Stock' },
            ]},
          ]}
          values={filters}
          onChange={(k, v) => setFilters({ ...filters, [k]: v })}
          onSearch={setSearch}
          searchValue={search}
          searchPlaceholder="Search by name or SKU"
        />
        <div className="flex gap-2">
          {canEdit && (
            <>
              <button onClick={() => { setImportRows([]); setImportError(''); setImportDone(null); setModal('import') }} className="btn-secondary">
                Import CSV
              </button>
              <button onClick={openCreate} className="btn-primary">+ New Product</button>
            </>
          )}
        </div>
      </div>

      <DataTable columns={cols} data={filtered} loading={loading} />

      {/* ── Create / Edit ── */}
      {(modal === 'create' || modal === 'edit') && (
        <Modal title={modal === 'create' ? 'New Product' : 'Edit Product'} onClose={() => setModal(null)} onConfirm={handleSave} confirmLabel="Save" loading={saving}>
          <div className="space-y-4">
            {error && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Name</label><input className="input" value={form.name} onChange={set('name')} required /></div>
              <div><label className="label">SKU</label><input className="input font-mono" value={form.sku} onChange={set('sku')} required /></div>
              <div>
                <label className="label">Category</label>
                <select className="input" value={form.category_id} onChange={set('category_id')}>
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div><label className="label">Unit of Measure</label><input className="input" value={form.unit_of_measure} onChange={set('unit_of_measure')} placeholder="pcs, kg, litres" /></div>
              <div><label className="label">Reorder Point</label><input className="input" type="number" min="0" value={form.reorder_point} onChange={set('reorder_point')} /></div>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Restock modal ── */}
      {modal === 'restock' && selected && (
        <Modal
          title={`Restock — ${selected.name}`}
          onClose={() => setModal(null)}
          onConfirm={!restockDone ? handleRestock : null}
          confirmLabel="Create Restock Receipt"
          loading={saving}
        >
          <div className="space-y-4">

            {/* Product summary card */}
            <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
              <div>
                <p className="font-semibold text-gray-800">{selected.name}</p>
                <p className="text-xs text-gray-500 font-mono mt-0.5">{selected.sku} · {selected.unit_of_measure}</p>
              </div>
              <div className="text-right">
                <p className={`text-2xl font-bold ${selected.qty_on_hand === 0 ? 'text-red-600' : 'text-amber-600'}`}>
                  {selected.qty_on_hand}
                </p>
                <p className="text-xs text-gray-400">in stock now</p>
              </div>
            </div>

            {restockDone ? (
              <div className="text-center py-6">
                <p className="text-5xl mb-3">✅</p>
                <p className="text-green-700 font-semibold text-base">Restock receipt created!</p>
                <p className="text-sm text-gray-500 mt-1 mb-4">
                  Go to <strong>Receipts</strong> and click <strong>Validate</strong> to update stock.
                </p>
                <button onClick={() => router.push('/receipts')} className="btn-primary mx-auto">
                  Go to Receipts →
                </button>
              </div>
            ) : (
              <>
                {error && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}

                <div>
                  <label className="label">Supplier Name</label>
                  <input
                    className="input"
                    placeholder="e.g. ABC Suppliers Ltd"
                    value={restockForm.supplier_name}
                    onChange={(e) => setRestockForm({ ...restockForm, supplier_name: e.target.value })}
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Destination Location</label>
                    <select
                      className="input"
                      value={restockForm.location_id}
                      onChange={(e) => setRestockForm({ ...restockForm, location_id: e.target.value })}
                    >
                      <option value="">Select location</option>
                      {locations.map(l => (
                        <option key={l.id} value={l.id}>
                          {l.name}{l.warehouse?.name ? ` — ${l.warehouse.name}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">
                      Quantity
                      {selected.reorder_point > 0 && (
                        <span className="text-gray-400 font-normal ml-1 text-xs">(reorder pt: {selected.reorder_point})</span>
                      )}
                    </label>
                    <input
                      className="input"
                      type="number"
                      min="1"
                      value={restockForm.qty}
                      onChange={(e) => setRestockForm({ ...restockForm, qty: e.target.value })}
                      placeholder={selected.reorder_point || '100'}
                    />
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs text-blue-700">
                  This creates a <strong>Receipt</strong> in draft. Go to <strong>Receipts → Validate</strong> to add stock.
                </div>
              </>
            )}
          </div>
        </Modal>
      )}

      {/* ── CSV Import ── */}
      {modal === 'import' && (
        <Modal
          title="Import Products via CSV"
          onClose={() => setModal(null)}
          onConfirm={importRows.length > 0 && !importDone ? handleImport : null}
          confirmLabel={`Import ${importRows.length} Products`}
          loading={saving}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">Upload a CSV to bulk-import products.</p>
              <button onClick={downloadTemplate} className="text-xs text-primary-700 hover:underline font-medium">Download template</button>
            </div>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input ref={fileRef} type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
              <button onClick={() => fileRef.current?.click()} className="btn-secondary mx-auto">Choose CSV File</button>
              <p className="text-xs text-gray-400 mt-2">Required: name, sku, unit_of_measure · Optional: category, reorder_point</p>
            </div>
            {importError && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{importError}</p>}
            {importRows.length > 0 && !importDone && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">{importRows.length} rows ready:</p>
                <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-200">
                  <table className="min-w-full text-xs">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>{['Name','SKU','Unit','Category','Reorder Pt'].map(h => <th key={h} className="px-3 py-2 text-left font-semibold text-gray-500">{h}</th>)}</tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {importRows.map((r, i) => (
                        <tr key={i}>
                          <td className="px-3 py-1.5">{r.name}</td>
                          <td className="px-3 py-1.5 font-mono">{r.sku}</td>
                          <td className="px-3 py-1.5">{r.unit_of_measure}</td>
                          <td className="px-3 py-1.5">{categories.find(c => c.id == r.category_id)?.name || <span className="text-amber-600">No match</span>}</td>
                          <td className="px-3 py-1.5">{r.reorder_point}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {importDone && (
              <div className={`rounded-lg px-4 py-3 text-sm ${importDone.failed > 0 ? 'bg-amber-50 text-amber-800' : 'bg-green-50 text-green-800'}`}>
                <span className="font-semibold">{importDone.success} succeeded</span>
                {importDone.failed > 0 && <span className="font-semibold">, {importDone.failed} failed (duplicate SKUs)</span>}
              </div>
            )}
          </div>
        </Modal>
      )}
    </Layout>
  )
}