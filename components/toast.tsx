'use client'

interface ToastProps {
  message: string
}

export function Toast({ message }: ToastProps) {
  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[100] toast-slide">
      <div className="px-4 py-2.5 bg-card border border-border rounded-full shadow-lg">
        <p className="text-sm font-medium text-foreground whitespace-nowrap">{message}</p>
      </div>
    </div>
  )
}
