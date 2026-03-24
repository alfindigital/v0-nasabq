'use client'

import { useEffect, useRef } from 'react'
import type { Member } from '@/lib/types'
import { Heart, ArrowUp, ArrowDown, Pencil } from 'lucide-react'

interface QuickActionPopupProps {
  x: number
  y: number
  member: Member
  onAction: (action: 'spouse' | 'parent' | 'child' | 'edit') => void
  onClose: () => void
}

export function QuickActionPopup({ x, y, member, onAction, onClose }: QuickActionPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [onClose])

  const actions = [
    { id: 'spouse' as const, icon: Heart, label: '+ Pasangan' },
    { id: 'parent' as const, icon: ArrowUp, label: '+ Orang Tua' },
    { id: 'child' as const, icon: ArrowDown, label: '+ Anak' },
    { id: 'edit' as const, icon: Pencil, label: 'Edit' },
  ]

  // Adjust position to stay within viewport
  const adjustedX = Math.min(Math.max(x, 100), window.innerWidth - 100)
  const adjustedY = Math.min(Math.max(y, 100), window.innerHeight - 200)

  return (
    <div
      ref={popupRef}
      className="absolute z-50 popup-scale"
      style={{
        left: adjustedX,
        top: adjustedY,
        transform: 'translate(-50%, -50%)'
      }}
    >
      <div className="bg-card border border-border rounded-2xl shadow-lg p-1.5 flex flex-col gap-1">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={() => onAction(action.id)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-foreground hover:bg-muted active:scale-[0.97] transition-all whitespace-nowrap"
          >
            <action.icon className="w-4 h-4 text-primary" />
            {action.label}
          </button>
        ))}
      </div>
    </div>
  )
}
