'use client'

import { AlertTriangle } from 'lucide-react'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning'
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Hapus',
  cancelLabel = 'Batal',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-foreground/50 backdrop-blur-sm"
        onClick={onCancel}
      />
      
      {/* Dialog */}
      <div className="relative bg-card rounded-2xl shadow-xl w-full max-w-[300px] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Content */}
        <div className="p-5 text-center">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${
            variant === 'danger' ? 'bg-destructive/10' : 'bg-gold/10'
          }`}>
            <AlertTriangle className={`w-6 h-6 ${
              variant === 'danger' ? 'text-destructive' : 'text-gold'
            }`} />
          </div>
          <h3 className="font-display font-bold text-base mb-2">{title}</h3>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
        
        {/* Actions */}
        <div className="flex border-t border-border">
          <button
            onClick={onCancel}
            className="flex-1 py-3 text-sm font-medium text-foreground hover:bg-muted transition-colors border-r border-border"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${
              variant === 'danger' 
                ? 'text-destructive hover:bg-destructive/10' 
                : 'text-gold hover:bg-gold/10'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
