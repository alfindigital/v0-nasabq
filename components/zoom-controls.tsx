'use client'

import { Maximize2, ZoomIn, ZoomOut, RotateCcw, Minimize2, Expand } from 'lucide-react'

interface ZoomControlsProps {
  onFit: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  onReset: () => void
  onToggleAll?: () => void
  isAllExpanded?: boolean
}

export function ZoomControls({ onFit, onZoomIn, onZoomOut, onReset, onToggleAll, isAllExpanded }: ZoomControlsProps) {
  const buttons = [
    { icon: Maximize2, label: 'Fit to screen', onClick: onFit },
    { icon: ZoomIn, label: 'Zoom in', onClick: onZoomIn },
    { icon: ZoomOut, label: 'Zoom out', onClick: onZoomOut },
    { icon: RotateCcw, label: 'Reset', onClick: onReset },
  ]

  return (
    <div className="fixed right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-20">
      {onToggleAll && (
        <button
          onClick={onToggleAll}
          className="w-8 h-8 md:w-9 md:h-9 bg-card border border-border rounded-full flex items-center justify-center shadow-sm hover:border-primary hover:text-primary active:scale-95 transition-all opacity-60 hover:opacity-100"
          title={isAllExpanded ? 'Minimize semua' : 'Expand semua'}
        >
          {isAllExpanded ? <Minimize2 className="w-4 h-4" /> : <Expand className="w-4 h-4" />}
        </button>
      )}
      {buttons.map((btn, i) => (
        <button
          key={i}
          onClick={btn.onClick}
          className="w-8 h-8 md:w-9 md:h-9 bg-card border border-border rounded-full flex items-center justify-center shadow-sm hover:border-primary hover:text-primary active:scale-95 transition-all opacity-60 hover:opacity-100"
          title={btn.label}
        >
          <btn.icon className="w-4 h-4" />
        </button>
      ))}
    </div>
  )
}
