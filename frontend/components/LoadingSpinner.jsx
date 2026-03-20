import { Loader2 } from 'lucide-react'

export default function LoadingSpinner({ center = false, size = 'md', label }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' }

  const content = (
    <div className={`flex flex-col items-center gap-3 ${center ? 'justify-center min-h-[200px]' : ''}`}>
      <Loader2 className={`${sizes[size]} text-primary-500 animate-spin`} />
      {label && <p className="text-sm text-gray-500 font-medium">{label}</p>}
    </div>
  )

  return center
    ? <div className="flex items-center justify-center w-full min-h-[200px]">{content}</div>
    : content
}