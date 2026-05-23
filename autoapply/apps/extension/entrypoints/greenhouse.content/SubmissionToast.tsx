import { useEffect, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'

interface Props {
  message: string
  duration?: number
  onDismiss: () => void
}

export function SubmissionToast({ message, duration = 4000, onDismiss }: Props) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const fadeTimer = setTimeout(() => setVisible(false), Math.max(duration - 200, 0))
    const dismissTimer = setTimeout(onDismiss, duration)

    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(dismissTimer)
    }
  }, [duration, onDismiss])

  return (
    <div
      aria-live="polite"
      className={`fixed bottom-6 right-6 z-[2147483647] flex items-center gap-2 rounded-lg border-l-4 border-l-[#22c55e] bg-white px-4 py-3 transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0'}`}
      role="status"
      style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}
    >
      <CheckCircle2 className="h-4 w-4 text-[#22c55e]" />
      <span className="text-sm font-medium text-[#2a3439]">{message}</span>
    </div>
  )
}
