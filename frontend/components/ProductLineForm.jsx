/**
 * ProductLineForm
 * lines: [{ product_id, location_id, qty }]
 * onChange: (lines) => void
 * products: [{ id, name, sku }]
 * locations: [{ id, name, warehouse_name }]
 */
export default function ProductLineForm({ lines, onChange, products = [], locations = [] }) {
  const addLine = () => {
    onChange([...lines, { product_id: '', location_id: '', qty: '' }])
  }

  const updateLine = (idx, field, value) => {
    const updated = lines.map((l, i) => i === idx ? { ...l, [field]: value } : l)
    onChange(updated)
  }

  const removeLine = (idx) => {
    onChange(lines.filter((_, i) => i !== idx))
  }

  return (
    <div>
      <div className="space-y-2">
        {lines.map((line, idx) => (
          <div key={idx} className="flex gap-2 items-start bg-gray-50 rounded-lg p-3">
            {/* Product */}
            <select
              value={line.product_id}
              onChange={(e) => updateLine(idx, 'product_id', e.target.value)}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 bg-white"
            >
              <option value="">Select product</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
              ))}
            </select>
            {/* Location */}
            <select
              value={line.location_id}
              onChange={(e) => updateLine(idx, 'location_id', e.target.value)}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 bg-white"
            >
              <option value="">Select location</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>{l.name} — {l.warehouse_name || l.warehouse?.name}</option>
              ))}
            </select>
            {/* Qty */}
            <input
              type="number"
              min="0"
              step="0.01"
              value={line.qty}
              onChange={(e) => updateLine(idx, 'qty', e.target.value)}
              placeholder="Qty"
              className="w-24 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
            {/* Remove */}
            <button
              type="button"
              onClick={() => removeLine(idx)}
              className="text-red-400 hover:text-red-600 font-bold text-lg leading-none px-1 mt-1.5"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={addLine}
        className="mt-3 text-sm text-primary-700 hover:text-primary-800 font-medium flex items-center gap-1"
      >
        <span className="text-lg leading-none">+</span> Add product line
      </button>
    </div>
  )
}