import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import FilterBar from '../components/FilterBar'
import ConfirmDialog from '../components/ConfirmDialog'
import api from '../lib/api'
import toast from 'react-hot-toast'
import { Plus, Upload } from 'lucide-react'
import Papa from 'papaparse'

const EMPTY = { name: '', sku: '', category_id: '', unit_of_measure: '', reorder_point: 0 }

// RFC 4180-compliant CSV parser — handles values with commas, quotes, newlines
const parseCSV = (text) => new Promise((resolve, reject) => {
  const result = Papa.parse(text.trim(), { header: true, skipEmptyLines: true, transformHeader: h => h.trim().toLowerCase().replace(/\s+/g, '_') })
  if (result.errors.length) return reject(new Error(result.errors[0].message))
  const required = ['name', 'sku', 'unit_of_measure']
  for (const r of required) {
    if (!result.meta.fields?.includes(r)) return reject(new Error(`CSV missing required column: ${r}`))
  }
  resolve(result.data)
})

export default function Products() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const fileRef = useRef(null)

  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({})
  const [modal, setModal] = useState(null)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [confirm, setConfirm] = useState(null)

  // Per-location detail
  const [locationDetail, setLocationDetail] = useState(null)   // { product, rows }
  const [locationLoading, setLocationLoading] = useState(false)

  // CSV import
  const [importRows, setImportRows] = useState([])
  const [importError, setImportError] = useState('')
  const [importDone, setImportDone] = useState(null)

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
      .catch(() => toast.error('Failed to load products'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { if (user) load() }, [user])

  const openCreate = () => { setForm(EMPTY); setError(''); setModal('create') }
  const openEdit = (row) => { setSelected(row); setForm({ ...row }); setError(''); setModal('edit') }
  const openDetail = async (row) => {
    setModal('detail')
    setLocationLoading(true)
    setLocationDetail(null)
    try {
      const { data } = await api.get(`/inventory?product_id=${row.id}`)
      setLocationDetail({ product: row, rows: data.data })
    } catch { toast.error('Failed to load stock breakdown') }
    finally { setLocationLoading(false) }
  }
  const openRestock = (row) => {
    setSelected(row)
    setRestockForm({
      supplier_name: '',
      location_id: locations[0]?.id?.toString() || '',
      qty: row.reorder_point > 0 ? String(row.reorder_point) : '',
    })
    setRestockDone(false)
    setError('')
    setModal('restock')
  }

  const handleSave = async () => {
    setSaving(true); setError('')
    try {
      if (modal === 'create') { await api.post('/products', form); toast.success('Product created') }
      else { await api.put(`/products/${selected.id}`, form); toast.success('Product updated') }
      setModal(null); load()
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed')
    } finally { setSaving(false) }
  }

  const handleDelete = (row) => {
    setConfirm({
      title: `Delete "${row.name}"?`,
      message: 'This product will be permanently deleted. If it has inventory records, deletion will be blocked.',
      confirmLabel: 'Delete Product',
      onConfirm: async () => {
        try { await api.delete(`/products/${row.id}`); toast.success('Product deleted'); load() }
        catch (err) { toast.error(err.response?.data?.message || 'Delete failed') }
      },
    })
  }

  const handleRestock = async () => {
    if (!restockForm.supplier_name.trim()) { setError('Supplier name is required'); return }
    if (!restockForm.location_id) { setError('Please select a destination location'); return }
    if (!restockForm.qty || Number(restockForm.qty) <= 0) { setError('Please enter a valid quantity'); return }

    setSaving(true); setError('')
    try {
      await api.post('/receipts', {
        supplier_name: restockForm.supplier_name,
        notes: `Quick restock for ${selected.name} (${selected.sku})`,
        lines: [{
          product_id: selected.id,
          location_id: parseInt(restockForm.location_id),
          qty: parseFloat(restockForm.qty),
        }],
      })
      setRestockDone(true)
      toast.success('Restock receipt created — go validate it in Receipts')
      load()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create restock receipt')
    } finally { setSaving(false) }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]; if (!file) return
    setImportError(''); setImportRows([]); setImportDone(null)
    const reader = new FileReader()
    reader.onload = async (ev) => {
      try {
        const rows = await parseCSV(ev.target.result)
        setImportRows(rows.map(r => ({
          name: r.name?.trim(),
          sku: r.sku?.trim(),
          unit_of_measure: r.unit_of_measure?.trim(),
          reorder_point: parseFloat(r.reorder_point) || 0,
          category_id: categories.find(c => c.name.toLowerCase() === r.category?.toLowerCase()?.trim())?.id || '',
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
    if (success > 0) { load(); toast.success(`${success} product${success !== 1 ? 's' : ''} imported`) }
    if (failed > 0) toast.error(`${failed} row${failed !== 1 ? 's' : ''} failed (duplicate SKUs)`)
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
      const qty = parseFloat(p.qty_on_hand) || 0
      const reorder = parseFloat(p.reorder_point) || 0
      if (filters.stock_status === 'low') return qty > 0 && qty <= reorder
      if (filters.stock_status === 'out') return qty === 0
      if (filters.stock_status === 'ok') return qty > reorder
      return true
    })
    .map(p => {
      const qty = parseFloat(p.qty_on_hand) || 0
      const reorder = parseFloat(p.reorder_point) || 0
      return { ...p, _rowVariant: qty === 0 ? 'danger' : qty <= reorder ? 'warning' : undefined }
    })

  const lowStockCount = products.filter(p => { const q = parseFloat(p.qty_on_hand) || 0; const r = parseFloat(p.reorder_point) || 0; return q > 0 && q <= r }).length
  const outOfStockCount = products.filter(p => (parseFloat(p.qty_on_hand) || 0) === 0).length
  const canRestock = ['admin', 'inventory_manager', 'warehouse_staff'].includes(user?.role)
  const canEdit = ['admin', 'inventory_manager'].includes(user?.role)

  const cols = [
    {
      key: 'name', label: 'Name', render: (v, row) => {
        const qty = parseFloat(row.qty_on_hand) || 0
        const reorder = parseFloat(row.reorder_point) || 0
        return (
          <div className="flex items-center gap-2">
            <span className={`font-semibold ${qty === 0 ? 'text-red-700' : qty <= reorder ? 'text-amber-800' : 'text-gray-800'}`}>{v}</span>
            {qty === 0
              ? (
                <span className="relative inline-flex">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-40" />
                  <span className="relative text-[10px] font-bold px-2 py-0.5 bg-red-600 text-white rounded-full uppercase tracking-wide">Out of Stock</span>
                </span>
              )
              : qty <= reorder
                ? (
                  <span className="relative inline-flex">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-30" />
                    <span className="relative text-[10px] font-bold px-2 py-0.5 bg-amber-500 text-white rounded-full uppercase tracking-wide">Low Stock</span>
                  </span>
                )
                : null}
          </div>
        )
      }
    },
    { key: 'sku', label: 'SKU', render: (v) => <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{v}</span> },
    { key: 'category', label: 'Category', render: (_, row) => row.category?.name || '—' },
    { key: 'unit_of_measure', label: 'Unit' },
    {
      key: 'qty_on_hand', label: 'Stock', render: (v, row) => {
        const qty = parseFloat(v) || 0
        const reorder = parseFloat(row.reorder_point) || 0
        return (
          <span className={qty === 0 ? 'text-red-600 font-bold' : qty <= reorder ? 'text-amber-600 font-semibold' : 'text-gray-800'}>
            {qty}
          </span>
        )
      }
    },
    { key: 'reorder_point', label: 'Reorder Pt' },
    {
      key: 'actions', label: '', render: (_, row) => (
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
      )
    },
  ]

  return (
    <Layout title="Products">

      {(lowStockCount > 0 || outOfStockCount > 0) && (
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          {outOfStockCount > 0 && (
            <button
              onClick={() => setFilters(f => ({ ...f, stock_status: 'out' }))}
              className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl shadow-md shadow-red-200 hover:shadow-red-300 hover:scale-[1.02] transition-all text-sm font-semibold"
            >
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-60" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
              </span>
              🚨 {outOfStockCount} product{outOfStockCount !== 1 ? 's' : ''} OUT OF STOCK — click to filter
            </button>
          )}
          {lowStockCount > 0 && (
            <button
              onClick={() => setFilters(f => ({ ...f, stock_status: 'low' }))}
              className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-xl shadow-md shadow-amber-200 hover:shadow-amber-300 hover:scale-[1.02] transition-all text-sm font-semibold"
            >
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-60" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
              </span>
              ⚠️ {lowStockCount} product{lowStockCount !== 1 ? 's' : ''} LOW STOCK — click to filter
            </button>
          )}
        </div>
      )}

      <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
        <FilterBar
          filters={[
            { key: 'category_id', label: 'Category', options: categories.map(c => ({ value: c.id, label: c.name })) },
            {
              key: 'stock_status', label: 'Stock Status', options: [
                { value: 'ok', label: 'In Stock' },
                { value: 'low', label: 'Low Stock' },
                { value: 'out', label: 'Out of Stock' },
              ]
            },
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

      <DataTable columns={cols} data={filtered} loading={loading} onRowClick={openDetail} />

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
                      <tr>{['Name', 'SKU', 'Unit', 'Category', 'Reorder Pt'].map(h => <th key={h} className="px-3 py-2 text-left font-semibold text-gray-500">{h}</th>)}</tr>
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

      {/* ── Per-location stock breakdown ── */}
      {modal === 'detail' && (
        <Modal
          title={locationDetail ? `${locationDetail.product.name} — Stock by Location` : 'Loading…'}
          onClose={() => { setModal(null); setLocationDetail(null) }}
          size="lg"
        >
          {locationLoading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full" />
            </div>
          ) : locationDetail && (
            <div className="space-y-4">
              {/* Product summary */}
              <div className="flex items-center gap-4 bg-gray-50 rounded-xl px-4 py-3">
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">{locationDetail.product.name}</p>
                  <p className="text-xs text-gray-400 font-mono">{locationDetail.product.sku} · {locationDetail.product.unit_of_measure}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">
                    {locationDetail.rows.reduce((s, r) => s + parseFloat(r.qty_on_hand || 0), 0)}
                  </p>
                  <p className="text-xs text-gray-400">total units</p>
                </div>
              </div>

              {/* Location breakdown table */}
              {locationDetail.rows.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p className="text-4xl mb-2">📦</p>
                  <p className="text-sm font-medium">No stock in any location</p>
                  <p className="text-xs mt-1">Create a Receipt and validate it to add stock.</p>
                </div>
              ) : (
                <div className="border border-gray-100 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-xs text-gray-500 uppercase font-semibold tracking-wide">
                      <tr>
                        <th className="px-4 py-2.5 text-left">Warehouse</th>
                        <th className="px-4 py-2.5 text-left">Location</th>
                        <th className="px-4 py-2.5 text-right">Qty on Hand</th>
                        <th className="px-4 py-2.5 text-right">% of Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {(() => {
                        const total = locationDetail.rows.reduce((s, r) => s + parseFloat(r.qty_on_hand || 0), 0)
                        return locationDetail.rows.map((row, i) => {
                          const qty = parseFloat(row.qty_on_hand || 0)
                          const pct = total > 0 ? Math.round(qty / total * 100) : 0
                          return (
                            <tr key={i} className="hover:bg-gray-50/60">
                              <td className="px-4 py-3 text-gray-500">{row.location?.warehouse?.name || '—'}</td>
                              <td className="px-4 py-3 font-medium text-gray-800">{row.location?.name || '—'}</td>
                              <td className="px-4 py-3 text-right font-mono font-semibold text-gray-900">{qty}</td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-primary-500 rounded-full" style={{ width: `${pct}%` }} />
                                  </div>
                                  <span className="text-xs text-gray-400 w-8 text-right">{pct}%</span>
                                </div>
                              </td>
                            </tr>
                          )
                        })
                      })()}
                    </tbody>
                    <tfoot className="bg-gray-50 border-t border-gray-200">
                      <tr>
                        <td className="px-4 py-2.5 text-xs font-bold text-gray-500 uppercase" colSpan={2}>Total</td>
                        <td className="px-4 py-2.5 text-right font-mono font-bold text-gray-900">
                          {locationDetail.rows.reduce((s, r) => s + parseFloat(r.qty_on_hand || 0), 0)}
                        </td>
                        <td className="px-4 py-2.5 text-right text-xs text-gray-400">100%</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}

              {/* Quick actions */}
              <div className="flex gap-2 pt-1">
                {canRestock && (
                  <button onClick={() => { setModal(null); openRestock(locationDetail.product) }} className="btn-secondary text-sm">
                    ↑ Restock this product
                  </button>
                )}
                {canEdit && (
                  <button onClick={() => { setModal(null); openEdit(locationDetail.product) }} className="btn-ghost text-sm">
                    Edit product
                  </button>
                )}
              </div>
            </div>
          )}
        </Modal>
      )}

      <ConfirmDialog config={confirm} onClose={() => setConfirm(null)} />
    </Layout>
  )
}
