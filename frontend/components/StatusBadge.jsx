const STATUS_STYLES = {
  draft:     'bg-gray-100 text-gray-700',
  waiting:   'bg-blue-100 text-blue-700',
  ready:     'bg-amber-100 text-amber-700',
  picking:   'bg-indigo-100 text-indigo-700',
  packing:   'bg-purple-100 text-purple-700',
  done:      'bg-green-100 text-green-700',
  confirmed: 'bg-green-100 text-green-700',
  applied:   'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

export default function StatusBadge({ status }) {
  const style = STATUS_STYLES[status?.toLowerCase()] || 'bg-gray-100 text-gray-600'
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${style}`}>
      {status}
    </span>
  )
}