/**
 * StepIndicator
 * steps: string[]
 * current: number (0-indexed)
 */
export default function StepIndicator({ steps, current }) {
  return (
    <div className="flex items-center gap-0">
      {steps.map((step, idx) => {
        const done    = idx < current
        const active  = idx === current
        return (
          <div key={step} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors
                  ${done   ? 'bg-primary-700 border-primary-700 text-white'   : ''}
                  ${active ? 'bg-white border-primary-700 text-primary-700'   : ''}
                  ${!done && !active ? 'bg-white border-gray-300 text-gray-400' : ''}
                `}
              >
                {done ? '✓' : idx + 1}
              </div>
              <span className={`text-xs mt-1 whitespace-nowrap ${active ? 'text-primary-700 font-semibold' : done ? 'text-primary-600' : 'text-gray-400'}`}>
                {step}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div className={`h-0.5 w-12 mx-1 mb-4 ${done ? 'bg-primary-700' : 'bg-gray-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}