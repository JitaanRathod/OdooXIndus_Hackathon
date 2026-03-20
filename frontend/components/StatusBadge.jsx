const STATUS_CONFIG = {
  // Document statuses
  draft: { label: 'Draft', cls: 'badge-gray', pulse: false },
  waiting: { label: 'Waiting', cls: 'badge-yellow', pulse: true, pulseColor: 'yellow' },
  ready: { label: 'Ready', cls: 'badge-blue', pulse: true, pulseColor: 'blue' },
  done: { label: 'Done', cls: 'badge-green', pulse: false },
  cancelled: { label: 'Cancelled', cls: 'badge-red', pulse: false },
  applied: { label: 'Applied', cls: 'badge-green', pulse: false },
  confirmed: { label: 'Confirmed', cls: 'badge-green', pulse: false },

  // Delivery workflow
  picking: { label: 'Picking', cls: 'badge-blue', pulse: true, pulseColor: 'blue' },
  packing: { label: 'Packing', cls: 'badge-purple', pulse: true, pulseColor: 'purple' },

  // Move types
  receipt: { label: 'Receipt', cls: 'badge-green', pulse: false },
  delivery: { label: 'Delivery', cls: 'badge-red', pulse: false },
  transfer: { label: 'Transfer', cls: 'badge-blue', pulse: false },
  adjustment: { label: 'Adjustment', cls: 'badge-indigo', pulse: false },

  // User statuses
  active: { label: 'Active', cls: 'badge-green', pulse: false },
  inactive: { label: 'Inactive', cls: 'badge-red', pulse: false },
}

const PULSE_COLORS = {
  blue: 'bg-blue-500',
  yellow: 'bg-amber-500',
  purple: 'bg-purple-500',
}

export default function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status, cls: 'badge-gray', pulse: false }

  return (
    <span className={`${cfg.cls} inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold`}>
      {cfg.pulse && (
        <span className="relative flex h-1.5 w-1.5 flex-shrink-0">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${PULSE_COLORS[cfg.pulseColor]}`} />
          <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${PULSE_COLORS[cfg.pulseColor]}`} />
        </span>
      )}
      {cfg.label}
    </span>
  )
}