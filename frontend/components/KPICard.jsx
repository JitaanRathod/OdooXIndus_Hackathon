export default function KPICard({ label, value, icon, variant = 'default' }) {
  const variants = {
    default: 'bg-white border-gray-200 text-primary-700',
    danger:  'bg-red-50 border-red-200 text-red-700',
    warning: 'bg-amber-50 border-amber-200 text-amber-700',
    success: 'bg-green-50 border-green-200 text-green-700',
  }
  const textVariants = {
    default: 'text-gray-900',
    danger:  'text-red-900',
    warning: 'text-amber-900',
    success: 'text-green-900',
  }
  return (
    <div className={`rounded-xl border shadow-sm p-5 flex items-center gap-4 ${variants[variant]}`}>
      {icon && (
        <div className={`text-2xl w-10 h-10 rounded-lg flex items-center justify-center bg-white bg-opacity-60 shadow-sm`}>
          {icon}
        </div>
      )}
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
        <p className={`text-2xl font-bold mt-0.5 ${textVariants[variant]}`}>{value ?? '—'}</p>
      </div>
    </div>
  )
}