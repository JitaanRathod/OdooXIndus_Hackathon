/**
 * FilterBar
 * filters: [{ key, label, options: [{ value, label }] }]
 * values: { [key]: value }
 * onChange: (key, value) => void
 */
export default function FilterBar({ filters, values, onChange, onSearch, searchValue, searchPlaceholder }) {
  return (
    <div className="flex flex-wrap gap-3 items-center mb-4">
      {onSearch && (
        <input
          type="text"
          value={searchValue || ''}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={searchPlaceholder || 'Search...'}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 w-56"
        />
      )}
      {filters.map((f) => (
        <select
          key={f.key}
          value={values?.[f.key] || ''}
          onChange={(e) => onChange(f.key, e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 bg-white"
        >
          <option value="">{f.label}: All</option>
          {f.options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ))}
    </div>
  )
}